import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const BASE_URL = 'http://localhost:3002';
const results: TestResult[] = [];
let testUser: { userId: string; email: string; username: string; token: string; refreshToken: string } | null = null;

const makeRequest = (
  method: string,
  path: string,
  data?: unknown,
  token?: string
): Promise<{ statusCode: number; data: string }> => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const body = data ? JSON.stringify(data) : undefined;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          data: responseData
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

const runTest = async (name: string, testFn: () => Promise<void>): Promise<void> => {
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const runTests = async () => {
  console.log('Starting User Service Tests...\n');

  await runTest('Health check returns 200', async () => {
    const response = await makeRequest('GET', '/api/health');
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    const data = JSON.parse(response.data);
    if (data.status !== 'ok') {
      throw new Error('Expected status ok');
    }
  });

  await runTest('Register with valid data succeeds', async () => {
    const timestamp = Date.now();
    const uniqueEmail = `test-${timestamp}@example.com`;
    const uniqueUsername = `testuser-${timestamp}`;
    const response = await makeRequest('POST', '/api/auth/register', {
      email: uniqueEmail,
      password: 'password123',
      username: uniqueUsername
    });
    if (response.statusCode !== 201) {
      throw new Error(`Expected 201, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.user || !data.token || !data.refreshToken) {
      throw new Error('Missing user, token, or refreshToken in response');
    }
    testUser = {
      userId: data.user.id,
      email: data.user.email,
      username: uniqueUsername,
      token: data.token,
      refreshToken: data.refreshToken
    };
  });

  await runTest('Register with invalid email fails', async () => {
    const timestamp = Date.now();
    const response = await makeRequest('POST', '/api/auth/register', {
      email: 'invalid-email',
      password: 'password123',
      username: `testuser2-${timestamp}`
    });
    if (response.statusCode !== 400) {
      throw new Error(`Expected 400, got ${response.statusCode}`);
    }
  });

  await runTest('Register with weak password fails', async () => {
    const timestamp = Date.now();
    const response = await makeRequest('POST', '/api/auth/register', {
      email: `test2-${timestamp}@example.com`,
      password: 'weak',
      username: `testuser3-${timestamp}`
    });
    if (response.statusCode !== 400) {
      throw new Error(`Expected 400, got ${response.statusCode}`);
    }
  });

  await runTest('Register with duplicate email fails', async () => {
    if (!testUser) {
      throw new Error('No test user available for duplicate email test');
    }
    const timestamp = Date.now();
    const response = await makeRequest('POST', '/api/auth/register', {
      email: testUser.email,
      password: 'password123',
      username: `differentuser-${timestamp}`
    });
    if (response.statusCode !== 409) {
      throw new Error(`Expected 409, got ${response.statusCode}`);
    }
  });

  await runTest('Register with duplicate username fails', async () => {
    if (!testUser) {
      throw new Error('No test user available for duplicate username test');
    }
    const timestamp = Date.now();
    const response = await makeRequest('POST', '/api/auth/register', {
      email: `different-${timestamp}@example.com`,
      password: 'password123',
      username: testUser.username
    });
    if (response.statusCode !== 409) {
      throw new Error(`Expected 409, got ${response.statusCode}`);
    }
  });

  await runTest('Login with valid credentials succeeds', async () => {
    if (!testUser) {
      throw new Error('No test user available for login test');
    }
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: 'password123'
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.user || !data.token || !data.refreshToken) {
      throw new Error('Missing user, token, or refreshToken in response');
    }
  });

  await runTest('Login with invalid email fails', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'invalid-email',
      password: 'password123'
    });
    if (response.statusCode !== 400) {
      throw new Error(`Expected 400, got ${response.statusCode}`);
    }
  });

  await runTest('Login with wrong password fails', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Login with non-existent user fails', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Validate valid token succeeds', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('POST', '/api/auth/validate', {
      token: testUser.token
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.valid || data.userId !== testUser.userId) {
      throw new Error('Token validation failed');
    }
  });

  await runTest('Validate invalid token fails', async () => {
    const response = await makeRequest('POST', '/api/auth/validate', {
      token: 'invalid.token.here'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Refresh token with valid refresh token succeeds', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('POST', '/api/auth/refresh', {
      refreshToken: testUser.refreshToken
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.token) {
      throw new Error('Missing new token in response');
    }
    testUser.token = data.token;
  });

  await runTest('Refresh token with invalid token fails', async () => {
    const response = await makeRequest('POST', '/api/auth/refresh', {
      refreshToken: 'invalid.refresh.token'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Get user profile with valid token succeeds', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('GET', `/api/users/${testUser.userId}`, undefined, testUser.token);
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.user || !data.profile || !data.preferences) {
      throw new Error('Missing user, profile, or preferences in response');
    }
  });

  await runTest('Get user profile without token fails', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('GET', `/api/users/${testUser.userId}`);
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Get user profile with wrong userId fails', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('GET', '/api/users/wrong-user-id', undefined, testUser.token);
    if (response.statusCode !== 403) {
      throw new Error(`Expected 403, got ${response.statusCode}`);
    }
  });

  await runTest('Update user profile succeeds', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest(
      'PUT',
      `/api/users/${testUser.userId}/profile`,
      {
        avatar_url: 'https://example.com/avatar.jpg',
        level: 5,
        experience: 1000
      },
      testUser.token
    );
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (data.profile.level !== 5 || data.profile.experience !== 1000) {
      throw new Error('Profile not updated correctly');
    }
  });

  await runTest('Update user profile without token fails', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('PUT', `/api/users/${testUser.userId}/profile`, {
      level: 10
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Update user preferences succeeds', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest(
      'PUT',
      `/api/users/${testUser.userId}/preferences`,
      {
        notifications_enabled: false,
        language: 'ko',
        theme: 'dark'
      },
      testUser.token
    );
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (
      data.preferences.notifications_enabled !== false ||
      data.preferences.language !== 'ko' ||
      data.preferences.theme !== 'dark'
    ) {
      throw new Error('Preferences not updated correctly');
    }
  });

  await runTest('Update user preferences without token fails', async () => {
    if (!testUser) throw new Error('Test user not available');
    const response = await makeRequest('PUT', `/api/users/${testUser.userId}/preferences`, {
      theme: 'light'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await runTest('Request password reset succeeds', async () => {
    const response = await makeRequest('POST', '/api/auth/request-password-reset', {
      email: 'test@example.com'
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}: ${response.data}`);
    }
    const data = JSON.parse(response.data);
    if (!data.message) {
      throw new Error('Missing message in response');
    }
  });

  await runTest('Request password reset for non-existent user succeeds (security)', async () => {
    const response = await makeRequest('POST', '/api/auth/request-password-reset', {
      email: 'nonexistent@example.com'
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('Test Results Summary');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n' + (failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed'));
  process.exit(failed > 0 ? 1 : 0);
};

const waitForServer = async (maxAttempts = 30): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('GET', '/api/health');
      console.log('Server is ready!\n');
      return;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error('Server failed to start');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const main = async () => {
  console.log('Waiting for server to start...');
  await waitForServer();
  await runTests();
};

main();
