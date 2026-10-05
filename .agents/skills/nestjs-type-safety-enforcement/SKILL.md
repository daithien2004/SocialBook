---
name: nestjs-type-safety-enforcement
description: Ép type safety bằng công cụ trong dự án NestJS - tsconfig strict (Nest scaffold mặc định tắt strictNullChecks và noImplicitAny), typescript-eslint strictTypeChecked, cấm consistent-type-assertions, no-explicit-any, no-non-null-assertion, ban-ts-comment, no-unsafe-*, switch-exhaustiveness-check, cấu hình riêng cho spec và file unsafe.ts, ESLint bulk suppressions để dọn code cũ dần, CI gate, khối luật dán vào AGENTS.md/CLAUDE.md/.cursorrules. Dùng skill này bất cứ khi nào thiết lập hoặc siết lint/tsconfig, muốn AI không cast nữa bằng luật máy kiểm tra, dọn any/as trong codebase cũ, hoặc viết file hướng dẫn cho AI coding agent. Also use for strict TypeScript migration, ESLint flat config for NestJS, ratcheting legacy type errors, agent instruction files.
---

# Type Safety Enforcement

Hướng dẫn bằng lời **không đủ** để chặn AI cast. Cần luật **máy kiểm tra** (compiler + lint + CI) cộng với **hướng dẫn trong repo** (AGENTS.md/CLAUDE.md) để AI biết phải làm gì khi lint đỏ.

Tiền đề: `nestjs-type-safety-core`.

## 1. tsconfig

`nest new` thường sinh tsconfig **không strict** (`strictNullChecks: false`, `noImplicitAny: false`, `strictBindCallApply: false`). Đây là nguyên nhân gốc khiến AI và người cast tùy ý: compiler không báo lỗi để phản ứng. Kiểm tra file của bạn trước.

```jsonc
{
  "compilerOptions": {
    "strict": true,                         // bật cả noImplicitAny, strictNullChecks, useUnknownInCatchVariables...
    "noUncheckedIndexedAccess": true,       // arr[0], record[k] là T | undefined
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
    // "exactOptionalPropertyTypes": true   // cân nhắc sau; hay xung đột với kiểu của thư viện (ORM, class-validator)
  }
}
```

Tương tác với Nest:

- `strictPropertyInitialization` sẽ báo trên DTO/entity: dùng definite assignment `name!: string` cho **DTO, entity, `@WebSocketServer()`** (xem boundaries). Không tắt cờ này toàn cục.
- `emitDecoratorMetadata`, `experimentalDecorators` giữ nguyên.

### Bật dần trên codebase cũ

Không bật `strict` một lần nếu có hàng trăm lỗi. Bật từng cờ, mỗi cờ một PR:

1. `noImplicitAny` → 2. `strictNullChecks` (lỗi nhiều nhất, thường bắt được bug thật) → 3. `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization` → 4. thay bằng `"strict": true` → 5. `noUncheckedIndexedAccess`.

## 2. ESLint (flat config, typescript-eslint với type-aware)

Cần ESLint ≥ 9.24 để dùng bulk suppressions (mục 4). ESLint 9.x đã hết hỗ trợ; nếu đang nâng lên bản mới hơn, kiểm tra tài liệu migration. Nếu dùng `tseslint.config(...)` thay cho `defineConfig(...)`, nội dung tương tự.

```js
// eslint.config.mjs
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist', 'node_modules', 'coverage', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Cấm cast: mọi dạng `as T`, `<T>x`. `as const` vẫn được phép (kiểm tra theo phiên bản rule).
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true, 'ts-check': false,
      }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // Nest: module/provider rỗng dùng decorator
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },

  // Nơi DUY NHẤT được phép cast: các helper có @reason và có test
  {
    files: ['src/shared/typing/unsafe.ts'],
    rules: { '@typescript-eslint/consistent-type-assertions': 'off' },
  },

  // Spec: nới những rule gây ồn do API của Jest, KHÔNG nới cấm cast/any
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',    // expect.any(...), objectContaining(...)
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',          // expect(obj.method)
    },
  },
  {
    files: ['test/support/typed-fake.ts'],
    rules: { '@typescript-eslint/consistent-type-assertions': 'off' },
  },
);
```

Ghi chú:

- `strictTypeChecked` rất nghiêm và sẽ báo nhiều ở codebase cũ. Dùng bulk suppressions (mục 4) thay vì hạ chuẩn.
- Đã có `assertionStyle: 'never'` thì `no-unsafe-type-assertion` thừa; nếu chọn cho phép `as` ở nơi nào đó, bật `no-unsafe-type-assertion` để chặn các cast mở rộng sai.
- Với `eslint-disable`: bật `reportUnusedDisableDirectives` (mặc định cảnh báo trong flat config) và **coi `eslint-disable` cho rule type-safety như cast**: chỉ được dùng ở file được liệt kê ở trên.

## 3. Cổng CI

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint . --max-warnings 0",
    "check": "npm run typecheck && npm run lint && npm test"
  }
}
```

- CI chạy `check` trên mọi PR; không merge khi đỏ.
- Cấm `eslint-disable`/`@ts-*` mới bằng chính các rule ở trên, không bằng review.
- Tùy chọn: đo độ phủ type bằng `type-coverage` (kiểm tra cờ như `--at-least`, `--strict` theo phiên bản) và đặt ngưỡng chỉ được tăng.

## 4. Dọn codebase cũ bằng bulk suppressions (ratchet)

Mục tiêu: **code mới không được vi phạm**, code cũ được dọn dần.

```bash
# 1) Bật luật ở mức "error" trong eslint.config.mjs
# 2) Ghi nhận vi phạm hiện có, ngăn vi phạm mới
npx eslint . --suppress-all           # tạo eslint-suppressions.json (commit file này)

# 3) Mỗi khi sửa xong một số chỗ
npx eslint . --prune-suppressions     # xóa suppression không còn cần

# CI nếu muốn không fail vì suppression chưa prune
npx eslint . --pass-on-unpruned-suppressions
```

- Review PR thấy `eslint-suppressions.json` **tăng** thì từ chối (chỉ được giảm).
- Có thể suppress từng rule: `--suppress-rule <tên-rule>`.

### Thứ tự dọn (theo rủi ro)

1. **Biên tin cậy:** xác thực/JWT, payload WS/HTTP, Redis JSON, config/env, query raw. Sai ở đây gây lỗi bảo mật hoặc dữ liệu hỏng.
2. `as unknown as`, `as any`, `: any`.
3. `!` (non-null) ở luồng nghiệp vụ.
4. `as T` còn lại.
5. File test (dùng fake/builder, xem testing).

Mỗi PR một module nhỏ, mỗi PR giảm số suppression. Đừng gộp refactor type với đổi hành vi.

### Kiểm kê nhanh

```bash
npx eslint src -f json -o /tmp/eslint.json
# đếm theo rule (cần jq):
jq '[.[].messages[].ruleId] | group_by(.) | map({rule: .[0], count: length}) | sort_by(-.count)' /tmp/eslint.json
```

## 5. Hướng dẫn cho AI coding agent

Đặt khối trong `assets/agent-rules.md` vào `AGENTS.md` (hoặc `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`). Khối này nói rõ:

- Lint/tsc đỏ thì **sửa nguồn lỗi**, không cast, không `eslint-disable`.
- Quy trình quyết định và nơi duy nhất được cast.
- Cách báo cáo khi buộc phải dùng escape hatch.
- Chạy `npm run check` trước khi báo xong.

Hướng dẫn mà không có lint kèm theo sẽ bị bỏ qua lúc AI bí; lint mà không có hướng dẫn thì AI sẽ đổi sang cách né khác (`as unknown as`, `eslint-disable`). Cần cả hai.

## Cạm bẫy

- Chỉ bật `strict` trong IDE mà không bật trong `tsconfig` build/CI.
- `strictTypeChecked` mà không có suppressions cho code cũ: team tắt luôn rule.
- Cho phép `eslint-disable` tự do: rule vô hiệu.
- Để AI sửa luôn `eslint.config.mjs`/`tsconfig.json` để "hết lỗi". Đưa vào luật: AI **không** được hạ cấu hình kiểm tra; cần hỏi người dùng.
- Nới rule cho spec quá rộng (cho phép cả `any`/cast).
