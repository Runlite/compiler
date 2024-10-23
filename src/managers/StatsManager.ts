// import {
//   PrismaClient,
//   ApiKey,
//   UsageRecord,
//   HttpMethod,
//   User,
//   SubscriptionPlan,
// } from "@prisma/client";
// import { Redis } from "ioredis";

import { HttpMethod, PrismaClient } from "@prisma/client";
import Redis from "ioredis";

// interface UsageData {
//   count: number;
//   lastRequest: Date;
// }

// export class UsageManager {
//   private prisma: PrismaClient;

//   constructor(private redis: Redis) {
//     this.prisma = new PrismaClient();
//   }

//   async recordRequest(
//     userId:id
//     apiKey: string,
//     endpoint: string,
//     method: HttpMethod,
//     statusCode: number,
//   ): Promise<boolean> {
//     const apiKeyData = await this.getApiKeyData(apiKey);
//     if (!apiKeyData) {
//       return false;
//     }

//     const { id: apiKeyId, rateLimit, userId } = apiKeyData;
//     const key = `usage:${apiKeyId}:${new Date().toISOString().split("T")[0]}`;

//     const pipeline = this.redis.pipeline();
//     pipeline.incr(key);
//     pipeline.expire(key, 86400);

//     const results = await pipeline.exec();
//     const count = results[0][1] as number;

//     if (count > rateLimit) {
//       await this.redis.decr(key);
//       return false;
//     }

//     await this.prisma.usageRecord.create({
//       data: {
//         apiKeyId,
//         endpoint,
//         method,
//         statusCode,
//       },
//     });
//     const withinSubscriptionLimits = await this.checkSubscriptionLimits(userId);
//     if (!withinSubscriptionLimits) {
//       return false;
//     }

//     return true;
//   }

//   private async getApiKeyData(apiKey: string): Promise<ApiKey | null> {
//     const cachedData = await this.redis.get(`apikey:${apiKey}`);
//     if (cachedData) {
//       return JSON.parse(cachedData);
//     }

//     const apiKeyData = await this.prisma.apiKey.findUnique({
//       where: { key: apiKey },
//     });

//     if (apiKeyData) {
//       await this.redis.set(
//         `apikey:${apiKey}`,
//         JSON.stringify(apiKeyData),
//         "EX",
//         3600
//       ); // Cache for 1 hour
//     }

//     return apiKeyData;
//   }

//   private async checkSubscriptionLimits(userId: string): Promise<boolean> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         Subscription: {
//           include: {
//             SubscriptionPlan: true,
//           },
//         },
//       },
//     });

//     if (!user?.Subscription || user.Subscription.length === 0) {
//       return false;
//     }

//     const activeSubscription = user.Subscription.find(
//       (sub) => sub.status === "ACTIVE"
//     );
//     if (!activeSubscription) {
//       return false;
//     }

//     const { maxApiKeys, maxRequestsPerDay } =
//       activeSubscription.SubscriptionPlan;

//     // Check API key limit
//     const apiKeyCount = await this.prisma.apiKey.count({
//       where: { userId: user.id },
//     });

//     if (apiKeyCount > maxApiKeys) {
//       return false;
//     }

//     // Check daily request limit
//     const today = new Date().toISOString().split("T")[0];
//     const dailyRequests = await this.prisma.usageRecord.count({
//       where: {
//         ApiKey: {
//           userId: user.id,
//         },
//         timestamp: {
//           gte: new Date(today),
//         },
//       },
//     });

//     if (dailyRequests > maxRequestsPerDay) {
//       return false;
//     }

//     return true;
//   }

//   async getUsage(apiKeyId: string, date: string): Promise<UsageData> {
//     const key = `usage:${apiKeyId}:${date}`;
//     const count = parseInt((await this.redis.get(key)) || "0");

//     const lastRequest = await this.prisma.usageRecord.findFirst({
//       where: {
//         apiKeyId,
//         timestamp: {
//           gte: new Date(date),
//           lt: new Date(new Date(date).getTime() + 86400000), // Next day
//         },
//       },
//       orderBy: {
//         timestamp: "desc",
//       },
//       select: {
//         timestamp: true,
//       },
//     });

//     return {
//       count,
//       lastRequest: lastRequest?.timestamp || new Date(date),
//     };
//   }

//   async resetUsage(apiKeyId: string, date: string): Promise<void> {
//     const key = `usage:${apiKeyId}:${date}`;
//     await this.redis.del(key);

//     await this.prisma.usageRecord.deleteMany({
//       where: {
//         apiKeyId,
//         timestamp: {
//           gte: new Date(date),
//           lt: new Date(new Date(date).getTime() + 86400000), // Next day
//         },
//       },
//     });
//   }

//   async generateAuditLog(
//     userId: string,
//     action: string,
//     details: any
//   ): Promise<void> {
//     await this.prisma.auditLog.create({
//       data: {
//         userId,
//         action,
//         details,
//       },
//     });
//   }
// }

export class UsageManager {
  private prisma: PrismaClient;
  constructor(private redis: Redis) {
    this.prisma = new PrismaClient();
  }
  async recordRequest(
    userId: string,
    method: HttpMethod,
    endpoint: string,
    statusCode: number,
    apiKeyId: string,
    isCached: boolean,
  ): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    pipeline.incr(apiKeyId);
    pipeline.expire(apiKeyId, 86400);
    const withinSubscriptionLimits = await this.checkSubscriptionLimits(userId);
    console.log(withinSubscriptionLimits);
    await this.prisma.usageRecord.create({
      data: {
        id: userId,
        method,
        isCached,
        apiKeyId,
        endpoint,
        statusCode,
      },
    });
    return true;
  }
  protected async getKeyRequestCount(apiKey: string) {
    return await this.redis.get(apiKey);
  }

  private async checkSubscriptionLimits(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        Subscription: {
          include: {
            SubscriptionPlan: true,
          },
        },
      },
    });

    if (!user?.Subscription || user.Subscription.length === 0) {
      return false;
    }

    const activeSubscription = user.Subscription.find(
      (sub) => sub.status === "ACTIVE",
    );
    if (!activeSubscription) {
      return false;
    }

    const { maxRequestsPerDay } = activeSubscription.SubscriptionPlan;

    const today = new Date().toISOString().split("T")[0];
    const dailyRequests = await this.prisma.usageRecord.count({
      where: {
        ApiKey: {
          userId: user.id,
        },
        timestamp: {
          gte: new Date(today),
        },
      },
    });

    if (dailyRequests > maxRequestsPerDay) {
      return false;
    }

    return true;
  }
}

// const apiKeyCount = await this.prisma.apiKey.count({
//   where: { userId: user.id },
// });

// if (apiKeyCount > maxApiKeys) {
//   return false;
// }
