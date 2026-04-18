import { Document } from 'mongoose';

export interface IUserLogs extends Document {
    ip: string;
    userLocation: {
        lat: number;
        lng: number;
    };
    userId: string;
    apiName: string;
}
