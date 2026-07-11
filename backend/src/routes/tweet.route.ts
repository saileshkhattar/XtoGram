import { Router } from "express";
import { fetchTweet } from "../controllers/tweet.controller.js";
import { tweetRateLimiter } from "../middleware/rateLimiter.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { fetchTweetSchema } from "../validators/tweet.validator.js";

const router = Router();


router.post(
  "/tweet",
  tweetRateLimiter,
  validateRequest(fetchTweetSchema),
  fetchTweet,
);

export default router;