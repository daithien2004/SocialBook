import { test, expect } from '@playwright/test';

test.describe('Intelligent Search UI Verification', () => {
  // Đường dẫn đến trang Thư viện (nơi có Search Bar)
  const SEARCH_PAGE = 'http://localhost:3000/books';

  const testCases = [
    { query: 'cậu bé học phép thuật ở trường Hogwart' },
    { query: 'có 2 người bạn Ron và Hermony' },
    { query: 'tập 1 của truyện harry potter' },
    { query: 'Harry Potter' },
  ];

  for (const { query } of testCases) {
    test(`UI Test: Truy vấn "${query}" phải hiển thị Harry Potter ở đầu`, async ({ page }) => {
      // 1. Đi đến trang tìm kiếm
      await page.goto(SEARCH_PAGE);

      // 2. Tìm ô input và nhập câu truy vấn
      const searchInput = page.getByPlaceholder('Tìm kiếm tên truyện, tác giả...');
      await searchInput.fill(query);
      
      // Nhấn Enter để kích hoạt tìm kiếm (mặc dù có debounce nhưng nhấn Enter sẽ chạy ngay)
      await searchInput.press('Enter');

      // 3. Đợi kết quả hiển thị
      // Chúng ta nhắm thẳng vào các h3 nằm trong danh sách kết quả (Book Grid)
      // Thường thì danh sách sách sẽ nằm sau phần "Kết quả cho..."
      const bookTitles = page.locator('div.grid h3');
      const firstBookTitle = bookTitles.first();
      const secondBookTitle = bookTitles.nth(1);

      // Đợi tối đa 10s cho AI xử lý và trả kết quả
      await expect(firstBookTitle).toContainText('Harry Potter', { timeout: 10000 });
      await expect(secondBookTitle).toContainText('Harry Potter', { timeout: 10000 });

      // Chụp ảnh lại màn hình để "nhìn" kết quả
      await page.screenshot({ path: `test-results/search-ui-${query.replace(/\s+/g, '-')}.png` });
    });
  }
});
