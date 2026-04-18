import { Schema, model } from 'mongoose';
import { ISeriesGenerator } from '../interfaces/ISeriesGenerator';

const SeriesGeneratorSchema: Schema<ISeriesGenerator> = new Schema(
    {
        name: { type: String, required: true },
        startFrom: { type: Number, default: 1 },
        digitLength: { type: Number, default: 5 },
        prefix: { type: String, default: '' },
        postfix: { type: String, default: '' },
        totalEntry: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        type: { type: Number, default: 1 },
        referenceId: { type: String, default: null },
    },
    { timestamps: true },
);

SeriesGeneratorSchema.index({ name: 1, type: 1, referenceId: 1 }, { unique: true });

SeriesGeneratorSchema.pre<ISeriesGenerator>('save', async function (next) {
    // Additional logic after SeriesGenerator creation can be added here
    next();
});

SeriesGeneratorSchema.post<ISeriesGenerator>('save', function (doc) {
    // Additional logic after SeriesGenerator creation can be added here
});

export const SeriesGenerator = model<ISeriesGenerator>('SeriesGenerator', SeriesGeneratorSchema);
