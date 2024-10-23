import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import safeStringify from "fast-safe-stringify";
import { config } from "../configs";

// Define log levels with corresponding colors
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LOG_COLORS = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Define log directory
const LOG_DIR = "logs";

class Logger {
  private logger: winston.Logger;
  private static instance: Logger;

  private constructor() {
    this.createLogDir();
    this.logger = this.initializeLogger();
    this.handleExceptions();
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Create log directory if it doesn't exist
   */
  private createLogDir(): void {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR);
    }
  }

  /**
   * Initialize winston logger with all configurations
   */
  private initializeLogger(): winston.Logger {
    return winston.createLogger({
      levels: LOG_LEVELS,
      level: this.getLogLevel(),
      format: this.getLogFormat(),
      transports: this.getTransports(),
      exitOnError: false,
    });
  }

  /**
   * Get appropriate log level based on environment
   */
  private getLogLevel(): string {
    const env = config.isDevelopment ? "development" : "production";
    const logLevels = {
      development: "debug",
      test: "debug",
      production: "info",
    };
    return logLevels[env] || "info";
  }

  /**
   * Configure log format with enhanced security and readability
   */
  private getLogFormat(): winston.Logform.Format {
    const devFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.colorize({ colors: LOG_COLORS }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp"],
      }),
      this.sanitizeLogFormat(),
      winston.format.printf(this.formatLogMessage),
    );

    const prodFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp"],
      }),
      this.sanitizeLogFormat(),
      winston.format.json(),
    );

    return config.isDevelopment ? devFormat : prodFormat;
  }

  /**
   * Sanitize sensitive information from logs
   */
  private sanitizeLogFormat(): winston.Logform.Format {
    return winston.format((info) => {
      if (info.metadata) {
        // Remove sensitive data (passwords, tokens, etc.)
        const sensitiveFields = [
          "password",
          "token",
          "authorization",
          "cookie",
        ];
        this.sanitizeObject(info.metadata, sensitiveFields);
      }
      return info;
    })();
  }

  /**
   * Recursively sanitize sensitive fields in objects
   */
  private sanitizeObject(obj: any, sensitiveFields: string[]): void {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        this.sanitizeObject(obj[key], sensitiveFields);
      } else if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = "[REDACTED]";
      }
    }
  }

  /**
   * Configure log transports with rotation and compression
   */
  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (config.isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }

    // File transports with rotation
    const fileTransportOptions: DailyRotateFile.DailyRotateFileTransportOptions =
      {
        dirname: LOG_DIR,
        maxSize: "20m",
        maxFiles: "14d",
        format: winston.format.json(),
      };

    // Error logs
    transports.push(
      new DailyRotateFile({
        ...fileTransportOptions,
        level: "error",
      }),
    );
    transports.push(
      new DailyRotateFile({
        ...fileTransportOptions,
      }),
    );

    return transports;
  }

  /**
   * Format log messages with stack traces and metadata
   */
  private formatLogMessage = (
    info: winston.Logform.TransformableInfo,
  ): string => {
    const { timestamp, level, message, metadata, stack } = info;
    const metaStr = Object.keys(metadata).length
      ? `\nMetadata: ${safeStringify(metadata)}`
      : "";
    const stackStr = stack ? `\nStack: ${stack}` : "";

    return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
  };

  /**
   * Handle uncaught exceptions and unhandled rejections
   */
  private handleExceptions(): void {
    this.logger.exceptions.handle(
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: "exceptions-%DATE%.log",
        maxSize: "20m",
        maxFiles: "14d",
      }),
    );

    process.on("unhandledRejection", (error: Error) => {
      this.error("Unhandled Promise Rejection", { error });
    });
  }

  // Public logging methods with type safety and metadata support
  public info(message: string, metadata: object = {}): void {
    this.logger.info(message, { metadata });
  }

  public warn(message: string, metadata: object = {}): void {
    this.logger.warn(message, { metadata });
  }

  public error(message: string, metadata: object = {}): void {
    this.logger.error(message, { metadata });
  }

  public debug(message: string, metadata: object = {}): void {
    this.logger.debug(message, { metadata });
  }

  public http(message: string, metadata: object = {}): void {
    this.logger.http(message, { metadata });
  }

  // Helper method to log request details
  public logRequest(req: any, metadata: object = {}): void {
    this.http("Incoming Request", {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      ...metadata,
    });
  }
}

// Export singleton instance
export const log = Logger.getInstance();
