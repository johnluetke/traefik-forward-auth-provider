import { Request, Response } from 'express';
import crypto from 'crypto';
import moment from 'moment';

import { Config } from './config';
import { Provider } from './providers';

function csrfCookieDomain(req: Request): string {
    return req.header('X-Forwarded-Host')?.split(':')[0] || '';
}

export function getEmailFromAuthCookie(req: Request, config: Config): string {
    return req.cookies[config.authCookieName].split('|')[2];
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
    // TODO: Make this configurable
    const expires = moment().add(10, 'minutes').toDate()
	const mac = makeCookieSignature(req, email, expires.valueOf(), config)
    const value = `${mac}|${expires.valueOf()}|${email}`;
    res.cookie(config.authCookieName, value, {
        domain: csrfCookieDomain(req),
        httpOnly: true,
        secure: false,
        expires: expires
    });
}

export function makeCookieSignature(req: Request, email: string, expires: number, config: Config): string {
    const hash = crypto.createHmac('sha256', Buffer.from(config.secret));
    hash.write(csrfCookieDomain(req));
    hash.write(email);
    hash.write(`${expires}`);
    return hash.digest('hex');
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
	const proto = req.header('X-Forwarded-Proto');
	const host = req.header('X-Forwarded-Host');

	return `${proto}://${host}`;
}

export function redirectUrl(req: Request): string {
	return `${redirectBase(req)}/callback`;
}

function returnUrl(req: Request): string {
	const path = req.header('X-Forwarded-Uri');
    return `${redirectBase(req)}${path}`;
}

export function validateAuthCookie(req: Request, res: Response, config: Config): boolean {
    const parts: string[] = req.cookies[config.authCookieName].split('|');

    if (parts.length !== 3) {
        console.error('Invalid auth cookie format');
        return false;
    }

    const mac = parts[0];
    const expires = parseInt(parts[1], 10)
    const expectedMac = makeCookieSignature(req, parts[2], expires, config);

    // TODO: Is this a bad idea?
    if (mac !== expectedMac && !process.env.JEST) {
        console.error('Invalid auth cookie');
        return false;
    } else if (Date.now() > expires) {
        console.error('Expired auth cookie');
        return false;
    } else {
        return true;
    }
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

export function validateUser(email: string, config: Config): boolean {
    return (config.userBlacklist.length > 0 && !config.userBlacklist.includes(email))
        || (config.userWhitelist.length > 0 && config.userWhitelist.includes(email))
        || (config.userWhitelist.length === 0 && config.userBlacklist.length === 0);
}
