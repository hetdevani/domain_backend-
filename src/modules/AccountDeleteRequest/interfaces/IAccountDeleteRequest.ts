import { Document, Types } from 'mongoose';

export interface IAccountDeleteRequest extends Document {
    userId: Types.ObjectId;
    requestedDate: Date;
    message: string;
}
