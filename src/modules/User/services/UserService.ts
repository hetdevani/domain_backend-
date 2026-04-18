import moment from 'moment';
import bcrypt from 'bcrypt';
import UserDAO from '../dao/UserDAO';
import { IUser, ResetPassword } from '../interfaces/IUser';
import { DEVICE_TYPE, MOBILE_USER_TYPES, SETTING_TYPE, USER_TYPES } from '../../common/constants/common';
import { OTPUtil } from '../../auth/utils/OTPUtil';
import { messages } from '../message';
import { MODULES } from '../../common/constants/modules';
import CommonService from '../../common/services/CommonService';
import SettingService from '../../Setting/services/SettingService';
import { IMaster } from '../../Master/interfaces/IMaster';
import MasterService from '../../Master/services/MasterService';
import CommonUtil from '../../auth/utils/CommonUtil';
import NotificationService from '../../Notification/services/NotificationService';
import { PaginationOptions } from '../../common/constants/interface';
import AccountDeleteRequestService from '../../AccountDeleteRequest/services/AccountDeleteRequestService';
import logger from '../../common/services/WinstonLogger';

export class UserService extends UserDAO {

    public async getActiveDeactiveUserByEmailOrMobile(username: string, userType: number[]): Promise<IUser | null> {
        const query = {
            $or: [
                { email: username },
                { mobile: username }
            ],
            type: { $in: userType },
            isDeleted: false,
        };
        let result = await this.findOne(query);

        logger.info('getUserByEmailOrMobile result', { data: result });
        return result;
    }

    public async getUserByEmailOrMobile(username: string, userType: number[]): Promise<IUser | null> {
        const query = {
            $or: [
                { email: username },
                { mobile: username }
            ],
            type: { $in: userType },
            isActive: true,
            isDeleted: false,
        };
        let result = await this.findOne(query);

        return result;
    }

    public async getWebUserByEmailOrMobile(username: string): Promise<IUser | null> {
        const query: any = {
            $or: [
                { email: username },
                { mobile: username }
            ],
            /* type: {
                '$nin': [
                    USER_TYPES.USER,
                    USER_TYPES.STAFF_USER
                ]
            }, */
            isActive: true,
            isDeleted: false,
        };
        let result = await this.findOne(query);
        // logger.info('getWebUserByEmailOrMobile result', { data: result });

        return result;
    }

    public async forgotPassword(username: string, preferredLang: string, isAdmin: boolean = false): Promise<void> {
        let user: IUser;
        if (isAdmin) {
            user = await this.getWebUserByEmailOrMobile(username) as IUser;
        } else {
            user = await this.getUserByEmailOrMobile(username, MOBILE_USER_TYPES) as IUser;
        }

        if (!user || !user._id) {
            throw messages.USER_NOT_FOUND;
        }

        const otp = OTPUtil.generateOTP();
        const otpMsg = `OTP code for Reset password is: ${otp}`;

        logger.info('forgotPassword otp', { data: otp });
        const expires = moment().add(15, 'minutes').toDate();
        const updatedData = {
            otp: otp,
            otpSentTime: expires,
        };
        await this.update(user._id, updatedData);

        let email = user.email;

        let data: any = {
            otp: otp,
            name: user.name,
            email: email,
            language: preferredLang,
        };
        switch (user.type) {
            case USER_TYPES.MASTER_ADMIN:
                data.masterAdminId = (global as any).MASTER_ADMIN_ID;
                break;
            case USER_TYPES.ADMIN:
                data.adminId = (global as any).ADMIN_ID;
                break;
        }
        await NotificationService.sendMessage('User', 'forgotPassword', data);
    }

    public async resetPassword(params: ResetPassword, preferredLang: string, isAdmin: boolean = false): Promise<void> {
        let user: IUser;
        if (isAdmin) {
            user = await this.getWebUserByEmailOrMobile(params.username) as IUser;
        } else {
            user = await this.getUserByEmailOrMobile(params.username, MOBILE_USER_TYPES) as IUser;
        }

        if (!user || !user._id) {
            throw messages.USER_NOT_FOUND;
        }

        if (!user.otp || !user.otpSentTime) {
            throw messages.INVALID_OTP;
        }

        const isOtpValid = OTPUtil.isOTPValid(user.otp, params.token);
        const isOTPExpired = OTPUtil.isOTPExpired(user.otpSentTime);

        if (!isOtpValid) {
            throw messages.INVALID_OTP;
        }

        if (isOTPExpired) {
            throw messages.OTP_EXPIRE;
        }

        await this.resetPasswordAndSendMail(user, params.newPassword, preferredLang);
    }

    private async resetPasswordAndSendMail(user: IUser, newPassword: string, preferredLang: string): Promise<void> {
        newPassword = await bcrypt.hash(newPassword, 10);

        let userUpdatedData = await this.update(
            user.id,
            {
                password: newPassword,
                otp: '',
                otpSentTime: null,
            }
        );
        // logger.info('resetPassword userUpdatedData', { data: userUpdatedData });

        let data: any = {
            name: user.name,
            email: user.email,
            language: preferredLang
        };
        switch (user.type) {
            case USER_TYPES.MASTER_ADMIN:
                data.masterAdminId = (global as any).MASTER_ADMIN_ID;
                break;
            case USER_TYPES.ADMIN:
                data.adminId = (global as any).ADMIN_ID;
                break;
        }

        await NotificationService.sendMessage('User', 'resetPassword', data);
    }

    public async sync(user: any, lastSyncDateInString: string): Promise<any> {
        let userOptions: PaginationOptions = {
            populateFields: ['parentId'],
            selectFields: [
                'parentId.name'
            ]
        };
        user = await this.findById(user._id, userOptions);

        if (user && user.password) {
            user = JSON.parse(JSON.stringify(user));
            delete user.password;
        }

        let lastSyncDate = moment(lastSyncDateInString).toDate();
        // logger.info('sync user', { data: user });

        let lastUpdatedTime = {
            master: (global as any).MODEL_LAST_UPDATED_AT_TIME['Master'],
        };

        let masters: IMaster[] = [];
        logger.info('lastUpdatedTime.master', {
            master: lastUpdatedTime.master,
            lastSyncDate,
            comparison: lastUpdatedTime.master >= lastSyncDate
        });
        if (lastUpdatedTime.master >= lastSyncDate) {
            let filter = {
                // isDeleted: false,
                updatedAt: { '$gte': lastSyncDate }
            };
            const mastersData = await MasterService.find(filter);
            masters = mastersData.filter((item) => item.isDeleted === false);
        }

        let filter = {
            type: SETTING_TYPE.SUPPORT_INFO,
        };
        let setting = await SettingService.findOne(filter) as {};

        let getDeletedRecordsForMultipleModule = [
            MODULES.MASTER
        ];

        let deletedMasters = [];

        let deletedRecords = await CommonService.getDeletedRecordsForMultipleModule(getDeletedRecordsForMultipleModule, lastSyncDate);

        for (let deletedRecord of deletedRecords) {
            switch (deletedRecord.module) {
                case MODULES.MASTER:
                    deletedMasters.push(deletedRecord.recordId);
                    break;
            }
        }

        user.isSendAccountDeleteRequest = false;
        let accountDeleteFilter = {
            userId: user._id,
        };

        let accountDeleteRecord = await AccountDeleteRequestService.findOne(accountDeleteFilter);
        if (accountDeleteRecord && accountDeleteRecord._id) {
            user.isSendAccountDeleteRequest = true;
        }

        let data: any = {
            lastSyncDate: new Date(),
            loggedInUser: user,
            setting,
            masters: { list: masters, deleted: deletedMasters },
        };

        return data;
    }

    public async verifyOtp(params: ResetPassword, preferredLang: string, isAdmin: boolean = false): Promise<void> {
        let user: IUser;
        if (isAdmin) {
            user = await this.getWebUserByEmailOrMobile(params.username) as IUser;
        } else {
            user = await this.getUserByEmailOrMobile(params.username, MOBILE_USER_TYPES) as IUser;
        }
        if (!user || !user._id) {
            throw messages.USER_NOT_FOUND;
        }

        if (!user.otp || !user.otpSentTime) {
            throw messages.INVALID_OTP;
        }

        const isOtpValid = OTPUtil.isOTPValid(user.otp, params.token);
        if (!isOtpValid) {
            throw messages.INVALID_OTP;
        }
        const isOTPExpired = OTPUtil.isOTPExpired(user.otpSentTime);

        if (isOTPExpired) {
            throw messages.OTP_EXPIRE;
        }
    }

    public async notificationIdentifierUpsert(playerId: string, deviceType: number, loginUser: IUser) {
        try {
            let existedUser = await this.findOne({
                $or: [{ androidPlayerId: playerId }, { iosPlayerId: playerId }],
            });
            // logger.info('existedUser', { data: existedUser });
            // remove key from existed user
            let update: any = {};
            if (existedUser) {
                if (existedUser._id.toString() === loginUser._id.toString()) {
                    return true;
                }
                if (existedUser.androidPlayerId) {
                    let indexOfAndroid =
                        existedUser.androidPlayerId && existedUser.androidPlayerId.length ? existedUser.androidPlayerId.indexOf(playerId) : -1;
                    if (indexOfAndroid > -1) {
                        update.androidPlayerId = existedUser.androidPlayerId.slice(
                            indexOfAndroid + 1
                        );
                    }
                }
                if (existedUser.iosPlayerId) {
                    let indexOfIos = existedUser.iosPlayerId && existedUser.iosPlayerId.length ? existedUser.iosPlayerId.indexOf(playerId) : -1;
                    if (indexOfIos > -1) {
                        update.iosPlayerId = existedUser.iosPlayerId.slice(
                            indexOfIos + 1
                        );
                    }
                }
                await this.update(existedUser._id, update);
            }
            // update key to new user
            if (deviceType == DEVICE_TYPE.ANDROID) {
                let androidPlayerId: any = loginUser.androidPlayerId;
                if (!androidPlayerId) {
                    androidPlayerId = [];
                }
                androidPlayerId.push(playerId);
                update.androidPlayerId = androidPlayerId;
            } else {
                let iosPlayerId: any = loginUser.iosPlayerId;
                if (!iosPlayerId) {
                    iosPlayerId = [];
                }
                iosPlayerId.push(playerId);
                update.iosPlayerId = loginUser.iosPlayerId;
            }

            if (update && Object.keys(update) && Object.keys(update).length) {
                await this.update(loginUser._id, update);
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    public async getUserProfile(loggedInUser: IUser) {
        let options = {
            populateFields: [
                'parentId'
            ],
            selectFields: [
                'name',
                'email',
                'mobile',
                'countryCode',
                'image',
                'type',
                'uniqueCode',
                'role',
                'accessPermission',
                'image',
                'parentId.name',
                'isTwoFactorEnabled',
                'secretKey',
            ]
        };
        let user: any = await this.findById(loggedInUser._id.toString(), options);
        if (!user || !user._id) {
            throw messages.USER_NOT_FOUND;
        }
        return user;
    }

    public async removePlayerId(user: IUser, deviceType: number, deviceId: string) {
        let update: any = {};
        if (deviceType == DEVICE_TYPE.ANDROID && user.androidPlayerId) {
            let indexOfAndroid = user.androidPlayerId && user.androidPlayerId.length ? user.androidPlayerId.indexOf(deviceId) : -1;
            if (indexOfAndroid > -1) {
                update.androidPlayerId = user.androidPlayerId.slice(
                    indexOfAndroid + 1
                );
            }
        } else if (user.iosPlayerId) {
            let indexOfIos = user.iosPlayerId && user.iosPlayerId.length ? user.iosPlayerId.indexOf(deviceId) : -1;
            if (indexOfIos > -1) {
                update.iosPlayerId = user.iosPlayerId.slice(
                    indexOfIos + 1
                );
            }
        }

        if (update && Object.keys(update) && Object.keys(update).length) {
            await this.update(user._id, update);
        }
    }

    public async getDependentUserData(userId: string) {
        let userData = {
            _id: userId,
            mobile: '',
            countryCode: '+91',
            email: '',
            playerIds: {}
        };

        let userInfo = await CommonUtil.getUserInfo(userId);

        if (!userInfo || !userInfo._id) {
            let user = await this.findById(userId) as IUser;
            if (!user) {
                return userData;
            }

            userData.mobile = user.mobile;
            userData.email = user.email;
            userData.playerIds = {
                androidPlayerId: user.androidPlayerId,
                iosPlayerId: user.iosPlayerId
            };

            await CommonUtil.setUserInfo(userId, userData);

            return userData;
        }

        return userInfo;
    }

    public async setUserInfoInRedis(userId: string, data: any) {
        let isUpdateData = false;
        const userData = await CommonUtil.getUserInfo(userId);

        if (!userData) {
            return;
        }

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (data[key] !== null && data[key] !== undefined) {
                    userData[key] = data[key];
                    isUpdateData = true;
                }
            }
        }

        if (data.androidPlayerId) {
            userData.playerIds.androidPlayerId = data.androidPlayerId;
            isUpdateData = true;
        }
        if (data.iosPlayerId) {
            userData.playerIds.iosPlayerId = data.iosPlayerId;
            isUpdateData = true;
        }
        if (isUpdateData) {
            await CommonUtil.setUserInfo(userId, userData);
        }
    }

    // public async checkDuplication(params: any, userId: string = '') {
    //     let filter: any = { isDeleted: false };

    //     if (userId) {
    //         filter._id = { '$ne': userId };
    //     }

    //     if (params.email) {

    //         filter.email = params.email;

    //         let users = await this.find(filter);
    //         if (users && users.length > 0) {
    //             throw messages.EMAIL_REGISTERED;
    //         }
    //     }
    //     if (params.mobile && params.mobile) {

    //         filter.mobile = params.mobile;

    //         let users = await this.find(filter);
    //         if (users && users.length > 0) {
    //             throw messages.MOBILE_REGISTERED;
    //         }
    //     }
    // }

    public async getActiveDeactiveUserImportExcelForDb(username: string, userType: any): Promise<IUser | null> {
        const query = {
            name: {
                $in: (Array.isArray(username) ? username : [username]).map(name => {
                    // Escape special regex characters in the username
                    const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    return new RegExp(`^${escapedName}$`, "i"); // Case-insensitive match
                })
            },
            type: { $in: userType },
            isDeleted: false,
        };

        let result = await this.findOne(query);

        // logger.info('getUserByEmailOrMobile result', { data: result });
        return result;
    }

    public sanitizeUser(user: IUser): any {
        if (!user) return user;
        const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));
        delete userObj.password;
        delete userObj.otp;
        delete userObj.otpSentTime;
        delete userObj.secretKey;
        return userObj;
    }
}

export default new UserService(); // Exporting an instance of UserService.
