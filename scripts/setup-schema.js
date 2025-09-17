#!/usr/bin/env node

import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Creating database tables...');
    
    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "shop" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "isOnline" BOOLEAN NOT NULL DEFAULT false,
        "scope" TEXT,
        "expires" TIMESTAMP,
        "accessToken" TEXT NOT NULL,
        "userId" BIGINT,
        "firstName" TEXT,
        "lastName" TEXT,
        "email" TEXT,
        "accountOwner" BOOLEAN NOT NULL DEFAULT false,
        "locale" TEXT,
        "collaborator" BOOLEAN,
        "emailVerified" BOOLEAN
      )
    `);
    
    // Create pricing rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PricingRule" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "shop" TEXT NOT NULL,
        "customerTags" JSONB NOT NULL,
        "productIds" JSONB NOT NULL,
        "collectionIds" JSONB NOT NULL,
        "discountType" TEXT NOT NULL,
        "discountValue" DOUBLE PRECISION NOT NULL,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create auto tagging rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AutoTaggingRule" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "shop" TEXT NOT NULL,
        "ruleName" TEXT NOT NULL,
        "criteriaType" TEXT NOT NULL,
        "criteriaValue" DOUBLE PRECISION NOT NULL,
        "targetTag" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create wholesale applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WholesaleApplication" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "shop" TEXT NOT NULL,
        "customerId" TEXT,
        "customerEmail" TEXT NOT NULL,
        "businessName" TEXT,
        "applicationData" JSONB,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "reviewedAt" TIMESTAMP,
        "reviewedBy" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Session_shop_idx" ON "Session"("shop")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "PricingRule_shop_idx" ON "PricingRule"("shop")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "PricingRule_isActive_idx" ON "PricingRule"("isActive")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AutoTaggingRule_shop_idx" ON "AutoTaggingRule"("shop")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AutoTaggingRule_isActive_idx" ON "AutoTaggingRule"("isActive")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "WholesaleApplication_shop_idx" ON "WholesaleApplication"("shop")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "WholesaleApplication_status_idx" ON "WholesaleApplication"("status")
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "WholesaleApplication_customerEmail_idx" ON "WholesaleApplication"("customerEmail")
    `);
    
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const setupDatabase = async () => {
  try {
    console.log('🔍 Setting up database schema...');
    await createTables();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

setupDatabase();
