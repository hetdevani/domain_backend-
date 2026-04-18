import { Model } from 'mongoose';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { ISeriesGenerator } from '../interfaces/ISeriesGenerator';
import { SeriesGenerator } from '../models/SeriesGenerator';
import { SeriesGeneratorService } from '../services/SeriesGeneratorService';

export class SeriesGeneratorDAO extends BaseDAO<ISeriesGenerator> {
    constructor() {
        super(SeriesGenerator);
    }
}

export default SeriesGeneratorDAO;