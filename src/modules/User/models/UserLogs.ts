import { Schema, model } from 'mongoose';
import { IUserLogs } from '../interfaces/IUserLogs';

const UserLogsSchema: Schema<IUserLogs> = new Schema(
    {
        ip: { type: String, required: false },
        userLocation: {
            lat: { type: Number },
            lng: { type: Number }
        },
        userId: { type: String, required: true },
        apiName: { type: String, required: true }
    },
    { timestamps: true }
);

UserLogsSchema.pre<IUserLogs>('save', async function (next) {
    // Additional logic after userLogs creation can be added here
    next();
});

UserLogsSchema.post<IUserLogs>('save', function (doc) {
    // Additional logic after userLogs creation can be added here
});

export const UserLogs = model<IUserLogs>('UserLogs', UserLogsSchema);
