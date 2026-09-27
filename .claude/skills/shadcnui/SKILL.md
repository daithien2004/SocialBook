---
name: shadcnui
description: Shadcn/UI conventions for this Next.js 16 + React 19 project. Covers the components.json config (new-york style, neutral base, lucide icons), the components/ui vs components/shared split, Radix primitives, cva variants, cn() merging, and Tailwind v4 CSS-variable theming. Triggers on tasks involving shadcn components, Radix UI, UI primitives, or component customization.
---

# Shadcn/UI Best Practices

> Cập nhật theo **Shadcn CLI mới + React 19 + Next.js 16 (App Router) + Tailwind v4**.

## 1. Triết lý Shadcn

Shadcn **không phải component library** theo nghĩa truyền thống — bạn **copy code vào project**, không install package:

- Component là của bạn, muốn sửa gì cũng được
- Không bị lock vào version của library
- Phải tự quản lý khi Shadcn release update

> Mindset: đây là **starting point**, không phải black box.

## 2. Cấu hình dự án

```json
// frontend/components.json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.mjs",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Thêm component mới **luôn qua CLI** để giữ đúng style `new-york`, base color và alias:

```bash
cd frontend
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu tooltip
```

CLI đọc `components.json` và đặt file vào `@/components/ui`. **Không** copy-paste tay từ docs — sẽ lệch theme token.

## 3. Cấu trúc thư mục

```
frontend/src/components/
├── ui/         ← shadcn primitives (sinh bởi CLI — hạn chế sửa trực tiếp)
└── shared/     ← wrapper / composed components của team
```

- **`ui/`**: primitives do CLI sinh (button, dialog, dropdown-menu, …). Ưu tiên giữ nguyên để `shadcn add` / update không conflict. Khi cần đổi hành vi, **tạo wrapper trong `shared/`**.
- **`shared/`**: component ghép từ primitives, có business logic nhẹ, dùng chung nhiều feature.
- Component gắn chặt với một feature → đặt trong `src/features/<feature>/components/`.

```tsx
// components/shared/AppButton.tsx — wrapper thay vì sửa ui/button.tsx
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

export function AppButton({ loading, disabled, children, className, ...props }: AppButtonProps) {
  return (
    <Button disabled={loading || disabled} className={cn(className)} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

## 4. React 19 + Server Components

- **Mặc định là Server Component.** Chỉ thêm `'use client'` khi cần hooks, event handler, hoặc browser API.
- Shadcn primitives dựa trên Radix **cần `'use client'`** — nhưng file trong `ui/` đã có sẵn directive, nên chỉ cần đặt `'use client'` ở **component của bạn** khi nó dùng state/handler.
- Truyền dữ liệu xuống client component qua props (đã serialize được) — không truyền function/hàm từ server.

```tsx
// Server Component (không có directive)
export default async function Page() {
  const books = await getBooks();
  return <BookGrid books={books} />;   // BookGrid có thể là client
}
```

- React 19: dùng `ref` như prop bình thường cho function component (không cần `forwardRef` cho component mới), nhưng code shadcn hiện tại vẫn dùng `React.forwardRef` — **giữ nguyên theo code đã sinh**.

## 5. Variants với `cva`

Dùng `class-variance-authority` (đã có sẵn) cho component nhiều biến thể — đúng pattern shadcn:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

## 6. Class merging với `cn()`

Luôn ghép class qua `cn()` (clsx + tailwind-merge) để class sau ghi đè class trước:

```tsx
import { cn } from '@/lib/utils';

<Card className={cn('p-4', isActive && 'ring-2 ring-ring', className)} />
```

Không nối chuỗi class thủ công — utility xung đột sẽ không được dedupe.

## 7. Theming (Tailwind v4 CSS variables)

Theme dùng **CSS variables** trong `globals.css` (`cssVariables: true`, base `neutral`), map sang utility qua `@theme inline`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
}
```

**Chỉ dùng semantic token**, không hard-code màu:

```tsx
<div className="bg-background text-foreground border-border">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<p className="text-muted-foreground">
<span className="text-destructive">
```

Xem skill `tailwindcss-advanced` để biết chi tiết `@theme`, design tokens và dark mode.

## 8. Icons

- Dùng **lucide-react** (`iconLibrary: "lucide"`), thống nhất một bộ icon.
- Kích thước qua class: `<Check className="h-4 w-4" />`.
- Icon trong button: `size-4` + `mr-2` (hoặc `gap-2` nếu button dùng flex).

## 9. Accessibility

- Radix đã lo phần lớn ARIA — **không phá** bằng cách tự render lại primitive.
- Mọi control cần label: dùng `<Label htmlFor>` của shadcn cho form.
- Giữ focus ring: `focus-visible:ring-2 focus-visible:ring-ring`.
- Dialog/Dropdown đã có focus trap + Esc — không tự chế lại.

## 10. Anti-patterns

- ❌ Sửa trực tiếp file trong `ui/` khi có thể tạo wrapper trong `shared/`.
- ❌ Copy-paste component từ docs thay vì dùng `npx shadcn@latest add`.
- ❌ Hard-code màu (`bg-white`, `text-gray-900`) thay vì semantic token.
- ❌ Thêm `'use client'` tràn lan — chỉ khi thực sự cần.
- ❌ Nối class thủ công thay vì `cn()`.
- ❌ Tự viết lại hành vi Radix (focus trap, keyboard nav) đã có sẵn.
