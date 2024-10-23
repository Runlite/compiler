import Bull, { Queue, JobOptions, Job, JobCounts, JobStatusClean } from "bull";
import { log } from "../../services";
import { config } from "../../configs";
import { Payload, Result } from "../../types";

export class QueueLayer {
  private queue: Queue<Payload>;
  constructor(name: string) {
    this.queue = new Bull<Payload>(name, this.getRedisConfig());
    this.setupEventListeners();
    // this.cleanAllQueueData();
    // this.cleanQueue();
  }
  private setupEventListeners(): void {
    this.queue.on("failed", this.onJobFailed.bind(this));
    this.queue.on("completed", this.onJobCompleted.bind(this));
    this.queue.on("progress", this.onJobProgress.bind(this));
  }
  private getRedisConfig(): Bull.QueueOptions {
    return {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        username: config.redis.username,
      },
    };
  }
  startProcessing(
    processor: (job: Job<Payload>) => Promise<Result>,
    concurrency: number = 1,
  ) {
    this.queue.process(concurrency, async (job) => {
      try {

        await job.progress(10);
        const result = await processor(job);
        await job.progress(100);
        return result;
      } catch (error) {
        this.handleError((error as Error).message, error);
        return Promise.reject(error); 
      }
    });
  }
  async addTask(task: Payload, options?: JobOptions) {
    try {
      const job = await this.queue.add(task, options);
      log.info(`Task added to queue with ID: ${job.id}`);
      return job;
    } catch (error) {
      this.handleError((error as Error).message, error);
      throw error;
    }
  }
  async waitforCompletion(jobId: Bull.JobId): Promise<Result> {
    return new Promise((resolve, reject) => {
      this.queue
        .getJob(jobId)
        .then((job) => {
          if (!job) {
            reject(new Error(`Job ${jobId} not found`));
            return;
          }
          const checkJobStatus = async () => {
            const status: Bull.JobStatus | "stuck" = await job.getState();
            switch (status) {
              case "completed":
                const result = await job.finished();
                resolve(result);
                job.remove();
                break;
              case "failed":
                reject(new Error(`Job ${jobId} failed: ${job.failedReason}`));
                job.remove();
                break;
              default:
                setTimeout(checkJobStatus, 1000);
                break;
            }
          };
          checkJobStatus();
        })
        .catch(reject);
    });
  }
  async getJobCounts(): Promise<JobCounts> {
    try {
      return await this.queue.getJobCounts();
    } catch (error) {
      this.handleError("Failed to get job counts", error);
      throw error;
    }
  }
  private async onJobFailed(job: Job<Payload>, err: Error): Promise<void> {
    log.error(`Failed job ${job.id}: ${err.message}`);
    try {
      await job.remove();
      log.info(`Job Failed and Delete from queue ${job.id}`);
    } catch (error) {
      this.handleError(`Failed to delete completed job ${job.id}`, error);
    }
  }

  private async onJobCompleted(job: Job<Payload>, result: any): Promise<void> {
    log.info(`Completed job ${job.id}: ${JSON.stringify(result)}`);
  }

  private onJobProgress(job: Job<Payload>, progress: number): void {
    log.info(`Job ${job.id} progress: ${progress}%`);
  }
  async cleanQueue(
    grace: number = 1000,
    limit: number = 1000,
    status?: JobStatusClean,
  ): Promise<Job<Payload>[]> {
    try {
      const cleaned = await this.queue.clean(grace, status, limit);
      log.info(`Queue cleaned successfully. Removed ${cleaned.length} jobs.`);
      return cleaned;
    } catch (error) {
      this.handleError("Failed to clean queue", error);
      throw error;
    }
  }
  protected async cleanAllQueueData(): Promise<void> {
    try {
      log.info("Starting to clean all queue data...");

      await this.queue.empty();
      await this.queue.clean(0, "failed");
      await this.queue.clean(0, "completed");
      await this.queue.clean(0, "delayed");
      await this.queue.clean(0, "active");
      await this.queue.clean(0, "wait");
      await this.queue.obliterate({ force: true });

      log.info("All queue data has been cleaned successfully.");
    } catch (error) {
      this.handleError("Failed to clean all queue data", error);
      throw error;
    }
  }

  private handleError(message: string, error: unknown): void {
    log.error(`${message}: ${(error as Error).message}`);
  }
}
