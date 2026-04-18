/**
 * Cron Logger Utility
 * Automatically logs all cron job executions
 */

import ActivityLogService from '../services/ActivityLogService';
import { ACTION_TYPES, EVENT_TYPES, LOG_STATUS, SEVERITY_LEVELS } from '../constants/activityLogConstants';
import logger from '../../common/services/WinstonLogger';

export class CronLogger {
    /**
     * Wrap cron execution with automatic logging
     * Logs: CRON_START, then CRON_SUCCESS or CRON_FAILURE
     */
    static async logCronExecution<T>(
        cronName: string,
        cronFn: () => Promise<T>,
        metadata?: any
    ): Promise<T> {
        const startTime = Date.now();
        let startLogId: string | undefined;

        try {
            // Log cron start
            const startLog = await ActivityLogService.logActivity({
                module: 'Cron',
                action: ACTION_TYPES.CRON_START,
                description: `Cron job started: ${cronName}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.PENDING,
                metadata: {
                    cronName,
                    startedAt: new Date(),
                    ...metadata
                }
            });
            startLogId = startLog?._id?.toString();

            // Execute cron job
            const result = await cronFn();
            const duration = Date.now() - startTime;

            // Log cron success
            await ActivityLogService.logActivity({
                module: 'Cron',
                action: ACTION_TYPES.CRON_SUCCESS,
                description: `Cron job completed successfully: ${cronName}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                duration,
                parentLogId: startLogId,
                metadata: {
                    cronName,
                    completedAt: new Date(),
                    durationMs: duration,
                    ...metadata
                }
            });

            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;

            // Log cron failure
            await ActivityLogService.logActivity({
                module: 'Cron',
                action: ACTION_TYPES.CRON_FAILURE,
                description: `Cron job failed: ${cronName}`,
                eventType: EVENT_TYPES.ERROR,
                status: LOG_STATUS.FAILED,
                severity: SEVERITY_LEVELS.HIGH,
                duration,
                parentLogId: startLogId,
                errorMessage: error.message,
                errorStack: error.stack,
                metadata: {
                    cronName,
                    failedAt: new Date(),
                    durationMs: duration,
                    ...metadata
                }
            });

            throw error; // Re-throw to maintain original behavior
        }
    }

    /**
     * Simple cron success log (for manual logging)
     */
    static async logSuccess(cronName: string, durationMs?: number): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Cron',
                action: ACTION_TYPES.CRON_SUCCESS,
                description: `Cron job completed: ${cronName}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                duration: durationMs,
                metadata: { cronName, completedAt: new Date() }
            });
        } catch (error) {
            logger.error('Error logging cron success', { error });
        }
    }

    /**
     * Simple cron failure log (for manual logging)
     */
    static async logFailure(cronName: string, error: Error, durationMs?: number): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Cron',
                action: ACTION_TYPES.CRON_FAILURE,
                description: `Cron job failed: ${cronName}`,
                eventType: EVENT_TYPES.ERROR,
                status: LOG_STATUS.FAILED,
                severity: SEVERITY_LEVELS.HIGH,
                duration: durationMs,
                errorMessage: error.message,
                errorStack: error.stack,
                metadata: { cronName, failedAt: new Date() }
            });
        } catch (logError) {
            logger.error('Error logging cron failure', { error: logError });
        }
    }
}

export default CronLogger;
