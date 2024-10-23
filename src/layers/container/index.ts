import fs from "fs/promises";
import path from "path";
import { log } from "../../services";
import { v4 as uuidv4 } from "uuid";
import { Extension, Payload } from "../../types";
import Docker from "dockerode";
import { Language } from "../../types";
import os from "os";
import tar from "tar-fs";
import { containerConfig } from "../../constants";
interface ContainerConfig {
  image: string;
  cmd: (file: string, output?: string) => string[];
}

export class Containerizer {
  private readonly docker: Docker;
  private readonly CODE_DIR: string = "/code";
  private readonly TEMP_DIR: string = os.tmpdir();
  constructor() {
    // const dockerHost = "/var/run/docker.sock";
    const dockerHost = "tcp://localhost:2375";
    try {
      if (dockerHost.startsWith("tcp://")) {
        const url = new URL(dockerHost);
        this.docker = new Docker({
          host: url.hostname,
          port: parseInt(url.port),
        });
      } else {
        this.docker = new Docker({
          socketPath: dockerHost,
        });
      }

      log.info(`Initialized Docker connection with: ${dockerHost}`);
    } catch (error) {
      log.error(
        `Failed to initialize Docker connection: ${(error as Error).message}`,
      );
      throw error;
    }
    this.docker.ping((err, data) => {
      if (err) {
        log.error("Failed to connect to Docker:", err);
      } else {
        log.info("Successfully connected to Docker:", data);
      }
    });
  }
  async start(payload: Payload) {
    const { lang, syntax } = payload;
    const config = containerConfig[lang];
    let container: Docker.Container | null = null;

    try {
      await this.pullImage(config.image);
      const { file, output } = await this.prepareFile(lang, syntax);
      container = await this.createContainer(config, file, output);
      await this.writeCodeToContainer(container, file, syntax);
      return container;
    } catch (error) {
      await this.cleanupContainer(container);
      throw error;
    }
  }
  private async prepareFile(
    lang: Language,
    syntax: string,
  ): Promise<{ file: string; output?: string }> {
    const fileId = uuidv4();
    const extension = Extension[lang];
    let file = `${fileId}.${extension}`;
    let output: string | undefined;
    output = fileId;
    if (lang === "java") {
      const classNameRegex = /public\s+class\s+(\w+)/;
      const match = syntax.match(classNameRegex);
      if (match && match[1]) {
        output = match[1];
        file = `${output}.${extension}`;
      }
    }
    return { file, output };
  }
  private async createContainer(
    config: ContainerConfig,
    file: string,
    output?: string,
  ): Promise<Docker.Container> {
    const containerConfig = await this.createContainerConfig(
      config.image,
      config.cmd(file, output),
    );
    return this.docker.createContainer(containerConfig);
  }
  private async createContainerConfig(
    Image: string,
    Cmd: string[],
  ): Promise<Docker.ContainerCreateOptions> {
    return {
      Image,
      Cmd,
      HostConfig: {
        Memory: 256 * 1024 * 1024,
        CpuQuota: 100000,
        NetworkMode: "bridge",
      },
      WorkingDir: this.CODE_DIR,
      name: `sandbox-${uuidv4()}`,
      Tty: false,
      AttachStderr: true,
      AttachStdout: true,
      ExposedPorts: {
        "8000/tcp": {},
      },
    };
  }
  private async writeCodeToContainer(
    container: Docker.Container,
    file: string,
    syntax: string,
  ): Promise<void> {
    const tempPath = path.join(this.TEMP_DIR, file);
    try {
      await fs.writeFile(tempPath, syntax);
      log.info(`File written successfully at: ${tempPath}`);

      const tarStream = tar.pack(this.TEMP_DIR, { entries: [file] });
      await container.putArchive(tarStream, { path: this.CODE_DIR });
      log.info("Code written to container");
    } finally {
      await fs
        .unlink(tempPath)
        .catch((error) => log.error(`Error deleting temp file: ${error}`));
    }
  }

  async pullImage(image: string) {
    const images = await this.docker.listImages({
      filters: { reference: [image] },
    });
    if (images.length === 0) {
      log.info("Image not found, start pulling from docker hub...");
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: any, stream: any) => {
          if (err) reject(err);
          this.docker.modem.followProgress(stream, (err, output) => {
            if (err) reject(err);
            resolve(output);
          });
        });
      });
    } else {
      log.info("Image found, use it directly...");
    }
  }

  private async cleanupContainer(
    container: Docker.Container | null,
  ): Promise<void> {
    if (container) {
      await container
        .stop()
        .catch((error) => log.error(`Error stopping container: ${error}`));
      await container
        .remove()
        .catch((error) => log.error(`Error removing container: ${error}`));
    }
  }

  async cleanup(filePath: string, compiledPath?: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      log.info(`File deleted: ${filePath}`);
      if (compiledPath) {
        await fs.unlink(compiledPath);
        log.info(`Compiled file deleted: ${compiledPath}`);
      }
    } catch (err) {
      log.error(`Cleanup error: ${(err as Error).message}`);
    }
  }
}
