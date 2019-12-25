import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import { loadConfiguration, validateConfiguration } from './config';
import { getProviderByName } from './providers';
import { makeNonce, makeCsrfCookie, makeState, redirectUrl, validateCsrfCookie, getProviderNameFromRequest, clearCsrfCookie, getRedirectFromRequest, makeAuthCookie, validateAuthCookie, validateUser, getEmailFromAuthCookie } from './auth';
import { ensureTraefikRequest } from './traefik';

const config = loadConfiguration();
validateConfiguration();

const app = express()
app.use(cookieParser());
app.use(ensureTraefikRequest);
const version = require("../package.json").version;

app.get('/', (req: Request, res: Response) => {
    console.debug("Authenticating request");
    const p = getProviderByName(config.provider);
    const nonce = makeNonce();

    if (!req.cookies[config.authCookieName]) {
        console.debug(`${config.authCookieName} not found: Forwarding to ${p.name()} login.`);
        const loginUrl = p.loginUrl(redirectUrl(req), makeState(req, p, nonce));
        makeCsrfCookie(req, res, config, nonce);
        res.redirect(307, `${loginUrl}`);
        return;
    } else if (!validateAuthCookie(req, res, config)) {
        console.debug(`${config.authCookieName} is invalid: Forwarding to ${p.name()} login.`);
        const loginUrl = p.loginUrl(redirectUrl(req), makeState(req, p, nonce));
        makeCsrfCookie(req, res, config, nonce);
        res.redirect(307, `${loginUrl}`);
        return;
    } else if (!validateUser(getEmailFromAuthCookie(req, config), config)) {
        console.debug(`${config.authCookieName} is unauthorized.`);
        res.sendStatus(403);
        return;
    } else {
        console.debug('Request is valid and authorized');
        res.header('X-Forwarded-User', getEmailFromAuthCookie(req, config));
        res.sendStatus(200);
    }
});

app.get('/callback', (req: Request, res: Response) => {
    if (!req.cookies[config.csrfCookieName]) {
        console.warn('Missing CSRF cookie');
        res.redirect(307, '/');
        return;
    } else if (!validateCsrfCookie(req, res, config)) {
        console.warn('Error validation csrf cookie');
        res.sendStatus(401);
        return;
    }

    clearCsrfCookie(req, res, config);

    const p = getProviderByName(getProviderNameFromRequest(req));
    const redirect = getRedirectFromRequest(req);

    try {
        p.exchangeCode(redirectUrl(req), req.query['code'])
        .then(token => {
            p.getUser(token)
            .then(user => {
                makeAuthCookie(req, res, config, user.email);
                console.info(`Authenticated ${user.email} via ${p.name()}`)
                res.redirect(307, redirect);
                return;
            })
            .catch(err => {
                console.error('Failed to get user', err);
                res.sendStatus(503);
                return;
            });
        })
        .catch(err => {
            console.error('Code exchange failed', err);
            res.sendStatus(503);
            return;
        })
    }
    catch (err) {
        console.error('Code exchange failed', err);
        res.sendStatus(503);
        return;
    }
});

app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
