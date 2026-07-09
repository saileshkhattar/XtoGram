import jwt from "jsonwebtoken";
import { type RequestHandler } from "express";
import { env } from "../config/env.js";

type AccessTokenPayload = jwt.JwtPayload & {
  sub: string;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
    if (!payload.sub) {
      res.status(401).json({ error: "Invalid or expired access token" });
      return;
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};
