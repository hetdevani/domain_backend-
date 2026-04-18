import Joi from 'joi';
import _ from 'lodash';
import Excel from 'exceljs';
import { IFileOperation } from '../interfaces/IFileOperation';
import { CommonValidator } from '../../common/validator/CommonValidator';
import CryptoUtils from '../../common/utils/cryptoUtils';

export class FileOperationValidators extends CommonValidator {

    public static readonly uploadFileOperationSchema = Joi.object<IFileOperation>({
        // Add fields here for creating FileOperation. Example:
        // fieldName: Joi.type().rules(),
    });

    public static readonly removeFileOperationSchema = Joi.object({
        fileName: Joi.string().required(),
    });

    public static readonly importExcelSchema = Joi.object<Partial<IFileOperation>>({
        // Add fields here for updating FileOperation. Example:
        // fieldName: Joi.type().rules(),
    });
}
