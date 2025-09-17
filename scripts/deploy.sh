#!/bin/bash

# B2B/Wholesale Simplifier - Fly.io Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting deployment of B2B/Wholesale Simplifier to Fly.io..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if user is logged in to Fly.io
if ! "$FLYCTL" auth whoami &> /dev/null; then
    print_error "Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

# Check if app exists
if ! "$FLYCTL" apps list | grep -q "b2b-wholesale-simplifier"; then
    print_status "Creating new Fly.io app..."
    "$FLYCTL" apps create b2b-wholesale-simplifier
    print_success "App created successfully"
else
    print_status "App already exists, proceeding with deployment..."
fi

# Check if Managed PostgreSQL database exists
if ! "$FLYCTL" mpg list | grep -q "b2b-wholesale-simplifier-db"; then
    print_status "Creating Managed PostgreSQL database..."
    DB_OUTPUT=$("$FLYCTL" mpg create --name b2b-wholesale-simplifier-db --region sjc)
    print_success "Database created successfully"
    
    # Extract cluster ID from output
    DB_CLUSTER_ID=$(echo "$DB_OUTPUT" | grep "ID:" | awk '{print $2}')
    if [ -z "$DB_CLUSTER_ID" ]; then
        print_error "Failed to extract cluster ID from database creation output"
        exit 1
    fi
    
    # Attach database to app using cluster ID
    print_status "Attaching database to app..."
    "$FLYCTL" mpg attach "$DB_CLUSTER_ID" --app b2b-wholesale-simplifier
    print_success "Database attached successfully"
else
    print_status "Database already exists, skipping creation..."
    
    # Get the cluster ID for existing database
    DB_CLUSTER_ID=$("$FLYCTL" mpg list | grep "b2b-wholesale-simplifier-db" | awk '{print $1}')
    
    # Check if database is already attached
    if ! "$FLYCTL" secrets list --app b2b-wholesale-simplifier | grep -q "DATABASE_URL"; then
        print_status "Attaching existing database to app..."
        "$FLYCTL" mpg attach "$DB_CLUSTER_ID" --app b2b-wholesale-simplifier
        print_success "Database attached successfully"
    else
        print_status "Database already attached to app"
    fi
fi

# Set environment variables
print_status "Setting environment variables..."

# Check if secrets are already set
if "$FLYCTL" secrets list --app b2b-wholesale-simplifier | grep -q "DATABASE_URL"; then
    print_warning "Secrets already exist. Skipping secret setup."
    print_warning "To update secrets, run: flyctl secrets set KEY=value --app b2b-wholesale-simplifier"
else
    print_warning "Please set your secrets manually:"
    echo "flyctl secrets set SHOPIFY_API_KEY=your_key --app b2b-wholesale-simplifier"
    echo "flyctl secrets set SHOPIFY_API_SECRET=your_secret --app b2b-wholesale-simplifier"
    echo "flyctl secrets set SHOPIFY_SCOPES='read_products,write_products,read_customers,write_customers,read_orders,write_orders' --app b2b-wholesale-simplifier"
    echo "flyctl secrets set HOST=https://b2b-wholesale-simplifier.fly.dev --app b2b-wholesale-simplifier"
    echo "flyctl secrets set SESSION_SECRET=your_session_secret --app b2b-wholesale-simplifier"
    echo ""
    read -p "Press Enter after setting secrets to continue..."
fi

# Build and deploy
print_status "Building and deploying application..."
"$FLYCTL" deploy --app b2b-wholesale-simplifier

# Run database migrations
print_status "Running database migrations..."
"$FLYCTL" ssh console --app b2b-wholesale-simplifier -C "npx prisma migrate deploy"

# Check deployment status
print_status "Checking deployment status..."
if "$FLYCTL" status --app b2b-wholesale-simplifier | grep -q "running"; then
    print_success "Deployment successful! 🎉"
    print_success "Your app is available at: https://b2b-wholesale-simplifier.fly.dev"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -f https://b2b-wholesale-simplifier.fly.dev/api/health > /dev/null 2>&1; then
        print_success "Health check passed! ✅"
    else
        print_warning "Health check failed. Check the logs: flyctl logs --app b2b-wholesale-simplifier"
    fi
else
    print_error "Deployment failed. Check the logs: flyctl logs --app b2b-wholesale-simplifier"
    exit 1
fi

print_success "Deployment complete! 🚀"
echo ""
echo "Next steps:"
echo "1. Update your Shopify app settings with the new URL"
echo "2. Test the app functionality"
echo "3. Monitor the logs: flyctl logs --app b2b-wholesale-simplifier"
echo "4. Scale if needed: flyctl scale count 2 --app b2b-wholesale-simplifier"
