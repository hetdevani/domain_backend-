import { Schema, model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../interfaces/IUser';
import { USER_TYPES, USER_TYPES_ARRAY } from '../../common/constants/common';
import RoleService from '../../Role/services/RoleService';
import { SeriesConfig } from '../../common/config/SeriesConfig';
import { MODULES } from '../../common/constants/modules';
import DeleteSyncService from '../../deleteSync/services/DeleteSyncService';
import UserService from '../services/UserService';
import DynamicKeys from '../../common/models/Dynamic';
import logger from '../../common/services/WinstonLogger';

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        type: { type: Number, default: USER_TYPES.CUSTOMER, enum: USER_TYPES_ARRAY },
        countryCode: { type: String, required: false, default: '+91' },
        mobile: { type: String, required: false, unique: true, sparse: true },
        email: { type: String, unique: true },
        password: { type: String, required: false }, // hashedPassword
        uniqueCode: { type: String, unique: true },
        role: { type: String },
        accessPermission: [
            {
                module: { type: Number, required: true },
                name: { type: String, required: true },
                permissions: {
                    list: { type: Boolean, default: false },
                    view: { type: Boolean, default: false },
                    insert: { type: Boolean, default: false },
                    update: { type: Boolean, default: false },
                    delete: { type: Boolean, default: false },
                },
            },
        ],
        androidPlayerId: { type: [String] },
        iosPlayerId: { type: [String] },
        image: { type: String },
        otp: { type: String },
        otpSentTime: { type: Date },
        parentId: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        socketConnection: { type: Boolean, default: false },
        lastSocketConnection: { type: Date },
        isTwoFactorEnabled: { type: Boolean, default: false },
        secretKey: { type: String, required: false, default: '' },
    },
    { timestamps: true }
);

DynamicKeys.forEach(dynamicKey => {
    if (dynamicKey.isEnable) {
        // logger.info('dynamicKey', { data: [dynamicKey.key], dynamicKey });
        UserSchema.add({
            [dynamicKey.key]: {
                type: dynamicKey.type,
                ref: dynamicKey.ref,
                default: dynamicKey.default,
            },
        });
    }
});

SeriesConfig['User'] = [{
    seriesType: 'User',
    filter: (data: any) => ({
        type: data.type
    }),
    field: 'uniqueCode'
}];

UserSchema.pre<IUser>('save', async function (next) {
    if (this.isModified('password')) {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        logger.info('Password hashed:', { data: this.password });
    }
    logger.info('UserSchema.pre');
    let role = await RoleService.addAccessPermission(this.type);
    this.accessPermission = role.permissions ? role.permissions : [];
    next();
});

UserSchema.post<IUser>('save', async function (doc) {
    if (doc && doc.type === USER_TYPES.ADMIN) {
        (global as any).MASTER_ADMIN_ID = doc._id.toString();
    }

    await UserService.setUserInfoInRedis(doc._id, doc);
});

UserSchema.post('findOneAndUpdate', async function (doc) {
    // logger.info('findOneAndUpdate doc', { data: doc });
    if (doc && doc.isDeleted) {
        let deleteSyncData = {
            module: MODULES.USER,
            recordId: doc._id.toString(),
            data: doc
        };
        await DeleteSyncService.logDeletedRecords(deleteSyncData);
    }
    if (doc && doc.type === USER_TYPES.ADMIN) {
        (global as any).MASTER_ADMIN_ID = doc._id.toString();
    }
    await UserService.setUserInfoInRedis(doc._id, doc);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        logger.info('candidatePassword', { data: candidatePassword, password: this.password });
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        logger.info('isMatch', { data: isMatch });
        return isMatch;
    } catch (error) {
        logger.info('comparePassword error', { data: error });
        return false;
    }
};

export const User = model<IUser>('User', UserSchema);
