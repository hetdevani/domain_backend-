export const NOTIFICATION_STATUS = {
    READ: 1,
    UNREAD: 2
};

export const NOTIFICATION_STATUS_ARRAY = Object.values(NOTIFICATION_STATUS);

export const NOTIFICATION_TYPE = {
    WEB: 1,
    MOBILE: 2,
    EMAIL: 3
};

export const NOTIFICATION_TYPE_ARRAY = Object.values(NOTIFICATION_TYPE);

export const PRIORITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
};

export const PRIORITY_ARRAY = Object.values(PRIORITY);

export const DEVICE_TYPE = {
    ANDROID: 1,
    IPHONE: 2,
    ADMIN: 3,
    DESKTOP: 4
};

export const USER_TYPES = {
    MASTER_ADMIN: 1,
    ADMIN: 2,
    CUSTOMER: 3
};

export const USER_ROLE_TITLE = {
    1: 'master_admin',
    2: 'admin',
    3: 'customer'
};

export const SETTING_TYPE = {
    SUPPORT_INFO: 1
};

export const MOBILE_USER_TYPES = [
    USER_TYPES.CUSTOMER,
];

export const ADMIN_USER_TYPES = [
    USER_TYPES.MASTER_ADMIN,
    USER_TYPES.ADMIN
];

export const USER_TYPES_ARRAY = Object.values(USER_TYPES);

export const DATE_FILTER_BY = {
    YEAR: 1,
    MONTH: 2,
    WEEK: 3,
    DAY: 4
};

export const OPERATING_SYSTEM = {
    ANDROID: 1,
    IOS: 2,
    WINDOWS: 3,
};
export const OPERATING_SYSTEM_ARRAY = Object.values(OPERATING_SYSTEM);

export const VALID_FILE_TYPES = [
    // Images
    '.jpeg', '.jpg', '.bmp', '.gif', '.png', '.tif',

    // TEXT
    '.txt',

    // APPLICATION FORMAT
    '.rtf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.odt', '.ods', '.odp', '.pdf', '.exe', '.zip'
];

export const VALID_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/zip',
    'application/x-ms-dos-executable'
    // 'text/plain',
    // 'application/vnd.ms-powerpoint',
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 'audio/mpeg',
    // 'audio/wav',
    // 'video/mp4',
    // 'video/mpeg',
    // 'application/x-rar-compressed',
];
