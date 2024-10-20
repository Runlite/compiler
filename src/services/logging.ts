import winston from "winston";
import { config } from "../config";

class Logger {
  private logger: winston.Logger;
  constructor() {
    this.logger = winston.createLogger({
      level: this.getLoglevel(config.node_env),
      format: this.getLogFormat(),
      transports: this.getTransports(config.node_env === "development"),
    });
    this.logger.info(`Logger initialized in ${config.node_env} mode`);
  }
  private getLoglevel(env: string): string {
    switch (env) {
      case "development":
        return "debug";
      case "production":
        return "info";
      default:
        return "info";
    }
  }
  private getLogFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.colorize(),
      winston.format.errors(),
      winston.format.json(),
      winston.format.splat(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    );
  }
  private getTransports(env: boolean): winston.transport[] {
    const transport: winston.transport[] = [
      new winston.transports.File({ filename: "error.log", level: "error" }),
      new winston.transports.File({ filename: "combined.log" }),
    ];
    if (env || config.node_env==='development') {
      transport.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(this.formatLogMessage)
          ),
        })
      );
    }
    return transport;
  }
  private formatLogMessage = (
    info: winston.Logform.TransformableInfo
  ): string => {
    const { timestamp, level, message, stack } = info;
    return `${timestamp} [${level}]: ${message}${stack ? "\n" + stack : ""}`;
  };
  info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, ...meta: any[]): void {
    this.logger.error(message, ...meta);
  }

  debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }

  verbose(message: string, ...meta: any[]): void {
    this.logger.verbose(message, ...meta);
  }
}

export const log = new Logger();
