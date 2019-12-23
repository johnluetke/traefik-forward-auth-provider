import express, { Request, Response } from 'express';

const app = express()
const port = 8080;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, /!');
});

app.get('/callback', (req: Request, res: Response) => {
    res.send('Hello, /callback!');
});

app.listen(port, () => console.log(`Listening on port ${port}`))