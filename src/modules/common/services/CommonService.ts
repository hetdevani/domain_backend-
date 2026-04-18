import moment from 'moment';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import * as fs from 'fs';
import DeleteSyncService from "../../deleteSync/services/DeleteSyncService";
import { MomentUtils } from '../utils/momentUtils';
import { ExcelReportColumnHeaders } from '../constants/interface';
import { DATE_FILTER_BY, USER_TYPES } from '../constants/common';
import UserService from '../../User/services/UserService';
import Container from '../services/Container';
import { SeriesConfig } from '../config/SeriesConfig';
import { IUser } from '../../User/interfaces/IUser';
import logger from './WinstonLogger';

export const awsConnection = async (): Promise<S3Client> => {
    try {
        // Create and return an S3 client instance
        return new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY || "",
                secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY || "",
            },
        });
    } catch (error) {
        logger.error('Error initializing AWS S3 Client:', { error: error });
        throw new Error("Failed to create AWS S3 connection.");
    }
};
export class CommonService {
    private seriesGeneratorService;
    constructor() {
        this.seriesGeneratorService = Container.get('SeriesGeneratorService');
    }

    public async getDeletedRecordsForMultipleModule(modules: object, lastSyncDate: Date): Promise<any> {
        let deleted = await DeleteSyncService.find(
            {
                module: { '$in': modules },
                updatedAt: { '$gte': lastSyncDate }
            },
            { selectFields: ['module', 'recordId'] }
        );

        return deleted;
    }

    public async setUpdatedTimeForModels(): Promise<any> {
        let modelNames = [
            'Master',
        ];
        logger.info('MODEL_LAST_UPDATED_AT_TIME[modelName] before', { data: (global as any).MODEL_LAST_UPDATED_AT_TIME });

        for (let modelName of modelNames) {
            let record = await this.updateModelLastUpdatedTime(modelName);

            let updatedDate;
            if (record && record[0] && record[0].updatedAt) {
                updatedDate = moment(record[0].updatedAt).toDate();
            } else {
                logger.info('Setting last year updated time to model', { data: modelName });
                let updatedStringDate = MomentUtils.subtractTime(1, null, 'year');
                updatedDate = moment(updatedStringDate).toDate();
            }

            (global as any).MODEL_LAST_UPDATED_AT_TIME[modelName] = updatedDate;
        }
        logger.info('MODEL_LAST_UPDATED_AT_TIME[modelName] after', { data: (global as any).MODEL_LAST_UPDATED_AT_TIME });
    }

    private async updateModelLastUpdatedTime(modelName: string): Promise<any> {
        // logger.info('updateModelLastUpdatedTime modelName----------------------------------', { data: modelName });
        const modelServiceName = `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}Service`;
        // logger.info('updateModelLastUpdatedTime modelServiceName----------------------------------', { data: modelServiceName });

        const ModelService = require(`../../${modelName}/services/${modelServiceName}`).default;

        // logger.info('updateModelLastUpdatedTime ModelService----------------------------------', { data: ModelService });
        let paginateOption = {
            limit: 1,
            page: 1,
            sortBy: { 'updatedAt': -1 },
            selectFields: ['updatedAt']
        };
        const latestRecord = await ModelService.find({}, paginateOption);

        // logger.info('latestRecord', { data: modelName, latestRecord });
        return latestRecord;
    }

    public async generateExcel(data: any, moduleName: string): Promise<any> {
        const columnHeaders = this.getColumnHeaders(moduleName) as ExcelReportColumnHeaders[];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(moduleName);

        worksheet.columns = columnHeaders;

        data.forEach((item: any) => {
            let rowData: any = {};
            columnHeaders.forEach((column: any) => {
                if (column.isReference && column.populateKey && item[column.key]) {
                    // logger.info('item[column.key]', { data: item[column.key] });
                    if (Array.isArray(item[column.key])) {
                        // Handle array of object IDs
                        const populatedData = item[column.key].map((objectId: string) => {
                            return objectId ? objectId[column.populateKey] : '';
                        });
                        logger.info('populatedData ---------', { data: populatedData });
                        let result = populatedData.join(", ");
                        rowData[column.key] = result;
                    } else {
                        // Handle single object ID
                        rowData[column.key] = item[column.key][column.populateKey];
                    }
                } else {
                    if (column.key === 'type') {
                        logger.info('column', { data: column });
                    }
                    if (column.enum && typeof item[column.key] === 'number') {
                        rowData[column.key] = this.getKeyByValue(column.enum, item[column.key]);
                        // rowData[column.key] = column.enum[item[column.key]];
                        logger.info('rowData[column.key] enum', { data: rowData[column.key] });
                    } else if (column.isNestedObj) {
                        if (
                            item[column.nestedKey] &&
                            item[column.nestedKey][column.headerName] !== undefined &&
                            item[column.nestedKey][column.headerName] !== null
                        ) {
                            rowData[column.key] = item[column.nestedKey][column.headerName];
                        } else {
                            rowData[column.key] = '';
                        }
                    } else if (column.isDate) {
                        rowData[column.key] = MomentUtils.getTimeByTimeZone(item[column.key], 'DD-MM-YYYY hh:mm:ss');

                        logger.info('rowData[column.key] isDate', { data: rowData[column.key] });
                    } else if (column.isArrayObject && Array.isArray(item[column.key])) {
                        rowData[column.key] = item[column.key].map((obj: any) => obj[column.populateKey]).join(', ');
                    } else if (typeof item[column.key] === 'boolean') {
                        rowData[column.key] = item[column.key] ? 'Yes' : 'No';
                    } else {
                        rowData[column.key] = item[column.key];
                    }
                }
            });
            // logger.info('rowData', { data: rowData });
            worksheet.addRow(rowData);
        });

        const excelBuffer = await workbook.xlsx.writeBuffer();
        return excelBuffer;
    }

    private getKeyByValue(object: any, value: any) {
        return Object.keys(object).find(key => object[key] === value);
    }

    public async saveExcelToFile(data: any, moduleName: string): Promise<string> {
        const columnHeaders = this.getColumnHeaders(moduleName) as ExcelReportColumnHeaders[];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(moduleName);

        worksheet.columns = columnHeaders;

        /* data.forEach((item: any) => {
            const rowData: any = {};
            columnHeaders.forEach((column) => {
                rowData[column.key] = item[column.header];
            });
            worksheet.addRow(rowData);
        }); */

        data.forEach((item: any) => {
            const rowData: any = {};
            columnHeaders.forEach((column) => {
                if (column.isReference && column.populateKey && item[column.key] && item[column.key][column.populateKey]) {
                    rowData[column.key] = item[column.key][column.populateKey];
                } else {
                    rowData[column.key] = item[column.key];
                }
            });
            worksheet.addRow(rowData);
        });

        /* data.forEach((item: any) => {
            const rowData: any = {};
            columnHeaders.forEach((column) => {
                if (column.isReference && column.populateKey && item[column.key]) {
                    if (Array.isArray(item[column.key])) {
                        // Handle array of object IDs
                        const populatedData = item[column.key].map((objectId: string) => {
                            return objectId ? objectId[column.populateKey] : '';
                        });
                        rowData[column.key] = populatedData.join(', '); // Comma-separated values
                    } else {
                        // Handle single object ID
                        rowData[column.key] = item[column.key][column.populateKey];
                    }
                } else {
                    rowData[column.key] = item[column.key];
                }
            });
            worksheet.addRow(rowData);
        }); */

        let destinationPath = `assets/excel/${moduleName}/`;

        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true }); // This creates the directory recursively
        }

        // Generate a unique file name (e.g., using a timestamp)
        const fileName = `${moduleName}_${new Date().getTime()}.xlsx`;
        const filePath = path.join(destinationPath, fileName);

        // Save the Excel file to the server's file system
        await workbook.xlsx.writeFile(filePath);

        // Return the file URL to the client
        const fileUrl = `/excelFiles/${fileName}`; // Define your file URL based on your server setup
        return fileUrl;
    }

    private getColumnHeaders(moduleName: string) {
        switch (moduleName) {
            case 'User':
                return [
                    { header: 'Name', key: 'name' },
                    { header: 'Country Code', key: 'countryCode' },
                    { header: 'Mobile', key: 'mobile' },
                    { header: 'Email', key: 'email' },
                    { header: 'City', key: 'cityId', isReference: true, populateKey: 'name' },
                    { header: 'State', key: 'stateId', isReference: true, populateKey: 'name' },
                    { header: 'Country', key: 'countryId', isReference: true, populateKey: 'name' },
                    { header: 'Admin', key: 'adminId', isReference: true, populateKey: 'name' },
                    { header: 'User', key: 'userId', isReference: true, populateKey: 'name' },
                    { header: 'Address', headerName: 'address', nestedKey: 'addresses', isNestedObj: true, key: "address" },
                    { header: 'Pincode', headerName: 'pincode', nestedKey: 'addresses', isNestedObj: true, key: "pincode" },
                ];
        }
    }

    public async setAdminId(): Promise<any> {
        let filter = {
            type: USER_TYPES.MASTER_ADMIN
        };
        let admin = await UserService.findOne(filter, { selectFields: ['_id'] });
        if (admin) {
            (global as any).MASTER_ADMIN_ID = admin._id.toString();
        }
    }

    public getNewLat(lat: number, meters: number) {
        // radius of the earth in kilometer
        let earth = 6378.137;
        let pi = Math.PI;
        // 1 meter in degree
        let m = (1 / ((2 * pi / 360) * earth)) / 1000;

        const newLat = lat + (meters * m);

        return newLat;
    }

    public getNewLong(lat: number, long: number, meters: number) {
        // radius of the earth in kilometer
        let earth = 6378.137;
        let pi = Math.PI;
        let cos = Math.cos;
        // 1 meter in degree
        let m = (1 / ((2 * pi / 360) * earth)) / 1000;

        let newLong = long + (meters * m) / cos(lat * (pi / 180));

        return newLong;
    }

    public getDifferenceOfLocation(coordinate1: any, coordinate2: any) {
        const R = 6371; // Radius of earth
        let diffLat = this.degreeToRadian(coordinate2.lat - coordinate1.lat);
        let diffLng = this.degreeToRadian(coordinate2.lng - coordinate1.lng);
        let lat1 = this.degreeToRadian(coordinate1.lat);
        let lng1 = this.degreeToRadian(coordinate1.lng);

        let distance = Math.sin(diffLat / 2) * Math.sin(diffLat / 2) + Math.sin(diffLng / 2) * Math.sin(diffLng / 2) * Math.cos(lat1) * Math.cos(lng1);
        distance = 2 * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance));
        distance = R * distance;

        return distance * 1000;
    }

    private degreeToRadian(degree: number) {
        return degree * Math.PI / 180;
    }

    public getCategories(createdAtFlag: number, startDate: Date | null, endDate: Date | null) {
        let categories: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // Default

        if (createdAtFlag === DATE_FILTER_BY.MONTH) {
            categories = [];
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Loop through each day from start to end date
                for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;

                    categories.push(formattedDate);
                }
            }
        } else if (createdAtFlag === DATE_FILTER_BY.WEEK) {
            categories = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        } else if (createdAtFlag === DATE_FILTER_BY.DAY) {
            categories = ['Today'];
        }

        return categories;
    }

    public async assignSeriesData(data: any, modelName: string, user?: IUser): Promise<void> {
        logger.info('common assignSeriesData', { data: modelName });
        if (SeriesConfig[modelName]) {
            if (!this.seriesGeneratorService) {
                this.seriesGeneratorService = Container.get('SeriesGeneratorService');
            }
            const seriesConfigs = SeriesConfig[modelName];
            for (let seriesConfig of seriesConfigs) {
                const field = seriesConfig.field;
                const filter = seriesConfig.filter(data);
                let seriesConfigGeneratorSeriesObj = seriesConfig.generatorSeries && seriesConfig.generatorSeries(data);
                logger.info('common seriesConfig.generatorSeries', { data: seriesConfigGeneratorSeriesObj });
                const seriesCode = await this.seriesGeneratorService.createAndUpdateSeries(seriesConfig.seriesType, filter, user, seriesConfigGeneratorSeriesObj);
                data = JSON.parse(JSON.stringify(data));
                data[field] = seriesCode;
            }
        }

        return data;
    }

    public isValidUTCDate(dateStr: string): boolean {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        return regex.test(dateStr) && !isNaN(new Date(dateStr).getTime());
    };

    public async downloadReportData(reportData: any, name: string) {

        // logger.info('downloadReportData reportData ------------', { data: reportData });

        // if (!reportData || !reportData.length) {
        //     throw messages.NOT_FOUND;
        // }
        let excelBuffer = await this.generateExcel(reportData, name);
        // logger.info('excelBuffer ------------', { data: excelBuffer });
        return excelBuffer;
    }



    public async uploadActivityLogTos3(logData: any | any[], moduleName: string, type: string) {
        try {
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = now.getUTCDate().toString().padStart(2, '0');
            const filePath = `static/activityLogs/${year}/${month}/${day}/index.json`;

            const dataArray = Array.isArray(logData) ? logData : [logData];

            // Convert each item to the required format
            const storeData = dataArray.map((item: any) => ({
                Body: item,
                Metadata: {
                    moduleName: moduleName,
                    type: type
                }
            }));

            // Read existing data from S3
            const S3ConnectionService = require('./s3ConnectionService').S3ConnectionService;
            const existingData = await S3ConnectionService.readDataFromS3(filePath);

            // Append new brightness data
            const updatedData = [...storeData, ...(existingData || [])];

            // Write back to S3
            await S3ConnectionService.writeDataToS3(filePath, updatedData);
        } catch (error) {
            logger.error('Error uploading activity log to S3:', { error: error });
            return null;
        }
    }

    public async timeDurationGet(startDate: Date, endDate: Date) {
        const durationMs = endDate.getTime() - startDate.getTime();

        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }


    // Monthly 4GB Internet Use
    public async internetUseInBytes(type: number): Promise<any> {
        try {
            const monthlyUseGB = 4; // 4 GB monthly
            const bytesInOneGB = 1024 * 1024 * 1024; // 1 GB = 1073741824 bytes
            const monthlyBytes = monthlyUseGB * bytesInOneGB;

            switch (type) {
                case 1: // Daily
                    return monthlyBytes / 30;
                case 2: // Hourly
                    return monthlyBytes / (30 * 24);
                case 3: // Per minute
                    return monthlyBytes / (30 * 24 * 60);
                case 4: // Per second
                    return monthlyBytes / (30 * 24 * 60 * 60);
                default:
                    throw new Error("Invalid type. Use 1 for daily, 2 for hourly, 3 for minute, 4 for second.");
            }
        } catch (error) {
            logger.error('Error internetUseInBytes:', { error: error });
            return null;
        }
    }
}

export default new CommonService();