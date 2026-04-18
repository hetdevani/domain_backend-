import { Schema, model } from 'mongoose';
import { ISetting } from '../interfaces/ISetting';
import { SETTING_TYPE } from '../../common/constants/common';
import logger from '../../common/services/WinstonLogger';

const SettingSchema: Schema<ISetting> = new Schema(
    {
        supportEmail: { type: String, required: true },
        supportMobileNumber: { type: String, required: true },
        type: { type: Number, unique: true, default: SETTING_TYPE.SUPPORT_INFO }
    },
    { timestamps: true }
);

SettingSchema.pre<ISetting>('save', async function (next) {
    // Additional logic after setting creation can be added here
    next();
});

SettingSchema.post<ISetting>('save', function (doc) {
    // Additional logic after setting creation can be added here  
});

SettingSchema.post('findOneAndUpdate', async function (doc) {
    logger.info('findOneAndUpdate doc', { data: doc });
});

export const Setting = model<ISetting>('Setting', SettingSchema);
