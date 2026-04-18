import mongoose, { ConnectOptions, Mongoose } from 'mongoose';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import logger from './modules/common/services/WinstonLogger';

dotenv.config();

class DatabaseConfig {
    private static instance: DatabaseConfig;
    private mongooseInstance: Mongoose;
    private mongoURI: string = '';
    private secretsManager: AWS.SecretsManager;
    private useTLS: boolean;
    private useAWSDocumentDB: boolean;

    private constructor() {
        this.mongooseInstance = mongoose;
        this.secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION });
        this.useTLS = process.env.IS_USE_TLS === 'true';
        this.useAWSDocumentDB = process.env.IS_USE_AWS_DOCUMENTDB === 'true';
        this.initializeDatabase();
        this.setupListeners();
    }

    public static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    public async initializeDatabase(): Promise<void> {
        try {
            if (this.useAWSDocumentDB) {
                const credentials = await this.getDocumentDBCredentials();
                const caFilePath = `/etc/ssl/certs/global-bundle.pem`;
                const tlsOptions = this.useTLS ? `&tls=true&tlsCAFile=${caFilePath}` : ``;
                const otherOptions = `?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;
                const encodedPassword = encodeURIComponent(credentials.password);

                this.mongoURI = `mongodb://${credentials.username}:${encodedPassword}@${process.env.DOCUMENTDB_HOST}:27017/base_db${otherOptions}${tlsOptions}`;
            } else {
                this.mongoURI = process.env.MONGODB_URI || '';
            }

            if (!this.mongoURI) {
                throw new Error('❌ No MongoDB URI configured. Check environment variables.');
            }

            await this.connect();
        } catch (error) {
            logger.error('Failed to initialize MongoDB connection', { error });
            process.exit(1);
        }
    }

    private async getDocumentDBCredentials(): Promise<{ username: string; password: string }> {
        try {
            const secretValue = await this.secretsManager.getSecretValue({ SecretId: process.env.DOCUMENTDB_SECRET_NAME || '' }).promise();
            if (!secretValue.SecretString) {
                throw new Error('SecretString is empty');
            }
            return JSON.parse(secretValue.SecretString);
        } catch (error) {
            logger.error('Error retrieving DocumentDB credentials from AWS Secrets Manager', { error });
            throw error;
        }
    }

    private async connect(): Promise<void> {
        const connectionOptions: ConnectOptions = {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        };

        try {
            await this.mongooseInstance.connect(this.mongoURI, connectionOptions);
            logger.info('Successfully connected to MongoDB');
        } catch (error) {
            logger.error('MongoDB connection error', { error });
            process.exit(1);
        }
    }

    private setupListeners(): void {
        this.mongooseInstance.connection.on('error', (error) => {
            logger.error('MongoDB connection error', { error });
        });

        let reconnectAttempts = 0;

        this.mongooseInstance.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
            const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with a max delay of 30 seconds
            setTimeout(() => {
                this.connect();
                reconnectAttempts++;
            }, retryDelay);
        });

        process.on('SIGINT', async () => {
            await this.mongooseInstance.connection.close();
            logger.info('MongoDB connection closed due to application termination');
            process.exit(0);
        });
    }

    public getMongooseInstance(): Mongoose {
        return this.mongooseInstance;
    }
}

export default DatabaseConfig.getInstance();
