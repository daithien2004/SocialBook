# Hướng dẫn refactor Hook và Component (dành cho AI)

Mục tiêu: hook và component **dễ đọc, dễ sửa, dễ liên kết với nhau**. Nhìn component là hiểu luồng mà không phải mở hook. Nhìn hook là biết nó lo đúng một việc.

Stack: Next.js App Router, React, TypeScript, Zustand, TanStack React Query v5, Tailwind v4, shadcn/ui. Đọc thêm `nextjs-frontend-rules.md` nếu có; khi hai file mâu thuẫn, file đó thắng về quy tắc chung, file này thắng về cấu trúc hook/component.

---

## PHẦN 0. Luật bất di bất dịch

1. **Refactor không đổi hành vi.** Mọi thay đổi phải giữ nguyên những gì người dùng thấy và dữ liệu gửi lên server. Nếu phát hiện bug trong lúc refactor, **không sửa lẫn vào**: ghi lại thành mục riêng và hỏi.
2. **Lập kế hoạch trước, sửa sau.** Bước đầu tiên luôn là báo cáo (Phần 4), chưa đụng code. Chỉ sửa sau khi người dùng duyệt.
3. **Từng bước nhỏ, mỗi bước chạy được.** Mỗi lần chỉ xử lý một hook hoặc một cụm liên quan. Sau mỗi bước chạy `tsc --noEmit`, lint, test (nếu có). Không gộp nhiều thay đổi lớn vào một lần.
4. **Không thêm thư viện, không đổi kiến trúc tổng thể, không đổi tên hàng loạt** ngoài phạm vi được duyệt.
5. **Không xác định được hành vi thì hỏi**, đừng đoán. Đặc biệt với effect/ref có vẻ thừa: kiểm tra ai đọc, khi nào chạy, deps là gì trước khi xoá.
6. **Xoá cái thừa chỉ khi đã chứng minh nó thừa** (có kịch bản/bằng chứng), không xoá vì "trông không cần".
7. **Không chạy theo số dòng.** Một hook 120 dòng thuộc cùng một khái niệm tốt hơn 5 hook 25 dòng chằng chịt nhau.

---

## PHẦN 1. Hook tốt là gì

### Mục đích đúng của hook

Hook để **đặt tên cho một khái niệm nghiệp vụ**, không phải để giấu code cho file component gọn. Di chuyển 300 dòng từ component sang hook chỉ dời sự rối sang chỗ khác.

- Tốt: `useReadingProgress(chapterId)`, `useChapterNavigation()`, `useReaderShortcuts()`
- Xấu: `useReaderPage()`, `useReaderLogic()`, `useXxxManager()`, `useXxxHandlers()` (tên theo trang hoặc theo kiểu triển khai, không theo khái niệm)

### Phép thử một câu

Mô tả hook bằng một câu **không có chữ "và"**. Nếu phải nói "hook này lo tiến độ **và** phím tắt **và** cài đặt hiển thị" thì hook đang gánh nhiều khái niệm → tách.

### Dấu hiệu nhận biết god hook (dùng để phát hiện, không phải luật cứng)

- Trả về nhiều giá trị (khoảng > 6) hoặc trả về object "túi đồ" để component chọn lấy.
- Nhận nhiều tham số (khoảng > 4), nhất là truyền `ref`/`setState` của nơi khác vào.
- Chứa nhiều nhóm `useState`/`useEffect` không liên quan nhau về mặt khái niệm.
- Tên chứa tên cả trang, `Manager`, `Logic`, `Handler`.
- Sửa một tính năng nhỏ mà phải sửa nhiều hook.
- Hook A cần giá trị từ hook B, B cần ref của C: phải lần theo dây mới hiểu.

Các ngưỡng số ở trên chỉ là gợi ý để cảnh báo; quyết định cuối dựa vào phép thử một câu và việc các phần có thật sự liên quan nhau không.

### Component đọc như mục lục

Đọc phần đầu component phải hiểu được mà không mở hook:

```tsx
function ChapterReader({ chapterId }: Props) {
  const chapter = useChapter(chapterId);              // React Query
  const { save } = useReadingProgress(chapterId);     // ghi tiến độ
  const fontSize = useReaderSettings((s) => s.fontSize); // Zustand selector

  if (chapter.isPending) return <ChapterSkeleton />;
  return (
    <>
      <ReadingProgressBar />  {/* tự nghe scroll, state riêng */}
      <ChapterContent chapter={chapter.data} fontSize={fontSize} onFinish={save} />
    </>
  );
}
```

Hook nên trả **ít giá trị, có nghĩa** (khoảng 1-4), tên trả về nói lên ý nghĩa.

---

## PHẦN 2. Quy trình refactor (làm đúng thứ tự)

### Bước 1. Kiểm kê

Với mỗi hook/component được giao, lập bảng: mỗi `useState`, `useRef`, `useEffect`, `useMemo`, `useCallback`, lời gọi store/query, handler. Ghi: **cái gì, ai đọc, ai ghi, chạy khi nào, phục vụ khái niệm gì**.

### Bước 2. Phân loại từng mục vào đúng chỗ (quan trọng nhất)

Nhiều khi hook tự co lại một phần ba chỉ sau bước này, không cần chia thêm.

| Thứ đang nằm trong hook | Chuyển đến | Điều kiện |
|---|---|---|
| Fetch, cache, loading/error viết tay | **React Query** (`useQuery`/`useMutation`) | Dữ liệu từ server |
| State được copy/tính từ state hoặc props khác | **Tính trong render** (derived), xoá state | Không cần lưu riêng |
| `useEffect` chỉ để đồng bộ state này sang state kia | Xoá effect, tính trực tiếp hoặc dùng `key` | Xác minh không có side effect thật |
| Filter, tab, trang, chương hiện tại cần share/reload | **URL** (`searchParams`/route segment) | Người dùng cần giữ khi reload/chia sẻ link |
| Logic phản ứng với click/submit nhưng viết trong effect | **Event handler** | Phản ứng với hành động người dùng |
| Phép tính thuần không dùng React | **`lib/`** (hàm thuần, có test) | Không dùng hook/state |
| State chỉ phục vụ một vùng UI nhỏ | **Component con** giữ state đó | State và JSX dùng nó cùng chỗ |
| Giá trị cấu hình nhiều trang cùng đọc | **Zustand** với selector | Nhiều nơi đọc, không phải server data |
| Dữ liệu server đang bị copy vào Zustand | Xoá khỏi store, dùng Query | Một dữ liệu một nơi |
| Sự kiện tần suất cao kéo re-render component lớn | Component nhỏ tự giữ, hoặc `ref`/CSS variable | Đã đo hoặc có kịch bản rõ |
| Nhiều `useState` đổi cùng nhau theo quy luật | **`useReducer`** | Một chỗ mô tả trạng thái → sự kiện → trạng thái |

Phần còn lại sau khi lọc mới là "hook thật". Chỉ khi đó mới quyết định chia hook.

### Bước 3. Nhóm phần còn lại theo khái niệm

- Gom các state/effect/handler **cùng phục vụ một khái niệm** thành một hook, đặt tên theo khái niệm.
- Các nhóm không liên quan → hook riêng hoặc component con riêng.
- Nếu hook chỉ phục vụ một vùng UI → **tách vùng UI đó thành component có hook của nó**, đừng kéo hook lên cha. Cha không cần biết gì về nó.

### Bước 4. Làm cho ranh giới hook đơn giản

- Hook nhận ít tham số; nhận **giá trị/id**, không nhận `ref`/`setState` của hook khác.
- Hook không phụ thuộc vào hook "anh em" qua ref. Nếu bắt buộc phụ thuộc, cân nhắc gộp lại làm một hook đúng khái niệm, hoặc đưa phần chung ra một hook thứ ba mà cả hai cùng dùng.
- Hook trả **ít giá trị có nghĩa**; không trả toàn bộ setter và state nội bộ "cho tiện".
- Đừng có `useEffect` chỉ để phản ứng với state của hook khác: chuyển logic về chỗ gây ra thay đổi đó.

### Bước 5. Áp dụng 3 tầng

```
lib/        → logic thuần (tính toán, định dạng, validate), test được không cần React
hooks/      → nối React với logic (state, effect, query), mỏng
components/ → giao diện, đọc như mục lục
```

Hook mỏng vì phần nặng đã nằm ở `lib/`.

### Bước 6. Tổ chức file

- Theo tính năng: `features/reader/{components,hooks,lib,types}`. Hook của một tính năng nằm cạnh component dùng nó.
- Thư mục `hooks/` chung chỉ chứa hook **thật sự dùng chung** nhiều tính năng.
- Không tạo `utils.ts`/`helpers.ts` khổng lồ; tách theo chủ đề.
- Mỗi hook một file, tên file = tên hook.

---

## PHẦN 3. Các mẫu thường gặp (trước và sau)

### Mẫu A. God hook → hook theo khái niệm

```tsx
// Trước: useReaderPage trả 18 giá trị
const { chapter, isLoading, progress, setProgress, fontSize, setFontSize,
        showControls, toggleControls, handleKeyDown, goNext, goPrev, ... } = useReaderPage(id);

// Sau: mỗi khái niệm một hook, component ghép lại
const chapter = useChapter(id);                       // Query
const { save } = useReadingProgress(id);              // tiến độ
const { goNext, goPrev } = useChapterNavigation(id);  // điều hướng
useReaderShortcuts({ onNext: goNext, onPrev: goPrev }); // phím tắt
```

`fontSize` ở Zustand (nhiều trang đọc). `showControls` thành `useState` trong component điều khiển (chỉ nó đọc).

### Mẫu B. State dẫn xuất

```tsx
// Trước
const [items, setItems] = useState(data);
const [count, setCount] = useState(0);
useEffect(() => { setCount(items.length); }, [items]);

// Sau
const count = items.length; // tính trong render
```

### Mẫu C. Effect thừa cho logic của sự kiện

```tsx
// Trước: effect phản ứng với state vừa được set trong click
useEffect(() => { if (submitted) { track(); navigate(); } }, [submitted]);

// Sau: làm ngay trong handler
function onSubmit() { track(); navigate(); }
```

### Mẫu D. Vùng UI có state riêng thành component con

```tsx
// Trước: cha giữ progress, cha và con đều re-render mỗi lần scroll
// Sau: <ReadingProgressBar /> tự lắng nghe scroll, giữ state riêng (hoặc cập nhật qua ref/CSS variable)
// Cha không biết gì về nó
```

### Mẫu E. Nhiều useState nối bằng effect → useReducer

Dùng khi các state đổi cùng nhau theo quy luật (ví dụ `status`, `error`, `retryCount` của một quy trình). Một reducer mô tả toàn bộ chuyển trạng thái ở một chỗ.

### Mẫu F. Logic thuần ra `lib/`

```ts
// lib/reading-progress.ts  (không import React)
export function getContentProgress(scrollTop: number, height: number, viewport: number) { ... }
```

Hook chỉ gọi hàm này. Nếu cùng phép tính xuất hiện ở 2 nơi **và là cùng khái niệm nghiệp vụ** thì dùng chung một hàm. Nếu chỉ giống hình thức nhưng đổi vì lý do khác nhau thì để riêng.

---

## PHẦN 4. Những điều KHÔNG được làm

- Không chuyển nguyên code từ component sang hook rồi coi như xong ("di chuyển mà không đặt tên khái niệm").
- Không tách thành nhiều hook nhỏ chằng chịt nhau qua ref/setter; tệ hơn gộp lại.
- Không tạo hook bọc một dòng `useState` không thêm ý nghĩa.
- Không đẩy state lên store chỉ vì "sợ mất" khi re-render.
- Không đổi hành vi, thứ tự side effect, thời điểm lưu dữ liệu, hay cache key trong lúc refactor.
- Không xoá `useEffect`/`useRef` khi chưa xác minh cơ chế.
- Không sửa `components/ui/*` (shadcn) trừ khi được yêu cầu.
- Không "tối ưu" bằng `useMemo`/`useCallback` khi chưa có bằng chứng cần.
- Không refactor các file ngoài phạm vi được giao.

---

## PHẦN 5. Định dạng làm việc

### Giai đoạn 1: Báo cáo kế hoạch (chưa sửa code)

Với mỗi hook/component trong phạm vi:

```
### <tên hook/component> — <file:dòng>
- Hiện trạng: số dòng, số state/effect, số giá trị trả về, nó đang lo những khái niệm nào
- Phép thử một câu: pass | fail (và vì sao)
- Kiểm kê & phân loại: bảng (mục → chuyển đến đâu → lý do)
- Đề xuất cấu trúc mới: danh sách hook/component/lib sau refactor, tên, trách nhiệm một câu, giá trị trả về
- Rủi ro đổi hành vi: (điểm cần chú ý: thứ tự effect, cache, persist, hydration...)
- Điểm chưa chắc / cần hỏi:
- Bug phát hiện (KHÔNG sửa trong refactor): ...
```

Kết thúc bằng thứ tự thực hiện đề xuất (từng bước, mỗi bước chạy được).

### Giai đoạn 2: Thực hiện (sau khi được duyệt)

Mỗi bước:
1. Nêu bước đang làm và file đụng vào.
2. Sửa tối thiểu.
3. Chạy `tsc --noEmit`, lint, test, build nếu có; báo kết quả thật.
4. Tóm tắt diff: cái gì chuyển đi đâu.
5. Xác nhận bằng lời "hành vi không đổi ở chỗ nào, và cách kiểm tra": ví dụ kịch bản tay để người dùng thử (mở chương, cuộn, đổi chương, reload).

### Giai đoạn 3: Tổng kết

- Trước/sau: số dòng, số giá trị hook trả về, số state trong store, số effect.
- Những chỗ đã kiểm tra nhưng quyết định **giữ nguyên** và lý do.
- Bug/rủi ro tìm thấy ngoài phạm vi (chưa sửa).

---

## PHẦN 6. Checklist hoàn thành

- [ ] Mỗi hook mô tả được bằng một câu không có chữ "và"
- [ ] Tên hook theo khái niệm nghiệp vụ, không theo trang hay kiểu triển khai
- [ ] Hook trả về ít giá trị có nghĩa; không trả "túi đồ"
- [ ] Đọc phần đầu component là hiểu luồng, không cần mở hook
- [ ] Không còn hook phụ thuộc hook khác qua `ref`/`setState` truyền chéo
- [ ] Không còn state dẫn xuất được lưu riêng, không còn effect chỉ để đồng bộ state
- [ ] Không còn dữ liệu server nằm trong Zustand/`useState`
- [ ] Logic thuần nằm ở `lib/`, không import React
- [ ] State chỉ phục vụ một vùng UI nằm trong component của vùng đó
- [ ] Hook/component của tính năng nằm cùng thư mục tính năng
- [ ] `tsc`, lint, test, build đều pass (hoặc báo rõ chỗ fail có sẵn từ trước)
- [ ] Hành vi không đổi; đã nêu kịch bản kiểm tra tay
