#!/bin/bash

# Database Setup Script for B2B/Wholesale Simplifier
# This script sets up the PostgreSQL database and runs migrations

set -e  # Exit on any error

echo "🗄️ Setting up database for B2B/Wholesale Simplifier..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set the flyctl path
FLYCTL="/Users/joeldg/.fly/bin/flyctl"

# Check if flyctl is installed
if ! command -v "$FLYCTL" &> /dev/null; then
    print_error "flyctl is not installed. Please install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if app exists
if ! "$FLYCTL" apps list | grep -q "b2b-wholesale-simplifier"; then
    print_error "App 'b2b-wholesale-simplifier' not found. Please deploy the app first."
    exit 1
fi

# Check if database exists
if ! "$FLYCTL" mpg list | grep -q "b2b-wholesale-simplifier-db"; then
    print_error "Database 'b2b-wholesale-simplifier-db' not found. Please create it first."
    exit 1
fi

print_status "Running database migrations..."

# Run migrations
"$FLYCTL" ssh console --app b2b-wholesale-simplifier -C "npx prisma migrate deploy"

print_success "Database migrations completed successfully! ✅"

print_status "Generating Prisma client..."
"$FLYCTL" ssh console --app b2b-wholesale-simplifier -C "npx prisma generate"

print_success "Prisma client generated successfully! ✅"

print_status "Checking database connection..."
if "$FLYCTL" ssh console --app b2b-wholesale-simplifier -C "npx prisma db pull --print" > /dev/null 2>&1; then
    print_success "Database connection successful! ✅"
else
    print_warning "Database connection test failed. Check your DATABASE_URL secret."
fi

print_success "Database setup complete! 🎉"
echo ""
echo "Database is ready for production use."
echo "You can monitor database performance with: flyctl mpg connect --app b2b-wholesale-simplifier"
