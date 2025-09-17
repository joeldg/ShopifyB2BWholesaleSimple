/**
 * Server-side environment variable validation
 * Ensures all required environment variables are present
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().url(),
  DATABASE_URL: z.string().url(),
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_SCOPES: z.string().default('read_products,write_products,read_customers,write_customers,read_orders,write_orders'),
  SESSION_SECRET: z.string().min(32),
  // Optional environment variables
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Helper functions for common environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database configuration
export const databaseConfig = {
  url: env.DATABASE_URL,
  // Connection pool settings for production
  ...(isProduction && {
    connectionLimit: 10,
    acquireTimeoutMillis: 30000,
    timeout: 30000,
  }),
};

// Shopify configuration
export const shopifyConfig = {
  apiKey: env.SHOPIFY_API_KEY,
  apiSecret: env.SHOPIFY_API_SECRET,
  scopes: env.SHOPIFY_SCOPES.split(','),
  host: env.HOST,
  isEmbeddedApp: true,
  apiVersion: '2024-01',
};

// Session configuration
export const sessionConfig = {
  secret: env.SESSION_SECRET,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: isProduction,
  httpOnly: true,
  sameSite: 'lax' as const,
};

// Redis configuration (if available)
export const redisConfig = env.REDIS_URL ? {
  url: env.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
} : null;

// Monitoring configuration
export const monitoringConfig = {
  sentryDsn: env.SENTRY_DSN,
  analyticsKey: env.ANALYTICS_API_KEY,
  enableMetrics: isProduction,
};

// Email configuration (if available)
export const emailConfig = env.SMTP_HOST ? {
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587'),
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  secure: false, // true for 465, false for other ports
} : null;

// Validate environment on startup
export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    return false;
  }
}

// Export a function to get environment-specific settings
export function getEnvironmentSettings() {
  return {
    isDevelopment,
    isProduction,
    isTest,
    database: databaseConfig,
    shopify: shopifyConfig,
    session: sessionConfig,
    redis: redisConfig,
    monitoring: monitoringConfig,
    email: emailConfig,
  };
}


