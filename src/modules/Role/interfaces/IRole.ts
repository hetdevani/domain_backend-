import { Document } from 'mongoose';

export interface Permissions {
    list: boolean;
    view: boolean;
    insert: boolean;
    update: boolean;
    delete: boolean;
}

export interface PermissionModule {
    module: number;
    name: string;
    permissions: Permissions;
}

export interface IRole extends Document {
    addedBy?: string;
    updatedBy?: string;
    title: string;
    userType: number;
    permissions: PermissionModule[];
    isActive?: boolean;
    isDefault?: boolean;
    isDeleted?: boolean;
}

export interface IEmptyRole extends Document {
    title: string;
    permissions: [];
}