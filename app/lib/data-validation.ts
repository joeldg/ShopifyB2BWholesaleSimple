/**
 * Data validation utilities for safety and integrity
 * Simple, reliable validation without over-engineering
 */

import { AppError, ErrorCodes } from './error-handling';

/**
 * Sanitize string input to prevent XSS and other issues
 */
export function sanitizeString(input: any): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize customer tags
 */
export function validateAndSanitizeCustomerTags(tags: any): string[] {
  if (!Array.isArray(tags)) {
    throw new AppError('Customer tags must be an array', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (tags.length === 0) {
    throw new AppError('At least one customer tag is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (tags.length > 10) {
    throw new AppError('Maximum 10 customer tags allowed', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const sanitizedTags = tags
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0)
    .map(tag => tag.toLowerCase());

  // Remove duplicates
  const uniqueTags = [...new Set(sanitizedTags)];

  if (uniqueTags.length === 0) {
    throw new AppError('No valid customer tags provided', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return uniqueTags;
}

/**
 * Validate and sanitize product/collection IDs
 */
export function validateAndSanitizeIds(ids: any, maxCount: number = 100): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  if (ids.length > maxCount) {
    throw new AppError(`Maximum ${maxCount} IDs allowed`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  const sanitizedIds = ids
    .map(id => sanitizeString(id))
    .filter(id => id.length > 0 && /^[a-zA-Z0-9]+$/.test(id)); // Only alphanumeric

  return sanitizedIds;
}

/**
 * Validate discount values
 */
export function validateDiscountValue(value: any, type: 'percentage' | 'fixed'): number {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    throw new AppError('Discount value must be a number', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (type === 'percentage') {
    if (numValue < 0 || numValue > 100) {
      throw new AppError('Percentage discount must be between 0 and 100', ErrorCodes.VALIDATION_ERROR, 400);
    }
  } else {
    if (numValue < 0) {
      throw new AppError('Fixed discount must be positive', ErrorCodes.VALIDATION_ERROR, 400);
    }
    
    if (numValue > 10000) {
      throw new AppError('Fixed discount cannot exceed $10,000', ErrorCodes.VALIDATION_ERROR, 400);
    }
  }

  return Math.round(numValue * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate priority values
 */
export function validatePriority(priority: any): number {
  const numPriority = parseInt(priority);
  
  if (isNaN(numPriority)) {
    throw new AppError('Priority must be a number', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (numPriority < 0 || numPriority > 1000) {
    throw new AppError('Priority must be between 0 and 1000', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return numPriority;
}

/**
 * Validate email addresses
 */
export function validateEmail(email: any): string {
  const emailStr = sanitizeString(email);
  
  if (!emailStr) {
    throw new AppError('Email is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) {
    throw new AppError('Invalid email format', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (emailStr.length > 254) {
    throw new AppError('Email is too long', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return emailStr.toLowerCase();
}

/**
 * Validate business name
 */
export function validateBusinessName(name: any): string {
  const nameStr = sanitizeString(name);
  
  if (!nameStr) {
    throw new AppError('Business name is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (nameStr.length < 2) {
    throw new AppError('Business name must be at least 2 characters', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (nameStr.length > 100) {
    throw new AppError('Business name is too long', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return nameStr;
}

/**
 * Validate rule names
 */
export function validateRuleName(name: any): string {
  const nameStr = sanitizeString(name);
  
  if (!nameStr) {
    throw new AppError('Rule name is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (nameStr.length < 2) {
    throw new AppError('Rule name must be at least 2 characters', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (nameStr.length > 50) {
    throw new AppError('Rule name is too long', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return nameStr;
}

/**
 * Validate criteria values for auto-tagging
 */
export function validateCriteriaValue(value: any, type: string): number {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    throw new AppError('Criteria value must be a number', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (numValue < 0) {
    throw new AppError('Criteria value must be positive', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Set reasonable limits based on criteria type
  switch (type) {
    case 'total_spend':
      if (numValue > 1000000) {
        throw new AppError('Total spend threshold cannot exceed $1,000,000', ErrorCodes.VALIDATION_ERROR, 400);
      }
      break;
    case 'order_count':
      if (numValue > 10000) {
        throw new AppError('Order count threshold cannot exceed 10,000', ErrorCodes.VALIDATION_ERROR, 400);
      }
      break;
    case 'days_since_first_order':
      if (numValue > 3650) { // 10 years
        throw new AppError('Days threshold cannot exceed 3,650', ErrorCodes.VALIDATION_ERROR, 400);
      }
      break;
    case 'average_order_value':
      if (numValue > 100000) {
        throw new AppError('Average order value threshold cannot exceed $100,000', ErrorCodes.VALIDATION_ERROR, 400);
      }
      break;
  }

  return Math.round(numValue * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate target tags
 */
export function validateTargetTag(tag: any): string {
  const tagStr = sanitizeString(tag);
  
  if (!tagStr) {
    throw new AppError('Target tag is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (tagStr.length < 2) {
    throw new AppError('Target tag must be at least 2 characters', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (tagStr.length > 30) {
    throw new AppError('Target tag is too long', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(tagStr)) {
    throw new AppError('Target tag can only contain letters, numbers, hyphens, and underscores', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return tagStr.toLowerCase();
}

/**
 * Validate JSON data structure
 */
export function validateJsonData(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new AppError('Invalid JSON data', ErrorCodes.VALIDATION_ERROR, 400);
    }
  }

  if (typeof data !== 'object' || data === null) {
    throw new AppError('Data must be an object', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return data;
}

/**
 * Check for duplicate rules
 */
export async function checkForDuplicateRule(
  prisma: any,
  shop: string,
  ruleData: any,
  excludeId?: string
): Promise<void> {
  const existingRule = await prisma.pricingRule.findFirst({
    where: {
      shop,
      customerTags: ruleData.customerTags,
      productIds: ruleData.productIds,
      collectionIds: ruleData.collectionIds,
      discountType: ruleData.discountType,
      discountValue: ruleData.discountValue,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  if (existingRule) {
    throw new AppError(
      'A pricing rule with these exact settings already exists',
      ErrorCodes.DUPLICATE_RULE,
      400
    );
  }
}


