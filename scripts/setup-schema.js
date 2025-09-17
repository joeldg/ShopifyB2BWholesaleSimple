#!/usr/bin/env node
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  try {
    console.log('🔍 Setting up database schema...');
    
    const client = await pool.connect();
    
    try {
      // Create Session table for Shopify session storage
      await client.query(`
        CREATE TABLE IF NOT EXISTS "Session" (
          "id" VARCHAR(255) PRIMARY KEY,
          "shop" VARCHAR(255) NOT NULL,
          "state" VARCHAR(255) NOT NULL,
          "isOnline" BOOLEAN NOT NULL DEFAULT false,
          "scope" TEXT,
          "expires" TIMESTAMP WITH TIME ZONE,
          "accessToken" VARCHAR(255),
          "userId" VARCHAR(255),
          "firstName" VARCHAR(255),
          "lastName" VARCHAR(255),
          "email" VARCHAR(255),
          "accountOwner" BOOLEAN DEFAULT false,
          "locale" VARCHAR(10),
          "collaborator" BOOLEAN DEFAULT false,
          "emailVerified" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Session table created successfully');
      
    } finally {
      client.release();
    }
    
    console.log('✅ Database setup completed');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('⚠️  Falling back to memory session storage');
  } finally {
    await pool.end();
  }
}

setupDatabase();
