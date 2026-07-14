import { test, expect } from '@playwright/test';

test.describe('Content Moderation UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Giả lập trạng thái đã đăng nhập
    await page.addInitScript(() => {
      window.localStorage.setItem('nextauth.message', 'logged-in');
    });
    
    // Đi tới trang Posts (nơi có chỗ đăng bài)
    await page.goto('/posts');
    
    // Mock API lấy thông tin session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', name: 'Test User', role: 'user', email: 'test@example.com' },
          expires: '2026-01-01T00:00:00.000Z',
          accessToken: 'mock-token'
        })
      });
    });
  });

  test('nên hiển thị Toast thành công khi đăng nội dung SAFE', async ({ page }) => {
    // Mock API đăng bài
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'post-1', content: 'Nội dung sạch', isFlagged: false }
        })
      });
    });

    // 1. Click vào thanh "Bạn đang nghĩ gì..." để mở Modal
    await page.getByText('bạn đang nghĩ gì về cuốn sách hôm nay?').click();
    
    // 2. Nhập nội dung vào Textarea trong Modal
    const textarea = page.getByPlaceholder('Chia sẻ suy nghĩ của bạn...');
    await expect(textarea).toBeVisible();
    await textarea.fill('Cuốn sách này rất hay, recommend mọi người!');
    
    // Nhấn Đăng bài
    await page.getByRole('button', { name: 'Đăng bài' }).click();

    // Kiểm tra Modal đóng lại (không còn thấy textarea)
    await expect(page.getByPlaceholder('Chia sẻ suy nghĩ của bạn...').last()).not.toBeVisible();
  });

  test('nên hiển thị Toast cảnh báo khi đăng nội dung WARNING (Spoiler)', async ({ page }) => {
    // Mock API đăng bài - trả về trạng thái PENDING/FLAGGED
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          warning: 'Nội dung chứa tiết lộ cốt truyện (Spoiler).',
          data: { id: 'post-2', content: 'Spoiler content', isFlagged: true }
        })
      });
    });

    await page.getByText('bạn đang nghĩ gì về cuốn sách hôm nay?').click();
    const textarea = page.getByPlaceholder('Chia sẻ suy nghĩ của bạn...');
    await expect(textarea).toBeVisible();
    await textarea.fill('Kết thúc truyện nhân vật chính chết!');
    await page.getByRole('button', { name: 'Đăng bài' }).click();

    // Kiểm tra Toast cảnh báo màu vàng xuất hiện
    const warningToast = page.locator('li[data-type="warning"]');
    await expect(warningToast).toBeVisible();
    await expect(warningToast).toContainText('Bài viết đang được xem xét');
  });

  test('nên hiển thị Toast lỗi khi đăng nội dung bị BLOCKED (Toxic)', async ({ page }) => {
    // Mock API đăng bài - trả về lỗi 400
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Nội dung chứa từ ngữ thô tục không phù hợp.'
        })
      });
    });

    await page.getByText('bạn đang nghĩ gì về cuốn sách hôm nay?').click();
    const textarea = page.getByPlaceholder('Chia sẻ suy nghĩ của bạn...');
    await expect(textarea).toBeVisible();
    await textarea.fill('Nội dung rất độc hại và thô tục...');
    await page.getByRole('button', { name: 'Đăng bài' }).click();

    // Kiểm tra Toast lỗi màu đỏ xuất hiện
    const errorToast = page.locator('li[data-type="error"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Nội dung chứa từ ngữ thô tục không phù hợp');
  });

  test('nên chặn và báo lỗi khi Chia sẻ sách với nội dung Toxic', async ({ page }) => {
    // 1. Mock API lấy thông tin sách
    await page.route('**/api/books/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'book-1', title: 'Harry Potter', slug: 'harry-potter', authorId: { name: 'J.K. Rowling' } }
        })
      });
    });

    // 2. Mock API đăng bài bị chặn
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Nội dung chia sẻ không hợp lệ.'
        })
      });
    });

    // 3. Đi tới trang chi tiết sách
    await page.goto('/books/harry-potter');

    // 4. Tìm và nhấn nút "Chia sẻ" (nút có icon Share2 trong ảnh bạn gửi)
    const shareButton = page.getByTitle('Chia sẻ');
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // 5. Nhập nội dung toxic vào Modal vừa hiện ra
    const modalTextarea = page.getByPlaceholder('Chia sẻ suy nghĩ của bạn về cuốn sách này...');
    await expect(modalTextarea).toBeVisible();
    await modalTextarea.fill('Sách này như c*t, đừng mua!');

    // 6. Nhấn Đăng bài
    await page.getByRole('button', { name: 'Đăng bài' }).click();

    // 7. Kiểm tra Toast lỗi
    const errorToast = page.locator('li[data-type="error"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Nội dung chia sẻ không hợp lệ');
  });
});
