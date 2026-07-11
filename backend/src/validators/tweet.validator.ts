import { z } from "zod";

export const fetchTweetSchema = z.object({
  body: z.object({
    url: z.string().url("A valid tweet URL is required"),
  }),
});