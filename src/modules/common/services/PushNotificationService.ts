import translatorService from "../response/translatorService";
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import logger from './WinstonLogger';
dotenv.config();

class PushNotificationService {

    public async send(options: any) {
        try {
            logger.info('----------Push Notification Message----------', { data: options.content });
            if (!process.env.FIREBASE_PRIVATE_KEY) {
                logger.info('----------Push Notification PRIVATE_KEY Empty----------');
                return;
            }

            if (admin.apps.length === 0) {
                let serviceAccount: any = {
                    type: process.env.FIREBASE_TYPE,
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: process.env.FIREBASE_AUTH_URI,
                    token_uri: process.env.FIREBASE_TOKEN_URI,
                    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL,
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }

            let playerIds = options.playerIds;
            let message = options.content;

            if (options.language) {
                message = translatorService.translateMessage(message, options.language);
            }
            if (!playerIds || !playerIds.length) {
                logger.info('----------PlayerIds Empty----------');
                return;
            }

            let payload: any = {
                notification: {
                    body: message
                }
            }

            if (options.title) {
                payload.notification.title = options.title
            }

            let response = await admin.messaging().sendEachForMulticast({
                tokens: playerIds,
                ...payload
            });
            logger.info('Successfully sent message:', { data: response && response.successCount });
        } catch (error) {
            logger.error('Error setting up push notification:', { error: error });
        }
    }
}

export default new PushNotificationService();
