# Manual Deployment Steps for wastetraq Zapier Integration

## Prerequisites
1. Create a Zapier Developer Account at https://developer.zapier.com if you haven't already
2. Install Zapier CLI globally:
```bash
npm install -g zapier-platform-cli
```

## Deployment Steps

1. Login to Zapier CLI:
```bash
zapier login
```
When prompted, enter your Zapier account email address.

2. Build the integration:
```bash
cd zapier
npm run build
```

3. Deploy to Zapier:
```bash
npm run deploy
```

4. After successful deployment:
- Go to your [Zapier Developer Dashboard](https://developer.zapier.com/dashboard)
- Find the wastetraq integration
- Invite users for testing or submit for review

## Testing the Integration

1. Create a new Zap in your Zapier account
2. Search for "wastetraq" in the app selection
3. Test the available triggers and actions:
   - New Initiative Trigger
   - New Invoice Trigger
   - New Vendor Trigger
   - Create Initiative Action

## Support and Troubleshooting

If you encounter any issues during deployment:
1. Check the Zapier CLI output for specific error messages
2. Review the [Zapier Platform CLI Documentation](https://platform.zapier.com/cli_docs/docs)
3. Contact support@wastetraq.com for assistance

Remember to keep your API keys secure and never share them publicly.
