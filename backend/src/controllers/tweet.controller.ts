import { type NextFunction, type Request, type Response } from "express";
import * as tweetService from "../services/tweet.service.js";
import { resolveTier } from "../config/tiers.js";

export async function fetchTweet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tier = await resolveTier({ isGuest: req.isGuest, userId: req.userId });
    const result = await tweetService.processConversation(
      req.body.url,
      tier,
      req.isGuest ? req.userId : undefined,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}