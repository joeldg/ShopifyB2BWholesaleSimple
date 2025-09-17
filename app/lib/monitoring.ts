/**
 * Simple monitoring and observability utilities
 * Provides basic insights without complex infrastructure
 */

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: Date;
}

class SimpleMetrics {
  private metrics: MetricData[] = [];
  private maxMetrics = 1000; // Keep only recent metrics

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, limit: number = 100): MetricData[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit);
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string, timeWindowMs: number = 3600000): number {
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentMetrics = this.metrics.filter(
      m => m.name === name && m.timestamp > cutoff
    );

    if (recentMetrics.length === 0) return 0;

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }

  /**
   * Get all metrics (for debugging)
   */
  getAllMetrics(): MetricData[] {
    return [...this.metrics];
  }
}

// Global metrics instance
export const metrics = new SimpleMetrics();

/**
 * Performance monitoring decorator
 */
export function measurePerformance(name: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        metrics.record(`${name}.duration`, duration);
        metrics.record(`${name}.success`, 1);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        metrics.record(`${name}.duration`, duration);
        metrics.record(`${name}.error`, 1);
        throw error;
      }
    };
  };
}

/**
 * Simple health check system
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  /**
   * Register a health check
   */
  register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthCheck> {
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
        if (!results[name]) {
          allHealthy = false;
        }
      } catch (error) {
        console.error(`Health check ${name} failed:`, error);
        results[name] = false;
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks: results,
      timestamp: new Date(),
    };
  }
}

// Global health checker
export const healthChecker = new HealthChecker();

/**
 * Register common health checks
 */
export function registerCommonHealthChecks() {
  // Database health check
  healthChecker.register('database', async () => {
    try {
      // const { PrismaClient } = await import('@prisma/client'); // Removed - using memory storage
      // const prisma = new PrismaClient(); // Removed - using memory storage
      // await prisma.$queryRaw`SELECT 1`;
      // await prisma.$disconnect();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  });

  // Memory usage check
  healthChecker.register('memory', async () => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    
    // Consider unhealthy if using more than 80% of heap
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    return heapUsagePercent < 80;
  });
}

/**
 * Simple logging with levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, context?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  error(message: string, context?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context || '');
    }
  }
}

export const logger = new Logger();

/**
 * Request timing middleware
 */
export function trackRequestTiming() {
  return async (request: Request, next: () => Promise<Response>) => {
    const start = Date.now();
    const url = new URL(request.url);
    
    try {
      const response = await next();
      const duration = Date.now() - start;
      
      metrics.record('request.duration', duration, {
        method: request.method,
        path: url.pathname,
        status: response.status.toString(),
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      metrics.record('request.duration', duration, {
        method: request.method,
        path: url.pathname,
        status: '500',
      });
      
      metrics.record('request.error', 1, {
        method: request.method,
        path: url.pathname,
      });
      
      throw error;
    }
  };
}


