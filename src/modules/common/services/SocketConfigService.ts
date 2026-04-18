import { Server } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import AuthService from '../../auth/services/AuthService';
import { commonMessages } from '../constants/message';
import CommonUtil from '../../auth/utils/CommonUtil';
import { v4 as uuidv4 } from "uuid"; // Install: npm install uuid
import UserService from '../../User/services/UserService';
import { USER_TYPES } from '../constants/common';
import ActivityLogService from '../../ActivityLog/services/ActivityLogService';
import { ACTION_TYPES, LOG_STATUS } from '../../ActivityLog/constants/activityLogConstants';
import logger from './WinstonLogger';

class SocketManager {
    private static instance: SocketManager;
    private io: SocketServer;
    public pendingRequests: Map<string, { resolve: Function, reject: Function; }>;

    // Private constructor to prevent direct instantiation
    private constructor() {
        this.io = {} as SocketServer;
        this.pendingRequests = new Map();
    }

    private setupSocket(server: Server) {
        this.io = new SocketServer(server);

        this.io.use(async (socket: Socket, next: (err?: any) => void) => {
            let headers = socket.handshake.headers;

            if (!headers.authorization && socket.handshake.auth) {
                headers = socket.handshake.auth;
            }

            const token = headers.authorization;
            // logger.info('token ------------', { data: token });
            if (token) {
                try {
                    const userData = await AuthService.validateToken(token);

                    socket.handshake.headers.userid = userData.id;
                    socket.handshake.headers.usertype = userData.type.toString();

                    return next();
                } catch (error) {
                    logger.info('Error during authorization:', { data: error });
                    return next(error);
                }
            } else {
                return next(commonMessages.MISSING_TOKEN);
            }
        });

        this.io.on('connection', async (socket: Socket) => {

            socket.on('disconnect', async () => {
                let userId = socket.handshake.headers['userid'];
                let userType = socket.handshake.headers['usertype'];
                // logger.info('socket user before-------', { data: userId });

                userId = JSON.parse(JSON.stringify(userId));
                userType = JSON.parse(JSON.stringify(userType));
                // logger.info('A user disconnected');

                if (userId) {
                    await this.removeUserSocket(socket.id, userId.toString());
                }
            });

            // logger.info('A user connected');

            let userId = socket.handshake.headers['userid'];
            let userType = socket.handshake.headers['usertype'];

            // logger.info('socket user before-------', { data: userId });

            userId = JSON.parse(JSON.stringify(userId));
            userType = JSON.parse(JSON.stringify(userType));

            // logger.info('socket user after-------', { data: userId });

            if (userId && userType) {
                // logger.info('socket user -------', { data: userId });

                await this.addUserSocket(socket.id, userId.toString(), userType.toString());
            }

            socket.on('error', (err: Error) => {
                // logger.info('Socket error', { data: err });
            });

            socket.on("systemUpTime:response", (data) => {
                this.handleResponse(data);
            });
        });

        this.io.on('error', (err: Error) => {
            logger.info('Socket error', { data: err });
        });
    }

    public static initialize(server: Server): SocketManager {
        if (!SocketManager.instance) {
            // logger.info('socket manager initialize');
            SocketManager.instance = new SocketManager();
            SocketManager.instance.setupSocket(server);
            SocketManager.instance.sendRequest = SocketManager.instance.sendRequest.bind(SocketManager.instance);
        }
        // this.pendingRequests = new Map<string, { resolve: Function, reject: Function }>();

        return SocketManager.instance;
    }

    public async addUserSocket(socketId: string, userId: string, userType: string) {
        let userSocket = await CommonUtil.getUserSocket(userId);

        if (!userSocket || !userSocket.socketId) {
            userSocket = {
                id: socketId,
                socketId: socketId,
                userId: userId,
                userType: userType,
                connection: true,
                // deviceId: options.deviceId
            };
            await CommonUtil.setUserSocket(userId, userSocket);
        } else {
            userSocket.socketId = socketId;
            userSocket.connection = true;
            await CommonUtil.setUserSocket(userId, userSocket);
        }

        let updatedData: any = {
            socketConnection: true,
            lastSocketConnection: new Date()
        };
        await UserService.update(userId, updatedData);

        let userSocketData = await CommonUtil.getUserSocket(userId);

        // Log socket connection
        ActivityLogService.logActivity({
            module: 'Socket',
            action: ACTION_TYPES.SOCKET_CONNECT,
            description: `User connected to socket`,
            userId: userId,
            userType: Number(userType),
            status: LOG_STATUS.SUCCESS,
            metadata: { socketId }
        });

        // logger.info('addUserSocket userSocketData ------------', { data: userSocketData });
    }

    public async removeUserSocket(socketId: string, userId: string) {
        let userSocket = await CommonUtil.getUserSocket(userId);
        if (userSocket && socketId === userSocket.socketId) {
            userSocket.connection = false;
            await CommonUtil.setUserSocket(userId, userSocket);

            let updatedData: any = {
                socketConnection: false
            };
            await UserService.update(userId, updatedData);

            // Log socket disconnection
            ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_DISCONNECT,
                description: `User disconnected from socket`,
                userId: userId,
                status: LOG_STATUS.SUCCESS,
                metadata: { socketId }
            });
        }

        let userSocketData = await CommonUtil.getUserSocket(userId);
        // logger.info('removeUserSocket userSocketData ------------', { data: userSocketData });
    }

    public async sendNotification(userId: string, message: string) {
        const userSocket = await this.findUserSocket(userId);
        if (userSocket) {
            this.io.to(userSocket).emit('notification', { message });

            // Log notification
            ActivityLogService.logActivity({
                module: 'Socket',
                action: ACTION_TYPES.SOCKET_MESSAGE,
                description: `Notification sent to user`,
                userId: userId,
                status: LOG_STATUS.SUCCESS,
                metadata: { message }
            });

            // logger.info('Sent notification to user ID ${userId}: ${message}');
        } else {
            // logger.info('User with ID ${userId} is not connected');
        }
    }

    public async sendUnreadNotificationCount(userId: string, message: string, data: any) {
        const userSocket = await this.findUserSocket(userId);
        if (userSocket) {
            this.io.to(userSocket).emit('unreadNotificationCount', { message, data });
            // logger.info('Sent unreadNotificationCount to user ID ${userId}: ${message}');
        } else {
            // logger.info('User with ID ${userId} is not connected');
        }
    }

    public async sendMessageAdmin(userId: string, userType: string, data: any) {
        const AdminUser = await UserService.find({ type: USER_TYPES.MASTER_ADMIN });
        if (AdminUser && AdminUser.length > 0) {
            for (const admin of AdminUser) {
                const userSocket = await this.findUserSocket(admin._id.toString());
                if (userSocket) {
                    this.io.to(userSocket).emit('listenMessage:response', { data, userId, userType });
                    // logger.info('Sent messageAdmin to user ID ${admin._id}: ${data}');
                } else {
                    // logger.info('Admin with ID ${admin._id} is not connected');
                }
            }
        } else {
            // logger.info('No admin users found');
        }
    }

    public async sendMessage(userId: string, userType: string, data: any) {
        // logger.info('sendMessage data ------------', { data: data });

        const userSocket = await this.findUserSocket(userId);
        if (userSocket) {
            this.io.to(userSocket).emit('listenMessage:response', { data, userId, userType });
            // logger.info('Sent message technician to user ID ${userId}: ${data}');
        } else {
            // logger.info('User with ID ${userId} is not connected');
        }
    }

    public async findUserSocket(userId: string): Promise<string | null> {
        // logger.info('findUserSocket userId ------------', { data: userId, screenId, pcClientType, ticketId });

        let userSocket = await CommonUtil.getUserSocket(userId);

        let user = await UserService.findById(userId);
        if (userSocket && userSocket.connection) {
            if (user && user._id && !user.socketConnection) {
                let updatedData = {
                    socketConnection: true,
                    lastSocketConnection: new Date()
                };
                await UserService.update(userId, updatedData);
            }

            return userSocket.socketId;
        } else {
            if (user && user._id && user.socketConnection) {
                let updatedData = {
                    socketConnection: false
                };
                await UserService.update(userId, updatedData);
            }
            return null;
        }
    }

    /**
     * Sends a request and waits for a response using Promises.
     * @param {string} userId - The user ID.
     * @param {string} event - The event name to emit.
     * @param {Object} payload - The data to send.
     * @returns {Promise} Promise that resolves when the response is received.
     */
    public async sendRequest(userId: string, event: string, payload: any): Promise<any> {
        const requestId = uuidv4(); // Generate unique ID
        const timeout = 1000 * 120; // 5 seconds timeout
        if (!this.pendingRequests) {
            this.pendingRequests = new Map();
        }

        if (payload && payload.data && payload.data.message) {

            return new Promise(async (resolve, reject) => {
                // Store the request with resolve/reject callbacks
                this.pendingRequests.set(requestId, { resolve, reject });

                // Attach the request ID to the payload
                const requestPayload = { ...payload };
                // const userSocket: any = await this.findUserSocket(userId, screenId, pcClientType);
                const userSocket = await this.findUserSocket(payload.data.receiverUserId);

                // logger.info('sendRequest userSocket ------------', { data: userSocket, userId, event });
                if (userSocket) {
                    const userData = await UserService.findOne({ _id: requestPayload.data.senderId });

                    const data = {
                        message: requestPayload.data.message,
                        ticketId: requestPayload.data.ticketId,
                        receiverUserId: requestPayload.data.receiverUserId,
                        messageType: requestPayload.data.messageType,
                        senderId: {
                            _id: requestPayload.data.senderId,
                            name: userData?.name
                        },
                        senderUserType: requestPayload.data.senderUserType,
                        date: requestPayload.data.date,
                        uniqueCode: requestPayload.data.uniqueCode

                    };

                    logger.info('Ticket is  connected');

                    try {
                        resolve(this.io.to(userSocket).emit(event, { data: data }));

                    } catch (error) {
                        logger.error('Error sending request:', { error: error });
                    }

                    setTimeout(() => {
                        if (this.pendingRequests.has(requestId)) {
                            this.pendingRequests.delete(requestId);
                            reject(new Error('Request timed out'));
                        }
                    }, timeout);
                }
                else {
                    resolve(false);
                }

            });

        } else {

            return new Promise(async (resolve, reject) => {
                // Store the request with resolve/reject callbacks
                this.pendingRequests.set(requestId, { resolve, reject });

                // Attach the request ID to the payload
                const requestPayload = { requestId, ...payload };
                const userSocket: any = await this.findUserSocket(userId);
                // logger.info('sendRequest userSocket ------------', { data: userSocket, userId, event });
                if (!userSocket) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Client is not connected'));
                    return;
                }
                try {
                    this.io.to(userSocket).emit(event, requestPayload);
                } catch (error) {
                    logger.error('Error sending request:', { error: error });
                }

                // Timeout to reject the request if no response
                setTimeout(() => {
                    if (this.pendingRequests.has(requestId)) {
                        this.pendingRequests.delete(requestId);
                        reject(new Error('Request timed out'));
                    }
                }, timeout);
            });
        }

    }

    /**
     * Handles incoming responses and resolves the corresponding Promise.
     * @param {Object} response - The response payload (must include requestId).
     */
    public async handleResponse(response: { requestId: string, data?: any, error?: string }, event?: string) {
        // logger.info('handleResponse ------------', { data: response.isTitlesFaulted });
        const { requestId, data, error } = response;
        // logger.info('========isTitlesFaulted============>', { data: isTitlesFaulted });

        if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve, reject } = this.pendingRequests.get(requestId)!;

            // Resolve or reject based on the response
            if (error) {
                reject(new Error(error));
            } else {
                resolve(data);
            }

            // Clean up
            this.pendingRequests.delete(requestId);
        }
    }
}

export default SocketManager; 
