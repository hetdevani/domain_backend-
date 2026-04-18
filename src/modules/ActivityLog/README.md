# Activity Log Module

## Overview
The **Activity Log Module** is a robust auditing system designed to track user actions, system events, and API calls within the application. It provides a dual-storage strategy using **MongoDB** for recent, high-frequency access logs and **AWS S3** for long-term archival of older logs.

## Features
- **Comprehensive Logging:** Tracks detailed information including user context, request details, device info, and data changes (before/after snapshots).
- **Automated Archival:** Automatically moves logs older than a configurable threshold (default: 90 days) from MongoDB to S3 to maintain database performance and reduce costs.
- **S3 Integration:** Archives logs to a structured public folder path `static/activityLogs/YYYY/MM/DD/index.json`.
- **Hybrid Search:** API endpoints allow seamless searching and retrieval of both "live" logs (MongoDB) and "archived" logs (S3).
- **Performance Optimized:** Uses background processing and bulk writes (optionally) to minimize impact on request latency.

---

## Configuration

### Environment Variables
Ensure the following variables are set in your `.env` file:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_db

# AWS S3 (Required for Archival)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_BUCKET_ACCESS_KEY=your-access-key
AWS_S3_BUCKET_SECRET_ACCESS_KEY=your-secret-key
```

### Constants
Configuration constants can be found in `src/modules/ActivityLog/constants/activityLogConstants.ts`.

| Constant | Default | Description |
|----------|---------|-------------|
| `ARCHIVE_THRESHOLD_DAYS` | `90` | Logs older than this many days are moved to S3. |
| `DEFAULT_RETENTION_DAYS` | `365` | General reference for retention policies. |
| `SENSITIVE_FIELDS` | `['password', ...]` | List of fields to automatically redact from logs. |

---

## Architecture & Workflow

### 1. Logging Activity
Logs are created via the `ActivityLogService`.
```typescript
import ActivityLogService from './services/ActivityLogService';
import { ACTION_TYPES, EVENT_TYPES } from './constants/activityLogConstants';

await ActivityLogService.logActivity({
    module: 'User',
    action: ACTION_TYPES.UPDATE,
    description: 'User updated profile',
    resourceId: userId,
    changeTracking: {
        before: oldData,
        after: newData
    }
}, req.user);
```

### 2. Archival Process (Cron Job)
A cron job named `archiveActivityLogs` runs daily (at midnight by default) to manage storage.
- **Source:** Finds logs in MongoDB where `createdAt < (NOW - ARCHIVE_THRESHOLD_DAYS)`.
- **Destination:** Uploads these logs to S3.
- **Path Structure:** `static/activityLogs/{YYYY}/{MM}/{DD}/index.json`
- **Cleanup:** Once successfully uploaded, the logs are **permanently deleted** from MongoDB.

**Cron Configuration:**
Defined in `src/modules/Cron/CronConfig.ts`.
```typescript
{
    name: 'archiveActivityLogs',
    schedule: '0 0 * * *', // Daily at midnight
    task: async () => {
        await CronService.archiveActivityLogs();
    }
}
```

---

## API Documentation

### Live Logs (MongoDB)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activity-log/list` | List logs with filters, pagination, and sorting. |
| `GET` | `/api/activity-log/:id` | Get details of a specific log. |
| `POST` | `/api/activity-log/search` | Full-text search on description, user name, etc. |
| `POST` | `/api/activity-log/user/:userId` | Get logs for a specific user. |
| `POST` | `/api/activity-log/module/:module` | Get logs for a specific module. |

### Archived Logs (S3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activity-log/archived` | Retrieve archived logs by date range. |
| `POST` | `/api/activity-log/archived/:year/:month/:day` | Get logs for a specific historic date. |
| `POST` | `/api/activity-log/archived/search` | Search within archived log files. |
| `POST` | `/api/activity-log/archived/dates` | List all dates that have available archives. |

### Analytics & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/activity-log/analytics` | Get stats (logs per day, top users, actions). |
| `POST` | `/api/activity-log/export` | Export logs to JSON, CSV, or Excel. |

---

## Implementation Details

### `ActivityLogService.ts`
- **`logActivity()`**: Main entry point for creating logs. Handles data sanitization (removing passwords/keys) and saving to DB.
- **`archiveOldLogs(days)`**: Orchestrates the move from DB to S3. Checks threshold, fetches batch, calls `CommonService` for upload, then deletes from DB.
- **`getArchivedLogsByDate()`**: dynamically constructs S3 paths and fetches `index.json` content for historical viewing.

### `CommonService.ts` & `S3ConnectionService.ts`
- **`uploadActivityLogTos3()`**: Helper in CommonService that formats data and uses `S3ConnectionService` to write the file.
- **`S3ConnectionService`**: Centralized handler for AWS S3 connectivity, ensuring consistent credential usage and connection pooling.

## Developer Guide - How to Use

1.  **Inject Logging:**
    Whenever you implement a critical action (Create, Update, Delete), call `ActivityLogService.logActivity`.

2.  **S3 Path Customization:**
    If you need to change the upload path from `static/activityLogs`, modify `generateS3Path` in `ActivityLogService.ts` and `uploadActivityLogTos3` in `CommonService.ts`.

3.  **Testing Archival:**
    To test the archival process manually without waiting for 90 days:
    - Change `ARCHIVE_THRESHOLD_DAYS` in constants to `0` or `1`.
    - Run the cron job manually or use a test script calling `ActivityLogService.archiveOldLogs(0)`.
    - Verify logs appear in S3 and disappear from MongoDB.
