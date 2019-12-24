import { Request, Response } from 'express';
import crypto from 'crypto';
import moment from 'moment';

import { Config } from './config';
import { Provider } from './providers';

function csrfCookieDomain(req: Request) {
    return req.header('x-forwarded-host')?.split(':')[0];
}

export function getProviderNameFromRequest(req: Request): string {
    const params = req.query['state'].split(':');
    return params[1];
}

export function getRedirectFromRequest(req: Request): string {
    const params: string[] = req.query['state'].split(':');
    return params.slice(2).join(':');
}

export function clearCsrfCookie(req: Request, res: Response, config: Config) {
    res.cookie(config.csrfCookieName, '', {
        // path: '/',
        domain: csrfCookieDomain(req),
        httpOnly: true,
        secure: false,
        expires: moment().subtract(60, 'seconds').toDate()
    });
}

export function makeAuthCookie(req: Request, res: Response, config: Config, email: string) {
    const value = "";
    res.cookie(config.csrfCookieName, value, {
        // path: '/',
        domain: csrfCookieDomain(req),
        httpOnly: true,
        secure: false,
        expires: moment().add(60, 'seconds').toDate()
    });
}

export function makeCsrfCookie(req: Request, res: Response, config: Config, nonce: string) {
    res.cookie(config.csrfCookieName, nonce, {
        // path: '/',
        domain: csrfCookieDomain(req),
        httpOnly: true,
        secure: false,
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
	const proto = req.header('x-forwarded-proto');
	const host = req.header('x-forwarded-host');

	return `${proto}://${host}`;
}

export function redirectUrl(req: Request): string {
	return `${redirectBase(req)}/callback`;
}

function returnUrl(req: Request): string {
	const path = req.header('x-forwarded-uri');
    return `${redirectBase(req)}${path}`;
}

export function validateCsrfCookie(req: Request, res: Response, config: Config): boolean {
    const state = req.query['state'];
    const csrf = req.cookies[config.csrfCookieName];

    if (csrf.length !== 32) {
        console.error("Invalid CSRF cookie value");
        return false;
	} else if (state.length < 34) {
        console.error("Invalid state value");
        return false;
    } else if (!state.startsWith(csrf)) {
        console.error("CSRF value does not match state");
        return false;
    } else {
        return true;
    }
}
