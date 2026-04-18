import { Document } from 'mongoose';

export interface IStaticPage extends Document {
    code: string;
    description: string;
}