import type { Config } from 'jest';

const config: Config = {
    // ==============================================================
    // CẤU HÌNH CHUNG (áp dụng cho tất cả projects)
    // ==============================================================

    // Các đuôi file mà Jest sẽ nhận diện
    moduleFileExtensions: ['js', 'json', 'ts'],

    // Thư mục gốc = thư mục chứa file jest.config.ts (backend/)
    rootDir: '.',

    // Môi trường chạy test: Node.js (không phải browser/jsdom)
    testEnvironment: 'node',

    // Dùng ts-jest để compile TypeScript → JavaScript khi chạy test
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },

    // Map path alias "@/*" → "src/*" (giống tsconfig.json paths)
    // Đây chính là phần bị THIẾU trong cấu hình cũ, gây lỗi
    // "Cannot find module '@/common/guards/jwt-auth.guard'"
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // ==============================================================
    // CẤU HÌNH MULTI-PROJECT
    // Cho phép chạy Unit / Integration / E2E test riêng biệt
    // ==============================================================
    projects: [
        // ----- UNIT TESTS -----
        // Test logic thuần: Entities, Value Objects, Use Cases
        // Chạy bằng: npm run test:unit
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
            transform: { '^.+\\.(t|j)s$': 'ts-jest' },
            moduleFileExtensions: ['js', 'json', 'ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            testEnvironment: 'node',
        },

        // ----- INTEGRATION TESTS -----
        // Test tương tác giữa các layer: Controller + UseCase, Repo + DB
        // Chạy bằng: npm run test:integration
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
            transform: { '^.+\\.(t|j)s$': 'ts-jest' },
            moduleFileExtensions: ['js', 'json', 'ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            testEnvironment: 'node',
        },

        // ----- E2E TESTS -----
        // Test toàn bộ API flow (HTTP request → response)
        // Chạy bằng: npm run test:e2e
        {
            displayName: 'e2e',
            testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
            transform: { '^.+\\.(t|j)s$': 'ts-jest' },
            moduleFileExtensions: ['js', 'json', 'ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            testEnvironment: 'node',
        },
    ],

    // ==============================================================
    // CẤU HÌNH COVERAGE (báo cáo độ phủ test)
    // ==============================================================

    // Thu thập coverage từ tất cả file .ts/.js trong src/
    // Loại trừ: main.ts, module files, DTOs, index files
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/index.ts',
    ],

    // Thư mục xuất báo cáo coverage
    coverageDirectory: './coverage',
};

export default config;
