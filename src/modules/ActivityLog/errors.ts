export const activityLogErrors = {
    ACTIVITY_LOG_NOT_FOUND: {
        code: 'ACTIVITY_LOG_NOT_FOUND',
        status: 404,
        message: 'Activity log not found'
    },
    INVALID_DATE_RANGE: {
        code: 'INVALID_DATE_RANGE',
        status: 400,
        message: 'Invalid date range: start date must be before end date'
    },
    INVALID_EXPORT_FORMAT: {
        code: 'INVALID_EXPORT_FORMAT',
        status: 400,
        message: 'Invalid export format. Supported formats: json, excel, csv'
    },
    SEARCH_QUERY_REQUIRED: {
        code: 'SEARCH_QUERY_REQUIRED',
        status: 400,
        message: 'Search query is required'
    },
    INVALID_ARCHIVE_DATE: {
        code: 'INVALID_ARCHIVE_DATE',
        status: 400,
        message: 'Invalid archive date provided'
    },
    ARCHIVE_NOT_FOUND: {
        code: 'ARCHIVE_NOT_FOUND',
        status: 404,
        message: 'No archived logs found for the specified date'
    },
    EXPORT_FAILED: {
        code: 'EXPORT_FAILED',
        status: 500,
        message: 'Failed to export activity logs'
    },
    ARCHIVE_FAILED: {
        code: 'ARCHIVE_FAILED',
        status: 500,
        message: 'Failed to archive activity logs'
    }
};
