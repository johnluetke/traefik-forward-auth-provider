import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import { loadConfiguration, validateConfiguration } from './config';
import { getProviderByName } from './providers';
import { makeNonce, makeCsrfCookie, makeState, redirectUrl, validateCsrfCookie, getProviderNameFromRequest, clearCsrfCookie, getRedirectFromRequest, makeAuthCookie } from './auth';
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

    makeCsrfCookie(req, res, config, nonce);

    const loginUrl = p.loginUrl(redirectUrl(req), makeState(req, p, nonce));

    res.redirect(307, `${loginUrl}`);
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
        const token = p.exchangeCode(redirectUrl(req), req.query['code']);
        const user = p.getUser(token);
        makeAuthCookie(req, res, config, user.email);
        res.redirect(307, redirect);
        return;
    }
    catch (err) {
        console.error('Code exchange failed', err);
        res.sendStatus(503);
        return;
    }
});

app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
