import "@shopify/shopify-app-remix/adapters/node";
import {
  LATEST_API_VERSION,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Debug: Test database connection
console.log('🔍 Testing database connection...');
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    return prisma.session.findMany({ take: 1 });
  })
  .then((sessions) => {
    console.log('📊 Current sessions in database:', sessions.length);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || ["read_products", "write_products", "read_customers", "write_customers", "read_orders", "write_orders"],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma, {
    onError: (error) => {
      console.error('❌ Session storage error:', error);
    },
  }),
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
