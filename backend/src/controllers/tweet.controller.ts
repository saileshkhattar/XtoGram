import { type NextFunction, type Request, type Response } from "express";
import * as tweetService from "../services/tweet.service.js";

export async function fetchTweet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await tweetService.processTweet(req.body.url);
    res.json(result);
  } catch (err) {
    next(err);
  }
}