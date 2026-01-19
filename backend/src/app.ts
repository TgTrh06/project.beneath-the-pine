import express, { Request, Response } from 'express';
import habitRouter from './routes/habit.route';

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send("Beneath the Pine");
});

app.use("/api/habit", habitRouter)

export default app;