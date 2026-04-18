import { Document, Types } from 'mongoose';

export interface IMaster extends Document {
    name: string;
    normalizeName: string;
    code: string;
    group: string;
    description: string;
    isActive: boolean;
    isDeleted: boolean;
    isDefault: boolean;
    sortingSequence: number;
    image: string;
    icon: string;
    parentId: Types.ObjectId | null;
    // multiLanguageData: {};
}