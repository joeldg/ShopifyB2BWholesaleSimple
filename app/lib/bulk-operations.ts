import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Bulk operations for better merchant experience
 * Simple, reliable bulk actions without complexity
 */
export class BulkOperationsService {
  /**
   * Enable/disable multiple pricing rules at once
   */
  static async togglePricingRules(
    shop: string,
    ruleIds: string[],
    isActive: boolean
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const ruleId of ruleIds) {
      try {
        await prisma.pricingRule.updateMany({
          where: {
            id: ruleId,
            shop: shop, // Security: ensure rule belongs to shop
          },
          data: { isActive },
        });
        successCount++;
      } catch (error) {
        errors.push(`Failed to update rule ${ruleId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  }

  /**
   * Enable/disable multiple auto-tagging rules at once
   */
  static async toggleAutoTaggingRules(
    shop: string,
    ruleIds: string[],
    isActive: boolean
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const ruleId of ruleIds) {
      try {
        await prisma.autoTaggingRule.updateMany({
          where: {
            id: ruleId,
            shop: shop, // Security: ensure rule belongs to shop
          },
          data: { isActive },
        });
        successCount++;
      } catch (error) {
        errors.push(`Failed to update rule ${ruleId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  }

  /**
   * Delete multiple pricing rules at once
   */
  static async deletePricingRules(
    shop: string,
    ruleIds: string[]
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const ruleId of ruleIds) {
      try {
        await prisma.pricingRule.deleteMany({
          where: {
            id: ruleId,
            shop: shop, // Security: ensure rule belongs to shop
          },
        });
        successCount++;
      } catch (error) {
        errors.push(`Failed to delete rule ${ruleId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  }

  /**
   * Delete multiple auto-tagging rules at once
   */
  static async deleteAutoTaggingRules(
    shop: string,
    ruleIds: string[]
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const ruleId of ruleIds) {
      try {
        await prisma.autoTaggingRule.deleteMany({
          where: {
            id: ruleId,
            shop: shop, // Security: ensure rule belongs to shop
          },
        });
        successCount++;
      } catch (error) {
        errors.push(`Failed to delete rule ${ruleId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  }

  /**
   * Duplicate a pricing rule
   */
  static async duplicatePricingRule(
    shop: string,
    ruleId: string
  ): Promise<{ success: boolean; rule?: any; error?: string }> {
    try {
      const originalRule = await prisma.pricingRule.findFirst({
        where: {
          id: ruleId,
          shop: shop, // Security: ensure rule belongs to shop
        },
      });

      if (!originalRule) {
        return { success: false, error: 'Rule not found' };
      }

      const duplicatedRule = await prisma.pricingRule.create({
        data: {
          shop: originalRule.shop,
          customerTags: originalRule.customerTags,
          productIds: originalRule.productIds,
          collectionIds: originalRule.collectionIds,
          discountType: originalRule.discountType,
          discountValue: originalRule.discountValue,
          priority: originalRule.priority,
          isActive: false, // Start as inactive for safety
        },
      });

      return { success: true, rule: duplicatedRule };
    } catch (error) {
      return { success: false, error: `Failed to duplicate rule: ${error}` };
    }
  }

  /**
   * Duplicate an auto-tagging rule
   */
  static async duplicateAutoTaggingRule(
    shop: string,
    ruleId: string
  ): Promise<{ success: boolean; rule?: any; error?: string }> {
    try {
      const originalRule = await prisma.autoTaggingRule.findFirst({
        where: {
          id: ruleId,
          shop: shop, // Security: ensure rule belongs to shop
        },
      });

      if (!originalRule) {
        return { success: false, error: 'Rule not found' };
      }

      const duplicatedRule = await prisma.autoTaggingRule.create({
        data: {
          shop: originalRule.shop,
          ruleName: `${originalRule.ruleName} (Copy)`,
          criteriaType: originalRule.criteriaType,
          criteriaValue: originalRule.criteriaValue,
          targetTag: originalRule.targetTag,
          isActive: false, // Start as inactive for safety
        },
      });

      return { success: true, rule: duplicatedRule };
    } catch (error) {
      return { success: false, error: `Failed to duplicate rule: ${error}` };
    }
  }

  /**
   * Archive multiple applications (soft delete)
   */
  static async archiveApplications(
    shop: string,
    applicationIds: string[]
  ): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const applicationId of applicationIds) {
      try {
        await prisma.wholesaleApplication.updateMany({
          where: {
            id: applicationId,
            shop: shop, // Security: ensure application belongs to shop
          },
          data: {
            status: 'archived',
            reviewedAt: new Date(),
          },
        });
        successCount++;
      } catch (error) {
        errors.push(`Failed to archive application ${applicationId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  }
}


