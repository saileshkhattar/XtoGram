import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";

async function start(): Promise<void> {
  await connectDB();
  const app = createApp();
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((err: unknown) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
