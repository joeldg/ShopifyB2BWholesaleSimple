import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRemixStub } from '@remix-run/testing';
import { json } from '@remix-run/node';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock Prisma
const mockPrisma = {
  pricingRule: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Import after mocking
import { loader, action } from '../../app/routes/api.pricing-rules';

// Mock Shopify authentication
vi.mock('../../app/shopify.server', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: { shop: 'test-shop.myshopify.com' },
    }),
  },
}));

describe('Pricing Rules API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up the mock to return our mockPrisma
    const { PrismaClient } = require('@prisma/client');
    (PrismaClient as any).mockReturnValue(mockPrisma);
  });

  describe('GET /api/pricing-rules', () => {
    it('returns all pricing rules for a shop', async () => {
      const mockRules = [
        {
          id: '1',
          shop: 'test-shop.myshopify.com',
          customerTags: ['wholesale'],
          productIds: [],
          collectionIds: [],
          discountType: 'percentage',
          discountValue: 10,
          priority: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.pricingRule.findMany.mockResolvedValue(mockRules);

      const request = new Request('http://localhost/api/pricing-rules');
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pricingRules).toHaveLength(1);
      expect(data.pricingRules[0].customerTags).toEqual(['wholesale']);
    });

    it('returns empty array when no rules exist', async () => {
      mockPrisma.pricingRule.findMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/pricing-rules');
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pricingRules).toEqual([]);
    });
  });

  describe('POST /api/pricing-rules', () => {
    it('creates a new pricing rule', async () => {
      const newRule = {
        customerTags: ['wholesale'],
        productIds: [],
        collectionIds: [],
        discountType: 'percentage',
        discountValue: 15,
        priority: 1,
        isActive: true,
      };

      const createdRule = {
        id: '2',
        shop: 'test-shop.myshopify.com',
        ...newRule,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricingRule.create.mockResolvedValue(createdRule);

      const request = new Request('http://localhost/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.pricingRule.id).toBe('2');
      expect(data.pricingRule.discountValue).toBe(15);
    });

    it('validates required fields', async () => {
      const invalidRule = {
        customerTags: [],
        discountType: 'percentage',
        discountValue: 15,
      };

      const request = new Request('http://localhost/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRule),
      });

      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Customer tags are required');
    });
  });

  describe('PUT /api/pricing-rules/:id', () => {
    it('updates an existing pricing rule', async () => {
      const updatedRule = {
        customerTags: ['wholesale', 'vip'],
        discountValue: 20,
      };

      const existingRule = {
        id: '1',
        shop: 'test-shop.myshopify.com',
        customerTags: ['wholesale'],
        productIds: [],
        collectionIds: [],
        discountType: 'percentage',
        discountValue: 10,
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricingRule.findUnique.mockResolvedValue(existingRule);
      mockPrisma.pricingRule.update.mockResolvedValue({
        ...existingRule,
        ...updatedRule,
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/pricing-rules/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule),
      });

      const response = await action({ request, params: { id: '1' }, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pricingRule.discountValue).toBe(20);
      expect(data.pricingRule.customerTags).toEqual(['wholesale', 'vip']);
    });

    it('returns 404 when rule not found', async () => {
      mockPrisma.pricingRule.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/pricing-rules/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountValue: 20 }),
      });

      const response = await action({ request, params: { id: '999' }, context: {} });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Pricing rule not found');
    });
  });

  describe('DELETE /api/pricing-rules/:id', () => {
    it('deletes an existing pricing rule', async () => {
      const existingRule = {
        id: '1',
        shop: 'test-shop.myshopify.com',
        customerTags: ['wholesale'],
        productIds: [],
        collectionIds: [],
        discountType: 'percentage',
        discountValue: 10,
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.pricingRule.findUnique.mockResolvedValue(existingRule);
      mockPrisma.pricingRule.delete.mockResolvedValue(existingRule);

      const request = new Request('http://localhost/api/pricing-rules/1', {
        method: 'DELETE',
      });

      const response = await action({ request, params: { id: '1' }, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Pricing rule deleted successfully');
    });

    it('returns 404 when rule not found', async () => {
      mockPrisma.pricingRule.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost/api/pricing-rules/999', {
        method: 'DELETE',
      });

      const response = await action({ request, params: { id: '999' }, context: {} });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Pricing rule not found');
    });
  });
});
