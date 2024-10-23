import Docker from "dockerode";
import { log } from "../../services";
import { Result, ExecutionStatus, ResourceUsage } from "../../types";

export class Sandbox {
  constructor(private container: Docker.Container) {}

  async execute(): Promise<Result> {
    const startTime = process.hrtime.bigint();
    let status = ExecutionStatus.Accepted;
    let resourceUsage: ResourceUsage = {
      memory: { peak: 0, average: 0 },
      cpu: { peak: 0, average: 0 },
    };
    let errorMessage = "";
    let exitCode: number | null = null;
    let stdout = "";
    let stderr = "";
    let signal: NodeJS.Signals | null = null;
    let stats;
    try {
      await this.container.start();
      const [containerStats, logs, exitInfo] = await Promise.all([
        this.trackDetailedContainerStats(),
        this.getContainerLogs(),
        this.container.wait(),
      ]);
      log.info(`Container exited with code: ${exitInfo.StatusCode}`);
      const { name, id, ...remainstats }: any = containerStats;
      stats = remainstats;
      exitCode = exitInfo.StatusCode;
      stdout = logs.stdout;
      stderr = logs.stderr;
      signal = (exitInfo.Signal as NodeJS.Signals) || null;

      if (exitCode === 137 || signal === "SIGKILL") {
        status = ExecutionStatus.TimeLimitExceeded;
      } else if (exitCode !== 0) {
        status = ExecutionStatus.RuntimeError;
      }
    } catch (error) {
      log.error(`Error executing code: ${error}`);
      errorMessage = (error as Error).message;
      status = ExecutionStatus.InternalError;
    } finally {
      await this.cleanupContainer();
    }

    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1e6;

    return {
      status,
      stdout,
      stderr,
      error: errorMessage,
      executionTime,
      resourceUsage,
      exitCode,
      signal,
      killedBySystem: exitCode === 137 || signal === "SIGKILL",
      metrics: {
        compilationTime: 0,
        totalTime: executionTime,
      },
      stats,
    };
  }

  private async getContainerLogs(): Promise<{
    stdout: string;
    stderr: string;
  }> {
    if (!this.container) {
      throw new Error("Container not created");
    }

    const [stdout, stderr] = await Promise.all([
      this.getStream(true),
      this.getStream(false),
    ]);

    return { stdout, stderr };
  }

  private async getStream(isStdout: boolean): Promise<string> {
    const logStream = await this.container.logs({
      stdout: isStdout,
      stderr: !isStdout,
      follow: true,
    });

    return new Promise((resolve) => {
      let output = "";
      logStream.on("data", (chunk) => {
        output += this.demuxStream(chunk);
      });
      logStream.on("end", () => resolve(output));
    });
  }

  private async trackDetailedContainerStats(): Promise<Docker.ContainerStats> {
    const stream = await this.container.stats({ stream: false });
    return stream;
  }
  private async cleanupContainer(): Promise<void> {
    if (this.container) {
      try {
        const containerInfo = await this.container.inspect();
        if (containerInfo.State.Running) {
          await this.container.stop();
        }
        await this.container.remove({ force: true });
        log.info("Container stopped and removed");
      } catch (cleanupError) {
        log.error(`Error during cleanup: ${(cleanupError as Error).message}`);
      }
    }
  }

  private demuxStream(buffer: Buffer): string {
    const headerSize = 8;
    let result = "";

    for (let i = 0; i < buffer.length; ) {
      const header = buffer.slice(i, i + headerSize);
      const type = header[0];
      const payloadSize = header.readUInt32BE(4);
      const payload = buffer.slice(
        i + headerSize,
        i + headerSize + payloadSize,
      );

      if (type === 1 || type === 2) {
        result += payload.toString("utf8");
      }

      i += headerSize + payloadSize;
    }

    return result;
  }
}
