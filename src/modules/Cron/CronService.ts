import moment from 'moment';
import UserService from '../User/services/UserService';
import { USER_TYPES } from '../common/constants/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { AnyKeys } from 'mongoose';
import { MomentUtils } from '../common/utils/momentUtils';
import path from 'path';
import fs from 'fs';
import CommonService from '../common/services/CommonService';
import NotificationService from '../Notification/services/NotificationService';
import logger from '../common/services/WinstonLogger';


/**
 * Function to create an S3 connection
 * @returns {S3Client} AWS S3 Client instance
 */
export const awsConnection = async (): Promise<S3Client> => {
    try {
        // Create and return an S3 client instance
        return new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY || "",
                secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY || "",
            },
        });
    } catch (error) {
        logger.error('Error initializing AWS S3 Client', { error });
        throw new Error("Failed to create AWS S3 connection.");
    }
};

export class CronService {
    private static bucketName = process.env.AWS_S3_BUCKET_NAME || "";

    public static async testCron() {
        // config test cron service...
    }

    public static async archiveActivityLogs() {
        try {
            logger.info('Starting activity log archival', { timestamp: new Date() });
            const ActivityLogService = require('../ActivityLog/services/ActivityLogService').default;
            const count = await ActivityLogService.archiveOldLogs();
            logger.info('Activity log archival completed', { archivedCount: count });
        } catch (error) {
            logger.error('Error running activity log archival cron', { error });
        }
    }
}

export default new CronService();