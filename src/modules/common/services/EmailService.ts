import _ from 'lodash';
import nodemailer from 'nodemailer';
import Email from 'email-templates';
import path from 'path';
import translatorService from '../response/translatorService';
import ejs from 'ejs';
import fs from 'fs';
import dotenv from 'dotenv';
import { PROJECT_CONFIG } from '../config/ProjectConfig';
import logger from './WinstonLogger';
dotenv.config(); // Load .env variables

class EmailService {

    private prepareMessage(mailObj: any) {
        let language = mailObj.data && mailObj.data.language ? mailObj.data.language : 'en';
        const subject = mailObj.subject ? translatorService.translateMessage(mailObj.subject, language) : mailObj.subject;

        let html = '';

        if (mailObj.htmlContent) {
            html = mailObj.htmlContent;
        } else if (mailObj.template) {
            const templatePath = path.join(__dirname, `../../Emails/${mailObj.template}/html.ejs`);
            const template = fs.readFileSync(templatePath, 'utf-8');

            html = ejs.render(template, mailObj.data);
        }

        let mailOptions: any = {
            from: process.env.DEFAULT_MAIL,
            to: mailObj.to,
            subject: subject,
            html: html,
        };

        if (Array.isArray(mailObj.cc) && mailObj.cc.length > 0) {
            mailOptions.cc = mailObj.cc.join(', ');
        }

        if (mailObj.attachments) {
            mailOptions.attachments = mailObj.attachments.map((attachment: string) => {
                const assetsDir = path.join(process.cwd(), 'assets');
                const fullPath = path.join(assetsDir, attachment);
                const dirOfAttachment = path.dirname(fullPath);

                if (!fs.existsSync(dirOfAttachment)) {
                    fs.mkdirSync(dirOfAttachment, { recursive: true });
                }

                if (!fs.existsSync(fullPath)) {
                    fs.writeFileSync(fullPath, 'Dummy content for testing');
                }

                return {
                    filename: path.basename(attachment),
                    path: fullPath
                };
            });
        }

        return mailOptions;
    }

    /* async send(mailObj: any) {
        try {
            // if (!process.env.MAIL_AUTH_USER || !process.env.MAIL_AUTH_PASS) {
            //     logger.info('----------Mail Auth User/Pass Empty----------');
            //     return;
            // }

            const transporter = nodemailer.createTransport({
                service: 'Mailgun',
                auth: {
                    user: process.env.MAIL_AUTH_USER,
                    pass: process.env.MAIL_AUTH_PASS,
                },
            });

            if (!mailObj.data.language) {
                mailObj.data.language = 'en-US';
            }
            
            // mailObj.data.lang = mailObj.data.language.toString().substr(0, 2);
            // mailObj.data.textDirection = 'ltr';
           

            const message = this.prepareMessage(mailObj);

            let email = new Email({
                message: message,
                send: false,
                transport: transporter,
                views: {
                    options: {
                        extension: 'ejs',
                    },
                    // root: path.join(__dirname, `../../Emails/`)
                },
            });

            mailObj.data.template = `../../Emails/${mailObj.template}/html.ejs`;
            // mailObj.data.template = path.join(__dirname, `../../Emails/${mailObj.template}/html.ejs`);
            logger.info('mailObj.data.template ----', { data: mailObj.template, mailObj.data.template });

            logger.info('mailObj.data');
            console.log(mailObj.data);
            logger.info('mailObj.data');
            try {
                await email.send({
                    template: mailObj.data.template,
                    // template: mailObj.template,
                    message: {
                        to: mailObj.to,
                        subject: mailObj.subject,
                    },
                    locals: mailObj.data,
                });
            } catch (e) {
                console.log('e')
                console.log(e)
                console.log('e')
            }

            logger.info('email sent successfully');

        } catch (error) {
            logger.error('Error sending email:', { error: error });
        }
    } */

    async send(mailObj: any) {
        try {
            if (!process.env.MAIL_AUTH_USER || !process.env.MAIL_AUTH_PASS) {
                logger.info('----------Mail Auth User/Pass Empty----------');
                return;
            }

            const transporter = nodemailer.createTransport({
                service: 'Mailgun',
                auth: {
                    user: process.env.MAIL_AUTH_USER,
                    pass: process.env.MAIL_AUTH_PASS,
                },
            });

            const mailOptions = this.prepareMessage(mailObj);

            try {
                await transporter.sendMail(mailOptions);
                logger.info('Email sent successfully');
            } catch (e) {
                logger.error('Error sending email:', { error: e });
            }
        } catch (error) {
            logger.error('Error setting up email:', { error: error });
        }
    }
}

export default new EmailService();
