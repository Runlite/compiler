import express, { Application, Request } from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import { log } from "./services/logging";
import http from "http";
import { config } from "./config";
import { routes } from "./manager/route.manager";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cluster from "cluster";
import os from "os";
import { Extension } from "./types";
import { initMonitoring } from "./services/monitoring";

export class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.initMiddleware();
    this.initRoutes();
    this.initErrorHandling();
  }

  private initMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.set("trust proxy", true);
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "1mb" }));
    this.app.use(
      morgan("combined", {
        stream: { write: (message) => log.info(message.trim()) },
      })
    );

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      keyGenerator: (req: Request) => req.ip as string,
    });
    this.app.use(limiter);
    initMonitoring(this.app);
  }

  private initRoutes() {
    this.app.use("/", routes);
  }

  private initErrorHandling() {
    this.app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        log.error((err as Error).stack as string);
        res.status(500).send("Something broke!");
      }
    );
  }

  public shutdown(server: http.Server) {
    log.info("Server shutting down...");
    server.close((err) => {
      if (err) log.error((err as Error).message);
      log.info("Server stopped");
      process.exit(0);
    });
    setTimeout(() => {
      log.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  }

  public run() {
    const server = this.app.listen(config.port, () => {
      log.info(`Worker ${process.pid} running on port ${config.port}`);
    });

    process.on("SIGTERM", () => this.shutdown(server));
    process.on("SIGINT", () => this.shutdown(server));
    process.on("uncaughtException", (error) => {
      log.error("Uncaught Exception:", error);
      this.shutdown(server);
    });
    process.on("unhandledRejection", (reason, promise) => {
      log.error("Unhandled Rejection at:", promise, "reason:", reason);
      this.shutdown(server);
    });
  }
}

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    log.info(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  (async () => {
    try {
      const server = new Server();
      server.run();
    } catch (error) {
      log.error((error as Error).message);
      process.exit(1);
    }
  })();
}
