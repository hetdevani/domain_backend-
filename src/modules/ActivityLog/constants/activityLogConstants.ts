// Activity Log Action Types
export enum ACTION_TYPES {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    VIEW = 'VIEW',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    EXPORT = 'EXPORT',
    IMPORT = 'IMPORT',
    DOWNLOAD = 'DOWNLOAD',
    UPLOAD = 'UPLOAD',
    ACTIVATE = 'ACTIVATE',
    DEACTIVATE = 'DEACTIVATE',
    SOFT_DELETE = 'SOFT_DELETE',
    RESTORE = 'RESTORE',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    SUBMIT = 'SUBMIT',
    CANCEL = 'CANCEL',
    ASSIGN = 'ASSIGN',
    UNASSIGN = 'UNASSIGN',
    SHARE = 'SHARE',
    ARCHIVE = 'ARCHIVE',
    SEARCH = 'SEARCH',
    FILTER = 'FILTER',
    CUSTOM = 'CUSTOM',

    // Socket Events
    SOCKET_CONNECT = 'SOCKET_CONNECT',
    SOCKET_DISCONNECT = 'SOCKET_DISCONNECT',
    SOCKET_MESSAGE = 'SOCKET_MESSAGE',
    SOCKET_ERROR = 'SOCKET_ERROR',

    // Cron Jobs
    CRON_START = 'CRON_START',
    CRON_SUCCESS = 'CRON_SUCCESS',
    CRON_FAILURE = 'CRON_FAILURE',

    // API Calls
    API_CALL = 'API_CALL',
    EXTERNAL_API_CALL = 'EXTERNAL_API_CALL',

    // System Events
    SYSTEM_STARTUP = 'SYSTEM_STARTUP',
    SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
    SYSTEM_ERROR = 'SYSTEM_ERROR',
    SYSTEM_WARNING = 'SYSTEM_WARNING'
}

// Event Types
export enum EVENT_TYPES {
    USER_ACTION = 'USER_ACTION',
    SYSTEM_EVENT = 'SYSTEM_EVENT',
    SECURITY_EVENT = 'SECURITY_EVENT',
    DATA_CHANGE = 'DATA_CHANGE',
    API_CALL = 'API_CALL',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO'
}

// Severity Levels
export enum SEVERITY_LEVELS {
    INFO = 'INFO',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

// Log Status
export enum LOG_STATUS {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL'
}

// Sensitive fields to sanitize (all lowercase for case-insensitive matching)
export const SENSITIVE_FIELDS = [
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'secret',
    'secretkey',
    'privatekey',
    'creditcard',
    'cardnumber',
    'cvv',
    'ssn',
    'socialsecuritynumber',
    'bankaccount',
    'routingnumber',
    'pin',
    'otp',
    'twofactorcode',
    'verificationcode',
    'resettoken',
    'sessionid',
    'cookie',
    'authorization'
];

// Modules to exclude from automatic logging
export const EXCLUDED_MODULES = [
    'ActivityLog',
];

// Default retention period in days
export const DEFAULT_RETENTION_DAYS = 365;

// Archive threshold in days
export const ARCHIVE_THRESHOLD_DAYS = 90;

// Batch logging settings
export const BATCH_SIZE = 100;
export const BATCH_INTERVAL_MS = 5000; // 5 seconds
