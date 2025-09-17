# 🚀 B2B/Wholesale Simplifier - Fly.io Deployment Guide

This guide will help you deploy the B2B/Wholesale Simplifier Shopify app to Fly.io.

## 📋 Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. **Shopify App**: Your Shopify app must be created and configured
4. **Managed PostgreSQL Database**: We'll create this during deployment

## 🔧 Initial Setup

### 1. Login to Fly.io
```bash
flyctl auth login
```

### 2. Set Environment Variables
Copy the example environment file and configure your secrets:

```bash
cp env.production.example .env.production
```

Edit `.env.production` with your actual values:
- `SHOPIFY_API_KEY`: Your Shopify app's API key
- `SHOPIFY_API_SECRET`: Your Shopify app's API secret
- `SHOPIFY_SCOPES`: Required Shopify scopes
- `HOST`: Your app's URL (will be `https://b2b-wholesale-simplifier.fly.dev`)
- `SESSION_SECRET`: A secure random string for session encryption

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)
Use the provided deployment script:

```bash
npm run fly:deploy
```

This script will:
- Create the Fly.io app
- Set up PostgreSQL database
- Deploy the application
- Run database migrations
- Verify deployment

### Option 2: Manual Deployment

#### Step 1: Create the App
```bash
flyctl apps create b2b-wholesale-simplifier
```

#### Step 2: Create Managed PostgreSQL Database
```bash
flyctl mpg create --name b2b-wholesale-simplifier-db --region sjc
flyctl mpg attach b2b-wholesale-simplifier-db --app b2b-wholesale-simplifier
```

#### Step 3: Set Secrets
```bash
flyctl secrets set SHOPIFY_API_KEY=your_key --app b2b-wholesale-simplifier
flyctl secrets set SHOPIFY_API_SECRET=your_secret --app b2b-wholesale-simplifier
flyctl secrets set SHOPIFY_SCOPES="read_products,write_products,read_customers,write_customers,read_orders,write_orders" --app b2b-wholesale-simplifier
flyctl secrets set HOST=https://b2b-wholesale-simplifier.fly.dev --app b2b-wholesale-simplifier
flyctl secrets set SESSION_SECRET=your_session_secret --app b2b-wholesale-simplifier
```

#### Step 4: Deploy
```bash
flyctl deploy --app b2b-wholesale-simplifier
```

#### Step 5: Run Database Migrations
```bash
npm run fly:db
```

## 🔍 Management Commands

The app includes several management scripts:

### Quick Commands
```bash
# Check app status
npm run fly:status

# View logs
npm run fly:logs

# Restart app
npm run fly:restart

# Check health
npm run fly:health

# SSH into app
npm run fly:ssh
```

### Advanced Management
```bash
# Use the management script
./scripts/manage.sh [command]

# Available commands:
./scripts/manage.sh status      # Show app status
./scripts/manage.sh logs        # Show app logs
./scripts/manage.sh restart     # Restart the app
./scripts/manage.sh scale 2     # Scale to 2 instances
./scripts/manage.sh secrets     # Show current secrets
./scripts/manage.sh db-connect  # Connect to database
./scripts/manage.sh db-migrate  # Run database migrations
./scripts/manage.sh health      # Check app health
./scripts/manage.sh ssh         # SSH into the app
./scripts/manage.sh deploy      # Deploy the app
```

## 📊 Monitoring & Scaling

### Health Monitoring
The app includes a health check endpoint at `/api/health` that monitors:
- Database connectivity
- Memory usage
- Response times
- Error rates

### Scaling
```bash
# Scale to 2 instances
flyctl scale count 2 --app b2b-wholesale-simplifier

# Scale to 0 instances (stop)
flyctl scale count 0 --app b2b-wholesale-simplifier

# Scale with specific resources
flyctl scale memory 1024 --app b2b-wholesale-simplifier
```

### Monitoring
```bash
# View real-time logs
flyctl logs --app b2b-wholesale-simplifier

# View metrics
flyctl metrics --app b2b-wholesale-simplifier

# View app status
flyctl status --app b2b-wholesale-simplifier
```

## 🗄️ Database Management

### Connect to Database
```bash
flyctl mpg connect --app b2b-wholesale-simplifier
```

### Run Migrations
```bash
flyctl ssh console --app b2b-wholesale-simplifier -C "npx prisma migrate deploy"
```

### Database Backup
```bash
flyctl mpg backup create --app b2b-wholesale-simplifier
```

## 🔧 Troubleshooting

### Common Issues

#### 1. App Won't Start
```bash
# Check logs
flyctl logs --app b2b-wholesale-simplifier

# Check status
flyctl status --app b2b-wholesale-simplifier

# Restart app
flyctl apps restart --app b2b-wholesale-simplifier
```

#### 2. Database Connection Issues
```bash
# Check database status
flyctl mpg status --app b2b-wholesale-simplifier

# Check secrets
flyctl secrets list --app b2b-wholesale-simplifier

# Test database connection
flyctl ssh console --app b2b-wholesale-simplifier -C "npx prisma db pull --print"
```

#### 3. Health Check Failing
```bash
# Check health endpoint
curl https://b2b-wholesale-simplifier.fly.dev/api/health

# Check app logs
flyctl logs --app b2b-wholesale-simplifier
```

### Debug Mode
```bash
# SSH into the app for debugging
flyctl ssh console --app b2b-wholesale-simplifier

# Run commands inside the container
flyctl ssh console --app b2b-wholesale-simplifier -C "npx prisma studio"
```

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Fly.io secrets for sensitive data
- Rotate secrets regularly

### Database Security
- Database is only accessible from your app
- Use strong passwords
- Regular backups are recommended

### App Security
- HTTPS is enforced
- Session secrets are encrypted
- Input validation is implemented
- Rate limiting is configured

## 📈 Performance Optimization

### Resource Allocation
- **CPU**: 1 shared CPU (can be increased)
- **Memory**: 512MB (can be increased)
- **Storage**: Ephemeral (data in database)

### Scaling Recommendations
- **Development**: 0-1 instances
- **Production**: 2+ instances for high availability
- **Peak Traffic**: Scale up based on metrics

### Monitoring
- Monitor CPU and memory usage
- Set up alerts for high error rates
- Track response times
- Monitor database performance

## 🆘 Support

### Fly.io Support
- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)

### App-Specific Issues
- Check the logs: `fly logs --app b2b-wholesale-simplifier`
- Review the health endpoint: `https://b2b-wholesale-simplifier.fly.dev/api/health`
- SSH into the app for debugging: `fly ssh console --app b2b-wholesale-simplifier`

## 🎉 Success!

Once deployed, your B2B/Wholesale Simplifier app will be available at:
**https://b2b-wholesale-simplifier.fly.dev**

Remember to update your Shopify app settings with the new URL!
