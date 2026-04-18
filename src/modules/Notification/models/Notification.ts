import { Schema, model } from 'mongoose';
import { INotification } from '../interfaces/INotification';
import { PRIORITY, PRIORITY_ARRAY, NOTIFICATION_TYPE, NOTIFICATION_TYPE_ARRAY, NOTIFICATION_STATUS, NOTIFICATION_STATUS_ARRAY } from '../../common/constants/common';

const NotificationSchema: Schema<INotification> = new Schema(
    {
        title: { type: 'string', required: true },
        description: { type: 'string', default: '' },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: 'number', required: true, default: NOTIFICATION_STATUS.UNREAD, enum: NOTIFICATION_STATUS_ARRAY },
        type: { type: 'number', default: NOTIFICATION_TYPE.WEB, enum: NOTIFICATION_TYPE_ARRAY },
        priority: { type: "number", enum: PRIORITY_ARRAY, default: PRIORITY.LOW },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

NotificationSchema.pre<INotification>('save', async function (next) {
    next();
});

NotificationSchema.post<INotification>('save', function (doc) {

});

export const Notification = model<INotification>('Notification', NotificationSchema);
