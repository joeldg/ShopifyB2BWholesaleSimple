#!/bin/bash

# Fly CLI Alias Script
# This script creates convenient aliases for the Fly CLI commands

# Add to your shell profile (.bashrc, .zshrc, etc.) or source this file
# source scripts/fly-alias.sh

# Create aliases for common flyctl commands
# Note: flyctl should already be aliased to /Users/joeldg/.fly/bin/flyctl

# App management aliases
alias fly-apps='flyctl apps'
alias fly-status='flyctl status --app b2b-wholesale-simplifier'
alias fly-logs='flyctl logs --app b2b-wholesale-simplifier'
alias fly-restart='flyctl apps restart --app b2b-wholesale-simplifier'
alias fly-deploy='flyctl deploy --app b2b-wholesale-simplifier'
alias fly-ssh='flyctl ssh console --app b2b-wholesale-simplifier'

# Database aliases
alias fly-db='flyctl mpg'
alias fly-db-connect='flyctl mpg connect --app b2b-wholesale-simplifier'
alias fly-db-status='flyctl mpg status --app b2b-wholesale-simplifier'

# Scaling aliases
alias fly-scale='flyctl scale count'
alias fly-scale-2='flyctl scale count 2 --app b2b-wholesale-simplifier'
alias fly-scale-0='flyctl scale count 0 --app b2b-wholesale-simplifier'

# Secrets aliases
alias fly-secrets='flyctl secrets list --app b2b-wholesale-simplifier'
alias fly-secret-set='flyctl secrets set'

# Health check alias
alias fly-health='curl -f https://b2b-wholesale-simplifier.fly.dev/api/health'

echo "✅ Fly CLI aliases loaded!"
echo ""
echo "Available aliases:"
echo "  fly-status     - Check app status"
echo "  fly-logs       - View app logs"
echo "  fly-restart    - Restart app"
echo "  fly-deploy     - Deploy app"
echo "  fly-ssh        - SSH into app"
echo "  fly-db-connect - Connect to database"
echo "  fly-scale-2    - Scale to 2 instances"
echo "  fly-scale-0    - Scale to 0 instances"
echo "  fly-secrets    - List secrets"
echo "  fly-health     - Check app health"
echo ""
echo "To make these permanent, add this to your shell profile:"
echo "  source $(pwd)/scripts/fly-alias.sh"
