import { Schema, model } from 'mongoose';
import { IDeleteSync } from '../interfaces/IDeleteSync';

const DeleteSyncSchema = new Schema<IDeleteSync>(
    {
        module: { type: Number, required: true, },
        recordId: { type: String, required: true, },
        data: { type: Object }
    },
    { timestamps: true }
);

DeleteSyncSchema.pre<IDeleteSync>('save', function (next) {
    // Additional logic before DeleteSync creation can be added here
    next();
});

DeleteSyncSchema.post<IDeleteSync>('save', function (doc) {
    // Additional logic after DeleteSync creation can be added here
});

export const DeleteSync = model<IDeleteSync>('DeleteSync', DeleteSyncSchema);