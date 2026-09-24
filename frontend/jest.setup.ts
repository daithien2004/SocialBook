import '@testing-library/jest-dom';

// Bỏ qua validate env của @t3-oss/env-nextjs khi chạy jest
// (test environment không có .env đầy đủ như thật)
process.env.SKIP_ENV_VALIDATION = 'true';

// Mock matchMedia for components like Next Themes or Radix UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
