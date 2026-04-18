import { Schema, model, Document, UpdateQuery } from 'mongoose';
import { IRole } from '../interfaces/IRole';
import RoleService from '../services/RoleService';
import logger from '../../common/services/WinstonLogger';

const RoleSchema = new Schema<IRole>(
    {
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        title: { type: String, required: true },
        userType: { type: Number, required: true },
        permissions: [
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
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

RoleSchema.pre<IRole>('save', async function (next) {
    // Additional logic before role creation can be added here
    if (!this.isDefault) {
        logger.info('this.userType', { isDefault: this.isDefault, userType: this.userType });
        const existingDefault = await RoleService.findDefaultRole(this.userType);

        logger.info('existingDefault', { data: existingDefault });
        if (!existingDefault) {
            this.isDefault = true;
        }
    }
    next();
});

RoleSchema.post<IRole>('save', async function (doc) {
    // Additional logic before role creation can be added here
});

RoleSchema.post('findOneAndUpdate', async function (doc) {
    // Additional logic before role creation can be added here
});

export const Role = model<IRole>('Role', RoleSchema);
