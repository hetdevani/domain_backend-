/**
 * System Logger Utility
 * Logs system-level events (startup, shutdown, errors, warnings)
 */

import ActivityLogService from '../services/ActivityLogService';
import { ACTION_TYPES, EVENT_TYPES, LOG_STATUS, SEVERITY_LEVELS } from '../constants/activityLogConstants';
import logger from '../../common/services/WinstonLogger';

export class SystemLogger {
    /**
     * Log application startup
     */
    static async logStartup(): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'System',
                action: ACTION_TYPES.SYSTEM_STARTUP,
                description: 'Application started',
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                metadata: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    pid: process.pid,
                    startedAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Error logging startup', { error });
        }
    }

    /**
     * Log application shutdown
     */
    static async logShutdown(reason: string): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'System',
                action: ACTION_TYPES.SYSTEM_SHUTDOWN,
                description: `Application shutting down: ${reason}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                metadata: {
                    reason,
                    shutdownAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Error logging shutdown', { error });
        }
    }

    /**
     * Log system error
     */
    static async logError(error: Error, context: string): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'System',
                action: ACTION_TYPES.SYSTEM_ERROR,
                description: `System error in ${context}: ${error.message}`,
                eventType: EVENT_TYPES.ERROR,
                status: LOG_STATUS.FAILED,
                severity: SEVERITY_LEVELS.CRITICAL,
                errorMessage: error.message,
                errorStack: error.stack,
                metadata: {
                    context,
                    errorOccurredAt: new Date()
                }
            });
        } catch (logError) {
            logger.error('Error logging system error', { error: logError });
        }
    }

    /**
     * Log system warning
     */
    static async logWarning(message: string, context: string, metadata?: any): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'System',
                action: ACTION_TYPES.SYSTEM_WARNING,
                description: `Warning in ${context}: ${message}`,
                eventType: EVENT_TYPES.WARNING,
                status: LOG_STATUS.SUCCESS,
                severity: SEVERITY_LEVELS.MEDIUM,
                metadata: {
                    context,
                    warningAt: new Date(),
                    ...metadata
                }
            });
        } catch (error) {
            logger.error('Error logging system warning', { error });
        }
    }
}

export default SystemLogger;
