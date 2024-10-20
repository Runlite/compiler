//  // private initRoutes() {
//   //   this.app.post("/", async (req, res) => {
//   //     const docker = new Docker();
//   //     let container;
//   //     try {
//   //       // Pull the Docker image
//   //       await new Promise((resolve, reject) => {
//   //         docker.pull("node:14", (err: any, stream: any) => {
//   //           if (err) reject(err);
//   //           docker.modem.followProgress(stream, (err, output) => {
//   //             if (err) reject(err);
//   //             resolve(output);
//   //           });
//   //         });
//   //       });
//   //       log.info("Docker image pulled successfully");
//   //       container = await docker.createContainer({
//   //         Image: "node:14",
//   //         name: "test-container",
//   //         WorkingDir: "/code",
//   //         Cmd: ["node", "main.js"],
//   //         Tty: false,
//   //         HostConfig: {
//   //           Memory: 256 * 1024 * 1024, // 256 MB
//   //           NetworkMode: "none", // No external network access
//   //           PidsLimit: 50,
//   //           NanoCpus: 1e8,
//   //           // Binds: ["/c/Users/ajays/code/compyl:/app"], // Adjusted bind path for Windows
//   //         },
//   //         AttachStderr: true,
//   //         AttachStdout: true,
//   //       });
//   //       log.info(`Container created with ID: ${container.id}`);
//   //       const tempPath = path.join("/tmp", "main.js");
//   //       await fs.writeFile(tempPath, "console.log('hello world')");
//   //       await container.putArchive(tempPath, { path: "/code" });
//   //       await fs.unlink(tempPath);
//   //       await container.start();
//   //       log.info("Container started successfully");
//   //       const logStream = await container.logs({
//   //         stdout: true,
//   //         stderr: true,
//   //         follow: true,
//   //       });

//   //       let result = Buffer.alloc(0);

//   //       logStream.on("data", (chunk) => {
//   //         result = Buffer.concat([result, chunk]);
//   //       });

//   //       logStream.on("end", () => {
//   //         const decodedLogs = demuxStream(result);
//   //         log.info(`Container output: ${decodedLogs}`);

//   //         res.json({
//   //           message: "Container execution completed successfully",
//   //           logs: decodedLogs,
//   //         });
//   //       });
//   //       const exitCode = await container.wait();
//   //       log.info(`Container exited with code: ${exitCode.StatusCode}`);
//   //     } catch (error) {
//   //       log.error(`Error: ${(error as Error).message}`);
//   //       console.error(error);
//   //       res.status(500).json({
//   //         error: "Failed to execute container",
//   //         details: (error as Error).message,
//   //       });
//   //     } finally {
//   //       if (container) {
//   //         try {
//   //           const containerInfo = await container.inspect();
//   //           if (containerInfo.State.Running) {
//   //             await container.stop();
//   //           }
//   //           await container.remove();
//   //           log.info("Container stopped and removed");
//   //         } catch (cleanupError) {
//   //           log.error(
//   //             `Error during cleanup: ${(cleanupError as Error).message}`
//   //           );
//   //         }
//   //       }
//   //     }
//   //   });

//   //   this.app.use("/", routes);
//   // }
//   // private initRoutes() {
//   //   this.app.post("/", async (req, res) => {
//   //     const docker = new Docker();
//   //     let container: Docker.Container | null = null;

//   //     try {
//   //       // Check if the image exists locally
//   //       const images = await docker.listImages({
//   //         filters: { reference: ["node:14"] },
//   //       });
//   //       if (images.length === 0) {
//   //         log.info("Image not found, pulling from Docker Hub...");
//   //         // Pull the Docker image if not found
//   //         await new Promise((resolve, reject) => {
//   //           docker.pull("node:14", (err: any, stream: any) => {
//   //             if (err) return reject(err);
//   //             docker.modem.followProgress(stream, (err, output) => {
//   //               if (err) return reject(err);
//   //               resolve(output);
//   //             });
//   //           });
//   //         });
//   //         log.info("Docker image pulled successfully");
//   //       } else {
//   //         log.info("Docker image already exists");
//   //       }

//   //       // Create the Docker container
//   //       container = await docker.createContainer({
//   //         Image: "node:14",
//   //         name: "test-container",
//   //         WorkingDir: "/code",
//   //         Cmd: ["node", "main.js"],
//   //         Tty: false,
//   //         HostConfig: {
//   //           Memory: 256 * 1024 * 1024, // 256 MB
//   //           NetworkMode: "none", // No external network access
//   //           PidsLimit: 50,
//   //           NanoCpus: 1e8, // Limit CPU usage
//   //         },
//   //         AttachStderr: true,
//   //         AttachStdout: true,
//   //       });
//   //       log.info(`Container created with ID: ${container.id}`);

//   //       // Write code to a temporary file
//   //       const tempPath = path.join("/tmp", "main.js");
//   //       const code = "console.log('hello world')";
//   //       await fs.writeFile(tempPath, code);

//   //       // Create a tar archive of the file
//   //       const tarStream = tar.pack("/tmp", {
//   //         entries: ["main.js"], // Include only main.js in the tarball
//   //       });

//   //       // Upload the tar archive to the container
//   //       await container.putArchive(tarStream, { path: "/code" });
//   //       log.info("Code written to container");

//   //       // Remove the temporary file
//   //       await fs.unlink(tempPath);

//   //       // Start the container
//   //       await container.start();
//   //       log.info("Container started successfully");

//   //       // Stream logs in real-time
//   //       const logStream = await container.logs({
//   //         stdout: true,
//   //         stderr: true,
//   //         follow: true,
//   //       });

//   //       let result = Buffer.alloc(0);
//   //       logStream.on("data", (chunk) => {
//   //         result = Buffer.concat([result, chunk]);
//   //       });

//   //       logStream.on("end", () => {
//   //         const decodedLogs = result.toString("utf-8"); // Decode logs
//   //         log.info(`Container output: ${decodedLogs}`);

//   //         res.json({
//   //           message: "Container execution completed successfully",
//   //           logs: decodedLogs,
//   //         });
//   //       });

//   //       // Wait for container to finish execution
//   //       const exitCode = await container.wait();
//   //       log.info(`Container exited with code: ${exitCode.StatusCode}`);
//   //     } catch (error) {
//   //       log.error(`Error: ${(error as Error).message}`);
//   //       res.status(500).json({
//   //         error: "Failed to execute container",
//   //         details: (error as Error).message,
//   //       });
//   //     } finally {
//   //       // Ensure proper cleanup
//   //       if (container) {
//   //         try {
//   //           const containerInfo = await container.inspect();
//   //           if (containerInfo.State.Running) {
//   //             await container.stop();
//   //           }
//   //           await container.remove();
//   //           log.info("Container stopped and removed");
//   //         } catch (cleanupError) {
//   //           log.error(
//   //             `Error during cleanup: ${(cleanupError as Error).message}`
//   //           );
//   //         }
//   //       }
//   //     }
//   //   });

//   //   this.app.use("/", routes);
//   // }















//   this.app.post("/", async (req, res) => {
//     const docker = new Docker();
//     let container: Docker.Container | null = null;

//     try {
//       // Check if the image exists locally
//       const images = await docker.listImages({
//         filters: { reference: ["node:14"] },
//       });
//       if (images.length === 0) {
//         log.info("Image not found, pulling from Docker Hub...");
//         // Pull the Docker image if not found
//         await new Promise((resolve, reject) => {
//           docker.pull("node:14", (err: any, stream: any) => {
//             if (err) return reject(err);
//             docker.modem.followProgress(stream, (err, output) => {
//               if (err) return reject(err);
//               resolve(output);
//             });
//           });
//         });
//         log.info("Docker image pulled successfully");
//       } else {
//         log.info("Docker image already exists");
//       }

//       // Create the Docker container
//       container = await docker.createContainer({
//         Image: "node:14",
//         name: "test-container",
//         WorkingDir: "/code",
//         Cmd: ["node", "main.js"],
//         Tty: false,
//         HostConfig: {
//           Memory: 256 * 1024 * 1024, // 256 MB
//           NetworkMode: "none", // No external network access
//           PidsLimit: 50,
//           NanoCpus: 1e8, // Limit CPU usage
//         },
//         AttachStderr: true,
//         AttachStdout: true,
//       });
//       log.info(`Container created with ID: ${container.id}`);

//       // Get the temporary directory for the current OS
//       const tmpDir = os.tmpdir();
//       const tempPath = path.join(tmpDir, "main.js");
//       const code = "console.log('hello world')";
//       await fs.writeFile(tempPath, code);
//       const tarStream = tar.pack(tmpDir, {
//         entries: ["main.js"],
//       });
//       await container.putArchive(tarStream, { path: "/code" });
//       log.info("Code written to container");

//       // Remove the temporary file
//       await fs.unlink(tempPath);

//       // Start the container
//       await container.start();
//       log.info("Container started successfully");

//       // Stream logs in real-time
//       const logStream = await container.logs({
//         stdout: true,
//         stderr: true,
//         follow: true,
//       });

//       let result = Buffer.alloc(0);
//       logStream.on("data", (chunk) => {
//         result = Buffer.concat([result, chunk]);
//       });

//       logStream.on("end", () => {
//         const decodedLogs = result.toString("utf-8"); // Decode logs
//         log.info(`Container output: ${decodedLogs}`);

//         res.json({
//           message: "Container execution completed successfully",
//           logs: decodedLogs,
//         });
//       });

//       // Wait for container to finish execution
//       const exitCode = await container.wait();
//       log.info(`Container exited with code: ${exitCode.StatusCode}`);
//     } catch (error) {
//       log.error(`Error: ${(error as Error).message}`);
//       res.status(500).json({
//         error: "Failed to execute container",
//         details: (error as Error).message,
//       });
//     } finally {
//       // Ensure proper cleanup
//       if (container) {
//         try {
//           const containerInfo = await container.inspect();
//           if (containerInfo.State.Running) {
//             await container.stop();
//           }
//           await container.remove();
//           log.info("Container stopped and removed");
//         } catch (cleanupError) {
//           log.error(
//             `Error during cleanup: ${(cleanupError as Error).message}`
//           );
//         }
//       }
//     }
//   });