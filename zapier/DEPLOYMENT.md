# Deploying the wastetraq Zapier Integration

## Prerequisites
- Node.js >= 16
- Zapier CLI (`npm install -g zapier-platform-cli`)
- A Zapier account with developer access

## Steps to Deploy

1. Login to Zapier CLI:
```bash
zapier login
```

2. Run tests:
```bash
npm test
```

3. Validate the integration:
```bash
npm run validate
```

4. Build the integration:
```bash
npm run build
```

5. Deploy to Zapier:
```bash
npm run deploy
```

## Testing in Zapier

1. After deployment, go to your [Zapier Developer Account](https://developer.zapier.com)
2. Find your integration under "Your Apps"
3. Invite users to test your integration
4. Monitor usage in the Zapier Developer Dashboard

## Versioning

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update version in package.json before deploying
- Add changelog entries in CHANGELOG.md

## Common Issues

1. Authentication Errors:
   - Verify API key and URL in environment variables
   - Check API endpoint accessibility

2. Trigger/Action Failures:
   - Review API response format
   - Check required fields in input/output

## Support

For deployment issues:
1. Check Zapier logs in Developer Dashboard
2. Review test output
3. Contact support@wastetraq.com for assistance
