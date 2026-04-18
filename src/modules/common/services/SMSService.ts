import request from 'request';
import logger from './WinstonLogger';

class SMSService {

    public async send(msgObj: any) {
        try {
            logger.info('send msgObj message:', { data: msgObj.message });
            if (!process.env.SMS_LOGIN_ID || !process.env.SMS_PASSWORD || process.env.SMS_URL) {
                logger.info('----------SMS Login ID/Pass Empty----------');
                return;
            }
            let smsData: any = {
                smsUsernameKey: process.env.SMS_LOGIN_ID,
                smsPasswordKey: process.env.SMS_PASSWORD,
                smsNoKey: msgObj.mobile,
                smsMsgKey: msgObj.message,
                smsMsgHeaderKey: process.env.SMS_UNICODE,
                template_id: msgObj.template_id
            };

            new Promise((resolve, reject) => {
                const options = {
                    url: process.env.SMS_URL || '',
                    method: 'get',
                    qs: smsData
                };

                request(options, (error: any, response: any, body: any) => {
                    if (error) {
                        logger.info('SMS err:', { data: error });
                        reject(error);
                    } else if (body) {
                        logger.info('SMS body:', { data: body });
                        resolve(body);
                    } else {
                        logger.info('response', { data: response });
                        resolve(response);
                    }
                });
            });
            return true;
        } catch (error) {
            logger.error('Error setting up sms:', { error: error });
        }
    }
}

export default new SMSService();
