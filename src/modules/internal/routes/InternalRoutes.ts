import { Router, Request, Response } from 'express';
import SeederService from '../../seeder/services/SeederService';
import { CronService } from '../../Cron/CronService';
import logger from '../../common/services/WinstonLogger';

const router = Router();

const isAuthorized = (req: Request): boolean => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cronSecret = req.headers['x-vercel-cron-secret'];
    const providedSecret = bearerToken || (Array.isArray(cronSecret) ? cronSecret[0] : cronSecret) || '';
    const expectedSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET || '';

    return !!expectedSecret && providedSecret === expectedSecret;
};

const rejectUnauthorized = (res: Response) =>
    res.status(401).json({ ok: false, message: 'Unauthorized' });

router.post('/seed', async (req: Request, res: Response) => {
    try {
        const result = await SeederService.seederConfig();
        return res.status(200).json({ ok: true, message: 'Seeder completed', result });
    } catch (error: any) {
        logger.error('Seeder route failed', { error });
        return res.status(500).json({ ok: false, message: error?.message || 'Seeder failed' });
    }
});

router.get('/cron/test', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return rejectUnauthorized(res);
    }

    try {
        await CronService.testCron();
        return res.status(200).json({ ok: true, message: 'Test cron executed' });
    } catch (error: any) {
        logger.error('Test cron route failed', { error });
        return res.status(500).json({ ok: false, message: error?.message || 'Test cron failed' });
    }
});

router.get('/cron/archive-activity-logs', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
        return rejectUnauthorized(res);
    }

    try {
        await CronService.archiveActivityLogs();
        return res.status(200).json({ ok: true, message: 'Archive cron executed' });
    } catch (error: any) {
        logger.error('Archive cron route failed', { error });
        return res.status(500).json({ ok: false, message: error?.message || 'Archive cron failed' });
    }
});

export default router;
