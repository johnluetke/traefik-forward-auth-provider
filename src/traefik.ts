import { Request, Response } from 'express';

export function ensureTraefikRequest(req: Request, res: Response, next: () => void) {
    const headers = {
        'x-forwarded-proto': 'http',
        'x-forwarded-host': req.headers.host,
        'x-forwarded-uri': '/',
    } as any;

    Object.keys(headers).forEach(header => {
        if (!req.headers[header]) {
            req.headers[header] = headers[header];
        }
    });

    next();
}