import "dotenv/config";

class Config {
  private static requiredEnvVars = [
    "PORT",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "NODE_ENV",
  ];

  static validateEnv() {
    const missingVars = this.requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }

  static getBaseConfig() {
    return {
      port: parseInt(this.getEnvVariable("PORT"), 10),
      redis: {
        host: this.getEnvVariable("REDIS_HOST"),
        port: parseInt(this.getEnvVariable("REDIS_PORT"), 10),
        password: this.getEnvVariable("REDIS_PASSWORD"),
        username: this.getEnvVariable("REDIS_USERNAME"),
      },
      secretKey: this.getEnvVariable("ENCRYPTION_KEY"),
      node_env: this.getEnvVariable("NODE_ENV"),
    };
  }
  static getEnvVariable(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || defaultValue!;
  }
}

Config.validateEnv();

// Export the base configuration object
export const config = Config.getBaseConfig();
