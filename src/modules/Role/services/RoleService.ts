import RoleDAO from '../dao/RoleDAO';
import { USER_ROLE_TITLE, USER_TYPES } from '../../common/constants/common';
import { IEmptyRole, IRole } from '../interfaces/IRole';
import UserService from '../../User/services/UserService';
import logger from '../../common/services/WinstonLogger';

export class RoleService extends RoleDAO {

    // public async addAccessPermission(type: Number): Promise<IRole | IEmptyRole> {
    //     let userType = '';
    //     let emptyRole = {
    //         title: '',
    //         permissions: []
    //     } as IEmptyRole;
    //     logger.info('type', { data: type });

    //     if (USER_ROLE_TITLE[type as keyof typeof USER_ROLE_TITLE]) {
    //         userType = USER_ROLE_TITLE[type as keyof typeof USER_ROLE_TITLE];
    //     } else {
    //         // for customer, other types
    //         return emptyRole;
    //     }

    //     logger.info('userType', { data: userType });
    //     logger.info('type', { data: type });
    //     const options = {
    //         // populateFields: []
    //     };
    //     let role = await this.findOne({ userType: type, isDeleted: false }, options);
    //     // not found, find default, else []
    //     if (role && role.title) {
    //         return role;
    //     }
    //     role = await this.findOne({ isDefault: true, isDeleted: false }, options);
    //     if (role) {
    //         return role;
    //     }

    //     return emptyRole;
    // }

    public async addAccessPermission(type: Number): Promise<IRole | IEmptyRole> {
        let userType = '';
        let emptyRole = {
            title: '',
            permissions: []
        } as IEmptyRole;
        logger.info('type', { data: type });

        if (USER_ROLE_TITLE[type as keyof typeof USER_ROLE_TITLE]) {
            userType = USER_ROLE_TITLE[type as keyof typeof USER_ROLE_TITLE];
        } else {
            // for customer, other types
            return emptyRole;
        }

        logger.info('userType', { data: userType });
        logger.info('type', { data: type });
        const options = {
            // populateFields: []
        };
        let role = await this.findOne({ userType: type, isDefault: true, isDeleted: false }, options);
        // not found, find default, else []
        if (role) {
            return role;
        }

        return emptyRole;
    }

    public async setDefaultRole(id: string, userType: number): Promise<void> {
        let criteria = {
            _id: {
                $ne: id
            },
            userType: userType,
            isDefault: true
        };
        const update = { isDefault: false };

        await this.updateMany(criteria, update);
    }

    public async findDefaultRole(userType: number): Promise<boolean> {
        let isRoleFound = false;
        const existingDefault = await this.findOne({
            userType: userType,
            isDefault: true,
            isDeleted: false
        });

        if (existingDefault) {
            isRoleFound = true;
        }

        return isRoleFound;
    }

    public async updatePermissionsToAllUsers(userType: number, newPermissionArray: Array<string>) {
        await UserService.updateMany({ type: userType }, { accessPermission: newPermissionArray });
    }

    public async updateSeederPermissionsToAllUsers(userType: number, newPermissionArray: Array<string>) {
        let users = await UserService.find({ type: userType });
        if (users && users.length) {
            for (let user of users) {
                let accessPermission: any = user.accessPermission;

                accessPermission = JSON.parse(JSON.stringify(accessPermission));
                accessPermission.push(...newPermissionArray);
                let dataToUpdate = {
                    accessPermission: accessPermission
                };

                await UserService.update(user._id, dataToUpdate);
            }
        }
    }
}

export default new RoleService(); // Exporting an instance of RoleService.
