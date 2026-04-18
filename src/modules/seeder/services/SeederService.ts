import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import _ from 'lodash';
import { SEEDER_DATA_CONFIG } from '../../common/constants/seeder';
import { SeederConfig } from '../interfaces/ISeeder';
import RoleService from '../../Role/services/RoleService';
import CommonService from '../../common/services/CommonService';
import logger from '../../common/services/WinstonLogger';

class SeederService {

    async seedDatabase(): Promise<void> {
        const seederDirectory = path.join(__dirname, '../../../../', 'Seeder-Data');
        logger.info('seederDirectory', { data: seederDirectory });

        let files = await fs.readdirSync(seederDirectory);

        for (const file of files) {
            const modelName = path.basename(file, '.json');
            const data = require(path.join(seederDirectory, file));

            if (modelName !== 'User') {
                await this.seedData(modelName, data);
            }
        }
    }

    private async seedData(modelName: string, data: any): Promise<void> {
        // logger.info('modelName', { data: modelName });
        const model = mongoose.model(modelName);

        // logger.info('model', { data: model });
        const seederConfig = SEEDER_DATA_CONFIG[modelName as keyof SeederConfig]; // Type assertion
        const uniqueField = seederConfig.uniqueField;

        for (const item of data) {
            let query: any = {};
            for (let field of uniqueField) {
                query[field] = item[field]; // Use computed property name
            }
            let existingItem = await model.findOne(query);

            if (!existingItem || !existingItem._id) {
                await model.create(item);
                // logger.info(`Inserted ${item[uniqueField]} record into ${modelName} collection`);
            } else {
                if (modelName === 'Role') {
                    const existingModuleNumbers = _.map(existingItem.permissions, (permission) => permission.module);
                    const moduleNumbers = _.map(item.permissions, (permission) => permission.module);

                    let difference = moduleNumbers.filter(item => !existingModuleNumbers.includes(item));

                    logger.info('difference *****', { data: difference });
                    if (difference && difference.length) {
                        let modulesToAdd = item.permissions.filter((permission: any) => difference.includes(permission.module));
                        logger.info('dataToUpdate *********', { data: existingItem._id, modulesToAdd: modulesToAdd });

                        existingItem = JSON.parse(JSON.stringify(existingItem));
                        existingItem.permissions.push(...modulesToAdd);
                        let dataToUpdate = {
                            permissions: existingItem.permissions
                        };

                        let updatedData = await model.findByIdAndUpdate(existingItem._id, dataToUpdate, { new: true });
                        logger.info('updatedData *********', { data: updatedData._id });

                        if (updatedData && updatedData._id) {
                            await RoleService.updateSeederPermissionsToAllUsers(updatedData.userType, modulesToAdd);
                        }
                    }
                }
                // logger.info(`${modelName} with key ${item[uniqueField]} already has data. Skipping seeding.`);
            }
        }

    }

    public async seedUsers(): Promise<void> {
        const userFilePath = path.join(__dirname, '../../../../', 'Seeder-Data', 'User.json');

        fs.readFile(userFilePath, 'utf8', async (err, data) => {
            if (err) {
                logger.error('Error reading User.json:', { error: err });
                return;
            }

            try {
                const userData = JSON.parse(data);
                await this.seedUserData(userData);
            } catch (parseError) {
                logger.error('Error parsing User.json:', { error: parseError });
            }
        });
    }

    private async seedUserData(records: any): Promise<void> {
        const userModel = mongoose.model('User');

        // logger.info('seedUserData records', { data: records });
        for (let data of records) {
            // Check if user exists by email or mobile (if mobile is provided)
            const query: any = { $or: [{ email: data.email }] };
            if (data.mobile) {
                query.$or.push({ mobile: data.mobile });
            }

            const exists = await userModel.findOne(query);

            if (!exists) {
                logger.info('Seeding user data...');
                data = await CommonService.assignSeriesData(data, 'User');
                await userModel.create(data);
            } else {
                logger.info(`User ${data.email} already exists`);

                continue;
            }
        }
    }

    public async seederConfig(): Promise<void> {
        // logger.info('seederConfig');
        await this.seedDatabase();
        await this.seedUsers();
    }
}

export default new SeederService();
