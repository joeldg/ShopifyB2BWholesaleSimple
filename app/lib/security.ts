/**
 * Security utilities for the B2B/Wholesale Simplifier
 * Simple, effective security measures without over-engineering
 */

import { AppError, ErrorCodes } from './error-handling';

/**
 * Rate limiting for API endpoints
 * Simple in-memory rate limiter (in production, use Redis)
 */
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier);
    return record ? record.resetTime : Date.now() + this.windowMs;
  }
}

// Global rate limiters for different endpoints
export const rateLimiters = {
  api: new SimpleRateLimiter(60000, 100), // 100 requests per minute
  auth: new SimpleRateLimiter(300000, 10), // 10 requests per 5 minutes
  webhook: new SimpleRateLimiter(60000, 1000), // 1000 requests per minute
};

/**
 * Rate limiting middleware
 */
export function createRateLimit(limiter: SimpleRateLimiter) {
  return (identifier: string) => {
    if (!limiter.isAllowed(identifier)) {
      throw new AppError(
        'Rate limit exceeded. Please try again later.',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        429
      );
    }
  };
}

/**
 * Validate shop domain format
 */
export function validateShopDomain(shop: string): string {
  if (!shop || typeof shop !== 'string') {
    throw new AppError('Shop domain is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Remove protocol if present
  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Validate format: shopname.myshopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$/;
  
  if (!shopRegex.test(cleanShop)) {
    throw new AppError('Invalid shop domain format', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return cleanShop;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize customer ID
 */
export function validateCustomerId(customerId: any): string {
  const id = sanitizeInput(customerId);
  
  if (!id) {
    throw new AppError('Customer ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Shopify customer IDs are numeric strings
  if (!/^\d+$/.test(id)) {
    throw new AppError('Invalid customer ID format', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return id;
}

/**
 * Validate and sanitize rule ID
 */
export function validateRuleId(ruleId: any): string {
  const id = sanitizeInput(ruleId);
  
  if (!id) {
    throw new AppError('Rule ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Our rule IDs are CUIDs (alphanumeric with hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new AppError('Invalid rule ID format', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return id;
}

/**
 * Check if user has permission to access shop data
 */
export function validateShopAccess(userShop: string, requestedShop: string): void {
  if (userShop !== requestedShop) {
    throw new AppError(
      'Access denied: You can only access your own shop data',
      ErrorCodes.VALIDATION_ERROR,
      403
    );
  }
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data (simple hash for non-cryptographic purposes)
 */
export function simpleHash(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Validate request origin (basic CSRF protection)
 */
export function validateRequestOrigin(request: Request, allowedOrigins: string[]): void {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) {
    // Allow requests without origin (e.g., direct API calls)
    return;
  }

  const requestOrigin = origin || new URL(referer!).origin;
  
  if (!allowedOrigins.includes(requestOrigin)) {
    throw new AppError(
      'Request origin not allowed',
      ErrorCodes.VALIDATION_ERROR,
      403
    );
  }
}

/**
 * Audit logging for sensitive operations
 */
export class AuditLogger {
  private static logs: Array<{
    timestamp: Date;
    action: string;
    shop: string;
    userId?: string;
    details: any;
  }> = [];

  static log(action: string, shop: string, details: any, userId?: string): void {
    this.logs.push({
      timestamp: new Date(),
      action,
      shop,
      userId,
      details,
    });

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // In production, you'd send this to a proper logging service
    console.log('AUDIT:', {
      timestamp: new Date().toISOString(),
      action,
      shop,
      userId,
      details,
    });
  }

  static getLogs(shop?: string): any[] {
    if (shop) {
      return this.logs.filter(log => log.shop === shop);
    }
    return [...this.logs];
  }
}

/**
 * Input validation for form data
 */
export function validateFormData(formData: FormData, requiredFields: string[]): Record<string, string> {
  const data: Record<string, string> = {};
  const errors: string[] = [];

  for (const field of requiredFields) {
    const value = formData.get(field);
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${field} is required`);
    } else {
      data[field] = sanitizeInput(value);
    }
  }

  if (errors.length > 0) {
    throw new AppError(
      `Validation failed: ${errors.join(', ')}`,
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  return data;
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize input and check for suspicious patterns
 */
export function sanitizeAndValidateInput(input: any): string {
  const sanitized = sanitizeInput(input);
  
  if (detectSuspiciousInput(sanitized)) {
    throw new AppError(
      'Input contains potentially malicious content',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  return sanitized;
}


