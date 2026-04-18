import { RedisSingleton } from './RedisSingletonService';
import { RedisClientType } from 'redis';
import logger from './WinstonLogger';

export class RedisService {
    private client!: RedisClientType;

    public initializeClient() {
        this.client = RedisSingleton.getInstance();
    }

    public async getData(key: string): Promise<any> {
        try {
            const client = this.client;
            // logger.info('getData client ---------', { data: client });

            const data = await client.get(key);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            throw new Error(`Error getting data: ${e}`);
        }
    }

    public async setData(key: string, data: any): Promise<boolean> {
        try {
            const client = this.client;
            // logger.info('setData client ---------', { data: client });

            const dataString = JSON.stringify(data);
            await client.set(key, dataString);

            return true;
        } catch (e) {
            throw new Error(`Error setting data: ${e}`);
        }
    }

    public async removeKey(key: string): Promise<boolean> {
        try {
            const client = this.client;
            // logger.info('removeKey client ---------', { data: client });

            const result = await client.del(key);

            return result === 1;
        } catch (e) {
            throw new Error(`Error removing key: ${e}`);
        }
    }

    public async getAllDataWithKey(prefix: string): Promise<{ [key: string]: any }> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }

        try {
            const keys = await this.client.keys(`${prefix}*`);
            const allData: { [key: string]: any } = {};

            for (const key of keys) {
                const data = await this.client.get(key);
                allData[key] = data ? JSON.parse(data) : null;
            }

            logger.info('getAllDataWithKey allData', { data: allData });
            return allData;
        } catch (e) {
            throw new Error(`Error getting all data with key: ${e}`);
        }
    }

    public async resetDB(): Promise<void> {
        try {

            let dataToReSaveAfterClean = ['vehicleUser'];
            let data: any = {};
            for (let prefixWord of dataToReSaveAfterClean) {
                data[prefixWord] = await this.getAllDataWithKey(prefixWord);
            }

            const client = this.client;
            if (!client) {
                throw new Error('Redis client not initialized');
            }

            await this.client.flushDb();

            for (let prefixWord of dataToReSaveAfterClean) {
                logger.info('data[prefixWord]', { data: data[prefixWord] });
                for (let k in data[prefixWord]) {
                    await this.setData(k, data[prefixWord][k]);
                }
            }
        } catch (e) {
            throw new Error(`Error resetting DB: ${e}`);
        }
    }
}

export default new RedisService();