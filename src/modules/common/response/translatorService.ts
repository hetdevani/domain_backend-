import fs from 'fs';
import path from 'path';
import logger from '../services/WinstonLogger';

class TranslatorService {
    private readonly appPath: string = path.dirname(require.main!.filename);

    public translateData(data: any, language: string = 'en'): any {
        if (language === 'en') {
            return data;
        };

        let isObject = false;
        if (!Array.isArray(data)) {
            isObject = true;
            data = [data];
        }

        for (let record of data) {
            if (record && record.multiLanguageData && record.multiLanguageData[language]) {
                for (let field in record.multiLanguageData[language]) {
                    if (record.multiLanguageData[language][field]) {
                        record[field] = record.multiLanguageData[language][field];
                    }
                }
            }
        }

        if (isObject) {
            data = data[0];
        };

        return data;
    }

    public translateMessage(message: string, language: string = 'en'): string {
        if (language === 'en') {
            return message;
        }
        const filePath = path.join(this.appPath, `modules/common/locales/${language}.json`);
        try {
            if (!fs.existsSync(filePath)) {
                return message;
            }

            const localeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const newMessage = localeData[message];

            if (newMessage) {
                // let typeOfVehicle = type ? sails.config.VEHICLE_TYPE_STRING[type] : "Vehicle";  // Adjust based on your config
                // let word = localeData[typeOfVehicle] || typeOfVehicle;
                // message = newMessage.replace('%@', word);
                message = newMessage;
            }

            return message;
        } catch (error) {
            logger.info('Translation error', { data: error });
            return message;
        }
    }
}

export default new TranslatorService();
