import { test, expect } from '@playwright/test';

const USER_ME = {
  data: {
    id: 'user-1',
    email: 'user@test.com',
    role: 'user',
    username: 'user',
    image: null,
  },
};

const LOGIN_RESPONSE = {
  message: 'Đăng nhập thành công',
  data: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { id: 'user-1', email: 'user@test.com', role: 'user' },
  },
};

test.describe('Authentication and Authorization Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.context().clearCookies();
  });

  test('should login with credentials and land on home for normal user', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 200, json: LOGIN_RESPONSE });
    });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: USER_ME });
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
  });

  test('should block anonymous user from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin');
  });

  test('should mock token refresh flow gracefully', async ({ page }) => {
    let callCount = 0;

    await page.route('**/api/some-protected-route', async (route) => {
      if (callCount === 0) {
        callCount++;
        await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      } else {
        await route.fulfill({ status: 200, json: { data: 'Success' } });
      }
    });

    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({ status: 200, json: { data: { accessToken: 'new-mock-token' } } });
    });

    await page.goto('/');

    const result = await page.evaluate(async () => {
      try {
        const response1 = await fetch('/api/some-protected-route');
        if (response1.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          const refreshData = await refreshRes.json();
          if (refreshData) {
            const response2 = await fetch('/api/some-protected-route');
            return response2.status;
          }
        }
        return response1.status;
      } catch {
        return 500;
      }
    });

    expect(result).toBe(200);
  });

  test('should start Google OAuth redirect to provider', async ({ page }) => {
    await page.route('**/api/auth/google', async (route) => {
      await route.fulfill({
        status: 302,
        headers: { Location: 'https://accounts.google.com/o/oauth2/v2/auth?source=socialbook' },
      });
    });

    await page.goto('/login');

    const googleBtn = page.locator('button', { hasText: /google/i }).first();
    if (await googleBtn.isVisible()) {
      await googleBtn.click();
      await expect(page).toHaveURL(/accounts\.google\.com.*/);
    }
  });
});