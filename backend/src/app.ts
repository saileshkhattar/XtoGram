import express, { type Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import tweetRoutes from "./routes/tweet.route.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/auth", authRoutes);

  // Everything under /api requires a valid access token from here down.
  app.use("/api", requireAuth);
  app.use("/api", tweetRoutes);

  app.use(errorHandler);
  return app;
}