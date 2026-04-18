import { Document } from "mongoose";

export interface ISeriesGenerator extends Document {
    name: string;
    type: number;
    startFrom: number;
    digitLength: number;
    prefix: string;
    postfix: string;
    totalEntry: number;
    referenceId: string;
    isActive?: boolean;
    isDeleted?: boolean;
}