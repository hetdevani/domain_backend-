/**
 * Socket Logger Utility
 * Automatically logs all Socket.IO events
 */

import ActivityLogService from '../services/ActivityLogService';
import { ACTION_TYPES, EVENT_TYPES, LOG_STATUS } from '../constants/activityLogConstants';
import { IUser } from '../../User/interfaces/IUser';
import logger from '../../common/services/WinstonLogger';

export class SocketLogger {
    /**
     * Log socket connection
     */
    static async logConnection(socketId: string, user?: IUser, ipAddress?: string): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_CONNECT,
                description: `Socket connected: ${socketId}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                ipAddress,
                metadata: {
                    socketId,
                    connectedAt: new Date()
                }
            }, user);
        } catch (error) {
            logger.error('Error logging socket connection', { error });
        }
    }

    /**
     * Log socket disconnection
     */
    static async logDisconnection(socketId: string, reason: string, user?: IUser): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_DISCONNECT,
                description: `Socket disconnected: ${reason}`,
                eventType: EVENT_TYPES.SYSTEM_EVENT,
                status: LOG_STATUS.SUCCESS,
                metadata: {
                    socketId,
                    reason,
                    disconnectedAt: new Date()
                }
            }, user);
        } catch (error) {
            logger.error('Error logging socket disconnection', { error });
        }
    }

    /**
     * Log socket message/event
     */
    static async logMessage(event: string, data: any, socketId: string, user?: IUser): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_MESSAGE,
                description: `Socket event: ${event}`,
                eventType: EVENT_TYPES.USER_ACTION,
                status: LOG_STATUS.SUCCESS,
                metadata: {
                    socketId,
                    event,
                    data,
                    timestamp: new Date()
                }
            }, user);
        } catch (error) {
            logger.error('Error logging socket message', { error });
        }
    }

    /**
     * Log socket error
     */
    static async logError(error: Error, socketId: string, user?: IUser): Promise<void> {
        try {
            await ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_ERROR,
                description: `Socket error: ${error.message}`,
                eventType: EVENT_TYPES.ERROR,
                status: LOG_STATUS.FAILED,
                errorMessage: error.message,
                errorStack: error.stack,
                metadata: {
                    socketId,
                    errorOccurredAt: new Date()
                }
            }, user);
        } catch (logError) {
            logger.error('Error logging socket error', { error: logError });
        }
    }
}

export default SocketLogger;
