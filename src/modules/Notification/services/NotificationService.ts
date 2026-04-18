import { IUser } from '../../User/interfaces/IUser';
import UserService from '../../User/services/UserService';
import { NotificationConfig } from '../../common/config/NotificationConfig';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE, PRIORITY, USER_TYPES } from '../../common/constants/common';
import EmailService from '../../common/services/EmailService';
import PushNotificationService from '../../common/services/PushNotificationService';
import SMSService from '../../common/services/SMSService';
import NotificationDAO from '../dao/NotificationDAO';
import logger from '../../common/services/WinstonLogger';

export class NotificationService extends NotificationDAO {

    public async sendMessage(module: string, action: string, data: any) {

        let msgObj = NotificationConfig[module] && NotificationConfig[module][action];

        if (msgObj && msgObj.type) {
            let msg = msgObj.message;
            let userName = data.name || 'Admin';
            msg = msg.replace('$name', userName);
            msg = msg.replace('$driverName', data.driverName);
            msg = msg.replace('$punchInZoneName', data.hubName);
            msg = msg.replace('$vehicleId', `vehicleId: ${data.vehicleId}`);
            msg = msg.replace('$request', data.request);
            msg = msg.replace('$otp', data.otp);

            let title = msgObj.title;

            // let userData = {
            //     userId: user._id.toString(),
            //     mobile: user.mobile,
            //     countryCode: user.countryCode,
            //     email: user.email,
            //     playerIds: {
            //         androidPlayerId: user.androidPlayerId,
            //         iosPlayerId: user.iosPlayerId
            //     }
            // };
            // await this.sendNotificationToUser(msgObj, msg, data, userData, user);

            if (msgObj.userTypes && Array.isArray(msgObj.userTypes)) {
                for (const type of msgObj.userTypes) {
                    let userId: string = data.userId;
                    if (type === USER_TYPES.MASTER_ADMIN) {
                        userId = data.masterAdminId;
                    } else if (type === USER_TYPES.ADMIN) {
                        userId = data.adminId;
                    }
                    if (!userId) {
                        continue;
                    }

                    const { mobile, countryCode, email, playerIds } = await UserService.getDependentUserData(userId.toString());

                    let dependentUserData = {
                        userId: userId,
                        mobile: mobile,
                        countryCode: countryCode,
                        email: email,
                        playerIds: playerIds
                    };
                    await this.sendNotificationToUser(msgObj, title, msg, data, dependentUserData);
                }
            }
        }
    }

    private async sendNotificationToUser(msgObj: any, title: string, msg: string, data: any, userData: any) {
        // logger.info('sendNotificationToUser msg', { data: msg, userData });
        if (msgObj.type.sms) {
            await this.sendSMS(userData.mobile, userData.countryCode, msgObj, msg);
        }
        if (msgObj.type.pushNotification) {
            await this.sendPushNotification(userData.playerIds, data, msgObj, msg);
        }
        if (msgObj.type.email) {
            await this.sendEmail(userData.email, msgObj, msg, data);
        }
        if (msgObj.type.createDb) {
            await this.createDbNotification(userData.userId, data, msg, title);
        }
        if (msgObj.type.socket) {
            await this.sendSocketNotification(userData.userId.toString(), msg);
        }
    }

    public async sendSMS(mobile: string, countryCode: string, msgObj: any, message: string) {
        logger.info('send sms');

        let smsObj: any = {
            message: message,
            mobile: countryCode + mobile,
        };
        if (msgObj.templateId) {
            smsObj.template_id = msgObj.templateId;
        }

        await SMSService.send(smsObj);
    }

    private async sendPushNotification(userPlayerIds: any, data: any, msgObj: any, message: string) {
        logger.info('send pushNotification');

        let playerIds: any = [];
        if (userPlayerIds.androidPlayerId) {
            playerIds = playerIds.concat(userPlayerIds.androidPlayerId);
        }
        if (userPlayerIds.iosPlayerId) {
            playerIds = playerIds.concat(userPlayerIds.iosPlayerId);
        }

        if (!playerIds.length) {
            return;
        }

        await PushNotificationService.send({
            playerIds: playerIds,
            content: message,
            language: data.language || 'en',
            title: msgObj.title
        });
    }

    public async sendEmail(email: string, msgObj: any, message: string, data: any, username?: string, subject?: string) {
        logger.info('send email');

        let mailObj = {
            subject: subject ? subject : PROJECT_CONFIG.DEFAULT_MAIL_SUBJECT,
            to: email,
            template: msgObj.template,
            data: {
                name: username || '-',
                email: email || '-',
                otp: data.otp || PROJECT_CONFIG.USER_MASTER_OTP,
                message: message,
                language: data.language || 'en'
            }
        };

        await EmailService.send(mailObj);
    }

    private async createDbNotification(userId: string, data: any, message: string, title: string) {
        logger.info('createDb');

        let notificationData: any = {
            title: title,
            description: message,
            userId: userId,
            status: NOTIFICATION_STATUS.UNREAD,
            type: data.type || NOTIFICATION_TYPE.MOBILE,
            priority: data.priority || PRIORITY.LOW
        };

        // if (!user) {
        //     user = await UserService.findById(userId) as IUser;
        // }

        await this.create(notificationData);
        await this.sendUnreadNotificationsCount(userId);
    }

    private async sendSocketNotification(userId: string, message: string) {
        logger.info('socket');

        const socketManager = (global as any).socketManager; // Access the global instance
        if (socketManager) {
            await socketManager.sendNotification(userId, message);
        } else {
            logger.info('SocketManager not initialized');
        }
    }

    public async sendUnreadNotificationsCount(userId: string) {
        logger.info('socket');

        const socketManager = (global as any).socketManager;
        if (socketManager) {
            let message = 'Notification update.';
            let data = {
                unreadNotificationsCount: 0
            };
            data.unreadNotificationsCount = await this.unreadNotificationsCount(userId);
            await socketManager.sendUnreadNotificationCount(userId, message, data);
        } else {
            logger.info('SocketManager not initialized');
        }
    }

    public async unreadNotificationsCount(userId: string) {
        let filter = {
            userId: userId,
            status: NOTIFICATION_STATUS.UNREAD
        };

        let unreadNotificationsCount = await this.getCount(filter);

        return unreadNotificationsCount;
    }

    public async sendNotify(module: string, action: string, data: any) {
        let filter = {
            type: USER_TYPES.MASTER_ADMIN
        };
        let user = await UserService.findOne(filter) as IUser;

        // let screenData = await ScreenService.findOne({ _id: data.screenId });

        // const screenName = screenData && screenData._id ? screenData.name : 'Unknown Screen';

        // data.masterAdminId = user._id;
        // data.screenName = screenName;

        await this.sendMessage(module, action, data);
    }
}

export default new NotificationService();
