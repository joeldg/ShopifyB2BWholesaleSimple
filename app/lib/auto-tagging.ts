import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AutoTaggingCriteria {
  totalSpend?: number;
  orderCount?: number;
  daysSinceFirstOrder?: number;
  averageOrderValue?: number;
}

export interface CustomerData {
  id: string;
  totalSpent: number;
  ordersCount: number;
  firstOrderDate: Date | null;
  averageOrderValue: number;
  tags: string[];
}

/**
 * Auto-tagging service for applying customer tags based on behavior
 * Keeps it simple with clear, reliable criteria
 */
export class AutoTaggingService {
  /**
   * Process a customer against all active auto-tagging rules
   */
  static async processCustomer(
    shop: string,
    customerData: CustomerData
  ): Promise<string[]> {
    const rules = await prisma.autoTaggingRule.findMany({
      where: {
        shop,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc', // Process in creation order
      },
    });

    const appliedTags: string[] = [];

    for (const rule of rules) {
      if (await this.evaluateRule(rule, customerData)) {
        // Only apply if customer doesn't already have this tag
        if (!customerData.tags.includes(rule.targetTag)) {
          appliedTags.push(rule.targetTag);
        }
      }
    }

    return appliedTags;
  }

  /**
   * Evaluate a single rule against customer data
   */
  private static async evaluateRule(
    rule: any,
    customerData: CustomerData
  ): Promise<boolean> {
    switch (rule.criteriaType) {
      case 'total_spend':
        return customerData.totalSpent >= rule.criteriaValue;
      
      case 'order_count':
        return customerData.ordersCount >= rule.criteriaValue;
      
      case 'days_since_first_order':
        if (!customerData.firstOrderDate) return false;
        const daysSinceFirstOrder = Math.floor(
          (Date.now() - customerData.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceFirstOrder >= rule.criteriaValue;
      
      case 'average_order_value':
        return customerData.averageOrderValue >= rule.criteriaValue;
      
      default:
        console.warn(`Unknown criteria type: ${rule.criteriaType}`);
        return false;
    }
  }

  /**
   * Get customer data from Shopify (simplified version)
   * In production, this would fetch from Shopify Admin API
   */
  static async getCustomerData(
    shop: string,
    customerId: string
  ): Promise<CustomerData | null> {
    // This is a simplified version - in production you'd fetch from Shopify
    // For now, return mock data for testing
    return {
      id: customerId,
      totalSpent: 1500, // Mock data
      ordersCount: 8,
      firstOrderDate: new Date('2024-01-01'),
      averageOrderValue: 187.5,
      tags: ['customer'], // Mock existing tags
    };
  }

  /**
   * Apply tags to a customer in Shopify
   * In production, this would use Shopify Admin API
   */
  static async applyTagsToCustomer(
    shop: string,
    customerId: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      // In production, this would call Shopify Admin API
      console.log(`Applying tags ${tags.join(', ')} to customer ${customerId} in shop ${shop}`);
      
      // For now, just log the action
      // In production: await shopify.admin.rest.Customer.update(customerId, { tags: tags });
      
      return true;
    } catch (error) {
      console.error('Failed to apply tags to customer:', error);
      return false;
    }
  }

  /**
   * Process all customers for a shop (batch operation)
   * This would be called by a webhook or scheduled job
   */
  static async processAllCustomers(shop: string): Promise<void> {
    try {
      // In production, this would:
      // 1. Fetch all customers from Shopify
      // 2. Process each customer
      // 3. Apply tags in batches
      
      console.log(`Processing auto-tagging for all customers in shop: ${shop}`);
      
      // For now, just log the action
      // In production: await this.batchProcessCustomers(shop);
      
    } catch (error) {
      console.error('Failed to process all customers:', error);
    }
  }

  /**
   * Create a new auto-tagging rule with validation
   */
  static async createRule(
    shop: string,
    ruleData: {
      ruleName: string;
      criteriaType: string;
      criteriaValue: number;
      targetTag: string;
    }
  ) {
    // Validate criteria value
    if (ruleData.criteriaValue < 0) {
      throw new Error('Criteria value must be positive');
    }

    // Validate criteria type
    const validCriteriaTypes = [
      'total_spend',
      'order_count', 
      'days_since_first_order',
      'average_order_value'
    ];
    
    if (!validCriteriaTypes.includes(ruleData.criteriaType)) {
      throw new Error('Invalid criteria type');
    }

    // Validate target tag
    if (!ruleData.targetTag || ruleData.targetTag.trim().length === 0) {
      throw new Error('Target tag is required');
    }

    return await prisma.autoTaggingRule.create({
      data: {
        shop,
        ruleName: ruleData.ruleName.trim(),
        criteriaType: ruleData.criteriaType,
        criteriaValue: ruleData.criteriaValue,
        targetTag: ruleData.targetTag.trim().toLowerCase(),
        isActive: true,
      },
    });
  }

  /**
   * Get human-readable description of a rule
   */
  static getRuleDescription(rule: any): string {
    const criteriaValue = rule.criteriaValue;
    
    switch (rule.criteriaType) {
      case 'total_spend':
        return `Total spend ≥ $${criteriaValue.toLocaleString()}`;
      case 'order_count':
        return `Order count ≥ ${criteriaValue}`;
      case 'days_since_first_order':
        return `Customer for ≥ ${criteriaValue} days`;
      case 'average_order_value':
        return `Average order value ≥ $${criteriaValue.toLocaleString()}`;
      default:
        return 'Unknown criteria';
    }
  }
}


