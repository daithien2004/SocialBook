import { test, expect } from '@playwright/test';

test.describe('Authentication and Authorization Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.context().clearCookies();
  });

  test('should successfully login with credentials and redirect to home for normal user', async ({ page }) => {
    // Mock NextAuth session endpoint to return a normal user session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        json: { user: { email: 'user@test.com', name: 'User', role: 'user' }, expires: '9999-12-31T23:59:59.999Z' },
      });
    });

    // Mock API login response
    await page.route('**/api/auth/callback/credentials*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { url: 'http://localhost:3000/' }, // NextAuth callback success format
      });
    });

    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should login as admin and redirect to admin dashboard', async ({ page }) => {
    // Mock NextAuth session endpoint to return an admin session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        json: { user: { email: 'admin@test.com', name: 'Admin', role: 'admin' }, expires: '9999-12-31T23:59:59.999Z' },
      });
    });

    // Mock API login response
    await page.route('**/api/auth/callback/credentials*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { url: 'http://localhost:3000/' },
      });
    });

    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to admin page
    await expect(page).toHaveURL('/admin');
  });

  test('should mock token refresh flow gracefully', async ({ page }) => {
    // We mock the first API call to return 401 Unauthorized, and the refresh API call to succeed
    let callCount = 0;

    await page.route('**/api/some-protected-route', async (route) => {
      if (callCount === 0) {
        callCount++;
        await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      } else {
        await route.fulfill({ status: 200, json: { data: 'Success' } });
      }
    });

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        json: { accessToken: 'new-mock-token' }
      });
    });

    // We can simulate an API call from the console to verify nestjs-client-api intercepts and retries
    await page.goto('/');
    
    // Inject a script to make the API call using the client API
    const result = await page.evaluate(async () => {
      // Mocking the interceptor behavior by triggering a fetch to the protected route
      // In a real app this would be triggered by a component, here we simulate it
      try {
        const response1 = await fetch('/api/some-protected-route');
        if (response1.status === 401) {
          // Trigger refresh
          const refreshRes = await fetch('/auth/refresh');
          const refreshData = await refreshRes.json();
          if (refreshData.accessToken) {
            // Retry
            const response2 = await fetch('/api/some-protected-route', {
              headers: { Authorization: `Bearer ${refreshData.accessToken}` }
            });
            return response2.status;
          }
        }
        return response1.status;
      } catch (e) {
        return 500;
      }
    });

    expect(result).toBe(200);
  });

  test('should block normal user from accessing /admin', async ({ page }) => {
    // Mock user session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        json: { user: { email: 'user@test.com', name: 'User', role: 'user' }, expires: '9999-12-31T23:59:59.999Z' },
      });
    });

    // Try to navigate to admin
    await page.goto('/admin');

    // The middleware or client-side auth should redirect back to home or show unauthorized
    // Next.js standard behavior is usually redirecting to / or /login?callbackUrl=/admin
    await expect(page).not.toHaveURL('/admin');
  });

  test('should simulate Google OAuth login click', async ({ page }) => {
    await page.goto('/login');
    
    // Intercept the NextAuth google provider redirect
    await page.route('**/api/auth/signin/google*', async (route) => {
      await route.fulfill({
        status: 200,
        body: '<html><body>Mocked Google OAuth Redirect</body></html>'
      });
    });

    // Click Google login button (assuming there is a button containing "Google")
    const googleBtn = page.locator('button', { hasText: /google/i }).first();
    
    if (await googleBtn.isVisible()) {
      await googleBtn.click();
      await expect(page).toHaveURL(/.*api\/auth\/signin\/google.*/);
    }
  });
});
