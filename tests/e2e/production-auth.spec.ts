import { test, expect } from '@playwright/test';

test.describe('Production App Authentication', () => {
  test('should handle OAuth flow correctly', async ({ page }) => {
    // Test the root URL redirect
    await page.goto('https://b2b-wholesale-simplifier.fly.dev/');
    
    // Should show the login form or redirect
    await expect(page).toHaveURL(/.*b2b-wholesale-simplifier\.fly\.dev.*/);
    
    // Check if we get a proper response (not 401)
    const response = await page.goto('https://b2b-wholesale-simplifier.fly.dev/');
    expect(response?.status()).not.toBe(401);
    
    // Test with shop parameter - should redirect to login first
    await page.goto('https://b2b-wholesale-simplifier.fly.dev/?shop=test-store.myshopify.com');
    
    // Should redirect to /auth/login (correct Shopify behavior)
    await expect(page).toHaveURL(/.*\/auth\/login.*/);
    
    // Check that we get a proper login page (not 401)
    const loginResponse = await page.goto('https://b2b-wholesale-simplifier.fly.dev/auth/login?shop=test-store.myshopify.com');
    expect(loginResponse?.status()).not.toBe(401);
  });

  test('should return proper error for invalid requests', async ({ page }) => {
    // Test direct access to /app without shop parameter
    const response = await page.goto('https://b2b-wholesale-simplifier.fly.dev/app');
    
    // Should either redirect or show proper error (not 401)
    expect(response?.status()).not.toBe(401);
  });

  test('should have working health endpoint', async ({ page }) => {
    const response = await page.goto('https://b2b-wholesale-simplifier.fly.dev/api/health');
    
    expect(response?.status()).toBe(200);
    
    const body = await response?.json();
    expect(body.status).toBe('healthy');
  });

  test('should handle Shopify admin iframe requests', async ({ page }) => {
    // Simulate a request from Shopify admin with embedded parameters
    const shopifyUrl = 'https://b2b-wholesale-simplifier.fly.dev/app?embedded=1&hmac=test&host=test&shop=test-store.myshopify.com';
    
    const response = await page.goto(shopifyUrl);
    
    // Should not return 401 - this is the main issue we're debugging
    console.log('Response status:', response?.status());
    console.log('Response headers:', await response?.allHeaders());
    
    // The response might redirect to login, which is expected
    // Let's check that we get a proper response (not 401)
    expect(response?.status()).not.toBe(401);
    
    // Should either redirect to login or show the app
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    // Should be either login page or app page
    expect(currentUrl).toMatch(/.*\/(auth\/login|app).*/);
  });
});
