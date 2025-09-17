#!/bin/bash

# Management Script for B2B/Wholesale Simplifier on Fly.io
# This script provides common management operations

set -e  # Exit on any error

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

APP_NAME="b2b-wholesale-simplifier"

# Function to show usage
show_usage() {
    echo "B2B/Wholesale Simplifier - Fly.io Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      - Show app status"
    echo "  logs        - Show app logs"
    echo "  restart     - Restart the app"
    echo "  scale       - Scale the app (usage: $0 scale <count>)"
    echo "  secrets     - Show current secrets"
    echo "  db-connect  - Connect to the database"
    echo "  db-migrate  - Run database migrations"
    echo "  health      - Check app health"
    echo "  ssh         - SSH into the app"
    echo "  deploy      - Deploy the app"
    echo "  help        - Show this help message"
    echo ""
}

# Set the flyctl path
FLYCTL="/Users/joeldg/.fly/bin/flyctl"

# Check if flyctl is installed
check_flyctl() {
    if ! command -v "$FLYCTL" &> /dev/null; then
        print_error "flyctl is not installed. Please install it first:"
        echo "curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
}

# Show app status
show_status() {
    print_status "App Status:"
    "$FLYCTL" status --app $APP_NAME
    echo ""
    print_status "Machine Status:"
    "$FLYCTL" machine list --app $APP_NAME
}

# Show logs
show_logs() {
    print_status "Showing app logs (press Ctrl+C to exit):"
    "$FLYCTL" logs --app $APP_NAME
}

# Restart app
restart_app() {
    print_status "Restarting app..."
    "$FLYCTL" apps restart --app $APP_NAME
    print_success "App restarted successfully! ✅"
}

# Scale app
scale_app() {
    local count=$1
    if [ -z "$count" ]; then
        print_error "Please provide a count. Usage: $0 scale <count>"
        exit 1
    fi
    
    print_status "Scaling app to $count instances..."
    "$FLYCTL" scale count $count --app $APP_NAME
    print_success "App scaled to $count instances! ✅"
}

# Show secrets
show_secrets() {
    print_status "Current secrets:"
    "$FLYCTL" secrets list --app $APP_NAME
}

# Connect to database
connect_db() {
    print_status "Connecting to database..."
    "$FLYCTL" mpg connect --app $APP_NAME
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    "$FLYCTL" ssh console --app $APP_NAME -C "npx prisma migrate deploy"
    print_success "Database migrations completed! ✅"
}

# Check app health
check_health() {
    print_status "Checking app health..."
    local url="https://$APP_NAME.fly.dev/api/health"
    
    if curl -f -s $url > /dev/null; then
        print_success "App is healthy! ✅"
        echo "Health endpoint: $url"
    else
        print_error "App health check failed! ❌"
        echo "Check the logs: $0 logs"
    fi
}

# SSH into app
ssh_app() {
    print_status "Connecting to app via SSH..."
    "$FLYCTL" ssh console --app $APP_NAME
}

# Deploy app
deploy_app() {
    print_status "Deploying app..."
    "$FLYCTL" deploy --app $APP_NAME
    print_success "App deployed successfully! ✅"
}

# Main script logic
main() {
    check_flyctl
    
    case "${1:-help}" in
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        restart)
            restart_app
            ;;
        scale)
            scale_app $2
            ;;
        secrets)
            show_secrets
            ;;
        db-connect)
            connect_db
            ;;
        db-migrate)
            run_migrations
            ;;
        health)
            check_health
            ;;
        ssh)
            ssh_app
            ;;
        deploy)
            deploy_app
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
