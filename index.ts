import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const port = 8000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World123!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});