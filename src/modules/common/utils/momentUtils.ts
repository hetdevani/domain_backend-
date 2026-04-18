import moment from 'moment';
import moment_tz from 'moment-timezone';
import { PROJECT_CONFIG } from '../config/ProjectConfig';
import logger from '../services/WinstonLogger';

export class MomentUtils {

    public static getTimeByTimeZone(date: string, format: string) {
        return moment_tz(date).tz(PROJECT_CONFIG.DEFAULT_TIME_ZONE).format(format);
    }

    static getTimeFromNow(): Date {
        return moment().toDate();
    }

    static startOfMonth(): Date {
        return moment().startOf('month').toDate();
    }

    static endOfMonth(): Date {
        return moment().endOf('month').toDate();
    }

    static startOfDay(): Date {
        return moment().startOf('day').toDate();
    }

    static endOfDay(): Date {
        return moment().endOf('day').toDate();
    }

    static subtractTime(value: number, time: string | null = null, unit: moment.unitOfTime.DurationConstructor = 'minutes'): string {
        if (time === null) {
            time = moment().toISOString();
        }

        return moment(time).subtract(value, unit).toISOString();
    }

    static isAfterCurrentDate(date: Date): boolean {
        return moment(date).isAfter(moment());
    }

    static getTimeDiffrence(startDate: Date, endDate: Date): number {
        const start = moment(startDate);
        const end = moment(endDate);

        let diff = end.diff(start, 'seconds');
        return diff;
    }

    static getDurationInHours(startDate: Date, endDate: Date): number {
        const start = moment(startDate);
        const end = moment(endDate);
        const duration = moment.duration(end.diff(start));
        return duration.asHours();

        /*
        const start = moment(startDate);
        const end = moment(endDate);

        let duration = end.diff(start, 'hours');
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;

        logger.info('hours 0000000', { data: hours, 'minutes', minutes });
        let time = 0;
        if (hours > 0 && minutes > 0) {
            logger.info('hours 1111111', { data: hours, 'minutes', minutes });
            time = parseFloat(`${hours}.${minutes}`);
        } else if (hours > 0) {
            logger.info('hours 2222222', { data: hours });
            time = hours;
        } else if (minutes > 0) {
            logger.info('hours 3333333', { data: minutes });
            time = parseFloat(`0.${minutes}`);
        }
        return time;
        */
    }

    static getDaysInMonth(year: number, month: number) {
        return new Date(year, month, 0).getDate();
    }
}

export default new MomentUtils();
