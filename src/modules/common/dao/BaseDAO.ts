import { Request } from 'express';
import { FilterQuery } from 'mongoose';
import { Document, Model, Types, Query } from 'mongoose';
import moment from 'moment';
import { NestedSelect, PaginationOptions, SearchOptions } from '../constants/interface';
import Container from '../services/Container';
import { SeriesConfig } from '../config/SeriesConfig';
import { IUser } from '../../User/interfaces/IUser';
import { commonMessages } from '../constants/message';
import { messages } from '../config/message';
import DBErrorHandler from '../middleware/DBErrorHandler';
import dbQueryUtils from '../utils/dbQueryUtils';
import { ACTION_TYPES } from '../../ActivityLog/constants/activityLogConstants';
import { DATE_FILTER_BY, USER_TYPES } from '../constants/common';
import RequestContext from '../../ActivityLog/utils/RequestContext';
import logger from '../services/WinstonLogger';
export abstract class BaseDAO<T extends Document> {
    private model: Model<T>;
    private seriesGeneratorService;
    private commonService;

    constructor(model: Model<T>) {
        this.model = model;
        this.seriesGeneratorService = Container.get('SeriesGeneratorService');
        this.commonService = Container.get('CommonService');
        // logger.info('this.seriesGeneratorService', { data: this.seriesGeneratorService });
    }

    private async assignSeriesData(data: Partial<T>, user?: IUser): Promise<void> {
        logger.info('assignSeriesData', { data: this.model.modelName });
        if (SeriesConfig[this.model.modelName]) {
            if (!this.seriesGeneratorService) {
                this.seriesGeneratorService = Container.get('SeriesGeneratorService');
            }
            const seriesConfigs = SeriesConfig[this.model.modelName];
            for (let seriesConfig of seriesConfigs) {
                const field = seriesConfig.field;
                const filter = seriesConfig.filter(data);
                let seriesConfigGeneratorSeriesObj = seriesConfig.generatorSeries && seriesConfig.generatorSeries(data);
                logger.info('seriesConfig.generatorSeries', { data: seriesConfigGeneratorSeriesObj });
                const seriesCode = await this.seriesGeneratorService.createAndUpdateSeries(seriesConfig.seriesType, filter, user, seriesConfigGeneratorSeriesObj);
                data[field as keyof T] = seriesCode;
            }
        }
    }

    private assignUserIdentity(data: Partial<T>, user?: IUser): void {
        const modelKeys = Object.keys(this.model.schema.paths);

        /* if (modelKeys.includes('adminId') && user?.type === USER_TYPES.ADMIN) {
            data['adminId' as keyof T] = user._id;
        }

        if (modelKeys.includes('clientId') && user?.type === USER_TYPES.CLIENT) {
            data['clientId' as keyof T] = user._id;
            (data['adminId' as keyof T] as any) = user.clientId;
        }

        if (modelKeys.includes('staffId') && user?.type === USER_TYPES.STAFF) {
            data['staffId' as keyof T] = user._id;
            (data['clientId' as keyof T] as any) = user.clientId;
            (data['adminId' as keyof T] as any) = user.adminId;
        } */


        // if (modelKeys.includes('clientId') && user?.type === USER_TYPES.CLIENT) {
        //     (data['clientId' as keyof T] as any) = user._id;
        // }
    }

    private processNestedFields(fields: string[]) {
        let result: NestedSelect = {};

        fields.forEach(field => {
            const parts = field.split('.');
            let currentLevel = result;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                // If it's the last part, we add to the 'select' array
                if (i === parts.length - 1) {
                    if (!currentLevel.select) {
                        currentLevel.select = [];
                    }
                    currentLevel.select.push(part);
                } else {
                    // Otherwise, we navigate deeper or create the nested structure if it doesn't exist
                    if (!currentLevel[part]) {
                        currentLevel[part] = {};
                    }
                    currentLevel = currentLevel[part] as NestedSelect;
                }
                /*  if (!currentLevel.select) {
                     currentLevel.select = [];
                 }
                 if (i === 0 && !currentLevel.select.includes(part)) {
                     currentLevel.select.push(part);
                 }
                 if (i !== parts.length - 1) {
                     // Otherwise, we navigate deeper or create the nested structure if it doesn't exist
                     if (!currentLevel[part]) {
                         currentLevel[part] = {};
                     }
                     currentLevel = currentLevel[part] as NestedSelect;
                 } */
            }
        });

        return result;
    }

    private populateSelectFields(extractSelectFields: any, populateFields: string[]) {
        populateFields.forEach(field => {
            const parts = field.split('.');
            if (parts && parts.length > 1 && extractSelectFields.select && !extractSelectFields.select.includes(parts[0])) {
                extractSelectFields.select.push(parts[0]);
            }
        });

        return extractSelectFields;
    }

    public async create(data: Partial<T>, user?: IUser): Promise<T> {
        try {
            // logger.info('create data', { data: data });

            for (let key in data) {
                if (data[key] === '') {
                    delete data[key];
                }
            }

            this.assignUserIdentity(data, user);
            await this.assignSeriesData(data, user);


            const instance = new this.model(data as T);

            let createdData = await instance.save();


            // Log activity for important models
            if (this.model.modelName !== 'ActivityLog' && this.model.modelName !== 'UserLogs') {
                try {
                    // Lazy load to avoid circular dependency
                    const ActivityLogService = (await import('../../ActivityLog/services/ActivityLogService')).default;
                    await ActivityLogService.logActivity({
                        module: this.model.modelName,
                        action: ACTION_TYPES.CREATE,
                        resourceId: createdData._id?.toString(),
                        resourceType: this.model.modelName,
                        changeTracking: {
                            after: createdData.toObject ? createdData.toObject() : createdData
                        },
                        description: `Created new ${this.model.modelName} record`
                    }, user);
                } catch (logError) {
                    logger.error('Error logging activity:', { error: logError });
                }
            }
            return createdData;
        } catch (error: any) {
            logger.error('Error creating record', { errorMessage: error.message, errorName: error.name, errorCode: error.code });
            logger.info('create error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async insertMany(dataArray: Partial<T>[], user?: IUser): Promise<T[]> {
        let seriesData: any = {};
        let module = this.model.modelName;

        if (SeriesConfig[module]) {
            const seriesConfigs = SeriesConfig[module];
            for (let seriesConfig of seriesConfigs) {
                const type = seriesConfig.seriesType;
                const filter = seriesConfig.filter;
                if (!this.seriesGeneratorService) {
                    this.seriesGeneratorService = Container.get('SeriesGeneratorService');
                }
                seriesData[type] = await this.seriesGeneratorService.findOneWithFilter(type, filter);
            }
        }

        for (let data of dataArray) {
            this.assignUserIdentity(data, user);
            await this.assignSeriesData(data, user);
        }

        const result: any = await this.model.insertMany(dataArray);

        if (SeriesConfig[module]) {
            const seriesConfigs = SeriesConfig[module];
            for (let seriesConfig of seriesConfigs) {
                const type = seriesConfig.seriesType;
                const filter = seriesConfig.filter;
                if (seriesData[type]?._id) {
                    await this.seriesGeneratorService.updatedSeriesByTotalEntry(type, filter, seriesData[type].totalEntry + dataArray.length);
                }
            }
        }

        return result;
    }

    public async findById(id: string, options?: PaginationOptions, user?: IUser): Promise<T | null> {
        // todo: fId, dId, cId
        const { populateFields, selectFields } = options || {};
        let query: any = this.model.findById(id);

        let extractSelectFields: any = {};
        if (selectFields) {
            extractSelectFields = this.processNestedFields(selectFields);
            if (populateFields) {
                extractSelectFields = this.populateSelectFields(extractSelectFields, populateFields);
            }
            query = query.select(extractSelectFields.select);
        }
        if (user) {
            query = this.applyHierarchyFilters(query, user);
        }
        if (populateFields) {
            query = this.applyPopulate(query, populateFields, extractSelectFields);
        }
        try {
            return await query.exec();
        } catch (error: any) {
            // logger.info('findById error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async findOne<K extends keyof T>(conditions: any, options?: PaginationOptions, user?: IUser): Promise<T | null> {
        // todo fId, dId, cId
        const { populateFields, selectFields } = options || {};
        let query: any = this.model.findOne(conditions);

        let extractSelectFields: any = {};
        if (selectFields) {
            extractSelectFields = this.processNestedFields(selectFields);
            if (populateFields) {
                extractSelectFields = this.populateSelectFields(extractSelectFields, populateFields);
            }
            query = query.select(extractSelectFields.select);
        }
        if (user) {
            query = this.applyHierarchyFilters(query, user);
        }
        if (populateFields) {
            query = this.applyPopulate(query, populateFields, extractSelectFields);
        }
        try {
            return await query.exec();
        } catch (error: any) {
            // logger.info('findOne error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async findOneBySort<K extends keyof T>(conditions: Partial<Pick<T, K>>, sortBy?: any): Promise<T | null> {
        try {
            if (sortBy) {
                return await this.model.findOne(conditions as any).sort(sortBy);
            }

            return await this.model.findOne(conditions as any);
        } catch (error: any) {
            // logger.info('findOneBySort error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }


    public async getLastSequence(): Promise<T | null> {
        try {
            let record = await this.model.find().sort({ _id: -1 }).limit(1);

            return record[0];
        } catch (error: any) {
            // logger.info('getLastSequence error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }


    public async distinct<K extends keyof T>(field: string, conditions: Partial<Pick<T, K>>): Promise<T[] | null> {
        try {

            return await this.model.distinct(field, conditions as any);
        } catch (error: any) {
            // logger.info('distinct error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    public async findByFilter<K extends keyof T>(conditions: any, options?: PaginationOptions, user?: IUser): Promise<T[]> {
        const { populateFields, selectFields, sortBy } = options || {};

        const modelKeys = Object.keys(this.model.schema.paths);

        if (modelKeys.includes('isActive') && !conditions['isActive' as keyof T]) {
            // conditions['isActive' as keyof T] = true as T[keyof T];
        }

        let query: Query<T[], T> = this.model.find(conditions as any);

        if (sortBy) {
            query = query.sort(sortBy);
        }
        let extractSelectFields: any = {};
        if (selectFields) {
            extractSelectFields = this.processNestedFields(selectFields);
            if (populateFields) {
                extractSelectFields = this.populateSelectFields(extractSelectFields, populateFields);
            }
            query = query.select(extractSelectFields.select);
        }
        if (user) {
            query = this.applyHierarchyFilters(query, user);
        }
        if (populateFields) {
            query = this.applyPopulate(query, populateFields, extractSelectFields);
        }
        try {
            return await query.exec();
        } catch (error: any) {
            // logger.info('findBySort error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    public async find(conditions: FilterQuery<T>, options?: PaginationOptions, user?: IUser): Promise<T[]> {
        const { page, limit, sortBy, populateFields, selectFields } = options || {};
        let query: Query<T[], T> = this.model.find(conditions as any);
        if (page && limit) {
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);
        } else if (limit) {
            query = query.limit(limit);
        }

        if (sortBy) {
            query = query.sort(sortBy);
        }
        let extractSelectFields: any = {};
        if (selectFields) {
            extractSelectFields = this.processNestedFields(selectFields);
            if (populateFields) {
                extractSelectFields = this.populateSelectFields(extractSelectFields, populateFields);
            }
            query = query.select(extractSelectFields.select);
        }
        if (user) {
            query = this.applyHierarchyFilters(query, user);
        }
        if (populateFields) {
            query = this.applyPopulate(query, populateFields, extractSelectFields);
        }
        try {
            return await query.exec();
        } catch (error: any) {
            // logger.info('find error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async paginateWithOptionsAndFilters(req: Request): Promise<{ data: T[]; totalRecords: number; totalPages: number; }> {
        let loggedInUser = req.user as IUser;
        const options: PaginationOptions = {
            page: Number(req.body.page) || 1,
            limit: Number(req.body.limit) || 10,
            sortBy: req.body.sortBy || { 'createdAt': -1 },
            populateFields: req.body.populateFields ? req.body.populateFields : [],
            selectFields: req.body.selectFields ? req.body.selectFields : [],
        };

        const filters: FilterQuery<Document> = {};
        if (req.body.filter) {
            for (const key in req.body.filter) {
                if (req.body.filter.hasOwnProperty(key)) {
                    const value = req.body.filter[key];
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
                            // logger.info('paginate value -----------', { data: key, value['>='], value });
                            if (Object.keys(value).includes('>=')) {
                                // logger.info('paginate value[>=] -----------', { data: value['>='] });
                                filters[key].$gte = value['>='];
                            }
                            if (Object.keys(value).includes('<=')) {
                                // logger.info('paginate value[<=] -----------', { data: value['<='] });
                                filters[key].$lte = value['<='];
                            }
                        } else {
                            filters[key] = value;
                        }
                    }
                }
            }
        }
        // logger.info('filters before -----------', { data: filters });
        if (this.model.modelName === 'User' && filters.type && filters.type.$in && filters.type.$in.length && filters.type.$in.includes(USER_TYPES.MASTER_ADMIN)) {
            filters.type.$in = filters.type.$in.filter((type: number) => type !== USER_TYPES.MASTER_ADMIN);
        }
        if (this.model.modelName === 'User') {
            if (!filters.type || !filters.type.$in || !filters.type.$in.length) {

                // logger.info('filters 111111111 -----------', { data: filters });
                filters.type = {
                    // $nin: this.filterUserTypes(loggedInUser.type)
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
            filters.$or = searchOptions.keys.map((field: string) => {
                return { [field]: new RegExp(searchOptions.keyword, 'i') };
            });
        }
        if (req.body.startDate && req.body.endDate) {
            let startDate = moment(req.body.startDate).toDate();
            let endDate = moment(req.body.endDate).toDate();
            filters.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }
        const paginatedData = await this.paginate(filters, options, loggedInUser, req.body.filter || {});
        return paginatedData;
    }

    private getDateFilter(conditions: FilterQuery<T>, reqBodyFilter: any) {
        if (reqBodyFilter && Object.keys(reqBodyFilter).length > 0) {
            if (reqBodyFilter.createdAt) {
                if (reqBodyFilter.createdAt['>=']) {
                    let startDate = moment(reqBodyFilter.createdAt['>=']).toDate();
                    conditions['createdAt' as keyof FilterQuery<T>].$gte = startDate;

                    delete conditions['createdAt' as keyof FilterQuery<T>]['>='];
                }
                if (reqBodyFilter.createdAt['<=']) {
                    let endDate = moment(reqBodyFilter.createdAt['<=']).toDate();
                    conditions['createdAt' as keyof FilterQuery<T>].$lte = endDate;

                    delete conditions['createdAt' as keyof FilterQuery<T>]['<='];
                }
            }
            for (const key in reqBodyFilter) {
                let schemaPath = this.model.schema.paths;
                if (schemaPath && schemaPath[key] && schemaPath[key].instance === 'Date') {
                    if (reqBodyFilter[key]['>=']) {
                        let startDate = moment(reqBodyFilter[key]['>=']).toDate();
                        logger.info('startDate', { data: startDate, typeOf: typeof startDate });
                        conditions[key as keyof FilterQuery<T>].$gte = startDate;

                        delete conditions[key as keyof FilterQuery<T>]['>='];
                    }
                    if (reqBodyFilter[key]['<=']) {
                        let endDate = moment(reqBodyFilter[key]['<=']).toDate();
                        conditions[key as keyof FilterQuery<T>].$lte = endDate;

                        delete conditions[key as keyof FilterQuery<T>]['<='];
                    }
                }
            }
        }

        return conditions;
    }

    public async paginate(conditions: FilterQuery<T>, options: PaginationOptions, user?: IUser, reqBodyFilter?: any): Promise<{ data: T[]; totalRecords: number; totalPages: number; }> {
        conditions = this.getDateFilter(conditions, reqBodyFilter);

        // logger.info('paginate conditions *****', { data: conditions });
        const { page = 1, limit = 10, sortBy, populateFields, selectFields } = options || {};
        const skip = (page - 1) * limit;
        const modelKeys = Object.keys(this.model.schema.paths);
        if (modelKeys.includes('isDeleted') && typeof conditions['isDeleted'] === 'undefined') {
            conditions['isDeleted' as keyof FilterQuery<T>] = false;
        }
        // logger.info('paginate conditions', { data: conditions });
        let query: Query<T[], T> = this.model.find(conditions).skip(skip).limit(limit);
        let countQuery: any = this.model.count(conditions);
        if (sortBy) {
            query = query.sort(sortBy);
        }
        let extractSelectFields: any = {};
        if (selectFields) {
            extractSelectFields = this.processNestedFields(selectFields);
            if (populateFields) {
                extractSelectFields = this.populateSelectFields(extractSelectFields, populateFields);
            }
            query = query.select(extractSelectFields.select);
        }
        // adding user hierarchy filters
        if (user) {
            query = this.applyHierarchyFilters(query, user);
            countQuery = this.applyHierarchyFilters(countQuery, user);
        }
        if (populateFields) {
            query = this.applyPopulate(query, populateFields, extractSelectFields);
        }
        try {
            const [data, totalRecords] = await Promise.all([query.exec(), countQuery]);

            const totalPages = Math.ceil(totalRecords / limit);

            return { data, totalRecords, totalPages };
        } catch (error: any) {
            logger.info('paginate error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async getCount(conditions: FilterQuery<T>, user?: IUser): Promise<number> {
        const modelKeys = Object.keys(this.model.schema.paths);
        if (modelKeys.includes('isDeleted') && typeof conditions['isDeleted'] === 'undefined') {
            conditions['isDeleted' as keyof FilterQuery<T>] = false;
        }
        let query: any = this.model.count(conditions);

        if (user) {
            query = this.applyHierarchyFilters(query, user);
        }
        try {
            return await query.exec();
        } catch (error: any) {
            logger.info('getCount error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async update(id: string, updateData: Partial<T>, user?: IUser): Promise<T | null> {
        try {
            // todo check for empty string
            // for (let key in updateData) {
            //     if (updateData[key] === '') {
            //         delete updateData[key];
            //     }
            // }

            let record: any = await this.model.findById(id);

            if (record && record.isDeleted) {
                throw commonMessages.ALREADY_SOFT_DELETED;
            }

            if (user) {
                await this.checkPermission(id, user);
            }

            if (record && record.assignedTo && updateData['assignedTo' as keyof T] && record.assignedTo !== updateData['assignedTo' as keyof T]) {
                updateData['assignedDateTime' as keyof T] = new Date() as T[keyof T];
            } else if (record && !record.assignedTo && updateData['assignedTo' as keyof T]) {
                updateData['assignedDateTime' as keyof T] = new Date() as T[keyof T];
            }
            if (record && !record.solvedBy && updateData['solvedBy' as keyof T]) {
                updateData['resolvedDateTime' as keyof T] = new Date() as T[keyof T];
            }

            if (record && record.statusTrack) {
                updateData['statusTrack' as keyof T] = this.getStatusTrack(user?._id.toString(), updateData, record);
            }

            const updatedRecord = await this.model.findByIdAndUpdate(id, updateData, { new: true });

            // Log activity for important models
            if (this.model.modelName !== 'ActivityLog' && this.model.modelName !== 'UserLogs' && updatedRecord) {
                try {
                    // Identify changed fields and extract only changed values
                    const changedFields: string[] = [];
                    const beforeChanges: any = {};
                    const afterChanges: any = {};

                    const recordObj = record.toObject ? record.toObject() : record;
                    const updatedObj = updatedRecord.toObject ? updatedRecord.toObject() : updatedRecord;

                    for (const key in updateData) {
                        // Skip internal fields
                        if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') continue;

                        const oldValue = recordObj[key];
                        const newValue = updatedObj[key];

                        // Compare values (stringify for deep comparison)
                        const oldStr = JSON.stringify(oldValue);
                        const newStr = JSON.stringify(newValue);

                        if (oldStr !== newStr) {
                            changedFields.push(key);
                            beforeChanges[key] = oldValue;
                            afterChanges[key] = newValue;
                        }
                    }

                    // Only log if there are actual changes
                    if (changedFields.length > 0) {
                        const ActivityLogService = (await import('../../ActivityLog/services/ActivityLogService')).default;
                        await ActivityLogService.logActivity({
                            module: this.model.modelName,
                            action: ACTION_TYPES.UPDATE,
                            resourceId: id,
                            resourceType: this.model.modelName,
                            changeTracking: {
                                before: beforeChanges,
                                after: afterChanges,
                                changedFields
                            },
                            description: `Updated ${this.model.modelName}: ${changedFields.join(', ')}`
                        }, user);
                    }
                } catch (logError) {
                    logger.error('Error logging activity:', { error: logError });
                }
            }

            return updatedRecord;
        } catch (error: any) {
            logger.info('update error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async updateMany(criteria: any, updateData: any): Promise<void> {
        // logger.info('updateMany -----------------------', { data: criteria, updateData });
        try {
            await this.model.updateMany(criteria, updateData, { multi: true });
        } catch (error: any) {
            logger.info('updateMany error', { data: error });
            throw DBErrorHandler.handleError(error);
        }
    }

    public async updateOneWithoutSet(criteria: any, updateData: any): Promise<void> {
        logger.info('updateOneWithoutSet -----------------------', { data: criteria, updateData });
        try {
            await this.model.updateOne(criteria, updateData, { upsert: true });
        } catch (error: any) {
            logger.info('updateOneWithoutSet error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    public async updateOne(filter: Record<string, any>, updateData: Partial<T>, user?: IUser): Promise<void> {
        // todo fId, dId, cId
        const modelKeys = Object.keys(this.model.schema.paths);

        /* if (modelKeys.includes('adminId') && user && user.type === USER_TYPES.ADMIN) {
            filter['adminId'] = user._id;
        }

        if (modelKeys.includes('clientId') && user && user.type === USER_TYPES.CLIENT) {
            filter['clientId'] = user._id;
        }

        if (modelKeys.includes('staffId') && user && user.type === USER_TYPES.STAFF) {
            filter['staffId'] = user._id;
        } */
        try {
            await this.model.updateOne(filter, updateData);
        } catch (error: any) {
            logger.info('updateOne error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    // remark: this method is used to return the updated data
    // public async updateOne(filter: object, updateData: Partial<T>, user: IUser): Promise<T | null> {
    //     // todo fId, dId, cId
    //     const result = await this.model.updateOne(filter, updateData);

    //     if (result.modifiedCount > 0) {
    //         return this.model.findOne(filter);
    //     } else {
    //         return null;
    //     }
    // }

    public async delete(id: string, user: IUser): Promise<void> {
        try {
            await this.checkPermission(id, user);
            await this.model.findByIdAndDelete(id);
        } catch (error: any) {
            throw DBErrorHandler.handleError(error);
        }
    }

    public async deleteMany(criteria: any): Promise<void> {
        try {
            await this.model.deleteMany(criteria);
        } catch (error: any) {
            throw DBErrorHandler.handleError(error);
        }
    }

    public async deleteByCriteria(criteria: any): Promise<void> {
        try {
            await this.model.deleteMany(criteria);
            // await this.model.findByIdAndDelete(id);
        } catch (error: any) {
            throw DBErrorHandler.handleError(error);
        }
    }

    public async activate(id: string, user: IUser): Promise<T | null> {
        return this.updateField(id, 'isActive' as keyof T, true, user);
    }

    public async deactivate(id: string, user: IUser): Promise<T | null> {
        return this.updateField(id, 'isActive' as keyof T, false, user);
    }

    public async softDelete(id: string, user: IUser): Promise<T | null> {
        return this.updateField(id, 'isDeleted' as keyof T, true, user);
    }

    public async setDefault(id: string, user: IUser): Promise<T | null> {
        return this.updateField(id, 'isDefault' as keyof T, true, user);
    }

    private async updateField(id: string, fieldName: keyof T, fieldValue: boolean, user: IUser): Promise<T | null> {
        try {
            await this.checkPermission(id, user);
            const updateData: Partial<T> = { [fieldName]: fieldValue } as unknown as Partial<T>;
            let record: any = await this.model.findById(id);
            if (record && record.isDeleted) {
                throw commonMessages.ALREADY_SOFT_DELETED;
            }
            if (record && record[fieldName] === fieldValue) {
                let msg = commonMessages.ALREADY_ACTIVATED;
                if (fieldName === 'isActive' && !fieldValue) {
                    msg = commonMessages.ALREADY_DEACTIVATED;
                } else if (fieldName === 'isDeleted' && fieldValue) {
                    msg = commonMessages.ALREADY_SOFT_DELETED;
                } else if (fieldName === 'isDefault' && !record.isActive) {
                    msg = commonMessages.NOT_ACTIVE;
                }
                throw msg;
            }

            return await this.model.findByIdAndUpdate({ _id: id }, updateData, { new: true });
        } catch (error: any) {
            logger.info('findByIdAndUpdate error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    private applyHierarchyFilters(query: Query<T[], T>, user: IUser): Query<T[], T> {
        const modelKeys = Object.keys(this.model.schema.paths);

        /* if (modelKeys.includes('adminId') && user.type === USER_TYPES.ADMIN) {
            query = query.where('adminId').equals(user._id);
        }

        if (modelKeys.includes('clientId') && user.type === USER_TYPES.CLIENT) {
            query = query.where('clientId').equals(user._id).where('adminId').equals(user.adminId);
        }

        if (modelKeys.includes('staffId') && user.type === USER_TYPES.STAFF) {
            query = query.where('staffId').equals(user._id).where('clientId').equals(user.clientId).where('adminId').equals(user.adminId);
        } */

        return query;
    }

    private async checkPermission(id: string, user: IUser): Promise<void> {
        const existingItem = await this.model.findById(id);
        if (!existingItem) {
            throw messages.NOT_FOUND;
        }

        const modelKeys = Object.keys(this.model.schema.paths);
        const idKeys: string[] = ['adminId', 'clientId', 'staffId'];

        for (const key of idKeys) {
            if (modelKeys.includes(key)) {
                const itemUserId = (existingItem[key as keyof T] as any)?.toString();
                const userUserId = user._id.toString();

                /* if (user.type === USER_TYPES.ADMIN && key === 'adminId' && itemUserId !== userUserId) {
                    throw commonMessages.INSUFFICIENT_PERMISSION;
                }
                if (user.type === USER_TYPES.CLIENT && key === 'clientId' && itemUserId !== userUserId) {
                    throw commonMessages.INSUFFICIENT_PERMISSION;
                }
                if (user.type === USER_TYPES.STAFF && key === 'staffId' && itemUserId !== userUserId) {
                    throw commonMessages.INSUFFICIENT_PERMISSION;
                } */
            }
        }
    }

    private applyPopulate(query: Query<any, any>, populateFields: string[], nestedSelect: NestedSelect): Query<any, any> {
        for (const field of populateFields) {
            if (nestedSelect[field]) {
                for (const field in nestedSelect) {
                    if (field !== 'select') {
                        const nestedPopulate: any = nestedSelect[field];
                        if (nestedPopulate && Object.keys(nestedPopulate).length > 0) {
                            query = query.populate({
                                path: field,
                                select: nestedPopulate.select,
                                populate: this.recursivePopulate({}, nestedPopulate)
                            });
                        } else {
                            query = query.populate({
                                path: field,
                                select: nestedPopulate.select
                            });
                        }
                    }
                }
            } else if (field.includes('.')) {
                const [fieldName, pathName] = field.split('.');
                const nestedPopulate: any = nestedSelect[fieldName] || {};
                const nestedPopulateFields = nestedPopulate[pathName] || {};

                if (nestedPopulateFields && Object.keys(nestedPopulateFields).length > 0) {
                    query = query.populate({
                        path: field,
                        select: nestedPopulateFields.select,
                        populate: this.recursivePopulate({}, nestedPopulateFields)
                    });
                } else {
                    query = query.populate(field);
                }
            } else {
                query = query.populate(field);
            }
        }

        return query;
    }

    private recursivePopulate(parent: any, nestedSelect: NestedSelect): any {
        const result: any[] = [];
        for (const field in nestedSelect) {
            if (field !== 'select') {
                const nestedFields: any = nestedSelect[field];
                if (nestedFields && Object.keys(nestedFields).length > 0) {
                    if (JSON.stringify(nestedFields.select) === JSON.stringify(['*'])) {
                        result.push({
                            path: field,
                        });
                    } else {
                        result.push({
                            path: field,
                            select: nestedFields.select,
                            populate: this.recursivePopulate({}, nestedFields)
                        });
                    }
                } else {
                    result.push({
                        path: field,
                        select: nestedFields.select
                    });
                }
            }
        }

        return result;
    }

    public async aggregateQuery(query: any): Promise<T[] | null> {
        let record = await this.model.aggregate(query);

        return record;
    }


    private getStatusTrack(userId: string, params: any, record: any) {
        let statusTrack = record.statusTrack;
        if (!statusTrack || !Array.isArray(statusTrack)) {
            statusTrack = [];
        }
        let remark = `Data updated:`;

        for (let key in params) {
            logger.info('key', { data: key, recordValue: record[key] });
            if (record[key] && params[key].toString() !== record[key].toString()) {
                remark += ` ${key} updated: ${record[key]} => ${params[key]}`;
            } else if (params[key] && !record[key]) {
                remark += ` ${key} set to  ${params[key]}`;
            }
        }

        let newStatus = {
            status: params.status || record.status,
            dateTime: new Date(),
            userId: userId,
            remark: remark
        };
        statusTrack.unshift(newStatus);

        return statusTrack;
    }

    public async findOneAndUpdate(conditions: any, updateData: any, user?: IUser): Promise<T | null> {
        try {
            this.assignUserIdentity(updateData, user);
            return await this.model.findOneAndUpdate(conditions, updateData, { upsert: true, new: true });
        } catch (error: any) {
            logger.info('findOneAndUpdate error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    public async validateNestWithinZone(coordinates: any, id?: any) {
        let geoQuery = [];
        for (let coordinate of coordinates[0]) {
            let newQuery = {
                boundary: {
                    $geoIntersects: {
                        $geometry: {
                            type: 'Point',
                            coordinates: coordinate
                        }
                    }
                }
            };
            geoQuery.push(newQuery);
        }
        let query = {
            isDeleted: false,
            '$and': geoQuery
        };
        let matchedZone = await this.find(
            query
        );

        if (matchedZone && matchedZone.length > 0) {
            return matchedZone;
        }

        throw messages.NEST_OUT_OF_ZONE;
    }

    public async validateIntersectBoundary(boundary: any, id?: any) {
        let query: any = {};
        if (id) {
            query._id = { '$nin': [id] };
        }
        let newQuery = {
            ...query,
            boundary: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: boundary
                    }
                }
            }
        };
        // logger.info('query============');
        // console.log(JSON.stringify(newQuery));
        // logger.info('query============');
        let matchedRecord = await this.find(newQuery);

        if (matchedRecord && matchedRecord.length) {
            throw messages.BOUNDARY_INTERSECT;
        }
    }

    public async createAggregateQuery(createdAtFlag?: number | null, isAddChartQuery: boolean = false, startDate?: Date | null, endDate?: Date | null, matchFilter?: any, groupBy?: any, sort?: any, lookup?: any, unwind?: any, project?: any): Promise<T[] | null> {
        try {
            let pipeline = [];

            if (matchFilter) {
                pipeline.push({ $match: matchFilter });
            }
            if (startDate && endDate) {
                pipeline[0].$match.createdAt = { $gte: startDate, $lte: endDate };
            }
            /*
            if (createdAtFlag && (!startDate || !endDate)) {
                logger.info('createAggregateQuery createdAtFlag', { data: createdAtFlag });
                let dateFilter = dbQueryUtils.createCreatedAtDateFilter(createdAtFlag);

                if (dateFilter && dateFilter.$gte && dateFilter.$lte) {
                    logger.info('createAggregateQuery dateFilter', { data: typeof dateFilter.$gte, typeof new Date() });
                    pipeline[0].$match.createdAt = dateFilter;
                }
            }
            */
            if (groupBy) {
                pipeline.push({ $group: groupBy });
            }
            if (sort) {
                pipeline.push({ $sort: sort });
            }
            if (lookup) {
                pipeline.push({ $lookup: lookup });
            }
            if (unwind) {
                pipeline.push({ $unwind: unwind });
            }
            logger.info('this.model.modelName', { data: this.model.modelName });
            if (isAddChartQuery && this.model.modelName === 'DriverParcelTrack') {
                pipeline = this.driverParcelTrackQuery(pipeline, createdAtFlag, pipeline[0].$match.createdAt);
            }
            if (project) {
                pipeline.push({ $project: project });
            }

            logger.info('createAggregateQuery pipeline', { data: JSON.stringify(pipeline) });
            let result = await this.model.aggregate(pipeline);

            logger.info('createAggregateQuery result', { data: result });
            return result;
        } catch (error: any) {
            logger.info('createAggregateQuery error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }

    private getRange(createdAtFlag?: number | null, dateFilter?: any) {
        let range = [1, 13]; // Default range for year

        if (createdAtFlag === DATE_FILTER_BY.MONTH && dateFilter) {
            let startDate = moment(dateFilter.$gte).toDate();
            let endDate = moment(dateFilter.$lte).toDate();

            let daysInMonth = moment(endDate).diff(startDate, 'days') + 1;

            range = [1, daysInMonth];
        } else if (createdAtFlag === DATE_FILTER_BY.WEEK) {
            range = [1, 8];
        } else if (createdAtFlag === DATE_FILTER_BY.DAY) {
            range = [1, 2];
        }

        return range;
    }

    private driverParcelTrackQuery(pipeline: any[], createdAtFlag?: number | null, dateFilter?: any) {
        logger.info('driverParcelTrackQuery dateFilter', { data: createdAtFlag, dateFilter });

        let range = this.getRange(createdAtFlag, dateFilter);
        pipeline.push({
            $group: {
                _id: '$_id.customerId',
                parcelsPerDate: { $push: { date: '$_id.date', parcelDelivered: '$parcelDelivered' } },
                customerName: { $first: '$customerId.name' },
            }
        });

        pipeline.push({
            $project: {
                customerName: 1,
                parcelsPerDate: {
                    $let: {
                        vars: {
                            dateRange: { $range: range }
                        },
                        in: {
                            $map: {
                                input: '$$dateRange',
                                as: 'date',
                                in: {
                                    $let: {
                                        vars: {
                                            parcelData: {
                                                $filter: {
                                                    input: '$parcelsPerDate',
                                                    as: 'data',
                                                    cond: { $eq: [{ $toInt: '$$data.date' }, '$$date'] }
                                                }
                                            }
                                        },
                                        in: {
                                            $ifNull: [{ $arrayElemAt: ['$$parcelData.parcelDelivered', 0] }, 0]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return pipeline;
    }

    public async getStatusCount(key: string, filter?: any): Promise<T[] | null> {
        try {
            let query = [];
            if (filter) {
                query.push({ $match: filter });
            }
            query.push(
                {
                    $group: {
                        _id: `$${key}`,
                        count: { $sum: 1 }
                    },
                },
                {
                    $project: {
                        _id: 1,
                        count: 1
                    }
                }
            );

            logger.info('getStatusCount query >>', { data: query });
            let result = await this.model.aggregate(query);

            return result;
        } catch (error: any) {
            logger.info('getStatusCount error', { data: error });

            throw DBErrorHandler.handleError(error);
        }
    }
}