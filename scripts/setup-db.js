#!/usr/bin/env node

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  console.log('🔍 Setting up database...');
  
  try {
    // First, try to connect to the database
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to run db push with retries
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🔄 Running prisma db push (${4 - retries}/3 attempts)...`);
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Database schema updated successfully');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('❌ Failed to update database schema after 3 attempts');
          throw error;
        }
        console.log(`⚠️ Database push failed, retrying in 5 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
