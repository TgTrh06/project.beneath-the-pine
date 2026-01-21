import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const PORT = env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🌲 Server is running on http://localhost:${PORT}`);
  });
});
