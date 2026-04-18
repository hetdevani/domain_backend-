import { celebrate, Joi, Segments } from 'celebrate';
import { ACTION_TYPES, EVENT_TYPES, SEVERITY_LEVELS, LOG_STATUS } from '../constants/activityLogConstants';

export class ActivityLogValidators {
    /**
     * Validator for listing activity logs with filters
     */
    public static list = celebrate({
        [Segments.BODY]: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.object().default({ createdAt: -1 }),

            // Filters
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS)),
                resourceId: Joi.string(),
                resourceType: Joi.string(),
                ipAddress: Joi.string(),
                createdAt: Joi.object({
                    '>=': Joi.date(),
                    '<=': Joi.date()
                }),
                tags: Joi.array().items(Joi.string())
            }).optional(),

            // Search
            search: Joi.object({
                keyword: Joi.string().allow(''),
                keys: Joi.array().items(Joi.string()).default([])
            }).optional(),

            // Date range
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional(),

            // Select fields
            selectFields: Joi.array().items(Joi.string()).optional(),
            populateFields: Joi.array().items(Joi.string()).optional()
        })
    });

    /**
     * Validator for getting single activity log
     */
    public static getById = celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required()
        })
    });

    /**
     * Validator for getting user-specific logs
     */
    public static getUserLogs = celebrate({
        [Segments.PARAMS]: Joi.object({
            userId: Joi.string().required()
        }),
        [Segments.BODY]: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.object().default({ createdAt: -1 }),
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional()
        })
    });

    /**
     * Validator for getting module-specific logs
     */
    public static getModuleLogs = celebrate({
        [Segments.PARAMS]: Joi.object({
            module: Joi.string().required()
        }),
        [Segments.BODY]: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.object().default({ createdAt: -1 }),
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional()
        })
    });

    /**
     * Validator for analytics
     */
    public static analytics = celebrate({
        [Segments.BODY]: Joi.object({
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS)),
                createdAt: Joi.object({
                    '>=': Joi.date(),
                    '<=': Joi.date()
                })
            }).optional(),
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional()
        })
    });

    /**
     * Validator for export
     */
    public static export = celebrate({
        [Segments.BODY]: Joi.object({
            format: Joi.string().valid('json', 'excel', 'csv').default('json'),
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS)),
                createdAt: Joi.object({
                    '>=': Joi.date(),
                    '<=': Joi.date()
                })
            }).optional(),
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional()
        })
    });

    /**
     * Validator for search
     */
    public static search = celebrate({
        [Segments.BODY]: Joi.object({
            query: Joi.string().required().min(1),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.object().default({ createdAt: -1 }),
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS))
            }).optional()
        })
    });

    /**
     * Validator for archived logs by date range
     */
    public static archivedLogs = celebrate({
        [Segments.BODY]: Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().min(Joi.ref('startDate')).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS))
            }).optional()
        })
    });

    /**
     * Validator for archived logs by specific date
     */
    public static archivedLogsByDate = celebrate({
        [Segments.PARAMS]: Joi.object({
            year: Joi.number().integer().min(2000).max(2100).required(),
            month: Joi.number().integer().min(1).max(12).required(),
            day: Joi.number().integer().min(1).max(31).required()
        }),
        [Segments.BODY]: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS))
            }).optional()
        })
    });

    /**
     * Validator for searching archived logs
     */
    public static searchArchived = celebrate({
        [Segments.BODY]: Joi.object({
            query: Joi.string().required().min(1),
            startDate: Joi.date().required(),
            endDate: Joi.date().min(Joi.ref('startDate')).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            filter: Joi.object({
                userId: Joi.string(),
                module: Joi.string(),
                action: Joi.string().valid(...Object.values(ACTION_TYPES)),
                eventType: Joi.string().valid(...Object.values(EVENT_TYPES)),
                severity: Joi.string().valid(...Object.values(SEVERITY_LEVELS)),
                status: Joi.string().valid(...Object.values(LOG_STATUS))
            }).optional()
        })
    });

    /**
     * Validator for listing archive dates
     */
    public static listArchiveDates = celebrate({
        [Segments.BODY]: Joi.object({
            startDate: Joi.date().optional(),
            endDate: Joi.date().min(Joi.ref('startDate')).optional()
        })
    });
}
