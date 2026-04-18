import cron from 'node-cron';
import { CronService } from './CronService';
import ActivityLogService from '../ActivityLog/services/ActivityLogService';
import { ACTION_TYPES, LOG_STATUS, SEVERITY_LEVELS } from '../ActivityLog/constants/activityLogConstants';
import logger from '../common/services/WinstonLogger';

type CronConfig = {
    name: string;
    schedule: string;
    task: () => void;
};

class CronScheduler {
    private cronConfigs: CronConfig[];

    constructor() {
        this.cronConfigs = [
            {
                name: 'testCron',
                // schedule: '*/1 * * * *',
                schedule: '30 18 * * *',
                task: async () => {
                    logger.info('testCron', { data: new Date() });
                    await CronService.testCron();
                }
            },
            {
                name: 'archiveActivityLogs',
                schedule: '0 0 * * *', // Run daily at midnight
                task: async () => {
                    await CronService.archiveActivityLogs();
                }
            },
        ];
    }

    public configureCronsObj() {
        this.configureCrons();
    }

    private configureCrons(): void {
        this.cronConfigs.forEach((config) => {
            cron.schedule(config.schedule, async () => {
                const startTime = Date.now();
                const cronName = config.name;

                try {
                    logger.info('Starting cron job: ${cronName}');

                    // Log start
                    await ActivityLogService.logActivity({
                        module: 'Cron',
                        action: ACTION_TYPES.CRON_START,
                        description: `Cron job started: ${cronName}`,
                        status: LOG_STATUS.PENDING,
                        metadata: { cronName, schedule: config.schedule }
                    });

                    // Execute task
                    await config.task();

                    const duration = Date.now() - startTime;
                    logger.info('Cron job finished: ${cronName} in ${duration}ms');

                    // Log success
                    await ActivityLogService.logActivity({
                        module: 'Cron',
                        action: ACTION_TYPES.CRON_SUCCESS,
                        description: `Cron job completed successfully: ${cronName}`,
                        status: LOG_STATUS.SUCCESS,
                        metadata: { cronName, duration: `${duration}ms` }
                    });
                } catch (error: any) {
                    const duration = Date.now() - startTime;
                    logger.error('Cron job failed: ${cronName}', { error: error });

                    // Log failure
                    await ActivityLogService.logActivity({
                        module: 'Cron',
                        action: ACTION_TYPES.CRON_FAILURE,
                        description: `Cron job failed: ${cronName}`,
                        status: LOG_STATUS.FAILED,
                        severity: SEVERITY_LEVELS.HIGH,
                        errorMessage: error.message,
                        metadata: { cronName, duration: `${duration}ms`, stack: error.stack }
                    });
                }
            });
        });
    }
}

export default new CronScheduler();