/**
 * Simple, robust error handling utilities
 * Keeps error handling consistent without over-engineering
 */

export interface AppError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Common error types for consistent handling
 */
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  RULE_NOT_FOUND: 'RULE_NOT_FOUND',
  DUPLICATE_RULE: 'DUPLICATE_RULE',
  INVALID_DISCOUNT_VALUE: 'INVALID_DISCOUNT_VALUE',
  
  // External service errors
  SHOPIFY_API_ERROR: 'SHOPIFY_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Create standardized error responses
 */
export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
  };
}

/**
 * Handle common validation errors
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new AppError(
      `${fieldName} is required`,
      ErrorCodes.MISSING_REQUIRED_FIELD,
      400
    );
  }
}

export function validateDiscountValue(value: number, type: 'percentage' | 'fixed'): void {
  if (type === 'percentage') {
    if (value < 0 || value > 100) {
      throw new AppError(
        'Percentage discount must be between 0 and 100',
        ErrorCodes.INVALID_DISCOUNT_VALUE,
        400
      );
    }
  } else {
    if (value < 0) {
      throw new AppError(
        'Fixed discount must be positive',
        ErrorCodes.INVALID_DISCOUNT_VALUE,
        400
      );
    }
  }
}

export function validateCustomerTags(tags: string[]): void {
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new AppError(
      'At least one customer tag is required',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }
  
  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.trim().length === 0) {
      throw new AppError(
        'Customer tags must be non-empty strings',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }
}

/**
 * Retry logic for external API calls
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (error instanceof AppError && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON, using fallback:', error);
    return fallback;
  }
}

/**
 * Log errors with context
 */
export function logError(error: Error, context?: any): void {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle async route errors consistently
 */
export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    logError(error);
    return createErrorResponse(error);
  }
  
  // Unknown error
  const appError = new AppError(
    'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR,
    500
  );
  
  logError(appError, { originalError: error });
  return createErrorResponse(appError);
}


