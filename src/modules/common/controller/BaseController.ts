import { Request, Response } from 'express';
import mongoose, { Document, FilterQuery, Types } from 'mongoose';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { commonMessages } from '../constants/message';
import { PaginationOptions, SearchOptions } from '../constants/interface';
import { messages } from '../config/message';
import { USER_TYPES } from '../constants/common';
import { IUser } from '../../User/interfaces/IUser';
import CommonService from '../services/CommonService';
import logger from '../services/WinstonLogger';

export abstract class BaseController<T extends Document> {
    constructor(private service: any, private moduleName: string) { }

    // Helper function to get the updated message with the module name
    private getUpdatedMessage(messageObj: any): string {
        return messageObj?.message?.replace('$moduleName', this.moduleName) || '';
    }

    private async sendSuccessResponse(res: Response, messageObj: any, data?: any) {
        const message = this.getUpdatedMessage(messageObj);
        SuccessResponseHandler.sendSuccessResponse(res, { ...messageObj, message }, data);
    }

    private async sendErrorResponse(res: Response, error: any) {
        ErrorResponseHandler.sendErrorResponse(res, error);
    }


    public async getPaginatedData(req: Request) {
        let loggedInUser = req.user as IUser;

        const options: PaginationOptions = {
            page: Number(req.body.page) || 1,
            limit: Number(req.body.limit) || 10,
            sortBy: req.body.sortBy || { 'createdAt': -1 },
            populateFields: req.body.populateFields ? req.body.populateFields : [],
            selectFields: req.body.selectFields ? req.body.selectFields : [],
        };

        let filters: FilterQuery<Document> = {};

        if (req.body.filter) {
            const model = mongoose.model(this.moduleName);
            const modelSchema = model.schema;

            for (const key in req.body.filter) {
                if (req.body.filter.hasOwnProperty(key)) {
                    const value = req.body.filter[key];
                    if (
                        value !== undefined &&
                        value !== '' &&
                        !(Array.isArray(value) && value.length === 0) &&
                        !(value && typeof value === 'object' && Object.keys(value).length === 0)
                    ) {
                        if (Array.isArray(value) && value.length) {
                            filters[key] = { '$in': value };
                        } else if (
                            value !== null &&
                            Object.keys(value).length &&
                            (Object.keys(value).includes('>=') || Object.keys(value).includes('<='))
                        ) {
                            filters[key] = {};
                            if (Object.keys(value).includes('>=')) {
                                filters[key].$gte = value['>='];
                                if (modelSchema.path(key).instance === 'Date') {
                                    filters[key].$gte = value['>='];
                                }
                            }
                            if (Object.keys(value).includes('<=')) {
                                filters[key].$lte = value['<='];
                                if (modelSchema.path(key).instance === 'Date') {
                                    filters[key].$lte = value['<='];
                                }
                            }
                        } else {
                            filters[key] = value;
                        }
                    }
                }
            }
        }
        if (this.moduleName === 'User' && filters.type && filters.type.$in && filters.type.$in.length && filters.type.$in.includes(USER_TYPES.MASTER_ADMIN)) {
            filters.type.$in = filters.type.$in.filter((type: number) => type !== USER_TYPES.MASTER_ADMIN);
        }
        if (this.moduleName === 'User') {
            if (!filters.type || !filters.type.$in || !filters.type.$in.length) {
                filters.type = {
                    $nin: [
                        USER_TYPES.MASTER_ADMIN
                    ]
                };
            }
            if (loggedInUser && loggedInUser._id) {
                filters._id = { $ne: loggedInUser._id };
            }
        }

        const searchOptions: SearchOptions = {
            keys: req.body.search && req.body.search.keys || [],
            keyword: req.body.search && req.body.search.keyword || ''
        };

        if (searchOptions.keys.length > 0 && searchOptions.keyword) {
            const escapedKeyword = searchOptions.keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            filters.$or = searchOptions.keys.map((field: string) => {
                return { [field]: new RegExp(escapedKeyword, 'i') };
            });
        }

        return await this.service.paginate(filters, options, loggedInUser, req.body.filter);
    }

    public async paginate(req: Request, res: Response) {
        try {
            const paginatedData = await this.getPaginatedData(req);
            this.sendSuccessResponse(res, commonMessages.FETCH_SUCCESSFULLY, paginatedData);
        } catch (error: any) {
            logger.info('error', { data: error });
            this.sendErrorResponse(res, error);
        }
    }

    private filterUserTypes(loggedInUserType: number) {
        const userTypes = Object.values(USER_TYPES);
        let userType = userTypes.filter(userType => userType <= loggedInUserType);
        logger.info('userType -----------', { data: userType });
        return userType;
    }

    public async find(req: Request, res: Response) {
        try {
            logger.info('BaseController find');
            let loggedInUser = req.user;
            const options: PaginationOptions = {
                page: Number(req.body.page) || 1,
                limit: Number(req.body.limit) || 10,
                sortBy: req.body.sortBy || { 'createdAt': -1 },
                populateFields: req.body.populateFields ? req.body.populateFields : [],
                selectFields: req.body.selectFields ? req.body.selectFields : [],
            };

            const filters: FilterQuery<Document> = {};
            if (req.body.filter) {
                Object.assign(filters, req.body.filter);
            }

            const searchOptions: SearchOptions = {
                keys: req.body.search && req.body.search.keys || [],
                keyword: req.body.search && req.body.search.keyword || '',
            };

            if (searchOptions.keys.length > 0 && searchOptions.keyword) {
                filters.$or = searchOptions.keys.map((field: string) => {
                    return { [field]: new RegExp(searchOptions.keyword, 'i') };
                });
            }

            const paginatedData = await this.service.find(filters, options, loggedInUser);

            this.sendSuccessResponse(res, commonMessages.FETCH_SUCCESSFULLY, paginatedData);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async findByFilter(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;

            let reqBody = req.body;
            let options: PaginationOptions = {
                populateFields: reqBody.populateFields ? reqBody.populateFields : [],
                selectFields: reqBody.selectFields ? reqBody.selectFields : [],
            };

            if (req.body.sortBy) {
                options.sortBy = req.body.sortBy;
            }
            const filters: FilterQuery<Document> = {};
            if (req.body.filter) {
                Object.assign(filters, req.body.filter);
            }

            const findData = await this.service.findByFilter(filters, options, loggedInUser);

            this.sendSuccessResponse(res, commonMessages.FETCH_SUCCESSFULLY, findData);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const data = req.body;
            const newItem = await this.service.create(data, loggedInUser);

            this.sendSuccessResponse(res, commonMessages.CREATED_SUCCESSFULLY, newItem);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            let reqBody = req.body;

            const options: PaginationOptions = {
                populateFields: reqBody.populateFields ? reqBody.populateFields : [],
                selectFields: reqBody.selectFields ? reqBody.selectFields : [],
            };

            let item = await this.service.findById(id, options, loggedInUser);
            delete item?.password;
            if (!item) {
                throw messages.NOT_FOUND;
            }
            this.sendSuccessResponse(res, commonMessages.FETCH_SUCCESSFULLY, item);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            const updatedData: Partial<T> = req.body;
            const updatedItem = await this.service.update(id, updatedData, loggedInUser);
            if (!updatedItem) {
                throw messages.NOT_FOUND;
            }
            this.sendSuccessResponse(res, commonMessages.UPDATE_SUCCESSFULLY, updatedItem);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            await this.service.delete(id, loggedInUser);
            this.sendSuccessResponse(res, commonMessages.SOFT_DELETED_SUCCESSFULLY);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async activate(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            const activatedItem = await this.service.activate(id, loggedInUser);
            if (!activatedItem) {
                throw messages.NOT_FOUND;
            }
            this.sendSuccessResponse(res, commonMessages.ACTIVATED_SUCCESSFULLY, activatedItem);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async deactivate(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            const deactivatedItem = await this.service.deactivate(id, loggedInUser);
            if (!deactivatedItem) {
                throw messages.NOT_FOUND;
            }
            this.sendSuccessResponse(res, commonMessages.DEACTIVATED_SUCCESSFULLY, deactivatedItem);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async softDelete(req: Request, res: Response) {
        try {
            let loggedInUser = req.user;
            const id: string = req.params.id;
            const softDeletedItem = await this.service.softDelete(id, loggedInUser);
            if (!softDeletedItem) {
                throw messages.NOT_FOUND;
            }
            this.sendSuccessResponse(res, commonMessages.SOFT_DELETED_SUCCESSFULLY, softDeletedItem);
        } catch (error: any) {
            this.sendErrorResponse(res, error);
        }
    }

    public async downloadReportData(req: Request, res: Response, params: any, selectFields: string[], populateFields: string[]) {
        let options = { populateFields, selectFields };

        const filters: FilterQuery<Document> = {};
        if (params.filter) {
            const model = mongoose.model(this.moduleName);
            const modelSchema = model.schema;

            for (const key in params.filter) {
                if (params.filter.hasOwnProperty(key)) {
                    const value = params.filter[key];
                    if (
                        // value !== null && // allow null for master
                        value !== undefined &&
                        value !== '' &&
                        !(Array.isArray(value) && value.length === 0) &&
                        !(value && typeof value === 'object' && Object.keys(value).length === 0)
                    ) {
                        if (Array.isArray(value) && value.length) {
                            filters[key] = { '$in': value };
                        } else if (
                            value !== null && // master paginate allow null to get parent records
                            Object.keys(value).length &&
                            (Object.keys(value).includes('>=') || Object.keys(value).includes('<='))
                        ) {
                            filters[key] = {};
                            logger.info('Report value -----------', { data: key, greaterThanEqual: value['>='], value });
                            if (modelSchema.path(key).instance === 'Date') {
                                logger.info('modelSchema.path(key).instance -----------', { data: modelSchema.path(key).instance });
                            }
                            if (Object.keys(value).includes('>=')) {
                                logger.info('value[>=] -----------', { data: value['>='] });
                                filters[key].$gte = value['>='];

                                if (modelSchema.path(key).instance === 'Date') {
                                    // let keyValue = moment(value['>=']).startOf('day').toDate();
                                    // keyValue = moment_tz(keyValue, PROJECT_CONFIG.DEFAULT_TIMEZONE).toDate();

                                    let keyValue = value['>='];
                                    filters[key].$gte = keyValue;
                                }
                            }
                            if (Object.keys(value).includes('<=')) {
                                logger.info('value[<=] -----------', { data: value['<='] });
                                filters[key].$lte = value['<='];

                                if (modelSchema.path(key).instance === 'Date') {
                                    // let keyValue = moment(value['<=']).endOf('day').toDate();
                                    // keyValue = moment_tz(keyValue, PROJECT_CONFIG.DEFAULT_TIMEZONE).toDate();

                                    let keyValue = value['<='];
                                    filters[key].$lte = keyValue;
                                }
                            }
                        } else {
                            filters[key] = value;
                        }
                    }
                }
            }
        }

        const searchOptions: SearchOptions = {
            keys: params.search && params.search.keys || [],
            keyword: params.search && params.search.keyword || ''
        };

        if (searchOptions.keys.length > 0 && searchOptions.keyword) {
            filters.$or = searchOptions.keys.map((field: string) => {
                return { [field]: new RegExp(searchOptions.keyword, 'i') };
            });
        }
        let reportData = await this.service.findByFilter(filters, options);

        let excelBuffer = await CommonService.generateExcel(reportData, this.moduleName);
        // logger.info('excelBuffer ------------', { data: excelBuffer });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${module}.xlsx`);

        return res.send(excelBuffer);
    }
}
