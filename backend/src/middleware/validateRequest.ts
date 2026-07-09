import { type RequestHandler } from "express";
import { type ZodType } from "zod";

export function validateRequest(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body });
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0]?.message });
      return;
    }
    next();
  };
}
