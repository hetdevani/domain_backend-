import { Document } from 'mongoose';

export interface ISetting extends Document {
    supportEmail: string;
    supportMobileNumber: string;
    type: number;
}
