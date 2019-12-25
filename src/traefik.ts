import { Request, Response } from 'express';

export function ensureTraefikRequest(req: Request, res: Response, next: () => void) {
    const headers = {
        'X-Forwarded-Proto': 'http',
        'X-Forwarded-Host': req.headers.host,
        'X-Forwarded-Uri': '/',
    } as any;

    Object.keys(headers).forEach(header => {
        if (!req.headers[header]) {
            req.headers[header] = headers[header];
        }
    });

    next();
}