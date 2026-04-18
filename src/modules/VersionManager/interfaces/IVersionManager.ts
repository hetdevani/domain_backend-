import { Document } from 'mongoose';

export interface IVersionManager extends Document {
    file: string;
    version: string;
    versionCode: number;
    description: string;
    isActive: boolean; 
    operatingSystem: number;
}
