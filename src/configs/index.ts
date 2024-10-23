import { envConfig } from "../constants/env.const";
import { EnvConfig, envSchema } from "../schema";
import { loadEnvFile } from "../utils";
import { z } from "zod";

export class Config {
  private static instance: Config;
  private config: EnvConfig;
  private envSpecificConfig: (typeof envConfig)[keyof typeof envConfig];

  private constructor() {
    loadEnvFile();

    try {
      this.config = envSchema.parse(process.env);
      this.envSpecificConfig = envConfig[this.config.NODE_ENV];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n");
        throw new Error(`Configuration validation failed:\n${errorMessages}`);
      }
      throw error;
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public getConfig() {
    return {
      server: {
        port: this.config.PORT,
        apiVersion: this.config.API_VERSION,
        nodeEnv: this.config.NODE_ENV,
        cluster: false,
        admin_user: this.config.ADMIN_USER,
        admin_password: this.config.ADMIN_PASSWORD,
      },
      security: {
        jwtSecret: this.config.JWT_SECRET,
        encryptionKey: this.config.ENCRYPTION_KEY,
        cookieSecret: this.config.COOKIE_SECRET,
        tokens: {
          accessTokenExpiresIn: this.config.ACCESS_TOKEN_EXPIRES_IN,
          refreshTokenExpiresIn: this.config.REFRESH_TOKEN_EXPIRES_IN,
        },
      },
      redis: {
        host: this.config.REDIS_HOST,
        port: this.config.REDIS_PORT,
        password: this.config.REDIS_PASSWORD,
        username: this.config.REDIS_USERNAME,
        tls: this.config.REDIS_TLS_ENABLED,
      },
      database: {
        host: this.config.DB_HOST,
        port: this.config.DB_PORT,
        name: this.config.DB_NAME,
        user: this.config.DB_USER,
        password: this.config.DB_PASSWORD,
        pool: {
          min: this.config.DB_POOL_MIN,
          max: this.config.DB_POOL_MAX,
        },
      },
      logging: {
        level: this.config.LOG_LEVEL,
        format: this.config.LOG_FORMAT,
      },
      cors: {
        ...this.envSpecificConfig.cors,
        origin: this.config.CORS_ORIGIN,
        methods: this.config.CORS_METHODS,
      },
      rateLimit: {
        windowMs: this.config.RATE_LIMIT_WINDOW_MS,
        max: this.config.RATE_LIMIT_MAX_REQUESTS,
      },
      features: {
        swagger: this.envSpecificConfig.swagger,
        monitor: this.envSpecificConfig.monitor,
      },
      isDevelopment: this.envSpecificConfig.isDevelopment,
      isProduction: this.envSpecificConfig.isProduction,
    } as const;
  }
  public get<K extends keyof ReturnType<Config["getConfig"]>>(
    key: K,
  ): ReturnType<Config["getConfig"]>[K] {
    return this.getConfig()[key];
  }
}
export const config = Config.getInstance().getConfig();
