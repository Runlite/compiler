import path from "path";
import dotenv from "dotenv";

export const loadEnvFile = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  const defaultEnvPath = path.resolve(process.cwd(), ".env");
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    const defaultResult = dotenv.config({ path: defaultEnvPath });
    if (defaultResult.error) {
      throw new Error("No .env file found");
    }
  }
};
