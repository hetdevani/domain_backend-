import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY as string;

class CryptoUtils {
    // AES encryption function
    static encrypt(text: string): string {
        const iv = crypto.randomBytes(16); // Initialization Vector
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex') as any, iv as any);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    // AES decryption function
    static decrypt(encryptedText: string): string {
        const [iv, encryptedData] = encryptedText.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex') as any, Buffer.from(iv, 'hex') as any);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // HMAC function for message integrity
    static calculateHmac(data: string): string {
        return CryptoJS.HmacSHA256(data, SECRET_KEY).toString();
    }

    // Base64 encode function
    static base64Encode(text: string): string {
        return Buffer.from(text).toString('base64');
    }

    // Base64 decode function
    static base64Decode(encodedText: string): string {
        return Buffer.from(encodedText, 'base64').toString('utf8');
    }

    static generateUniqueId(): string {
        const uniqueId = uuidv4();
        return uniqueId;
    }

    static getFloat(value: any) {
        return Number(parseFloat(value).toFixed(2));
    }
}

export default CryptoUtils;
