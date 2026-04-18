import ActivityLogDAO from '../dao/ActivityLogDAO';
import { IActivityLog } from '../interfaces/IActivityLog';
import { IUser } from '../../User/interfaces/IUser';
import { PaginationOptions } from '../../common/constants/interface';
import {
    ACTION_TYPES,
    EVENT_TYPES,
    SEVERITY_LEVELS,
    LOG_STATUS,
    SENSITIVE_FIELDS,
    ARCHIVE_THRESHOLD_DAYS
} from '../constants/activityLogConstants';
import CommonService from '../../common/services/CommonService';
import { Request } from 'express';
import RequestContext from '../utils/RequestContext';
import logger from '../../common/services/WinstonLogger';

export class ActivityLogService extends ActivityLogDAO {
    private batchQueue: Partial<IActivityLog>[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;

    /**
     * Log a single activity
     */
    public async logActivity(data: Partial<IActivityLog>, user?: IUser): Promise<IActivityLog | null> {
        try {
            // Sanitize sensitive data
            const sanitizedData = this.sanitizeData(data);

            // Enrichment with request context (if not already provided)
            if (!sanitizedData.ipAddress) {
                sanitizedData.ipAddress = RequestContext.getIpAddress();
            }
            if (!sanitizedData.userAgent) {
                sanitizedData.userAgent = RequestContext.getUserAgent();
            }
            if (!sanitizedData.deviceInfo) {
                sanitizedData.deviceInfo = RequestContext.getDeviceInfo();
            }
            if (!sanitizedData.correlationId) {
                sanitizedData.correlationId = RequestContext.getCorrelationId();
            }
            if (!sanitizedData.traceId) {
                sanitizedData.traceId = RequestContext.getTraceId();
            }

            // Enrichment with environment info (if not already provided)
            if (!sanitizedData.environment) {
                sanitizedData.environment = (process.env.NODE_ENV as any) || 'development';
            }
            if (!sanitizedData.appVersion) {
                sanitizedData.appVersion = process.env.APP_VERSION || 'unknown';
            }
            if (!sanitizedData.serverName) {
                sanitizedData.serverName = process.env.SERVER_NAME || require('os').hostname();
            }

            // Enrich with user info if provided
            if (user && !sanitizedData.userId) {
                sanitizedData.userId = user._id?.toString();
                sanitizedData.userName = user.name;
                sanitizedData.userEmail = user.email;
                sanitizedData.userType = user.type;
            }

            // Set defaults
            if (!sanitizedData.eventType) {
                sanitizedData.eventType = EVENT_TYPES.USER_ACTION;
            }
            if (!sanitizedData.severity) {
                sanitizedData.severity = SEVERITY_LEVELS.INFO;
            }
            if (!sanitizedData.status) {
                sanitizedData.status = LOG_STATUS.SUCCESS;
            }

            // Create the log
            return await this.create(sanitizedData as IActivityLog, user);
        } catch (error: any) {
            logger.error('Error logging activity', { error: error.message, stack: error.stack });
            // Don't throw error to prevent breaking the main operation
            return null;
        }
    }

    /**
     * Log activity from Express request
     */
    public async logFromRequest(
        req: Request,
        module: string,
        action: ACTION_TYPES,
        additionalData?: Partial<IActivityLog>
    ): Promise<IActivityLog | null> {
        try {
            const user = req.user as IUser;

            const logData: Partial<IActivityLog> = {
                module,
                action,
                requestInfo: {
                    method: req.method,
                    url: req.originalUrl || req.url,
                    query: req.query,
                    params: req.params,
                    body: this.sanitizeData({ body: req.body }).body
                },
                ...additionalData
            };

            return await this.logActivity(logData, user);
        } catch (error: any) {
            logger.error('Error logging from request', { error: error.message, stack: error.stack });
            return null;
        }
    }

    /**
     * Batch logging for performance
     */
    public async logBatch(dataArray: Partial<IActivityLog>[]): Promise<void> {
        try {
            const sanitizedArray = dataArray.map(data => this.sanitizeData(data));
            await this.insertMany(sanitizedArray as IActivityLog[]);
        } catch (error: any) {
            logger.error('Error batch logging', { error: error.message, stack: error.stack });
        }
    }

    /**
     * Add to batch queue (for high-performance scenarios)
     */
    public queueLog(data: Partial<IActivityLog>): void {
        this.batchQueue.push(data);

        // Process batch if queue is full or after timeout
        if (this.batchQueue.length >= 100) {
            this.processBatchQueue();
        } else if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => this.processBatchQueue(), 5000);
        }
    }

    /**
     * Process batch queue
     */
    private async processBatchQueue(): Promise<void> {
        if (this.batchQueue.length === 0) return;

        const batch = [...this.batchQueue];
        this.batchQueue = [];

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        await this.logBatch(batch);
    }

    /**
     * Get activity logs with advanced filtering
     */
    public async getActivityLogs(
        filters: any,
        pagination: PaginationOptions,
        user?: IUser
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            return await this.paginate(filters, pagination, user);
        } catch (error: any) {
            logger.error('Error getting activity logs', { error: error.message, stack: error.stack, filters });
            throw error;
        }
    }

    /**
     * Search activity logs
     */
    public async searchActivityLogs(
        query: string,
        filters: any = {},
        options?: PaginationOptions,
        user?: IUser
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            return await this.searchLogs(query, filters, options, user);
        } catch (error: any) {
            logger.error('Error searching activity logs', { error: error.message, stack: error.stack, query, filters });
            throw error;
        }
    }

    /**
     * Get activity analytics
     */
    public async getActivityAnalytics(filters: any = {}): Promise<any> {
        try {
            return await this.getActivityStats(filters);
        } catch (error: any) {
            logger.error('Error getting activity analytics', { error: error.message, stack: error.stack, filters });
            throw error;
        }
    }

    /**
     * Export activity logs
     */
    public async exportActivityLogs(
        filters: any = {},
        format: 'json' | 'excel' | 'csv' = 'json'
    ): Promise<any> {
        try {
            const logs = await this.findByFilter(filters, {
                limit: 10000, // Max export limit
                sortBy: { createdAt: -1 }
            });

            if (format === 'excel') {
                return await CommonService.generateExcel(logs, 'ActivityLog');
            } else if (format === 'json') {
                return logs;
            } else {
                // CSV format
                return this.convertToCSV(logs);
            }
        } catch (error: any) {
            logger.error('Error exporting activity logs', { error: error.message, stack: error.stack, format });
            throw error;
        }
    }

    /**
     * Archive old logs to S3
     */
    public async archiveOldLogs(daysOld: number = ARCHIVE_THRESHOLD_DAYS): Promise<number> {
        try {
            const logsToArchive = await this.getLogsForArchival(daysOld, 1000);

            if (logsToArchive.length === 0) {
                return 0;
            }

            // Upload to S3
            await CommonService.uploadActivityLogTos3(logsToArchive, 'ActivityLog', 'ARCHIVE');

            // Delete from MongoDB
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const deletedCount = await this.deleteOldLogs(daysOld);

            logger.info('Activity logs archived successfully', {
                archivedCount: logsToArchive.length,
                deletedCount,
                daysOld
            });
            return deletedCount;
        } catch (error: any) {
            logger.error('Error archiving old logs', { error: error.message, stack: error.stack, daysOld });
            throw error;
        }
    }

    /**
     * Sanitize sensitive data
     */
    private sanitizeData(data: any): any {
        if (!data) return data;

        const sanitized = JSON.parse(JSON.stringify(data));

        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;

            for (const key in obj) {
                if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = sanitizeObject(obj[key]);
                }
            }

            return obj;
        };

        return sanitizeObject(sanitized);
    }


    /**
     * Get archived logs from S3 by date range
     */
    public async getArchivedLogs(
        startDate: Date,
        endDate: Date,
        filters: any = {},
        pagination?: { page?: number; limit?: number }
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

            // Validate date range
            if (startDate > endDate) {
                throw require('../errors').activityLogErrors.INVALID_DATE_RANGE;
            }

            const s3 = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY || '',
                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY || '',
                },
            });

            const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
            let allLogs: IActivityLog[] = [];

            // Generate list of dates to check
            const datesToCheck = this.generateDateRange(startDate, endDate);

            // Fetch logs for each date
            for (const date of datesToCheck) {
                const filePath = this.generateS3Path(date);

                try {
                    const command = new GetObjectCommand({
                        Bucket: bucketName,
                        Key: filePath,
                    });

                    const { Body } = await s3.send(command);
                    if (Body) {
                        const jsonString = await Body.transformToString();
                        const fileData = JSON.parse(jsonString);

                        // Extract logs from S3 format
                        const logs = fileData.map((item: any) => item.Body);
                        allLogs = allLogs.concat(logs);
                    }
                } catch (error: any) {
                    if (error.name !== 'NoSuchKey') {
                        logger.error('Error fetching archived logs', { error: error.message, filePath });
                    }
                    // Continue to next date if file not found
                }
            }

            // Apply filters
            let filteredLogs = this.applyFiltersToLogs(allLogs, filters);

            // Apply pagination
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const totalRecords = filteredLogs.length;
            const totalPages = Math.ceil(totalRecords / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

            return {
                data: paginatedLogs,
                totalRecords,
                totalPages
            };
        } catch (error: any) {
            logger.error('Error getting archived logs', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Get archived logs for a specific date
     */
    public async getArchivedLogsByDate(
        year: number,
        month: number,
        day: number,
        filters: any = {},
        pagination?: { page?: number; limit?: number }
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            const date = new Date(Date.UTC(year, month - 1, day));
            if (isNaN(date.getTime())) {
                throw require('../errors').activityLogErrors.INVALID_ARCHIVE_DATE;
            }

            const filePath = this.generateS3Path(date);
            const { S3ConnectionService } = require('../../common/services/s3ConnectionService');

            const fileData = await S3ConnectionService.readDataFromS3(filePath);

            if (!fileData || fileData.length === 0) {
                return { data: [], totalRecords: 0, totalPages: 0 };
            }

            // Extract logs from S3 format (metadata wrapper)
            // Handle both legacy format (array of logs) and new format (wrapper)
            let logs: IActivityLog[];
            if (fileData.length > 0 && fileData[0].Body) {
                logs = fileData.map((item: any) => item.Body);
            } else {
                logs = fileData;
            }

            // Apply filters
            logs = this.applyFiltersToLogs(logs, filters);

            // Apply pagination
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const totalRecords = logs.length;
            const totalPages = Math.ceil(totalRecords / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedLogs = logs.slice(startIndex, endIndex);

            return {
                data: paginatedLogs,
                totalRecords,
                totalPages
            };
        } catch (error: any) {
            logger.error('Error getting archived logs by date', { error: error.message, stack: error.stack, year, month, day });
            throw error;
        }
    }

    /**
     * Search archived logs
     */
    public async searchArchivedLogs(
        query: string,
        startDate: Date,
        endDate: Date,
        filters: any = {},
        pagination?: { page?: number; limit?: number }
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            // Get all archived logs in date range
            const result = await this.getArchivedLogs(startDate, endDate, filters, { page: 1, limit: 100000 });

            // Search within logs
            const searchResults = result.data.filter((log: any) => {
                const searchableText = [
                    log.description,
                    log.userName,
                    log.userEmail,
                    log.module,
                    log.action,
                    log.errorMessage
                ].filter(Boolean).join(' ').toLowerCase();

                return searchableText.includes(query.toLowerCase());
            });

            // Apply pagination
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const totalRecords = searchResults.length;
            const totalPages = Math.ceil(totalRecords / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = searchResults.slice(startIndex, endIndex);

            return {
                data: paginatedResults,
                totalRecords,
                totalPages
            };
        } catch (error: any) {
            logger.error('Error searching archived logs', { error: error.message, stack: error.stack, query });
            throw error;
        }
    }

    /**
     * List available archive dates
     */
    public async listArchiveDates(
        startDate?: Date,
        endDate?: Date
    ): Promise<{ year: number; month: number; day: number; path: string }[]> {
        try {
            const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

            const s3 = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY || '',
                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY || '',
                },
            });

            const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
            const prefix = 'static/activityLogs/';

            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: prefix,
            });

            const response = await s3.send(command);
            const archiveDates: { year: number; month: number; day: number; path: string }[] = [];

            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key && item.Key.endsWith('index.json')) {
                        // Parse path: activitylogs/YYYY/MM/DD/index.json
                        const parts = item.Key.split('/');
                        if (parts.length === 6) {
                            const year = parseInt(parts[2]);
                            const month = parseInt(parts[3]);
                            const day = parseInt(parts[4]);

                            // Filter by date range if provided
                            if (startDate || endDate) {
                                const archiveDate = new Date(year, month - 1, day);
                                if (startDate && archiveDate < startDate) continue;
                                if (endDate && archiveDate > endDate) continue;
                            }

                            archiveDates.push({
                                year,
                                month,
                                day,
                                path: item.Key
                            });
                        }
                    }
                }
            }

            // Sort by date (newest first)
            archiveDates.sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1, a.day);
                const dateB = new Date(b.year, b.month - 1, b.day);
                return dateB.getTime() - dateA.getTime();
            });

            return archiveDates;
        } catch (error: any) {
            logger.error('Error listing archive dates', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Generate S3 path for a given date
     */
    private generateS3Path(date: Date): string {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `static/activityLogs/${year}/${month}/${day}/index.json`;
    }

    /**
     * Generate array of dates between start and end
     */
    private generateDateRange(startDate: Date, endDate: Date): Date[] {
        const dates: Date[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }

    /**
     * Apply filters to logs array
     */
    private applyFiltersToLogs(logs: any[], filters: any): any[] {
        if (!filters || Object.keys(filters).length === 0) {
            return logs;
        }

        return logs.filter((log: any) => {
            for (const key in filters) {
                if (filters[key] !== undefined && filters[key] !== null) {
                    if (log[key] !== filters[key]) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    /**
     * Convert logs to CSV format
     */
    private convertToCSV(logs: IActivityLog[]): string {
        if (logs.length === 0) return '';

        const headers = [
            'Date',
            'User',
            'Module',
            'Action',
            'Event Type',
            'Severity',
            'Status',
            'IP Address',
            'Description'
        ];

        const rows = logs.map(log => [
            log.createdAt?.toISOString() || '',
            log.userName || log.userEmail || log.userId || '',
            log.module,
            log.action,
            log.eventType,
            log.severity,
            log.status,
            log.ipAddress || '',
            log.description || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }
}

export default new ActivityLogService();
