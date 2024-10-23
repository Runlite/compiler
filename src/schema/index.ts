import { z } from "zod";

export const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  NODE_ENV: z.enum(["development", "production", "test", "staging"]),
  ADMIN_USER: z.string(),
  ADMIN_PASSWORD: z.string(),
  API_VERSION: z.string().default("v1"),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_TLS_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_POOL_MIN: z.string().transform(Number).default("2"),
  DB_POOL_MAX: z.string().transform(Number).default("10"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),
  CORS_ORIGIN: z.string().transform((val) => val.split(",")),
  CORS_METHODS: z
    .string()
    .transform((val) => val.split(","))
    .default("GET,POST,PUT,DELETE,PATCH"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
});

export type EnvConfig = z.infer<typeof envSchema>;
