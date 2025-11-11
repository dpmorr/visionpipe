const zapier = require('zapier-platform-core');
const App = require('../index');

const appTester = zapier.createAppTester(App);

// Mock data
const TEST_API_KEY = 'test-key';
const TEST_API_URL = 'http://localhost:5000';

describe('Authentication', () => {
  test('test auth succeeds', async () => {
    const bundle = {
      authData: {
        apiKey: TEST_API_KEY,
        apiUrl: TEST_API_URL
      },
    };

    const response = await appTester(App.authentication.test, bundle);
    expect(response.success).toBe(true);
  });
});

describe('Triggers', () => {
  test('new initiative trigger', async () => {
    const bundle = {
      authData: {
        apiKey: TEST_API_KEY,
        apiUrl: TEST_API_URL
      },
    };

    const results = await appTester(App.triggers.new_initiative.operation.perform, bundle);
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('title');
  });

  test('new invoice trigger', async () => {
    const bundle = {
      authData: {
        apiKey: TEST_API_KEY,
        apiUrl: TEST_API_URL
      },
    };

    const results = await appTester(App.triggers.new_invoice.operation.perform, bundle);
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toHaveProperty('invoiceNumber');
  });
});

describe('Creates', () => {
  test('create initiative action', async () => {
    const bundle = {
      authData: {
        apiKey: TEST_API_KEY,
        apiUrl: TEST_API_URL
      },
      inputData: {
        title: 'Test Initiative',
        description: 'Test Description',
        category: 'circular',
        estimatedImpact: {
          wasteReduction: 100,
          costSavings: 1000
        }
      }
    };

    const result = await appTester(App.creates.create_initiative.operation.perform, bundle);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

// This setup runs before all tests
beforeAll(() => {
  // Mock all HTTP requests in the Zapier environment
  zapier.tools.env.inject();
  process.env.TEST_MODE = true;
});