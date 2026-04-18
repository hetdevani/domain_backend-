import { Schema, model } from 'mongoose';
import { IVersionManager } from '../interfaces/IVersionManager';
import { OPERATING_SYSTEM_ARRAY } from '../../common/constants/common';

const VersionManagerSchema: Schema<IVersionManager> = new Schema(
    {
        file: { type: String, required: true },
        version: { type: String, required: true, unique: true },
        versionCode: { type: Number, required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: false },
        operatingSystem: {
            type: Number,
            enum: OPERATING_SYSTEM_ARRAY
        },
    },
    { timestamps: true }
);

VersionManagerSchema.pre<IVersionManager>('save', async function (next) {
    // Additional logic after versionManager creation can be added here
    next();
});

VersionManagerSchema.post<IVersionManager>('save', function (doc) {
    // Additional logic after versionManager creation can be added here
});

export const VersionManager = model<IVersionManager>('VersionManager', VersionManagerSchema);
