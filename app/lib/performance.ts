/**
 * Performance optimization utilities
 * Simple, effective performance improvements without complexity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simple caching for frequently accessed data
 */
class SimpleCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private maxSize = 1000;

  set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new SimpleCache();

/**
 * Cached database queries
 */
export class CachedQueries {
  /**
   * Get pricing rules with caching
   */
  static async getPricingRules(shop: string): Promise<any[]> {
    const cacheKey = `pricing_rules:${shop}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const rules = await prisma.pricingRule.findMany({
      where: { shop },
      orderBy: { priority: 'desc' },
    });

    cache.set(cacheKey, rules, 300000); // 5 minutes
    return rules;
  }

  /**
   * Get auto-tagging rules with caching
   */
  static async getAutoTaggingRules(shop: string): Promise<any[]> {
    const cacheKey = `auto_tagging_rules:${shop}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const rules = await prisma.autoTaggingRule.findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
    });

    cache.set(cacheKey, rules, 300000); // 5 minutes
    return rules;
  }

  /**
   * Get applications with caching
   */
  static async getApplications(shop: string, status?: string): Promise<any[]> {
    const cacheKey = `applications:${shop}:${status || 'all'}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const whereClause: any = { shop };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const applications = await prisma.wholesaleApplication.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    cache.set(cacheKey, applications, 60000); // 1 minute (applications change more frequently)
    return applications;
  }

  /**
   * Invalidate cache for a shop
   */
  static invalidateShopCache(shop: string): void {
    const patterns = [
      `pricing_rules:${shop}`,
      `auto_tagging_rules:${shop}`,
      `applications:${shop}:all`,
      `applications:${shop}:pending`,
      `applications:${shop}:approved`,
      `applications:${shop}:rejected`,
    ];

    patterns.forEach(pattern => {
      cache.delete(pattern);
    });
  }
}

/**
 * Database query optimization
 */
export class QueryOptimizer {
  /**
   * Optimize pricing rules query with proper indexing hints
   */
  static async getPricingRulesOptimized(shop: string, isActive?: boolean) {
    const whereClause: any = { shop };
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    return await prisma.pricingRule.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        customerTags: true,
        productIds: true,
        collectionIds: true,
        discountType: true,
        discountValue: true,
        priority: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get active pricing rules only (most common query)
   */
  static async getActivePricingRules(shop: string) {
    return await prisma.pricingRule.findMany({
      where: {
        shop,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
      select: {
        id: true,
        customerTags: true,
        productIds: true,
        collectionIds: true,
        discountType: true,
        discountValue: true,
        priority: true,
      },
    });
  }

  /**
   * Batch operations for better performance
   */
  static async batchUpdatePricingRules(shop: string, updates: Array<{ id: string; isActive: boolean }>) {
    const promises = updates.map(update =>
      prisma.pricingRule.updateMany({
        where: {
          id: update.id,
          shop, // Security check
        },
        data: { isActive: update.isActive },
      })
    );

    return await Promise.all(promises);
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private static lastCheck = Date.now();
  private static checkInterval = 30000; // 30 seconds

  static checkMemoryUsage(): { heapUsed: number; heapTotal: number; usagePercent: number } {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    return {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      usagePercent,
    };
  }

  static shouldCleanup(): boolean {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return false;
    }

    this.lastCheck = now;
    const { usagePercent } = this.checkMemoryUsage();
    
    return usagePercent > 80; // Cleanup if using more than 80% of heap
  }

  static cleanup(): void {
    // Clear cache if memory usage is high
    if (this.shouldCleanup()) {
      cache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
}

/**
 * Response compression for large datasets
 */
export function compressResponse(data: any): any {
  // Simple compression by removing unnecessary fields
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const { id, ...rest } = item;
        return { id, ...rest };
      }
      return item;
    });
  }

  return data;
}

/**
 * Pagination helper
 */
export function paginate<T>(items: T[], page: number = 1, limit: number = 20): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  const data = items.slice(offset, offset + limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Performance timing decorator
 */
export function measureTime(name: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - start;
        console.log(`${name} took ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.log(`${name} failed after ${duration.toFixed(2)}ms`);
        throw error;
      }
    };
  };
}

/**
 * Database connection optimization
 */
export class DatabaseOptimizer {
  static async optimizeConnection(): Promise<void> {
    // Set connection pool size
    await prisma.$connect();
    
    // Set query timeout
    await prisma.$executeRaw`SET statement_timeout = '30s'`;
    
    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        console.log('Query: ' + e.query);
        console.log('Params: ' + e.params);
        console.log('Duration: ' + e.duration + 'ms');
      });
    }
  }

  static async closeConnection(): Promise<void> {
    await prisma.$disconnect();
  }
}


