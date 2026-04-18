import moment_tz from 'moment-timezone';
import { DATE_FILTER_BY } from '../constants/common';
import logger from '../services/WinstonLogger';

export class DbQueryUtils {

    public createCreatedAtDateFilters(flag: number) {
        const startNow = moment_tz.tz('Asia/Kolkata');
        const endNow = moment_tz.tz('Asia/Kolkata');

        switch (flag) {
            case DATE_FILTER_BY.MONTH:
                const firstDayOfMonth = startNow.clone().startOf('month');
                const lastDayOfMonth = endNow.clone().endOf('month');
                logger.info('**firstDayOfMonth**', { data: firstDayOfMonth.toDate(), endDate: lastDayOfMonth.toDate() });
                return { $gte: firstDayOfMonth.toDate(), $lte: lastDayOfMonth.toDate() };
            case DATE_FILTER_BY.WEEK:
                const startOfWeek = startNow.clone().startOf('week');
                const endOfWeek = endNow.clone().endOf('week');
                logger.info('**startOfWeek**', { data: startOfWeek.toDate(), endDate: endOfWeek.toDate() });
                return { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() };
            case DATE_FILTER_BY.YEAR:
                const firstDayOfYear = startNow.clone().startOf('year');
                const lastDayOfYear = endNow.clone().endOf('year');
                return { $gte: firstDayOfYear.toDate(), $lte: lastDayOfYear.toDate() };
            case DATE_FILTER_BY.DAY:
                const startOfToday = startNow.clone().startOf('day');
                const endOfToday = endNow.clone().endOf('day');
                return { $gte: startOfToday.toDate(), $lte: endOfToday.toDate() };
            default:
                const defaultStartDate = startNow.clone().startOf('day');
                const defaultEndDate = endNow.clone().endOf('day');
                return { $gte: defaultStartDate.toDate(), $lte: defaultEndDate.toDate() };
        }
    }

    public createCreatedAtDateFilter(flag: number) {
        const now = moment_tz.tz('Asia/Kolkata');

        switch (flag) {
            case DATE_FILTER_BY.MONTH:
                const firstDayOfMonth = now.clone().startOf('month');
                const lastDayOfMonth = now.clone().endOf('month');
                logger.info('**firstDayOfMonth**', { data: firstDayOfMonth.toDate(), endDate: lastDayOfMonth.toDate() });
                return { startDate: firstDayOfMonth.toDate(), endDate: lastDayOfMonth.toDate() };
            case DATE_FILTER_BY.WEEK:
                const startOfWeek = now.clone().startOf('week');
                const endOfWeek = now.clone().endOf('week');
                logger.info('**startOfWeek**', { data: startOfWeek.toDate(), endDate: endOfWeek.toDate() });
                return { startDate: startOfWeek.toDate(), endDate: endOfWeek.toDate() };
            case DATE_FILTER_BY.YEAR:
                const firstDayOfYear = now.clone().startOf('year');
                const lastDayOfYear = now.clone().endOf('year');
                return { startDate: firstDayOfYear.toDate(), endDate: lastDayOfYear.toDate() };
            case DATE_FILTER_BY.DAY:
                const startOfToday = now.clone().startOf('day');
                const endOfToday = now.clone().endOf('day');
                return { startDate: startOfToday.toDate(), endDate: endOfToday.toDate() };
            default:
                const defaultStartDate = now.clone().startOf('day');
                const defaultEndDate = now.clone().endOf('day');
                return { startDate: defaultStartDate.toDate(), endDate: defaultEndDate.toDate() };
        }
    }

    public getDateFormat(dateFilter: number, isSetStaticFormat: boolean = false) {
        let format = '%Y-%m-%d';
        switch (dateFilter) {
            case DATE_FILTER_BY.YEAR:
                format = '%m';
                break;
            case DATE_FILTER_BY.MONTH:
                format = '%d';
                break;
            case DATE_FILTER_BY.WEEK:
                format = '%w';
                break;
            case DATE_FILTER_BY.DAY:
                format = '%Y-%m-%d';
                if (isSetStaticFormat) {
                    format = '01';
                }
                break;
        }
        return format;
    }

}

export default new DbQueryUtils();