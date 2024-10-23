import { log } from "../services";
import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { config } from "../configs";

interface ReqId extends Request {
  id?: string;
}
export class AppMiddleware {
  public responseTime = (
    _: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const start = process.hrtime();
    res.on("finish", () => {
      if (!res.headersSent) {
        const [seconds, nanoseconds] = process.hrtime(start);
        const responseTime = seconds * 1000 + nanoseconds / 1000000;
        res.setHeader("X-Response-Time", `${responseTime.toFixed(2)}ms`);
      }
    });

    next();
  };
  public requestId = (req: ReqId, res: Response, next: NextFunction): void => {
    try {
      req.id = randomBytes(16).toString("hex");
      res.setHeader("X-Request-ID", req.id);
      next();
    } catch (error) {
      log.error("Error generating request ID", { error });
      next(error);
    }
  };
  public errorHandler(
    err: any,
    req: ReqId,
    res: Response,
    _: NextFunction,
  ): void {
    const errorId = Math.random().toString(36).substring(7);

    log.error("Error handled:", {
      errorId,
      error: err.message,
      stack: err.stack,
      requestId: req.id,
      path: req.path,
      method: req.method,
      processId: process.pid,
    });

    res.status(err.status || 500).json({
      error: {
        message: config.isProduction ? "Internal Server Error" : err.message,
        errorId,
        requestId: req.id,
      },
    });
  }
}
