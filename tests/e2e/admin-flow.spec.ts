import { test, expect } from '@playwright/test';

test.describe('B2B Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the authentication and data
    await page.route('**/api/pricing-rules', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pricingRules: [
            {
              id: '1',
              customerTags: ['wholesale'],
              productIds: [],
              collectionIds: [],
              discountType: 'percentage',
              discountValue: 10,
              priority: 1,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });
    });

    await page.route('**/api/auto-tagging', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          autoTaggingRules: [
            {
              id: '1',
              ruleName: 'High Value Customer',
              criteriaType: 'total_spend',
              criteriaValue: 1000,
              targetTag: 'wholesale',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });
    });

    await page.route('**/api/applications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [
            {
              id: '1',
              customerEmail: 'test@example.com',
              businessName: 'Test Business',
              status: 'pending',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      });
    });
  });

  test('should navigate through all admin pages', async ({ page }) => {
    // Navigate to the app
    await page.goto('/app');

    // Check dashboard
    await expect(page.getByText('B2B/Wholesale Simplifier')).toBeVisible();
    await expect(page.getByText('Welcome to your B2B/Wholesale management dashboard')).toBeVisible();

    // Navigate to Pricing Rules
    await page.click('text=Pricing Rules');
    await expect(page.getByText('Pricing Rules')).toBeVisible();
    await expect(page.getByText('Manage customer tag-based discounts')).toBeVisible();
    await expect(page.getByText('wholesale')).toBeVisible();
    await expect(page.getByText('10%')).toBeVisible();

    // Navigate to Auto-Tagging
    await page.click('text=Auto-Tagging');
    await expect(page.getByText('Auto-Tagging Rules')).toBeVisible();
    await expect(page.getByText('Automatically tag customers based on their behavior')).toBeVisible();
    await expect(page.getByText('High Value Customer')).toBeVisible();

    // Navigate to Applications
    await page.click('text=Applications');
    await expect(page.getByText('Wholesale Applications')).toBeVisible();
    await expect(page.getByText('Review and manage wholesale applications')).toBeVisible();
    await expect(page.getByText('Test Business')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should create a new pricing rule', async ({ page }) => {
    await page.goto('/app/pricing-rules');

    // Mock the create API
    await page.route('**/api/pricing-rules', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            pricingRule: {
              id: '2',
              customerTags: ['vip'],
              productIds: [],
              collectionIds: [],
              discountType: 'percentage',
              discountValue: 15,
              priority: 1,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          }),
        });
      } else {
        // Return existing rules for GET
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pricingRules: [
              {
                id: '1',
                customerTags: ['wholesale'],
                productIds: [],
                collectionIds: [],
                discountType: 'percentage',
                discountValue: 10,
                priority: 1,
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
          }),
        });
      }
    });

    // Click create new rule button
    await page.click('text=Create New Rule');

    // Fill out the form (assuming a modal or form appears)
    // Note: This would need to be updated based on the actual form implementation
    await page.fill('input[name="customerTags"]', 'vip');
    await page.selectOption('select[name="discountType"]', 'percentage');
    await page.fill('input[name="discountValue"]', '15');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify the new rule appears
    await expect(page.getByText('vip')).toBeVisible();
    await expect(page.getByText('15%')).toBeVisible();
  });

  test('should approve a wholesale application', async ({ page }) => {
    await page.goto('/app/applications');

    // Mock the approve API
    await page.route('**/api/applications/*/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Application approved successfully',
        }),
      });
    });

    // Click approve button
    await page.click('text=Approve');

    // Verify success message or status change
    await expect(page.getByText('Application approved successfully')).toBeVisible();
  });

  test('should filter applications by status', async ({ page }) => {
    await page.goto('/app/applications');

    // Click on different status tabs
    await page.click('text=Pending');
    await expect(page.getByText('Test Business')).toBeVisible();

    await page.click('text=Approved');
    // Should show empty state or different applications

    await page.click('text=All');
    await expect(page.getByText('Test Business')).toBeVisible();
  });
});


