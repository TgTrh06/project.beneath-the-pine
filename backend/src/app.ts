import express, { Request, Response } from 'express';
import cors from 'cors';

import habitRouter from './routes/habit.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send("Beneath the Pine");
});

app.use("/api/habits", habitRouter)

export default app;