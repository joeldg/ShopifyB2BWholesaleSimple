# ✅ B2B/Wholesale Simplifier - Deployment Checklist

Use this checklist to ensure a successful deployment to Fly.io.

## 🔧 Pre-Deployment Setup

### 1. Development Environment
- [ ] All tests passing (`npm run test:all`)
- [ ] Build successful (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] Environment variables configured

### 2. Shopify App Configuration
- [ ] Shopify app created in Partner Dashboard
- [ ] App URL set to: `https://b2b-wholesale-simplifier.fly.dev`
- [ ] Allowed redirection URLs configured
- [ ] Required scopes: `read_products,write_products,read_customers,write_customers,read_orders,write_orders`
- [ ] App installed on test store

### 3. Fly.io Setup
- [ ] Fly.io account created
- [ ] Fly CLI installed (`curl -L https://fly.io/install.sh | sh`)
- [ ] Logged in to Fly.io (`flyctl auth login`)
- [ ] App name available (`b2b-wholesale-simplifier`)

## 🚀 Deployment Process

### 1. Initial Deployment
- [ ] Run deployment script: `npm run fly:deploy`
- [ ] Verify app creation: `flyctl apps list`
- [ ] Verify database creation: `flyctl mpg list`
- [ ] Check app status: `flyctl status --app b2b-wholesale-simplifier`

### 2. Environment Configuration
- [ ] Set Shopify API key: `flyctl secrets set SHOPIFY_API_KEY=your_key --app b2b-wholesale-simplifier`
- [ ] Set Shopify API secret: `flyctl secrets set SHOPIFY_API_SECRET=your_secret --app b2b-wholesale-simplifier`
- [ ] Set Shopify scopes: `flyctl secrets set SHOPIFY_SCOPES="read_products,write_products,read_customers,write_customers,read_orders,write_orders" --app b2b-wholesale-simplifier`
- [ ] Set app host: `flyctl secrets set HOST=https://b2b-wholesale-simplifier.fly.dev --app b2b-wholesale-simplifier`
- [ ] Set session secret: `flyctl secrets set SESSION_SECRET=your_session_secret --app b2b-wholesale-simplifier`

### 3. Database Setup
- [ ] Run database migrations: `npm run fly:db`
- [ ] Verify database connection: `flyctl mpg connect --app b2b-wholesale-simplifier`
- [ ] Check Prisma client generation: `flyctl ssh console --app b2b-wholesale-simplifier -C "npx prisma generate"`

### 4. App Verification
- [ ] Health check passes: `npm run fly:health`
- [ ] App accessible: `https://b2b-wholesale-simplifier.fly.dev`
- [ ] Admin interface loads: `https://b2b-wholesale-simplifier.fly.dev/app`
- [ ] API endpoints respond: `https://b2b-wholesale-simplifier.fly.dev/api/health`

## 🧪 Testing

### 1. Functional Testing
- [ ] App installs on test store
- [ ] Admin interface loads correctly
- [ ] Pricing rules can be created/edited/deleted
- [ ] Auto-tagging rules work
- [ ] Wholesale applications can be managed
- [ ] Shopify Functions pricing logic works

### 2. Performance Testing
- [ ] App loads within 3 seconds
- [ ] Database queries are fast
- [ ] Memory usage is reasonable
- [ ] No memory leaks detected

### 3. Security Testing
- [ ] HTTPS enforced
- [ ] Environment variables not exposed
- [ ] Input validation works
- [ ] Rate limiting active

## 📊 Monitoring Setup

### 1. Health Monitoring
- [ ] Health endpoint responding: `/api/health`
- [ ] Database connectivity monitored
- [ ] Memory usage tracked
- [ ] Error rates monitored

### 2. Logging
- [ ] Application logs accessible: `fly logs --app b2b-wholesale-simplifier`
- [ ] Error logs are clear and actionable
- [ ] Performance metrics logged

### 3. Alerts (Optional)
- [ ] Set up alerts for high error rates
- [ ] Set up alerts for memory usage
- [ ] Set up alerts for response times

## 🔧 Post-Deployment

### 1. Scaling
- [ ] Scale to 2 instances for high availability: `fly scale count 2 --app b2b-wholesale-simplifier`
- [ ] Monitor resource usage
- [ ] Adjust scaling based on traffic

### 2. Backup
- [ ] Database backup configured: `fly postgres backup create --app b2b-wholesale-simplifier`
- [ ] Regular backup schedule set
- [ ] Backup restoration tested

### 3. Documentation
- [ ] Update Shopify app description with new URL
- [ ] Update any external documentation
- [ ] Notify users of deployment

## 🚨 Troubleshooting

### Common Issues
- [ ] App won't start: Check logs with `flyctl logs --app b2b-wholesale-simplifier`
- [ ] Database connection issues: Verify `DATABASE_URL` secret
- [ ] Health check failing: Check app logs and database connectivity
- [ ] Shopify integration issues: Verify API keys and scopes

### Debug Commands
```bash
# Check app status
flyctl status --app b2b-wholesale-simplifier

# View logs
flyctl logs --app b2b-wholesale-simplifier

# SSH into app
flyctl ssh console --app b2b-wholesale-simplifier

# Check secrets
flyctl secrets list --app b2b-wholesale-simplifier

# Restart app
flyctl apps restart --app b2b-wholesale-simplifier
```

## ✅ Success Criteria

- [ ] App is accessible at `https://b2b-wholesale-simplifier.fly.dev`
- [ ] All core features working (pricing rules, auto-tagging, applications)
- [ ] Database migrations completed successfully
- [ ] Health checks passing
- [ ] Performance is acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backup strategy implemented

## 🎉 Deployment Complete!

Once all items are checked, your B2B/Wholesale Simplifier app is successfully deployed and ready for production use!

### Next Steps
1. Monitor the app for the first 24 hours
2. Set up regular backups
3. Configure monitoring alerts
4. Plan for scaling based on usage
5. Update documentation and user guides

### Support
- [Fly.io Documentation](https://fly.io/docs/)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Prisma Documentation](https://www.prisma.io/docs/)
