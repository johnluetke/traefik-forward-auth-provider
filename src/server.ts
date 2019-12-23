import express, { Request, Response } from 'express';
import { loadConfiguration, validateConfiguration } from './config';
import { getProviderByName } from './providers';
import { makeNonce, makeCsrfCookie, makeState, redirectUrl } from './auth';
import { ensureTraefikRequest } from './traefik';

const config = loadConfiguration();
validateConfiguration();

const app = express()
const version = require("../package.json").version;

app.get('/', ensureTraefikRequest, (req: Request, res: Response) => {
    console.debug("Authenticating request");

    const p = getProviderByName(config.provider);
    const nonce = makeNonce();

    makeCsrfCookie(req, res, config, nonce);

    const loginUrl = p.loginUrl(redirectUrl(req), makeState(req, p, nonce));

    res.send(`${loginUrl}`);
});

app.get('/callback', (req: Request, res: Response) => {
    res.send('Hello, /callback!');
});

app.listen(config.port, () => console.log(`Listening on port ${config.port}`));

 // 