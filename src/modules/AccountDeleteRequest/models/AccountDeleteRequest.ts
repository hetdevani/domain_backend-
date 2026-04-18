import { Schema, model } from 'mongoose';
import { IAccountDeleteRequest } from '../interfaces/IAccountDeleteRequest';

const AccountDeleteRequestSchema: Schema<IAccountDeleteRequest> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        requestedDate: { type: Date, required: true },
        message: { type: String, required: true },
    },
    { timestamps: true }
);

AccountDeleteRequestSchema.pre<IAccountDeleteRequest>('save', async function (next) {
    next();
});

AccountDeleteRequestSchema.post<IAccountDeleteRequest>('save', function (doc) {

});

export const AccountDeleteRequest = model<IAccountDeleteRequest>('AccountDeleteRequest', AccountDeleteRequestSchema);
