import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  AWS_ACCOUNT_ID: z.string().min(1),
	AWS_REGION: z.string().min(1).default("us-east-1"),
	ENVIRONMENT: z.enum(["dev", "prod", "staging"]).default("dev"),
  DOMAIN_NAME: z.string().min(1),
  CERTIFICATE_ARN: z.string().min(1),
	CF_PUBLIC_KEY_PATH: z.string(),
	CF_PRIVATE_KEY_PATH: z.string(),
	USER_API_DB_HOST: z.string(),
	USER_API_DB_PORT: z.string(),
	USER_API_DB_USER: z.string(),
	USER_API_DB_PASS: z.string(),
	USER_API_DB_NAME: z.string(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
