import fs from 'fs';
import path from 'path';
import logger from './WinstonLogger';

class MessageFileToJsonConverter {

    public async createJsonFiles(messageFilePaths: string[]): Promise<void> {
        try {
            let aggregatedMessages = {};
    
            for (const filePath of messageFilePaths) {
                const fileMessages = require(filePath).messages;
                aggregatedMessages = { ...aggregatedMessages, ...this.extractMessages(fileMessages) };
            }
    
            await this.writeToJsonFile(aggregatedMessages, './src/modules/common/locales/tr.json');
        } catch (error) {
            logger.info('Error while converting message files to json', { data: error });
        }
    }

    private extractMessages(messages: any): any {
        let newMessages: any = {};
        for (const key in messages) {
            let message = messages[key].message;
            newMessages[message] = message;
        }
        return newMessages;
    }

    private async writeToJsonFile(messages: any, outputPath: string): Promise<void> {
        const dir = path.dirname(outputPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let json = JSON.stringify(messages, null, 2);
        await fs.writeFileSync(outputPath, json);
    }
}

export default new MessageFileToJsonConverter();
