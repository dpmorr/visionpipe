# wastetraq Zapier Integration

This is the official Zapier integration for the wastetraq Sustainability Platform. It allows you to automate workflows between wastetraq and your other business tools.

## Available Triggers

1. New Initiative
   - Triggers when a new sustainability initiative is created
   - Can be used to create tasks in project management tools or send notifications

2. New Invoice
   - Triggers when a new invoice is created
   - Useful for accounting automation and payment tracking

3. New Vendor
   - Triggers when a new vendor is registered
   - Can update CRM systems or vendor management tools

## Available Actions

1. Create Initiative
   - Creates a new sustainability initiative in wastetraq
   - Required fields: title, description, category
   - Optional: estimated impact metrics

2. Create Invoice
   - Creates a new invoice in the system
   - Required fields: vendor ID, items, due date
   - Supports multiple line items

## Required Environment Variables

Before deploying, ensure you have:
- `OPENAI_API_KEY` - For AI-powered features
- `NEWS_API_KEY` - For news aggregation
- Database credentials if using a custom database

## Setup Instructions

1. Follow the steps in `DEPLOYMENT_STEPS.md` to deploy the integration
2. Get your API key from your wastetraq dashboard (Settings > API)
3. Configure the integration with your API key and instance URL
4. Create your first Zap using any of the available triggers or actions

## Development

1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Validate: `npm run validate`
4. Build: `npm run build`
5. Deploy: Follow `DEPLOYMENT_STEPS.md`

## Support

For any issues or questions about this integration:
1. Check the troubleshooting section in `DEPLOYMENT_STEPS.md`
2. Review test output and logs
3. Contact support@wastetraq.com for assistance