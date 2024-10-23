import { Application, Request, Response, NextFunction } from "express";
import promClient, { Registry, Histogram, Counter, Gauge } from "prom-client";
import responseTime from "response-time";
import os from "os";
import { rateLimit } from "express-rate-limit";
import basicAuth from "express-basic-auth";

export class Monitoring {
  private register: Registry;
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private httpRequestErrors: Counter<string>;
  private httpRequestSize: Histogram<string>;
  private httpResponseSize: Histogram<string>;
  private activeConnections: Gauge<string>;
  private memoryUsage: Gauge<string>;
  private cpuUsage: Gauge<string>;
  private lastCpuUsage: { user: number; system: number };

  constructor() {
    // Initialize all properties in the constructor
    this.register = new Registry();
    this.lastCpuUsage = process.cpuUsage();

    // Initialize metrics before setting default labels
    this.httpRequestDuration = this.createRequestDurationHistogram();
    this.httpRequestTotal = this.createRequestTotalCounter();
    this.httpRequestErrors = this.createRequestErrorsCounter();
    this.httpRequestSize = this.createRequestSizeHistogram();
    this.httpResponseSize = this.createResponseSizeHistogram();
    this.activeConnections = this.createActiveConnectionsGauge();
    this.memoryUsage = this.createMemoryUsageGauge();
    this.cpuUsage = this.createCpuUsageGauge();

    // Set default labels after initialization
    this.register.setDefaultLabels({
      app: "express-ts-template",
      env: process.env.NODE_ENV || "development",
    });

    // Collect default metrics
    promClient.collectDefaultMetrics({ register: this.register });
  }

  // Split metric creation into separate methods for better organization
  private createRequestDurationHistogram(): Histogram<string> {
    return new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.register],
    });
  }

  private createRequestTotalCounter(): Counter<string> {
    return new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [this.register],
    });
  }

  private createRequestErrorsCounter(): Counter<string> {
    return new Counter({
      name: "http_request_errors_total",
      help: "Total number of HTTP request errors",
      labelNames: ["method", "route", "error_code", "error_message"],
      registers: [this.register],
    });
  }

  private createRequestSizeHistogram(): Histogram<string> {
    return new Histogram({
      name: "http_request_size_bytes",
      help: "Size of HTTP requests in bytes",
      labelNames: ["method", "route"],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register],
    });
  }

  private createResponseSizeHistogram(): Histogram<string> {
    return new Histogram({
      name: "http_response_size_bytes",
      help: "Size of HTTP responses in bytes",
      labelNames: ["method", "route"],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register],
    });
  }

  private createActiveConnectionsGauge(): Gauge<string> {
    return new Gauge({
      name: "http_active_connections",
      help: "Number of active HTTP connections",
      registers: [this.register],
    });
  }

  private createMemoryUsageGauge(): Gauge<string> {
    return new Gauge({
      name: "process_memory_usage_bytes",
      help: "Process memory usage in bytes",
      labelNames: ["type"],
      registers: [this.register],
    });
  }

  private createCpuUsageGauge(): Gauge<string> {
    return new Gauge({
      name: "process_cpu_usage_percentage",
      help: "Process CPU usage percentage",
      labelNames: ["type"],
      registers: [this.register],
    });
  }

  private createMetricsAuth() {
    return basicAuth({
      users: {
        ["admin"]: "admin",
      },
      challenge: true,
      realm: "Prometheus Metrics",
    });
  }

  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: "rss" }, memUsage.rss);
    this.memoryUsage.set({ type: "heapTotal" }, memUsage.heapTotal);
    this.memoryUsage.set({ type: "heapUsed" }, memUsage.heapUsed);
    this.memoryUsage.set({ type: "external" }, memUsage.external);

    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    const userUsagePercent = (currentCpuUsage.user / 1000000) * 100;
    const systemUsagePercent = (currentCpuUsage.system / 1000000) * 100;
    this.cpuUsage.set({ type: "user" }, userUsagePercent);
    this.cpuUsage.set({ type: "system" }, systemUsagePercent);
    this.lastCpuUsage = process.cpuUsage();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.path === "/metrics") {
        next();
        return;
      }

      this.activeConnections.inc();

      if (req.headers["content-length"]) {
        this.httpRequestSize.observe(
          { method: req.method, route: req.route?.path || req.path },
          parseInt(req.headers["content-length"]),
        );
      }

      responseTime((req: Request, res: Response, time: number) => {
        const labels = {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode.toString(),
        };

        this.httpRequestDuration.observe(labels, time / 1000);
        this.httpRequestTotal.inc(labels);

        if (res.getHeader("content-length")) {
          this.httpResponseSize.observe(
            { method: req.method, route: req.route?.path || req.path },
            parseInt(res.getHeader("content-length") as string),
          );
        }

        if (res.statusCode >= 400) {
          this.httpRequestErrors.inc({
            method: req.method,
            route: req.route?.path || req.path,
            error_code: res.statusCode.toString(),
            error_message: res.statusMessage || "Unknown Error",
          });
        }

        this.activeConnections.dec();
      })(req, res, next);

      this.updateSystemMetrics();
    };
  }

  private createMetricsRateLimit() {
    return rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 5,
      message: "Too many requests to metrics endpoint",
    });
  }

  public initEndpoints(app: Application): void {
    app.get(
      "/metrics",
      this.createMetricsAuth(),
      this.createMetricsRateLimit(),
      async (_: Request, res: Response) => {
        try {
          res.set("Content-Type", this.register.contentType);
          res.send(await this.register.metrics());
        } catch (err) {
          console.error("Error generating metrics:", err);
          res.status(500).send("Error generating metrics");
        }
      },
    );

    app.get("/ready", (_: Request, res: Response) => {
      const readiness = {
        status: "OK",
        checks: {
          memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024,
          cpu: os.loadavg()[0] < os.cpus().length,
        },
      };
      res.status(200).json(readiness);
    });
  }
}
