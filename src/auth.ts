import { Request, Response } from 'express';
import crypto from 'crypto';
import moment from 'moment';

import { Config } from './config';
import { Provider } from './providers';

function csrfCookieDomain(req: Request) {
    // TODO: better way?
    return req.headers.host?.split(':')[0];
}

export function makeCsrfCookie(req: Request, res: Response, config: Config, nonce: string) {
    res.cookie(config.csrfCookieName, nonce, {
        path: '/',
        domain: csrfCookieDomain(req),
        httpOnly: true,
        secure: true,
        expires: moment().add(60, 'seconds').toDate()
    });
}

export function makeNonce() {
    const buffer = crypto.randomBytes(16);
    return `${buffer.toString('hex')}`;
}

export function makeState(req: Request, p: Provider, nonce: string): string {
    return `${nonce}:${p.name()}:${returnUrl(req)}`;
}

export function redirectBase(req: Request): string {
	const proto = req.headers["x-forwarded-proto"];
	const host = req.headers["x-forwarded-host"]

	return `${proto}://${host}`;
}

export function redirectUrl(req: Request): string {
	return `${redirectBase(req)}/callback`;
}

function returnUrl(req: Request): string {
    // TODO: 
	// const path = req.header('X-Forwarded-Uri');
    // return fmt.Sprintf("%s%s", redirectBase(r), path)
    return "";
}
