import { Schema, model } from 'mongoose';
import { IStaticPage } from '../interfaces/IStaticPage';

const StaticPageSchema: Schema<IStaticPage> = new Schema(
    {
        code: { type: String, required: true },
        description: { type: String, required: true }
    },
    { timestamps: true }
);

StaticPageSchema.pre<IStaticPage>('save', async function (next) {
    // Additional logic after staticPage creation can be added here
    next();
});

StaticPageSchema.post<IStaticPage>('save', function (doc) {
    // Additional logic after staticPage creation can be added here
});

export const StaticPage = model<IStaticPage>('StaticPage', StaticPageSchema);
