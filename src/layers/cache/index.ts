import { Redis } from "ioredis";
import { config } from "../../configs";
import crypto from "crypto";
import { log } from "../../services";
import { Payload, Result } from "../../types";
export class CacheLayer {
  public redis: Redis;
  private static readonly expiresIn = 60 * 60 * 2; // 2 hours
  constructor() {
    this.redis = new Redis({
      port: config.redis.port,
      host: config.redis.host,
      password: config.redis.password,
      username: config.redis.username,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    this.errorHandler();
  }
  private errorHandler() {
    this.redis.on("error", (error) => {
      log.error(error.message);
    });
  }
  private async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value, "EX", CacheLayer.expiresIn);
  }
  private async generateCacheKey(syntax: string, lang: string) {
    return crypto.createHash("sha256").update(`${syntax}${lang}`).digest("hex");
  }
  private async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
   async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
   async close(): Promise<void> {
    await this.redis.quit();
  }
  async isCached(payload: Payload) {
    const cacheKey = await this.generateCacheKey(payload.syntax, payload.lang);
    const result = await this.get(cacheKey);
    if (result) {
      return JSON.parse(result);
    }
    return null;
  }
  async cacheResult(request: Payload, result: Result) {
    const cacheKey = await this.generateCacheKey(request.syntax, request.lang);
    await this.set(cacheKey, JSON.stringify(result));
  }
}
