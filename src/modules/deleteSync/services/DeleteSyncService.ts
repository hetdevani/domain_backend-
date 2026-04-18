import logger from '../../common/services/WinstonLogger';
import DeleteSyncDAO from '../dao/DeleteSyncDao';

export class DeleteSyncService extends DeleteSyncDAO {

    public async logDeletedRecords(option: any): Promise<any> {
        logger.info('Logging deleted records', { option });
        return await this.create(option);
    }
}

export default new DeleteSyncService();