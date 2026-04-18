/**
 * Performance Tracker Utility
 * Track performance metrics for database queries, external API calls, and processing time
 */

export class PerformanceTracker {
    private startTime: number;
    private metrics: {
        dbQueryTime: number;
        externalApiTime: number;
        processingTime: number;
    };

    constructor() {
        this.startTime = Date.now();
        this.metrics = {
            dbQueryTime: 0,
            externalApiTime: 0,
            processingTime: 0
        };
    }

    /**
     * Track a database query operation
     */
    async trackDbQuery<T>(operation: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            return await operation();
        } finally {
            this.metrics.dbQueryTime += Date.now() - start;
        }
    }

    /**
     * Track an external API call
     */
    async trackExternalApi<T>(operation: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            return await operation();
        } finally {
            this.metrics.externalApiTime += Date.now() - start;
        }
    }

    /**
     * Track a processing/business logic operation
     */
    async trackProcessing<T>(operation: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            return await operation();
        } finally {
            this.metrics.processingTime += Date.now() - start;
        }
    }

    /**
     * Get the current performance metrics
     */
    getMetrics() {
        const total = Date.now() - this.startTime;

        return {
            dbQueryTime: this.metrics.dbQueryTime,
            externalApiTime: this.metrics.externalApiTime,
            processingTime: this.metrics.processingTime,
            total
        };
    }

    /**
     * Reset the tracker for a new operation
     */
    reset() {
        this.startTime = Date.now();
        this.metrics = {
            dbQueryTime: 0,
            externalApiTime: 0,
            processingTime: 0
        };
    }
}

/**
 * Example usage:
 * 
 * const tracker = new PerformanceTracker();
 * 
 * // Track DB query
 * const users = await tracker.trackDbQuery(async () => {
 *     return await UserModel.find({ active: true });
 * });
 * 
 * // Track external API call
 * const weather = await tracker.trackExternalApi(async () => {
 *     return await fetch('https://api.weather.com/data');
 * });
 * 
 * // Get metrics
 * const metrics = tracker.getMetrics();
 * // { dbQueryTime: 50, externalApiTime: 200, processingTime: 0, total: 250 }
 * 
 * // Log to ActivityLog with performance metrics
 * await ActivityLogService.logActivity({
 *     module: 'User',
 *     action: 'LIST',
 *     performanceMetrics: metrics
 * });
 */

export default PerformanceTracker;
