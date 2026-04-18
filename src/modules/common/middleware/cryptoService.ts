import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes IV for AES
const SALT_LENGTH = 16; // 16 bytes salt for PBKDF2
const KEY_LENGTH = 32; // 32 bytes for AES-256
const KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations
const DIGEST = "sha256";
const VERSION = "v1"; // Versioning for future updates

const asUint8Array = (buffer: Buffer): Uint8Array =>
    buffer as unknown as Uint8Array;

class CryptoService {
    private passphrase: string;

    constructor() {
        if (!process.env.ENCRYPTION_PASSPHRASE) {
            throw new Error("ENCRYPTION_PASSPHRASE is not set in environment variables.");
        }
        this.passphrase = process.env.ENCRYPTION_PASSPHRASE;
    }

    /**
     * Generates an encryption key from a passphrase and salt using PBKDF2.
     * @param salt - A cryptographic salt
     * @returns A derived key
     */
    private getKeyFromPassphrase(salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(this.passphrase, asUint8Array(salt), KEY_DERIVATION_ITERATIONS, KEY_LENGTH, DIGEST);
    }

    /**
     * Encrypts a text using AES-256-GCM with PBKDF2 key derivation and versioning.
     * @param text - The text to encrypt.
     * @returns A versioned, encrypted string.
     */
    public encrypt(text: string): string {        
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = this.getKeyFromPassphrase(salt);

        const cipher = crypto.createCipheriv(ALGORITHM, asUint8Array(key), asUint8Array(iv));
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag().toString("hex");

        return `${VERSION}:${salt.toString("hex")}:${iv.toString("hex")}:${encrypted}:${authTag}`;
    }

    /**
     * Decrypts an AES-256-GCM encrypted string back into plain text.
     * @param encryptedText - The encrypted data in versioned format.
     * @returns The decrypted text.
     */
    public decrypt(encryptedText: string): string {
        
        const parts = encryptedText.split(":");
        // const parts = encryptedText;
        if (parts.length !== 5) {
            throw new Error("Invalid encrypted text format.");
        }

        const [version, saltHex, ivHex, encrypted, authTagHex] = parts;
        if (version !== VERSION) {
            throw new Error("Unsupported encryption version.");
        }

        const salt = Buffer.from(saltHex, "hex");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const key = this.getKeyFromPassphrase(salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, asUint8Array(key), asUint8Array(iv));
        decipher.setAuthTag(asUint8Array(authTag));

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    }
}

export default new CryptoService();
