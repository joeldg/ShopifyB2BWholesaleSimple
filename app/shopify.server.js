import "@shopify/shopify-app-remix/adapters/node";
import {
  LATEST_API_VERSION,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { PgSessionStorage } from "./session-storage.server";

// Try to use PostgreSQL session storage, fallback to memory if it fails
console.log('🔍 Attempting to use PostgreSQL session storage...');

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || ["read_products", "write_products", "read_customers", "write_customers", "read_orders", "write_orders"],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: (() => {
    try {
      return new PgSessionStorage();
    } catch (error) {
      console.error('❌ Failed to create PostgreSQL session storage, falling back to memory storage:', error);
      return new MemorySessionStorage();
    }
  })(),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
