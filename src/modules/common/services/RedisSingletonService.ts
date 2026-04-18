import { createClient, RedisClientType } from 'redis';
import logger from './WinstonLogger';

export class RedisSingleton {
    private static instance: RedisClientType | undefined;

    private constructor() { }

    private static createInstance() {
        const client = createClient() as RedisClientType | undefined;
        client?.on('error', (error: Error) => {
            console.error(error);
        });

        RedisSingleton.instance = client;
        client?.connect();
    }

    public static getInstance(): RedisClientType {
        if (!RedisSingleton.instance) {
            RedisSingleton.createInstance();
        }
        return RedisSingleton.instance!;
    }

    public static setNewInstance() {
        RedisSingleton.instance?.quit();
        RedisSingleton.instance = undefined;
        RedisSingleton.createInstance();
    }
}
