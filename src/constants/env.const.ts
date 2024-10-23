export const envConfig = {
  development: {
    isDevelopment: true,
    isProduction: false,
    cors: { enabled: true },
    swagger: { enabled: true },
    monitor: { enabled: true },
  },
  production: {
    isDevelopment: false,
    isProduction: true,
    cors: { enabled: true },
    swagger: { enabled: false },
    monitor: { enabled: true },
  },
  test: {
    isDevelopment: true,
    isProduction: false,
    cors: { enabled: false },
    swagger: { enabled: false },
    monitor: { enabled: false },
  },
  staging: {
    isDevelopment: false,
    isProduction: false,
    cors: { enabled: true },
    swagger: { enabled: true },
    monitor: { enabled: true },
  },
} as const;
