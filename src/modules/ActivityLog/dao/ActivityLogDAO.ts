import { IActivityLog } from '../interfaces/IActivityLog';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { ActivityLog } from '../models/ActivityLog';
import { PaginationOptions } from '../../common/constants/interface';
import { IUser } from '../../User/interfaces/IUser';
import logger from '../../common/services/WinstonLogger';

export class ActivityLogDAO extends BaseDAO<IActivityLog> {
    constructor() {
        super(ActivityLog);
    }

    /**
     * Find activity logs by user ID
     */
    public async findByUser(userId: string, options?: PaginationOptions, user?: IUser): Promise<IActivityLog[]> {
        return this.findByFilter({ userId }, options, user);
    }

    /**
     * Find activity logs by module
     */
    public async findByModule(module: string, options?: PaginationOptions, user?: IUser): Promise<IActivityLog[]> {
        return this.findByFilter({ module }, options, user);
    }

    /**
     * Find activity logs by date range
     */
    public async findByDateRange(
        startDate: Date,
        endDate: Date,
        options?: PaginationOptions,
        user?: IUser
    ): Promise<IActivityLog[]> {
        const conditions = {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        };
        return this.findByFilter(conditions, options, user);
    }

    /**
     * Find activity logs by resource
     */
    public async findByResource(
        resourceId: string,
        resourceType?: string,
        options?: PaginationOptions,
        user?: IUser
    ): Promise<IActivityLog[]> {
        const conditions: any = { resourceId };
        if (resourceType) {
            conditions.resourceType = resourceType;
        }
        return this.findByFilter(conditions, options, user);
    }

    /**
     * Get activity statistics
     */
    public async getActivityStats(filters: any = {}): Promise<any> {
        try {
            const stats = await ActivityLog.aggregate([
                { $match: filters },
                {
                    $facet: {
                        totalCount: [{ $count: 'count' }],
                        byModule: [
                            { $group: { _id: '$module', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        byAction: [
                            { $group: { _id: '$action', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        byEventType: [
                            { $group: { _id: '$eventType', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        bySeverity: [
                            { $group: { _id: '$severity', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        byStatus: [
                            { $group: { _id: '$status', count: { $sum: 1 } } },
                            { $sort: { count: -1 } }
                        ],
                        topUsers: [
                            { $match: { userId: { $exists: true, $ne: null } } },
                            { $group: { _id: '$userId', userName: { $first: '$userName' }, count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        timeline: [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: '$createdAt' },
                                        month: { $month: '$createdAt' },
                                        day: { $dayOfMonth: '$createdAt' }
                                    },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
                            { $limit: 30 }
                        ]
                    }
                }
            ]);

            return {
                totalCount: stats[0].totalCount[0]?.count || 0,
                byModule: stats[0].byModule,
                byAction: stats[0].byAction,
                byEventType: stats[0].byEventType,
                bySeverity: stats[0].bySeverity,
                byStatus: stats[0].byStatus,
                topUsers: stats[0].topUsers,
                timeline: stats[0].timeline
            };
        } catch (error: any) {
            logger.error('Error getting activity stats', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Search activity logs using text search
     */
    public async searchLogs(
        query: string,
        filters: any = {},
        options?: PaginationOptions,
        user?: IUser
    ): Promise<{ data: IActivityLog[]; totalRecords: number; totalPages: number }> {
        try {
            const searchConditions = {
                ...filters,
                $text: { $search: query }
            };

            return this.paginate(searchConditions, options || {}, user);
        } catch (error: any) {
            logger.error('Error searching logs', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Delete old logs (for cleanup)
     */
    public async deleteOldLogs(daysOld: number): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await ActivityLog.deleteMany({
                createdAt: { $lt: cutoffDate }
            });

            return result.deletedCount || 0;
        } catch (error: any) {
            logger.error('Error deleting old logs', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Get logs for archival (older than specified days)
     */
    public async getLogsForArchival(daysOld: number, limit: number = 1000): Promise<IActivityLog[]> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            return await ActivityLog.find({
                createdAt: { $lt: cutoffDate }
            })
                .limit(limit)
                .lean()
                .exec();
        } catch (error: any) {
            logger.error('Error getting logs for archival', { error: error.message, stack: error.stack });
            throw error;
        }
    }
}

export default ActivityLogDAO;
