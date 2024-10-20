import { Application } from "express";
import promClient from "prom-client";

export function initMonitoring(app: Application) {
  promClient.collectDefaultMetrics();
  const httpReqDurationMicroSeconds = new promClient.Histogram({
    name: "http_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["methods", "route", "code"],
    buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500],
  });
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      httpReqDurationMicroSeconds
        .labels(
          req.method,
          req.route?.path || req.path,
          res.statusCode.toString()
        )
        .observe(duration);
    });
    next();
  });
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
}
