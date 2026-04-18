import { Schema, model } from 'mongoose';
import { IActivityLog } from '../interfaces/IActivityLog';
import { ACTION_TYPES, EVENT_TYPES, SEVERITY_LEVELS, LOG_STATUS, DEFAULT_RETENTION_DAYS } from '../constants/activityLogConstants';
import logger from '../../common/services/WinstonLogger';

const LocationSchema = new Schema({
    lat: { type: Number },
    lng: { type: Number },
    city: { type: String },
    state: { type: String },
    country: { type: String }
}, { _id: false });

const DeviceInfoSchema = new Schema({
    type: { type: String }, // mobile, tablet, desktop
    os: { type: String },
    browser: { type: String },
    version: { type: String }
}, { _id: false });

const ChangeTrackingSchema = new Schema({
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    changedFields: [{ type: String }]
}, { _id: false });

const RequestInfoSchema = new Schema({
    method: { type: String },
    url: { type: String },
    headers: { type: Schema.Types.Mixed },
    query: { type: Schema.Types.Mixed },
    params: { type: Schema.Types.Mixed },
    body: { type: Schema.Types.Mixed }
}, { _id: false });

const ResponseInfoSchema = new Schema({
    statusCode: { type: Number },
    duration: { type: Number },
    size: { type: Number }
}, { _id: false });

const ActivityLogSchema: Schema<IActivityLog> = new Schema(
    {
        // User Information
        userId: { type: String, index: true },
        userName: { type: String },
        userEmail: { type: String },
        userType: { type: Number },

        // Action Details
        module: { type: String, required: true, index: true },
        action: {
            type: String,
            required: true,
            enum: Object.values(ACTION_TYPES),
            index: true
        },
        description: { type: String },

        // Event Classification
        eventType: {
            type: String,
            required: true,
            enum: Object.values(EVENT_TYPES),
            default: EVENT_TYPES.USER_ACTION,
            index: true
        },
        category: { type: String, index: true },
        subcategory: { type: String },

        // Severity & Status
        severity: {
            type: String,
            required: true,
            enum: Object.values(SEVERITY_LEVELS),
            default: SEVERITY_LEVELS.INFO,
            index: true
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(LOG_STATUS),
            default: LOG_STATUS.SUCCESS,
            index: true
        },

        // Request Context
        ipAddress: { type: String, index: true },
        userAgent: { type: String },
        deviceInfo: { type: DeviceInfoSchema },
        location: { type: LocationSchema },

        // Data Tracking
        resourceId: { type: String, index: true },
        resourceType: { type: String, index: true },
        changeTracking: { type: ChangeTrackingSchema },

        // Request/Response Details
        requestInfo: { type: RequestInfoSchema },
        responseInfo: { type: ResponseInfoSchema },

        // Metadata
        tags: [{ type: String, index: true }],
        metadata: { type: Schema.Types.Mixed },
        errorMessage: { type: String },
        errorStack: { type: String },

        // Performance
        duration: { type: Number },
        performanceMetrics: {
            type: {
                dbQueryTime: { type: Number },
                externalApiTime: { type: Number },
                processingTime: { type: Number },
                total: { type: Number }
            },
            _id: false
        },

        // Request Tracking (Quick Win Enhancement)
        correlationId: { type: String, index: true },
        parentLogId: { type: String, index: true },
        traceId: { type: String, index: true },

        // Business Context (Quick Win Enhancement)
        businessMetrics: { type: Schema.Types.Mixed, default: {} },

        // Environment Info (Quick Win Enhancement)
        environment: {
            type: String,
            enum: ['development', 'staging', 'production', 'test'],
            index: true
        },
        appVersion: { type: String },
        serverName: { type: String, index: true }
    },
    {
        timestamps: true,
        // TTL index for automatic cleanup (optional, can be configured)
        // expireAfterSeconds is set in days * 24 * 60 * 60
    }
);

// Compound indexes for common queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ module: 1, action: 1, createdAt: -1 });
ActivityLogSchema.index({ eventType: 1, severity: 1, createdAt: -1 });
ActivityLogSchema.index({ resourceId: 1, resourceType: 1 });
ActivityLogSchema.index({ createdAt: -1 }); // For sorting by date

// Quick Win Enhancement: New indexes for correlation tracking and environment filtering
ActivityLogSchema.index({ correlationId: 1, createdAt: -1 });
ActivityLogSchema.index({ traceId: 1, createdAt: -1 });
ActivityLogSchema.index({ environment: 1, serverName: 1, createdAt: -1 });
ActivityLogSchema.index({ 'performanceMetrics.dbQueryTime': 1 }); // Find slow DB queries
ActivityLogSchema.index({ 'businessMetrics.revenue': 1 }); // Find high-revenue operations


// Text index for search functionality
ActivityLogSchema.index({
    description: 'text',
    userName: 'text',
    userEmail: 'text',
    errorMessage: 'text'
});

// Pre-save hook
ActivityLogSchema.pre<IActivityLog>('save', async function (next) {
    // Additional logic before saving can be added here
    // For example, auto-generate description if not provided
    if (!this.description && this.action && this.module) {
        this.description = `${this.action} operation on ${this.module}`;
    }
    next();
});

// Post-save hook
ActivityLogSchema.post<IActivityLog>('save', function (doc) {
    // Additional logic after saving can be added here
    // For example, emit events for real-time monitoring
    logger.debug('Activity log created', { logId: doc._id });
});

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
