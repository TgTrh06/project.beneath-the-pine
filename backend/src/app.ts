import express, { Request, Response } from "express";
import cors from "cors";

import habitRouter from "./routes/habit.routes";
import logRouter from "./routes/log.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Beneath the Pine");
});

app.use("/api/habits", habitRouter);
app.use("/api/logs", logRouter);

app.use(errorHandler);

export default app;
