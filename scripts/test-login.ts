import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Attempting login with:', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      }),
      credentials: 'include' // Important for cookies
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();
    console.log('Login response:', data);

    if (!response.ok) {
      throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
    }

    console.log('Login successful!');
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin(); 