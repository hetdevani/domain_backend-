/**
 * External API Logger Utility
 * Automatically logs all external API calls
 */

import ActivityLogService from '../services/ActivityLogService';
import { ACTION_TYPES, EVENT_TYPES, LOG_STATUS } from '../constants/activityLogConstants';
import PerformanceTracker from './PerformanceTracker';

export class ExternalApiLogger {
    /**
     * Wrap external API call with automatic logging
     */
    static async logApiCall<T>(
        apiName: string,
        method: string,
        url: string,
        apiFn: () => Promise<T>,
        requestData?: any
    ): Promise<T> {
        const tracker = new PerformanceTracker();

        try {
            const result = await tracker.trackExternalApi(apiFn);
            const metrics = tracker.getMetrics();

            await ActivityLogService.logActivity({
                module: 'ExternalAPI',
                action: ACTION_TYPES.EXTERNAL_API_CALL,
                description: `${method} ${apiName}`,
                eventType: EVENT_TYPES.API_CALL,
                status: LOG_STATUS.SUCCESS,
                performanceMetrics: {
                    externalApiTime: metrics.externalApiTime,
                    total: metrics.total
                },
                requestInfo: {
                    method,
                    url,
                    body: requestData
                },
                metadata: {
                    apiName,
                    calledAt: new Date()
                }
            });

            return result;
        } catch (error: any) {
            const metrics = tracker.getMetrics();

            await ActivityLogService.logActivity({
                module: 'ExternalAPI',
                action: ACTION_TYPES.EXTERNAL_API_CALL,
                description: `${method} ${apiName} - FAILED`,
                eventType: EVENT_TYPES.ERROR,
                status: LOG_STATUS.FAILED,
                performanceMetrics: {
                    externalApiTime: metrics.externalApiTime,
                    total: metrics.total
                },
                requestInfo: {
                    method,
                    url,
                    body: requestData
                },
                errorMessage: error.message,
                errorStack: error.stack,
                metadata: {
                    apiName,
                    failedAt: new Date()
                }
            });

            throw error;
        }
    }
}

export default ExternalApiLogger;
