import { IUser } from '../../User/interfaces/IUser';
import Container from '../../common/services/Container';
import SeriesGeneratorDAO from '../dao/SeriesGeneratorDAO';
import { messages } from '../message';
import logger from '../../common/services/WinstonLogger';

export class SeriesGeneratorService extends SeriesGeneratorDAO {

    private getUpdatedMessage(messageObj: any, type: string): string {
        return messageObj?.message?.replace('$moduleName', type) || '';
    }

    public async createAndUpdateSeries(type: string, filter: object, user: IUser, generatorSeries: any): Promise<string> {
        let baseFilter = {
            name: type
        };
        let seriesFilter = {
            ...baseFilter,
            ...filter
        }
        logger.info('seriesFilter', { data: seriesFilter });
        const options = {
            // populateFields: []
        };
        let seriesData = await this.findOne(seriesFilter, options);

        if (!seriesData) {
            if (!generatorSeries) {
                throw messages.SERIES_CODE_NOT_FOUND;
            }
            let data: any = {
                ...seriesFilter
            }
            if (generatorSeries.referenceId) {
                data['referenceId'] = generatorSeries.referenceId;
                if (generatorSeries.key) {
                    let seriesPrefix = generatorSeries.key || '';
                    logger.info('generatorSeries.serviceName', { data: generatorSeries.serviceName });
                    logger.info('generatorSeries.keyName', { data: generatorSeries.keyName });
                    if (generatorSeries.serviceName && generatorSeries.keyName.indexOf('.') > 0) {
                        let service = Container.get(generatorSeries.serviceName);
                        let referenceData = await service.findById(generatorSeries.referenceId);
                        logger.info('referenceData', { data: referenceData });
                        let seriesPrefixKeys = generatorSeries.keyName.split('.');
                        logger.info('seriesPrefixKeys', { data: seriesPrefixKeys });
                        logger.info('seriesPrefix 1', { data: seriesPrefix });
                        seriesPrefix = referenceData[seriesPrefixKeys[1]];
                        logger.info('seriesPrefix 2', { data: seriesPrefix });
                        logger.info('generatorSeries.prefixFunction', { data: generatorSeries.prefixFunction });
                        if (generatorSeries.prefixFunction) {
                            seriesPrefix = generatorSeries.prefixFunction(seriesPrefix);
                        }
                        logger.info('seriesPrefix 3', { data: seriesPrefix });
                    }
                    data.prefix = seriesPrefix;
                }
            }
            seriesData = await this.create(data);
        }

        const currentNumber = seriesData.startFrom + seriesData.totalEntry;
        const paddedNumber = String(currentNumber).padStart(seriesData.digitLength, '0');

        const seriesCode = `${seriesData.prefix}${paddedNumber}${seriesData.postfix}`;

        seriesData.totalEntry += 1;
        await this.updateOne(seriesFilter, seriesData, user);

        return seriesCode;
    }

    public async findOneWithFilter(type: string, filter: object): Promise<any> {
        let baseFilter = {
            name: type
        };
        let seriesFilter = {
            ...baseFilter,
            ...filter
        }
        logger.info('seriesFilter', { data: seriesFilter });
        const options = {
            // populateFields: []
        };
        let seriesData = await this.findOne(seriesFilter, options);

        return seriesData;
    }

    public async createSeries(seriesData: any): Promise<any> {
        const currentNumber = seriesData.startFrom + seriesData.totalEntry;
        const paddedNumber = String(currentNumber).padStart(seriesData.digitLength, '0');

        const seriesCode = `${seriesData.prefix}${paddedNumber}${seriesData.postfix}`;
        return seriesCode;
    }

    public async updatedSeriesByTotalEntry(type: string, filter: object, totalEntry: number): Promise<any> {
        let baseFilter = {
            name: type
        };
        let seriesFilter = {
            ...baseFilter,
            ...filter
        }

        let updatedSeriesData = {
            totalEntry: totalEntry
        }
        logger.info('updatedSeriesData', { data: updatedSeriesData });

        await this.updateOne(seriesFilter, updatedSeriesData);
    }
}

export default new SeriesGeneratorService();