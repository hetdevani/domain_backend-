import _ from 'lodash';
import mongoose from 'mongoose';
import Excel from 'exceljs';
import CryptoUtils from '../../common/utils/cryptoUtils';
import { USER_TYPES } from '../../common/constants/common';
import { SeriesConfig } from '../../common/config/SeriesConfig';
import Container from '../../common/services/Container';
import logger from '../../common/services/WinstonLogger';

export class FileOperationExcelService {
    private seriesGeneratorService;

    constructor() {
        this.seriesGeneratorService = Container.get('SeriesGeneratorService');
    }

    private async getModelSchema(module: string): Promise<any> {
        const model = mongoose.models[module];

        const modelSchema = model.schema;
        return modelSchema;
    }

    public async readAndValidateExcelHeaderData(filePath: string, header: string[]): Promise<any[]> {
        const upperCaseAlp = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);

        const workSheet = workbook.getWorksheet(1);
        let excelData: any[] = [];
        let headerTitleError: any[] = [];
        let column: any[] = [];
        let rows: any[] = [];
        let newRows: any[] = [];

        if (workSheet) {
            workSheet.eachRow({ includeEmpty: true }, function (row: any, rowNumber: number) {
                let data = row.values.slice(1);

                if (rowNumber === 1) {
                    column = data;
                    // _.each(column, (key: any, index: number) => {
                    //     // logger.info('workSheet.eachRow:', { data: CryptoUtils.getFloat(index) > 8 });
                        
                    //     if (CryptoUtils.getFloat(index) > 8) {
                    //         let cell = CryptoUtils.getFloat(index) + 1;
                          
                            
                    //         let message = `Headers are right but new header ${upperCaseAlp[index]}${cell} added after all header`;
                    //         headerTitleError.push(message);
                    //     }
                    // });
                    for (let key in header) {
                        if (column.length >= 9) {
                            if (!column[key]) {
                                let cell = CryptoUtils.getFloat(key) + 1;
                                headerTitleError.push(`Header ${upperCaseAlp[key]}${cell} is empty, It must be '${header[key]}'`);
                            }
                        } else if (header[key] !== column[key]) {
                            let cell = CryptoUtils.getFloat(key) + 1;
                            let message = `Header ${upperCaseAlp[key]}${cell} header is invalid, It must be '${header[key]}'`;
                            headerTitleError.push(message);
                        }
                    };

                } else {
                    /* 
                    let json: any = {};
                    let jsonStringKey: any = {};
                    _.each(column, (key, index) => {
                        jsonStringKey[key] = data[index];
                        json[index] = data[index];
                    });
                    rows.push(json);
                    newRows.push(jsonStringKey);
                    */

                    const rowData: any = {};
                    row.eachCell((cell: any, colNumber: any) => {
                        if (cell.value) {
                            const headerCell = workSheet.getRow(1).getCell(colNumber);
                            let header = headerCell.value as string;
                            // todo header name
                            // header.toLowerCase();
                            rowData[header] = cell.value;
                        }
                    });
                    if (rowData && !_.isEmpty(rowData)) {
                        //todo add series code
                        excelData.push(rowData);
                    }
                }
            });
        }

        if (headerTitleError && headerTitleError.length) {
            logger.info('headerTitleError', { data: headerTitleError });
            throw headerTitleError;
        }

        return excelData;
    }

    private isValidEnum(fieldValue: any, fields: any[]) {
        return fields.includes(fieldValue);
    }
    /*
        public async validateExcelData(records: any, schema: any, module: string, seriesData: any): Promise<any> {
            // logger.info('validateData seriesData', { data: seriesData });
            const validatedData = [];
            const validationErrors = [];
    
            let seriesTotalEntry = 0;
            let referenceData: any = {};
            let uniqueData: any = {};
            for (let data of records) {
                const index = records.indexOf(data);
                // const upperCaseAlp = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                /*
                const validationResult: any = {
                    errors: [],
                };
                * /
    
                for (const field in schema.paths) {
                    if ((field === '__v') || (field === '_id' && schema.paths[field].options.auto)) {
                        continue;
                    }
    
                    const fieldSchema = schema.paths[field].options;
                    const fieldValue = data[field];
                    let rowIndex = CryptoUtils.getFloat(index) + 2;
    
                    if (fieldSchema.required && !fieldValue) {
                        logger.info('Field ', { data: ${field}' is required.` });
                        validationErrors.push(`Field '${field}' is required in ${rowIndex}th row.`);
                    }
                    if (fieldSchema.unique) {
                        if (field === 'uniqueCode') {
                            continue;
                        }
                        if (fieldValue) {
                            if (!uniqueData[field]) {
                                uniqueData[field] = [];
                            } else if (uniqueData[field].indexOf(fieldValue) > -1) {
                                validationErrors.push(`Value '${fieldValue}' is not unique for field '${field}' in ${rowIndex}th row.`);
                            }
                            uniqueData[field].push(fieldValue);
                        }
                    }
                    if (fieldSchema.enum) {
                        logger.info('fieldSchema.enum >>>>>>>>>>>', { data: fieldSchema.enum });
                        const enumValues = schema.paths[field].options.enum;
    
                        if (!this.isValidEnum(fieldValue, enumValues)) {
                            validationErrors.push(`Value '${fieldValue}' for field '${field}' is not a valid enum value in ${rowIndex}th row.`);
                        }
                    }
                    if (fieldValue) {
                        if (fieldSchema.type) {
                            if (fieldSchema.ref) {
                                if (Array.isArray(fieldValue)) {  // Check if fieldValue is an array
                                    fieldValue.forEach(value => {
                                        logger.info('typeof value', { data: typeof value, value });
                                        if (typeof value !== 'string' && typeof value !== 'object') {
                                            validationErrors.push(`Value '${value}' for field '${field}' inside the array must be a valid string or object in ${rowIndex}th row.`);
                                        } else {
                                            if (!referenceData[field]) {
                                                referenceData[field] = {
                                                    value: [],
                                                    referenceModel: fieldSchema.ref,
                                                };
                                            }
                                            referenceData[field].value.push(value);
                                        }
                                    });
                                } else if (typeof fieldValue !== 'string' && typeof fieldValue !== 'object') {
                                    validationErrors.push(`Value '${fieldValue}' for field '${field}' must be a valid string or object id in ${rowIndex}th row.`);
                                } else {
                                    if (!referenceData[field]) {
                                        referenceData[field] = {
                                            value: [],
                                            referenceModel: fieldSchema.ref,
                                        };
                                    }
                                    referenceData[field].value.push(fieldValue);
                                }
                            } else if (typeof fieldValue !== fieldSchema.type.name.toLowerCase()) {
                                validationErrors.push(`Value '${fieldValue}' for field '${field}' must be of type '${fieldSchema.type.name.toLowerCase()}' in ${rowIndex}th row.`);
                            }
                        }
                    }
                }
                if (!validationErrors.length) {
                    if (seriesData && seriesData._id) {
                        let field = SeriesConfig[module].field;
                        if (!this.seriesGeneratorService) {
                            this.seriesGeneratorService = Container.get('SeriesGeneratorService');
                        }
    
                        const seriesCode = await this.seriesGeneratorService.createSeries(seriesData);
    
                        data[field] = seriesCode;
                        seriesTotalEntry += 1;
                        seriesData.totalEntry += 1;
                    }
                    validatedData.push(data);
                }
            }
    
            if (!_.isEmpty(uniqueData)) {
                for (const field in uniqueData) {
                    const isUnique = await this.isFieldValueUnique(module, field, uniqueData[field]);
                    if (!isUnique) {
                        validationErrors.push(`Value(s) is not unique for field '${field}'`);
                    }
                }
            }
            if (!_.isEmpty(referenceData)) {
                for (const field in referenceData) {
                    const associatedModel = referenceData[field].referenceModel;
                    const associatedModelSchema = await this.getModelSchema(associatedModel);
                    if (!associatedModelSchema) {
                        validationErrors.push(`Invalid associated model '${associatedModel}' for field '${field}'`);
                    } else {
                        const model = mongoose.model(associatedModel);
                        const existingRecord = await model.findById(referenceData[field].value);
    
                        if (!existingRecord || !existingRecord._id) {
                            validationErrors.push(`Wrong value for model '${associatedModel}' for field '${field}'`);
                        }
                    }
                }
            }
            logger.info('seriesTotalEntry && seriesData.totalEntry', { data: seriesTotalEntry, seriesData.totalEntry });
            let response: any = {
                errors: validationErrors,
                responseData: validatedData,
            };
            if (seriesData && seriesData._id) {
                response.seriesTotalEntry = seriesTotalEntry;
            }
            return response;
        }
    */
    private async isFieldValueUnique(module: string, fieldName: string, value: any): Promise<boolean> {
        let isUnique = true;
        const model = mongoose.model(module);
        let filter = {
            [fieldName]: value
        };
        // if (module === 'User') {
        //     filter.type = USER_TYPES.USER;
        // }

        const existingRecord = await model.findOne(filter);

        if (existingRecord) {
            isUnique = false;
        }
        return isUnique;
    }
}

export default new FileOperationExcelService();