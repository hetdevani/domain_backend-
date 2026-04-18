import { Request, Response } from 'express';
import { BaseController } from '../../common/controller/BaseController';
import ActivityLogService from '../services/ActivityLogService';
import { IActivityLog } from '../interfaces/IActivityLog';
import { activityLogMessages } from '../message';
import { activityLogErrors } from '../errors';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { IUser } from '../../User/interfaces/IUser';
import { PaginationOptions } from '../../common/constants/interface';
import moment from 'moment';

export class WebActivityLogController extends BaseController<IActivityLog> {
    constructor() {
        super(ActivityLogService, 'ActivityLog');
    }

    /**
     * Get activity logs with advanced filtering
     */
    public async getActivityLogs(req: Request, res: Response): Promise<void> {
        try {
            const loggedInUser = req.user as IUser;

            const options: PaginationOptions = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10,
                sortBy: req.body.sortBy || { createdAt: -1 },
                populateFields: req.body.populateFields || [],
                selectFields: req.body.selectFields || []
            };

            let filters: any = {};

            // Apply filters
            if (req.body.filter) {
                filters = { ...req.body.filter };
            }

            // Apply date range if provided
            if (req.body.startDate && req.body.endDate) {
                const startDate = moment(req.body.startDate).toDate();
                const endDate = moment(req.body.endDate).toDate();

                if (startDate > endDate) {
                    throw activityLogErrors.INVALID_DATE_RANGE;
                }

                filters.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            // Apply search if provided
            if (req.body.search && req.body.search.keyword) {
                const keyword = req.body.search.keyword;
                const keys = req.body.search.keys || ['description', 'userName', 'userEmail'];

                filters.$or = keys.map((field: string) => ({
                    [field]: new RegExp(keyword, 'i')
                }));
            }

            const result = await ActivityLogService.getActivityLogs(filters, options, loggedInUser);

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ACTIVITY_LOGS_FETCHED,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get single activity log by ID
     */
    public async getActivityLogById(req: Request, res: Response): Promise<void> {
        try {
            const loggedInUser = req.user as IUser;
            const id = req.params.id;

            const options: PaginationOptions = {
                populateFields: req.body.populateFields || [],
                selectFields: req.body.selectFields || []
            };

            const log = await ActivityLogService.findById(id, options, loggedInUser);

            if (!log) {
                throw activityLogErrors.ACTIVITY_LOG_NOT_FOUND;
            }

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ACTIVITY_LOG_FETCHED,
                log
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get activity logs for a specific user
     */
    public async getUserActivityLogs(req: Request, res: Response): Promise<void> {
        try {
            const loggedInUser = req.user as IUser;
            const userId = req.params.userId;

            const options: PaginationOptions = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10,
                sortBy: req.body.sortBy || { createdAt: -1 }
            };

            let filters: any = { userId };

            // Apply date range if provided
            if (req.body.startDate && req.body.endDate) {
                const startDate = moment(req.body.startDate).toDate();
                const endDate = moment(req.body.endDate).toDate();

                if (startDate > endDate) {
                    throw activityLogErrors.INVALID_DATE_RANGE;
                }

                filters.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const result = await ActivityLogService.getActivityLogs(filters, options, loggedInUser);

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ACTIVITY_LOGS_FETCHED,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get activity logs for a specific module
     */
    public async getModuleActivityLogs(req: Request, res: Response): Promise<void> {
        try {
            const loggedInUser = req.user as IUser;
            const module = req.params.module;

            const options: PaginationOptions = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10,
                sortBy: req.body.sortBy || { createdAt: -1 }
            };

            let filters: any = { module };

            // Apply date range if provided
            if (req.body.startDate && req.body.endDate) {
                const startDate = moment(req.body.startDate).toDate();
                const endDate = moment(req.body.endDate).toDate();

                if (startDate > endDate) {
                    throw activityLogErrors.INVALID_DATE_RANGE;
                }

                filters.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const result = await ActivityLogService.getActivityLogs(filters, options, loggedInUser);

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ACTIVITY_LOGS_FETCHED,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get activity analytics
     */
    public async getActivityAnalytics(req: Request, res: Response): Promise<void> {
        try {
            let filters: any = {};

            // Apply filters
            if (req.body.filter) {
                filters = { ...req.body.filter };
            }

            // Apply date range if provided
            if (req.body.startDate && req.body.endDate) {
                const startDate = moment(req.body.startDate).toDate();
                const endDate = moment(req.body.endDate).toDate();

                if (startDate > endDate) {
                    throw activityLogErrors.INVALID_DATE_RANGE;
                }

                filters.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const analytics = await ActivityLogService.getActivityAnalytics(filters);

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ANALYTICS_FETCHED,
                analytics
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Export activity logs
     */
    public async exportActivityLogs(req: Request, res: Response): Promise<void> {
        try {
            const format = req.body.format || 'json';

            if (!['json', 'excel', 'csv'].includes(format)) {
                throw activityLogErrors.INVALID_EXPORT_FORMAT;
            }

            let filters: any = {};

            // Apply filters
            if (req.body.filter) {
                filters = { ...req.body.filter };
            }

            // Apply date range if provided
            if (req.body.startDate && req.body.endDate) {
                const startDate = moment(req.body.startDate).toDate();
                const endDate = moment(req.body.endDate).toDate();

                if (startDate > endDate) {
                    throw activityLogErrors.INVALID_DATE_RANGE;
                }

                filters.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const exportData = await ActivityLogService.exportActivityLogs(filters, format as any);

            if (format === 'excel') {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${Date.now()}.xlsx`);
                res.send(exportData);
            } else if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${Date.now()}.csv`);
                res.send(exportData);
            } else {
                SuccessResponseHandler.sendSuccessResponse(
                    res,
                    activityLogMessages.EXPORT_SUCCESS,
                    exportData
                );
            }
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Search activity logs
     */
    public async searchActivityLogs(req: Request, res: Response): Promise<void> {
        try {
            const loggedInUser = req.user as IUser;
            const query = req.body.query;

            if (!query) {
                throw activityLogErrors.SEARCH_QUERY_REQUIRED;
            }

            const options: PaginationOptions = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10,
                sortBy: req.body.sortBy || { createdAt: -1 }
            };

            const filters = req.body.filter || {};

            const result = await ActivityLogService.searchActivityLogs(
                query,
                filters,
                options,
                loggedInUser
            );

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.SEARCH_SUCCESS,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get archived logs by date range
     */
    public async getArchivedLogs(req: Request, res: Response): Promise<void> {
        try {
            const startDate = moment(req.body.startDate).toDate();
            const endDate = moment(req.body.endDate).toDate();

            if (startDate > endDate) {
                throw activityLogErrors.INVALID_DATE_RANGE;
            }

            const filters = req.body.filter || {};
            const pagination = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10
            };

            const result = await ActivityLogService.getArchivedLogs(
                startDate,
                endDate,
                filters,
                pagination
            );

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ARCHIVED_LOGS_FETCHED,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Get archived logs by specific date
     */
    public async getArchivedLogsByDate(req: Request, res: Response): Promise<void> {
        try {
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);
            const day = parseInt(req.params.day);

            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                throw activityLogErrors.INVALID_ARCHIVE_DATE;
            }

            const filters = req.body.filter || {};
            const pagination = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10
            };

            const result = await ActivityLogService.getArchivedLogsByDate(
                year,
                month,
                day,
                filters,
                pagination
            );

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ARCHIVED_LOGS_FETCHED,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * Search archived logs
     */
    public async searchArchivedLogs(req: Request, res: Response): Promise<void> {
        try {
            const query = req.body.query;

            if (!query) {
                throw activityLogErrors.SEARCH_QUERY_REQUIRED;
            }

            const startDate = moment(req.body.startDate).toDate();
            const endDate = moment(req.body.endDate).toDate();

            if (startDate > endDate) {
                throw activityLogErrors.INVALID_DATE_RANGE;
            }

            const filters = req.body.filter || {};
            const pagination = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10
            };

            const result = await ActivityLogService.searchArchivedLogs(
                query,
                startDate,
                endDate,
                filters,
                pagination
            );

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ARCHIVED_SEARCH_SUCCESS,
                result
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    /**
     * List available archive dates
     */
    public async listArchiveDates(req: Request, res: Response): Promise<void> {
        try {
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (req.body.startDate) {
                startDate = moment(req.body.startDate).toDate();
            }
            if (req.body.endDate) {
                endDate = moment(req.body.endDate).toDate();
            }

            if (startDate && endDate && startDate > endDate) {
                throw activityLogErrors.INVALID_DATE_RANGE;
            }

            const archiveDates = await ActivityLogService.listArchiveDates(startDate, endDate);

            SuccessResponseHandler.sendSuccessResponse(
                res,
                activityLogMessages.ARCHIVE_DATES_FETCHED,
                archiveDates
            );
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}

export default new WebActivityLogController();
