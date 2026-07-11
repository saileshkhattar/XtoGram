import dotenv from "dotenv";
dotenv.config();

const required = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "APP_SCHEME",
  "GOOGLE_CLIENT_ID",
  "TWITTER_API_KEY",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

function getRequiredEnv(key: (typeof required)[number]): string {
  return process.env[key] as string;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: getRequiredEnv("MONGO_URI"),
  jwtAccessSecret: getRequiredEnv("JWT_ACCESS_SECRET"),
  twitterApiKey: getRequiredEnv("TWITTER_API_KEY"),
  resendApiKey: getRequiredEnv("RESEND_API_KEY"),
  emailFrom: getRequiredEnv("EMAIL_FROM"),
  appScheme: getRequiredEnv("APP_SCHEME"),
  googleClientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
  accessTokenTtl: "15m",
  refreshTokenTtlDays: 30,
} as const;
