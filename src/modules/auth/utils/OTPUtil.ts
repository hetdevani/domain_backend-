import NotificationService from "../../Notification/services/NotificationService";
import { NotificationConfig } from "../../common/config/NotificationConfig";
import { PROJECT_CONFIG } from "../../common/config/ProjectConfig";
import logger from '../../common/services/WinstonLogger';

export class OTPUtil {
    public static isOTPValid(storedOTP: string, providedOTP: string): boolean {
        let isOTPValid = false;
        if (storedOTP === providedOTP || (PROJECT_CONFIG.USER_ENABLE_MASTER_OTP && providedOTP === PROJECT_CONFIG.USER_MASTER_OTP)) {
            isOTPValid = true;
        }

        return isOTPValid;
    }

    public static isOTPExpired(otpSentTime: Date): boolean {
        // Set the OTP expiration duration (e.g., 5 minutes)
        const expirationDurationInMinutes = 5;

        // Calculate the current time and OTP sent time difference in minutes
        const currentTime = new Date();
        const timeDifferenceInMinutes = (currentTime.getTime() - otpSentTime.getTime()) / 60000;

        // Check if the OTP has expired
        return timeDifferenceInMinutes > expirationDurationInMinutes;
    }

    public static generateOTP(): string {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < PROJECT_CONFIG.OTP_LENGTH; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    // Send the OTP to the user's mobile via SMS
    public static async sendOTPViaSMS(username: string, mobile: string, countryCode: string, otp: string): Promise<void> {
        logger.info('Sending OTP ${otp} to ${mobile} via SMS...');

        let msgObj = NotificationConfig['User'] && NotificationConfig['User']['loginOtp'];
        let msg = msgObj.message;
        msg = msg.replace('$name', username);
        msg = msg.replace('$otp', otp);

        await NotificationService.sendSMS(mobile, countryCode, msgObj, msg);
    }

    // Send the OTP to the user's email
    public static async sendOTPViaEmail(username: string, email: string, otp: string, subject: string): Promise<void> {
        logger.info('Sending OTP ${otp} to ${email} via email...');

        let msgObj = NotificationConfig['User'] && NotificationConfig['User']['loginOtp'];
        let msg = msgObj.message;
        msg = msg.replace('$name', username);
        msg = msg.replace('$otp', otp);

        let data = {
            otp: otp
        };

        await NotificationService.sendEmail(email, msgObj, msg, data, username, subject);
    }
}
