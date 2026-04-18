import { Document } from 'mongoose';
import { ACTION_TYPES, EVENT_TYPES, SEVERITY_LEVELS, LOG_STATUS } from '../constants/activityLogConstants';

export interface ILocation {
    lat?: number;
    lng?: number;
    city?: string;
    state?: string;
    country?: string;
}

export interface IDeviceInfo {
    type?: string; // mobile, tablet, desktop
    os?: string;
    browser?: string;
    version?: string;
}

export interface IChangeTracking {
    before?: any;
    after?: any;
    changedFields?: string[];
}

export interface IRequestInfo {
    method?: string;
    url?: string;
    headers?: any;
    query?: any;
    params?: any;
    body?: any;
}

export interface IResponseInfo {
    statusCode?: number;
    duration?: number; // in milliseconds
    size?: number; // in bytes
}

export interface IPerformanceMetrics {
    dbQueryTime?: number;       // Time spent in database queries (ms)
    externalApiTime?: number;   // Time spent calling external APIs (ms)
    processingTime?: number;    // Business logic processing time (ms)
    total?: number;             // Total operation duration (ms)
}

export interface IBusinessMetrics {
    revenue?: number;           // Money involved in the operation
    orderCount?: number;        // Number of orders
    customerId?: string;        // Related customer ID
    productId?: string;         // Related product ID
    [key: string]: any;        // Extensible for custom business metrics
}

export interface IActivityLog extends Document {
    // User Information
    userId?: string;
    userName?: string;
    userEmail?: string;
    userType?: number;

    // Action Details
    module: string; // e.g., 'User', 'Role', 'Setting'
    action: ACTION_TYPES; // CREATE, UPDATE, DELETE, etc.
    description?: string; // Human-readable description

    // Event Classification
    eventType: EVENT_TYPES; // USER_ACTION, SYSTEM_EVENT, etc.
    category?: string; // Custom category
    subcategory?: string; // Custom subcategory

    // Severity & Status
    severity: SEVERITY_LEVELS; // INFO, LOW, MEDIUM, HIGH, CRITICAL
    status: LOG_STATUS; // SUCCESS, FAILED, PENDING

    // Request Context
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: IDeviceInfo;
    location?: ILocation;

    // Data Tracking
    resourceId?: string; // ID of the affected resource
    resourceType?: string; // Type of the affected resource
    changeTracking?: IChangeTracking; // Before/after snapshots

    // Request/Response Details
    requestInfo?: IRequestInfo;
    responseInfo?: IResponseInfo;

    // Metadata
    tags?: string[]; // For categorization and filtering
    metadata?: any; // Additional custom data
    errorMessage?: string; // If status is FAILED
    errorStack?: string; // Error stack trace

    // Performance
    duration?: number; // Operation duration in ms
    performanceMetrics?: IPerformanceMetrics; // Detailed performance breakdown

    // Request Tracking (Quick Win Enhancement)
    correlationId?: string;     // Track request across multiple operations
    parentLogId?: string;        // Link to parent operation log
    traceId?: string;           // Distributed tracing ID

    // Business Context (Quick Win Enhancement)
    businessMetrics?: IBusinessMetrics; // Business-related metrics

    // Environment Info (Quick Win Enhancement)
    environment?: string;       // development, staging, production, test
    appVersion?: string;        // Application version
    serverName?: string;        // Server hostname/ID

    // Timestamps (automatically added by mongoose)
    createdAt?: Date;
    updatedAt?: Date;
}
