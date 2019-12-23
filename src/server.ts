import express, { Request, Response } from 'express';
import { loadConfiguration, validateConfiguration } from './config';

const config = loadConfiguration();
validateConfiguration();

const app = express()
const version = require("../package.json").version;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, /!');
});

app.get('/callback', (req: Request, res: Response) => {
    res.send('Hello, /callback!');
});

app.listen(config.port, () => console.log(`Listening on port ${config.port}`))