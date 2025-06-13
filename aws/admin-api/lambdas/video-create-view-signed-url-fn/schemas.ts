import { z } from "zod";

export const envSchema = z.object({
  CF_KEY_PAIR_ID: z.string().min(1, "CF_KEY_PAIR_ID is required"),
  CF_PRIVATE_KEY: z.string().min(1, "CF_PRIVATE_KEY is required"),
});

export const requestSchema = z.object({
  body: z.object({
    url: z.string().url("Invalid URL format").min(1, "URL is required"),
  }),
});
