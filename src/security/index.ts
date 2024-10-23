import { config } from "../configs";
import express, { Application, Request } from "express";
import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export class Security {
  constructor(private app: express.Application) {}
  public enable() {
    this.app.use(hpp());
    this.app.use(cors(this.corsConfiguration()));
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: "same-site" },
        dnsPrefetchControl: true,
        frameguard: { action: "deny" },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        xssFilter: true,
      }),
    );
    this.app.set("trust proxy", config.isProduction);
    this.app.use(this.limiter());
    this.header(this.app);
  }
  private header(app: Application) {
    app.use((_, res, next) => {
      res.setHeader(
        "Permissions-Policy",
        "geolocation=(), camera=(), microphone=()",
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      next();
    });
  }
  private corsConfiguration() {
    return {
      origin: config.cors.origin,
      methods: config.cors.methods,
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      optionsSuccessStatus: 200,
    };
  }
  private limiter() {
    return rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      keyGenerator: (req: Request) =>
        (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
        (req.ip as string),
      message: "Too many requests, please try again later.",
    });
  }
}
