import { Document } from 'mongoose';

export interface IDeleteSync extends Document {
    module: number,
    recordId: string,
    data: object
}