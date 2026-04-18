import type { Request, Response } from 'express';

type ExpressHandler = (req: Request, res: Response) => void;

let cachedHandler: ExpressHandler | null = null;

export default async function handler(req: Request, res: Response) {
    try {
        if (!cachedHandler) {
            const appModule = await import('../src/app');
            const App = appModule.default;
            const application = new App();
            cachedHandler = application.app as ExpressHandler;
        }

        return cachedHandler(req, res);
    } catch (error: any) {
        console.error('Vercel bootstrap failed', error);

        return res.status(500).json({
            ok: false,
            error: 'SERVER_BOOTSTRAP_FAILED',
            message: error?.message || 'Unknown startup error',
            stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
        });
    }
}
