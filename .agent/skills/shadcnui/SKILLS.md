# Shadcn/UI Best Practices cho React

> Dành cho Senior Developer — cập nhật theo Shadcn v2 + React 18+

---

## 1. Hiểu triết lý của Shadcn

Shadcn **không phải là component library** theo nghĩa truyền thống. Bạn **copy code vào project**, không install package. Điều này có nghĩa:

- Component là của bạn — muốn sửa gì thì sửa
- Không bị lock vào version của library
- Phải tự quản lý khi Shadcn release update

> Senior cần có mindset: đây là **starting point**, không phải black box.

---

## 2. Cấu trúc thư mục

Mặc định Shadcn đặt component vào `components/ui/`. Nên tách bạch rõ ràng:

```
components/
  ui/           ← shadcn primitives, KHÔNG sửa trực tiếp
  common/       ← wrapper/composed components của team
  features/     ← components gắn với business logic
```

Khi cần customize, tạo wrapper trong `common/` thay vì sửa thẳng vào `ui/`.

```tsx
// components/common/AppButton.tsx
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppButtonProps extends ButtonProps {
  loading?: boolean
}

export function AppButton({ loading, className, children, ...props }: AppButtonProps) {
  return (
    <Button
      className={cn("min-w-[120px]", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </Button>
  )
}
```

---

## 3. Theming đúng cách

Shadcn dùng CSS variables qua Tailwind. Toàn bộ màu sắc nằm trong `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

**Nguyên tắc:**

- Chỉ thay đổi màu qua CSS variables, không hardcode màu Tailwind (`bg-blue-500`) trong component
- Dùng semantic tokens: `bg-primary`, `text-foreground`, `border-border`
- Dark mode chỉ cần override variables trong `.dark` class

---

## 4. Customize component với `cn()` và `cva`

**Dùng `cn()` để merge class có điều kiện:**

```tsx
import { cn } from "@/lib/utils"

<Button className={cn("w-full", isLoading && "opacity-50 cursor-not-allowed")}>
  Submit
</Button>
```

**Dùng `cva` để tạo variant mới:**

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 bg-destructive/10 text-destructive",
        success: "border-green-500/50 bg-green-500/10 text-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

---

## 5. Form với React Hook Form + Zod

Combo chính thức của Shadcn. Senior cần thành thục pattern này:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Tối thiểu 8 ký tự"),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = (values: FormValues) => {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Đăng nhập</Button>
      </form>
    </Form>
  )
}
```

> `FormMessage` tự động lấy error từ Zod — không cần tự viết error handling thủ công.

---

## 6. Dialog / Sheet — quản lý state

**Anti-pattern:** quản lý `open` state ở component cha và truyền prop xuống sâu.

**Cách tốt — dùng Zustand store:**

```tsx
// stores/useDialogStore.ts
import { create } from "zustand"

interface DialogStore {
  confirmOpen: boolean
  openConfirm: () => void
  closeConfirm: () => void
}

export const useDialogStore = create<DialogStore>((set) => ({
  confirmOpen: false,
  openConfirm: () => set({ confirmOpen: true }),
  closeConfirm: () => set({ confirmOpen: false }),
}))
```

```tsx
// Dùng bất kỳ đâu, không cần prop drilling
function DeleteButton() {
  const { openConfirm } = useDialogStore()
  return <Button variant="destructive" onClick={openConfirm}>Xoá</Button>
}

function ConfirmDialog() {
  const { confirmOpen, closeConfirm } = useDialogStore()
  return (
    <AlertDialog open={confirmOpen} onOpenChange={closeConfirm}>
      {/* ... */}
    </AlertDialog>
  )
}
```

---

## 7. DataTable pattern

`DataTable` của Shadcn dùng TanStack Table. Nên tách file rõ ràng:

```
features/users/
  components/
    UserTable.tsx      ← DataTable wrapper
    columns.tsx        ← column definitions
  hooks/
    useUserTable.ts    ← sorting, filtering, pagination state
```

**`columns.tsx`:**

```tsx
import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types"

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Tên",
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Email
      </Button>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
]
```

---

## 8. Accessibility — không được bỏ qua

Shadcn build trên Radix UI — Radix đã xử lý nhiều a11y. Nhưng senior cần chủ động:

```tsx
// Icon-only button phải có aria-label
<Button size="icon" aria-label="Xoá người dùng">
  <Trash2 className="h-4 w-4" />
</Button>

// Dialog phải có DialogTitle (Radix sẽ warn nếu thiếu)
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Xác nhận xoá</DialogTitle>  {/* bắt buộc */}
      <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

## 9. Performance

**Import trực tiếp, không barrel import:**

```tsx
// ✅ Đúng
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ❌ Sai — tạo index.ts re-export hết sẽ phá tree-shaking
import { Button, Input } from "@/components/ui"
```

**`Command` / `Combobox` với list lớn cần virtualization:**

```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

// Mặc định Command render hết items — thêm virtual scroll nếu > 200 items
```

---

## 10. Update và versioning

Khi Shadcn release update, dùng lệnh diff để xem thay đổi:

```bash
# Xem diff của component cụ thể
npx shadcn@latest diff button

# Update component
npx shadcn@latest add button --overwrite
```

**Chiến lược quản lý:**

- Giữ `ui/` folder sạch, ít customize trực tiếp
- Customize thông qua wrapper ở `common/`
- Review diff trước khi overwrite — đặc biệt nếu đã sửa trực tiếp

---

## Quick Reference

| Tình huống | Giải pháp |
|---|---|
| Thêm variant mới | `cva` trong wrapper component |
| Đổi màu toàn app | CSS variables trong `globals.css` |
| Global dialog state | Zustand store |
| Form validation | React Hook Form + Zod |
| List > 100 rows | TanStack Virtual |
| Component update | `npx shadcn@latest diff` |
| Custom default props | Wrapper ở `common/` |

---

> **Nguyên tắc quan trọng nhất:** Shadcn cho bạn toàn quyền kiểm soát — nhưng cũng đòi hỏi kỷ luật. Thiết lập convention rõ ràng từ đầu về nơi customize, cách đặt tên, và cách extend component.