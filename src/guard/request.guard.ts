import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { log, Crypto } from "../services";
export class RequestGuard {
  private prisma: PrismaClient;
  private crypto: Crypto;
  constructor() {
    this.prisma = new PrismaClient();
    this.crypto = new Crypto();
  }
  validateRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers["authorization"];
      if (!header) {
        res.status(401).json({ error: "Authorization header is missing" });
        return;
      }
      const [scheme, key] = header.split(" ");
      if (scheme !== "Bearer" || !key) {
        res.status(401).json({
          error: "Invalid authorization header format",
          format: "Bearer API_KEY",
          recevied: header,
        });
        return;
      }
      const hashkey = await this.crypto.hashApiKey(key);
      const apikey = await this.prisma.apiKey.findUnique({
        where: { key: hashkey },
      });

      if (!apikey) {
        res.status(404).json({ error: `API Key is Invalid ${key}` });
        return;
      }
      next();
    } catch (error) {
      log.error(`Middleware Error --> ${(error as Error).message}`);
      res
        .status(500)
        .json({ error: "Internal server error during authentication" });
    }
  };
}
