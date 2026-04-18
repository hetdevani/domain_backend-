import { Document, Types } from 'mongoose';

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
    _id?: string;
}

export interface IUser extends Document {
    name: string;
    type: number;
    countryCode: string;
    mobile: string;
    email: string;
    password: string;
    uniqueCode: string;
    role?: string;
    accessPermission?: PermissionModule[];
    androidPlayerId: [String];
    iosPlayerId: [String];
    image?: string;
    otp?: string;
    otpSentTime?: Date | null;
    isActive?: boolean;
    isDeleted?: boolean;
    parentId?: Types.ObjectId;
    adminId?: Types.ObjectId;
    socketConnection: boolean;
    lastSocketConnection?: Date;
    isTwoFactorEnabled: boolean;
    secretKey: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ResetPassword {
    username: string,
    token: string,
    newPassword: string;
}