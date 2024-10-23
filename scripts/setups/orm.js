const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const { exec } = require("child_process");
const { Select, Input, Password } = require("enquirer");
const ProgressIndicator = require("../utils/Indicator");
const Logger = require("../utils/Logger");
const {
  migrationContent,
  entityContent,
  subscriberContent,
} = require("../static");
const CONFIG = {
  FOLDERS: {
    ENTITY: "src/entity",
    MIGRATION: "src/migration",
    SUBSCRIBER: "src/subscriber",
  },
};

class CommandExecutor {
  static async execute(commands, errorMessage, showOutput = false) {
    const commandStr = Array.isArray(commands)
      ? `yarn add ${commands.join(" ")}`
      : commands;
    const progress = new ProgressIndicator(`Executing: ${commandStr}`).start();
    let output = "";

    try {
      output = await new Promise((resolve, reject) => {
        exec(
          commandStr,
          { stdio: showOutput ? "inherit" : "pipe" },
          (error, stdout, stderr) => {
            if (error) {
              return reject({ error, stdout, stderr });
            }
            resolve(stdout);
          }
        );
      });

      progress.stop(true, `Successfully executed: ${commandStr}`);
      return output;
    } catch ({ error, stdout, stderr }) {
      progress.stop(false, errorMessage);
      if (!showOutput) {
        console.error(chalk.red(`\nError output:\n${stderr || stdout}`));
      }
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  }
}

// Optimized file operations with parallel processing
class FileOperations {
  static async createDirectories() {
    const progress = new ProgressIndicator(
      "Creating project directories"
    ).start();
    try {
      await Promise.all(
        Object.values(CONFIG.FOLDERS).map((folder) =>
          fs.mkdir(folder, { recursive: true })
        )
      );
      progress.stop(true, "Project directories created successfully");
    } catch (error) {
      progress.stop(false, "Failed to create directories");
      throw error;
    }
  }

  static async writeConfig(filePath, content, options = {}) {
    const { createBackup = true } = options;
    const progress = new ProgressIndicator(
      `Writing config to ${filePath}`
    ).start();

    try {
      // Create backup if file exists and backup option is enabled
      if (createBackup) {
        try {
          const exists = await fs
            .access(filePath)
            .then(() => true)
            .catch(() => false);
          if (exists) {
            const backupPath = `${filePath}.backup-${Date.now()}`;
            await fs.copyFile(filePath, backupPath);
            Logger.info(`Created backup at: ${backupPath}`);
          }
        } catch (err) {
          Logger.warn(`Failed to create backup for ${filePath}`);
        }
      }

      await fs.writeFile(filePath, content.trim());
      progress.stop(true, `Successfully wrote config to ${filePath}`);
    } catch (error) {
      progress.stop(false, `Failed to write config to ${filePath}`);
      throw error;
    }
  }
}

// Optimized Prisma setup
class PrismaSetup {
  static async configure() {
    Logger.info("Configuring Prisma...");

    try {
      const dbconfig = await this.getDatabaseConfig();
      // Install all dependencies in one command
      await CommandExecutor.execute(
        ["-D prisma", "@prisma/client"],
        "Failed to install dependencies"
      );

      await Promise.all([
        await CommandExecutor.execute("npx prisma init"),
        this.generateSchema(dbconfig),
      ]);

      await Promise.all([this.updatePackageJson()]);

      Logger.success("Prisma setup completed!");
    } catch (error) {
      Logger.error("Prisma setup failed", error);
      throw error;
    }
  }
  static async getDatabaseConfig() {
    const dbType = await new Select({
      name: "database",
      message: "Database type:",
      choices: [
        "cockroachdb",
        "mongodb",
        "mysql",
        "postgresql",
        "sqlite",
        "sqlserver",
      ],
    }).run();
    return dbType;
  }

  static async generateSchema(provider) {
    const schema = `
datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Post {
  id        String   @id @default(uuid())
  title     String   @db.VarChar(100)
  content   String
  published Boolean  @default(false)
  authorId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;

    await FileOperations.writeConfig("prisma/schema.prisma", schema);
  }

  static async updatePackageJson() {
    const scripts = {
      "prisma:studio": "prisma studio",
      "prisma:generate": "prisma generate",
      "prisma:migrate:dev": "prisma migrate dev",
      "prisma:migrate:reset": "prisma migrate reset",
      "prisma:db:seed": "ts-node prisma/seed.ts",
      "prisma:format": "prisma format",
    };
    await writePackageJson({ ...scripts });
  }
}
async function writePackageJson(updates) {
  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"));
  } catch (error) {
    console.error(chalk.red("Error reading package.json"));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  Object.assign(packageJson.scripts, updates);
  await fs.writeFile("./package.json", JSON.stringify(packageJson, null, 2));
}

// Optimized TypeORM setup
class TypeORMSetup {
  static async configure() {
    Logger.info("Configuring TypeORM...");

    try {
      const dbConfig = await this.getDatabaseConfig();
      await Promise.all([
        CommandExecutor.execute(
          [
            "typeorm",
            "reflect-metadata",
            "class-validator",
            "class-transformer",
            dbConfig.driver,
          ],
          "Failed to install dependencies"
        ),
        this.setupConfig(dbConfig),
        FileOperations.createDirectories(),
        FileOperations.writeConfig(
          `${CONFIG.FOLDERS.ENTITY}/Post.ts`,
          entityContent
        ),
        FileOperations.writeConfig(
          `${CONFIG.FOLDERS.MIGRATION}/InitialMigration.ts`,
          migrationContent
        ),
        FileOperations.writeConfig(
          `${CONFIG.FOLDERS.SUBSCRIBER}/PostSubscriber.ts`,
          subscriberContent
        ),
      ]);

      await this.updatePackageJson();
      Logger.success("TypeORM setup completed!");
    } catch (error) {
      Logger.error("TypeORM setup failed", error);
      throw error;
    }
  }

  static async getDatabaseConfig() {
    const dbType = await new Select({
      name: "database",
      message: "Database type:",
      choices: ["PostgreSQL", "MySQL", "SQLite"],
    }).run();

    const driver =
      dbType === "PostgreSQL"
        ? "pg"
        : dbType === "MySQL"
          ? "mysql2"
          : "sqlite3";

    return {
      type: dbType.toLowerCase(),
      driver,
      host: "localhost",
      port: dbType === "PostgreSQL" ? 5432 : 3306,
      database: dbType === "SQLite" ? "database.sqlite" : undefined,
    };
  }

  static async setupConfig(dbConfig) {
    const config = `
import { DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const config: DataSourceOptions = {
    type: "${dbConfig.type}",
    host: "${dbConfig.host}",
    port: ${dbConfig.port},
    database: "${dbConfig.database || process.env.DB_NAME}",
    synchronize: false,
    logging: true,
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"]
};

export default config;`;

    await FileOperations.writeConfig(
      path.join("src", "data-source.ts"),
      config
    );
  }
  static async updatePackageJson() {
    const scripts = {
      "migration:generate":
        "npm run typeorm migration:generate -- -d src/data-source.ts",
      "migration:run": "npm run typeorm migration:run -- -d src/data-source.ts",
      "migration:revert":
        "npm run typeorm migration:revert -- -d src/data-source.ts",
      "schema:drop": "npm run typeorm schema:drop -- -d src/data-source.ts",
      "schema:sync": "npm run typeorm schema:sync -- -d src/data-source.ts",
    };
    await writePackageJson({ ...scripts });
  }
}
async function main() {
  try {
    clear();
    console.log(
      chalk.yellow(figlet.textSync("ORM Setup", { horizontalLayout: "full" }))
    );

    const orm = await new Select({
      name: "orm",
      message: "Select ORM:",
      choices: ["Prisma", "TypeORM"],
    }).run();

    await (orm === "Prisma" ? PrismaSetup : TypeORMSetup).configure();

    Logger.success("Setup complete! 🚀");
    Logger.info("Next steps:");
    Logger.info("1. Check package.json for available scripts");
    Logger.info("2. Update database configuration");
    Logger.info("3. Run migrations and start coding!");
  } catch (error) {
    Logger.error("Setup failed", error);
    process.exit(1);
  }
}

main();
