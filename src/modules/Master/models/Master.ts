import { Schema, model, Types } from 'mongoose';
import { IMaster } from '../interfaces/IMaster';
import DeleteSyncService from '../../deleteSync/services/DeleteSyncService';
import { MODULES } from '../../common/constants/modules';
import logger from '../../common/services/WinstonLogger';

const MasterSchema: Schema<IMaster> = new Schema(
    {
        name: { type: String, required: true, },
        // normalizeName: { type: String, required: false, },
        code: { type: String, unique: true, required: true, },
        // group: { type: String, }, // todo not required
        description: { type: String }, // todo not required
        isActive: { type: Boolean, default: true, },
        isDeleted: { type: Boolean, default: false, },
        isDefault: { type: Boolean, default: false, },
        sortingSequence: { type: Number }, // todo not required
        image: { type: String, },
        // icon: { type: String, },
        parentId: { type: Types.ObjectId, default: null, },
        // multiLanguageData: { type: Schema.Types.Mixed, default: {}, },
    },
    { timestamps: true }
);

MasterSchema.pre<IMaster>('save', async function (next) {
    // Additional logic after master creation can be added here
    next();
});

MasterSchema.post<IMaster>('save', function (doc) {
    // Additional logic after master creation can be added here
    let modelNames = 'Master';
    (global as any).MODEL_LAST_UPDATED_AT_TIME[modelNames] = new Date();
    logger.info('MODEL_LAST_UPDATED_AT_TIME create');
});


MasterSchema.post('findOneAndUpdate', async function (doc) {
    let modelNames = 'Master';
    (global as any).MODEL_LAST_UPDATED_AT_TIME[modelNames] = new Date();
    logger.info('MODEL_LAST_UPDATED_AT_TIME update', { data: (global as any).MODEL_LAST_UPDATED_AT_TIME[modelNames] });

    logger.info('findOneAndUpdate doc', { data: doc });
    if (doc && doc.isDeleted) {
        let deleteSyncData = {
            module: MODULES.MASTER,
            recordId: doc._id.toString(),
            data: doc
        }
        await DeleteSyncService.logDeletedRecords(deleteSyncData);
    }
});

MasterSchema.post('deleteOne', async function (doc) {
    if (doc && doc.isDeleted) {
        let deleteSyncData = {
            module: 'Master',
            recordId: doc._id,
            data: doc
        }
        await DeleteSyncService.logDeletedRecords(deleteSyncData);
    }
});
export const Master = model<IMaster>('Master', MasterSchema);
