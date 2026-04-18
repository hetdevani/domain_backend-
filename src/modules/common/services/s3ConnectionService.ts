import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';
import { PROJECT_CONFIG } from '../config/ProjectConfig';
import logger from './WinstonLogger';

export class S3ConnectionService {
    private static bucketName = process.env.AWS_S3_BUCKET_NAME || "";
    private static region = process.env.AWS_REGION || "us-east-1";

    /**
     * Function to create an S3 connection
     * @returns {S3Client} AWS S3 Client instance
     */
    private static async awsConnection(): Promise<S3Client> {
        try {
            return new S3Client({
                region: this.region,
                credentials: {
                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY || "",
                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY || "",
                },
            });
        } catch (error) {
            logger.error('Error initializing AWS S3 Client:', { error: error });
            throw new Error("Failed to create AWS S3 connection.");
        }
    }

    /**
     * Generate a signed URL for private S3 objects 
     * @param key S3 object key
     * @param expiresIn Expiration time in seconds (default from config)
     * @returns Signed URL string
     */
    public static async generateSignedUrl(key: string, expiresIn?: number): Promise<string> {
        try {
            const s3 = await this.awsConnection();
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const signedUrl = await getSignedUrl(s3, command, {
                expiresIn: expiresIn || PROJECT_CONFIG.S3_SIGNED_URL_EXPIRATION_SECONDS,
            });

            return signedUrl;
        } catch (error) {
            logger.error('Error generating signed URL:', { error: error });
            throw new Error("Failed to generate signed URL.");
        }
    }

    /**
     * Generate a public URL for S3 objects
     * @param key S3 object key
     * @returns Public URL string
     */
    public static generatePublicUrl(key: string): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Get URL based on access type
     * @param key S3 object key
     * @param accessType Access type ('private' or 'public')
     * @param expiresIn Optional expiration time for signed URLs
     * @returns URL string
     */
    public static async getUrlByAccessType(
        key: string,
        accessType: 'private' | 'public',
        expiresIn?: number
    ): Promise<string> {
        if (accessType === 'private') {
            return await this.generateSignedUrl(key, expiresIn);
        } else {
            ``
            return this.generatePublicUrl(key);
        }
    }

    /**
     * Function to read existing JSON file from S3
     * @param filePath S3 file path
     * @param bucket Optional bucket name, defaults to configured bucket
     * @returns Parsed JSON data or an empty array
     */
    public static async readDataFromS3(filePath: string, bucket?: string): Promise<any[]> {
        try {
            const s3 = await this.awsConnection();

            const command = new GetObjectCommand({
                Bucket: bucket || this.bucketName,
                Key: filePath,
            });

            const { Body } = await s3.send(command);
            if (!Body) return [];

            const jsonString = await Body.transformToString();
            return JSON.parse(jsonString);
        } catch (error: any) {
            if (error.name === "NoSuchKey") {
                logger.info('File not found, creating new: ${filePath}');
                return [];
            }
            throw error;
        }
    }

    /**
     * Function to write updated data to S3
     * @param filePath S3 file path
     * @param newData Data to store
     * @param acl Optional ACL setting ('private' | 'public-read')
     * @param bucket Optional bucket name, defaults to configured bucket
     */
    public static async writeDataToS3(filePath: string, newData: any[], acl?: string, bucket?: string): Promise<void> {
        const s3 = await this.awsConnection();

        const jsonData = JSON.stringify(newData, null, 2);
        const commandParams: any = {
            Bucket: bucket || this.bucketName,
            Key: filePath,
            Body: jsonData,
            ContentType: "application/json",
        };

        /*
        if (acl) {
            commandParams.ACL = acl;
        }
        */

        const command = new PutObjectCommand(commandParams);

        await s3.send(command);
        logger.info('Updated file: ${filePath}');
    }
}