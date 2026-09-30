# Báo cáo Rà soát Frontend (sb_develop)

Dưới đây là báo cáo rà soát mã nguồn frontend dựa trên "Bộ quy tắc Frontend" đã cung cấp.

---

### [Cao] Che giấu Hydration Mismatch bằng `suppressHydrationWarning`
- **Loại:** Bug
- **Vị trí:** `src/features/chapters/components/ChapterContent.tsx:188` và `src/store/useReadingSettings.ts`
- **Đã xác minh:** `useReadingSettings` dùng middleware `persist` của Zustand kết hợp với `localStorage`. Ở server, hàm `getSystemDefaults()` trả về `DARK_DEFAULTS` do `window === 'undefined'`. Nhưng ở client, nó đọc từ `localStorage` ra cài đặt của user (ví dụ `LIGHT_DEFAULTS`). Sự khác biệt giữa giá trị server render và giá trị hydration ở client tạo ra Hydration Mismatch. Thay vì xử lý đúng, component `<main>` trong `ChapterContent` lại thêm cờ `suppressHydrationWarning`.
- **Kịch bản:** Khi user cài đặt nền sáng, F5 lại trang, HTML trả về từ server là nền tối, sau đó client bù đắp nền sáng, gây ra một chớp đen (flash) rất nhỏ, và React bỏ qua cảnh báo lỗi hydration.
- **Nguyên tắc liên quan:** PHẦN 2B (Zustand: persist middleware + hydration mismatch) và PHẦN 2 (Hydration: Không dùng `suppressHydrationWarning` để che lỗi thật).
- **Cách sửa đề xuất:** 
  Thêm `skipHydration: true` trong cấu hình `persist` ở `useReadingSettings.ts`. Khôi phục trạng thái bằng tay trong 1 `useEffect` ở client, hoặc dùng phương pháp cờ `hasHydrated` để render an toàn. Sau đó gỡ bỏ cờ `suppressHydrationWarning`.

### [Trung bình] Sử dụng `isLoading` của React Query v5 thay vì `isPending`
- **Loại:** Rủi ro
- **Vị trí:** Rất nhiều component và hook (ví dụ: `src/features/reading-rooms/hooks/useReadingRoomData.ts`, `src/features/books/hooks/useBookDetail.ts`, `ChapterManagementClient.tsx`...)
- **Đã xác minh:** Tìm thấy bằng Regex. Code hiện tại đang dùng `const { data, isLoading } = useQuery(...)`. Ở v5, `isLoading` tuy chưa bị xóa bỏ hoàn toàn nhưng nó tương đương với `isFetching && isPending` (chỉ true ở lần tải đầu). Nếu query bị `enabled: false`, `isLoading` sẽ là `false` trong khi `isPending` vẫn là `true`.
- **Kịch bản:** Khi hiển thị Skeleton loader dựa trên `isLoading` cho một query bị tạm ngừng (`enabled: false`), giao diện sẽ bị trống không (trắng trang) thay vì chờ đợi, do `isLoading = false`.
- **Nguyên tắc liên quan:** PHẦN 2B (React Query v5: không còn `isLoading` - thay `isPending`).
- **Cách sửa đề xuất:** 
  Sửa toàn bộ `isLoading` (destructure từ `useQuery`) thành `isPending` để xử lý trạng thái chưa có dữ liệu chuẩn xác nhất theo v5. (Lưu ý: với `useMutation` cũng tương tự, đổi thành `isPending`).

### [Thấp] Khả năng sai lệch UI do dùng class cũ (v3) của shadcn/ui trên Tailwind v4
- **Loại:** Rủi ro
- **Vị trí:** Toàn bộ `src/components/ui/*.tsx` (ví dụ: `input.tsx`, `dropdown-menu.tsx`, `button.tsx`)
- **Đã xác minh:** Lệnh tìm kiếm cho thấy có hơn 40 file UI đang dùng `outline-none` và `shadow-sm`. Theo Tailwind v4, `outline-none` đã được đổi thành `outline-hidden`, trong khi `shadow-sm` nay đại diện cho bóng nhỏ hơn v3 (bóng v3 `shadow-sm` = v4 `shadow-xs`). Các component này mang code cũ.
- **Kịch bản:** Khi user dùng phím tab chuyển focus vào input, viền focus mặc định của trình duyệt có thể không bị giấu đi do `outline-none` không có tác dụng. Bóng của các dropdown/card có thể nhỏ hơn so với bản gốc thiết kế của shadcn.
- **Nguyên tắc liên quan:** PHẦN 2B (Tailwind CSS v4 đổi tên utility; shadcn/ui tương thích v4).
- **Cách sửa đề xuất:** 
  Ghi nhận để kiểm tra thực tế trên trình duyệt. Đổi `outline-none` -> `outline-hidden` nếu bị lỗi viền focus. Không tự động find-and-replace hàng loạt trừ khi xác nhận có sai lệch UI.

---

### Những rủi ro đã kiểm tra, KHÔNG phải vấn đề
1. **Quản lý state `isControlsVisible`:** Tôi đã kiểm tra xem state ẩn/hiện thanh dock có nằm trong store dùng chung (Zustand) và gây lỗi lưu state vượt quá tuổi thọ component hay không. May mắn là chúng ta vừa dọn dẹp nó xong, state hiện tại đang được giữ cục bộ và phân tách xuất sắc ở `ReadingProgressBar` và `useAutoHideDock`. Hoàn toàn tuân thủ nguyên tắc "State thuộc về đâu thì sống ở đó".
2. **`NEXT_PUBLIC_*`:** Đã kiểm tra `.env`, chỉ chứa `NEXT_PUBLIC_NEST_API_URL` và `NEXT_PUBLIC_SOCKET_URL`. Không có rò rỉ secret key hoặc credential ra trình duyệt.

### Cần hỏi xác nhận
Dự án có kế hoạch xử lý Dark Mode không bị chớp đen (flash of unstyled content) như thế nào? Thường thì người ta nhúng 1 script siêu nhẹ ở `<head>` để đọc `localStorage` và dán class `dark` trước khi body render. Nếu làm cách này, ta có thể dùng cookie hoặc đồng bộ với Zustand mà không cần `suppressHydrationWarning`.
