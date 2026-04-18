export const PROJECT_CONFIG = {
    CREATE_NEW_CUSTOMER: false, // Set this flag to true or false based on your project's requirements
    IS_UPLOAD_IN_S3: false,
    S3_DEFAULT_ACCESS_TYPE: 'private' as 'private' | 'public', // Default access type for S3 uploads
    S3_SIGNED_URL_EXPIRATION_SECONDS: 60, // 1 hour expiration for signed URLs
    MAX_LOGIN_REQUEST_LIMIT: 3,
    SET_LOGIN_REQUEST_INTERVAL: 3,
    OTP_LENGTH: 6,
    USER_ENABLE_MASTER_OTP: true,
    USER_MASTER_OTP: '498092',
    GOOGLE_API_KEY: 'AIzaSyArwoH4anHkBZYjUSCR3zwf-0l07-vGWrk',
    MIN_BATTER_LEVEL: 20,
    DEFAULT_MAIL_SUBJECT: 'Email from Demo Project',
    DEFAULT_TIME_ZONE: 'Asia/Kolkata',
    USER_MASTER_PASSWORD: 'BaseAuthenticator1234'
};
