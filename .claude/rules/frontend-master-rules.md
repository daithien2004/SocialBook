# FRONTEND MASTER RULES
Bộ quy tắc tổng thể để AI **audit** và **chỉnh sửa** dự án Frontend cho dễ maintain, sạch, an toàn.

Stack: Next.js (App Router) · React · TypeScript · Zustand · TanStack React Query v5 (`^5.67.2`) · Tailwind CSS v4 (`^4.0.0`) · shadcn/ui.

File này tự đứng được. Nó gộp và thay thế `nextjs-frontend-rules.md` và `refactor-hooks-components.md`. Nếu còn các file đó mà mâu thuẫn, file này thắng.

---

## 0. ĐỌC TRƯỚC: LUẬT CỨNG CHO AI

Bạn là reviewer/kỹ sư FE cẩn thận. Mục tiêu là code **đúng, dễ đọc, dễ sửa, an toàn**, không phải code "đẹp theo sách" và không phải thay đổi thật nhiều.

| # | Luật |
|---|---|
| H1 | **Đọc thật, không đoán.** `grep/rg` chỉ để *tìm chỗ cần đọc*. Phán xét chỉ sau khi đã đọc toàn bộ file liên quan (kể cả nơi gọi và nơi được gọi). |
| H2 | **Mỗi phát hiện phải có bằng chứng:** `file:dòng`, đoạn code, cơ chế (deps, điều kiện chạy, ai gọi), và kịch bản ("khi người dùng làm X thì Y xảy ra"). Không có kịch bản thì đó không phải bug, chỉ là Gợi ý. |
| H3 | **Xác minh cơ chế trước khi gán mức độ.** Chưa xác minh được thì ghi "Chưa xác minh", không gán Cao/Thấp. Người đọc tin theo bằng chứng, không tin theo giọng văn chắc chắn. |
| H4 | **Xác minh API bằng nguồn thật**, không dựa trí nhớ: đọc `package.json`, file type `.d.ts` trong `node_modules`, hoặc docs đúng version. Không bịa tên hàm/option. |
| H5 | **Refactor không đổi hành vi.** Bug phát hiện trong lúc refactor → ghi thành mục riêng, không sửa lẫn. |
| H6 | **Không tự ý:** thêm dependency, đổi kiến trúc, đổi tên hàng loạt, nâng version, sửa file ngoài phạm vi được giao. |
| H7 | **Không đụng:** `components/ui/*` của shadcn (trừ khi được yêu cầu), file sinh tự động, lockfile, `.next/`, migrations, file `.env*` thật. |
| H8 | **Không khẳng định tuyệt đối** ("luôn", "không bao giờ") khi quy tắc có điều kiện. Nêu điều kiện áp dụng. |
| H9 | **Báo cáo độ phủ trung thực:** đã xem những gì, chưa xem những gì. Không được nói "đã audit toàn bộ dự án" nếu chỉ xem một phần. |
| H10 | **Báo kết quả lệnh thật** (`tsc`, lint, test, build), kể cả khi fail. Phân biệt lỗi có sẵn (baseline) với lỗi do bạn gây ra. |
| H11 | **Không chắc thì hỏi**, gom câu hỏi lại một lần, đừng chọn bừa. Hỏi khi: quyết định sản phẩm, hành vi mong muốn không rõ, thay đổi ảnh hưởng dữ liệu người dùng, thay đổi lớn hơn phạm vi. |
| H12 | **Không sửa vì lo lắng thiết kế.** Nghi là bug, kiểm tra, không thấy kịch bản thì bỏ, và ghi lại "đã kiểm tra, không phải vấn đề". |

### Ba chế độ làm việc

- **AUDIT**: chỉ đọc và báo cáo. Không sửa file. (Mặc định nếu người dùng không nói rõ.)
- **FIX**: sửa theo lô đã được duyệt (mục 9).
- **VERIFY**: chạy kiểm tra, đối chiếu hành vi trước/sau, tổng kết.

---

## 1. BỐI CẢNH DỰ ÁN (AI TỰ ĐIỀN TRƯỚC KHI AUDIT)

Đọc repo để điền bảng này. Điểm nào không xác định được thì hỏi người dùng.

| Mục | Giá trị |
|---|---|
| Next.js version / Router (App hay Pages) | |
| React version (có React Compiler không) | |
| TypeScript (`strict`? `noUncheckedIndexedAccess`?) | |
| React Query | v5 (`^5.67.2`) |
| Zustand version | |
| Tailwind | v4 (`^4.0.0`) |
| shadcn/ui (bản tương thích Tailwind v4?) | |
| Package manager, scripts có sẵn (`lint`, `test`, `build`, `typecheck`) | |
| Test stack (Vitest/Jest/Playwright/Testing Library/MSW) | |
| Auth, i18n, analytics/error tracking đang dùng | |
| Trình duyệt phải hỗ trợ | |
| Nơi deploy (Vercel/self-host) | |

---

## 2. QUY TRÌNH

### Phase 0. Khảo sát (không phán xét)
- Đọc `package.json`, `next.config.*`, `tsconfig.json`, cấu hình ESLint/Prettier, `components.json`, file CSS chính (`globals.css`).
- Xem cây thư mục (2-3 cấp) và liệt kê 30 file lớn nhất (Phụ lục A).
- Điền bảng mục 1.

### Phase 1. Đường cơ sở (baseline) tự động
Chỉ chạy script **đã có** trong `package.json`, không cài thêm công cụ. Ghi lại kết quả ban đầu để sau này biết lỗi nào mới:
`typecheck` (hoặc `npx tsc --noEmit`) · `lint` · `test` · `build`.

### Phase 2. Audit thủ công theo vùng
Đi lần lượt từng vùng ở mục 4 (ARC, RSC, ST, HK, EF, DT, ZS, TS, PF, UI, A11Y, SEC, ERR, TST, CQ, DX). Với repo lớn, làm theo thư mục tính năng, mỗi lần một tính năng, và ghi tiến độ (nếu được phép, vào `AUDIT_PROGRESS.md`, không commit).

Thứ tự đọc ưu tiên trong mỗi tính năng: route/page → component cha → hook → store/query → lib → type.

### Phase 3. Báo cáo và xin duyệt
Xuất báo cáo theo mục 8. **Dừng ở đây chờ người dùng duyệt** trước khi sửa.

### Phase 4. Sửa theo lô
Theo mục 9.

### Phase 5. Xác minh và tổng kết
Chạy lại toàn bộ kiểm tra của Phase 1, so với baseline, đưa kịch bản kiểm tra tay, tổng kết trước/sau.

---

## 3. TRIẾT LÝ CODE DỄ MAINTAIN

1. **Code được đọc nhiều hơn viết.** Tối ưu cho người đọc sau 6 tháng.
2. **Tên là tài liệu.** Tên nói lên *ý nghĩa nghiệp vụ*, không nói kiểu triển khai.
3. **Một thứ một chỗ.** Mỗi dữ liệu có một nguồn sự thật. Mỗi khái niệm một nơi sống.
4. **State và giao diện dùng nó nằm cạnh nhau** (colocation). Đẩy state xuống thấp nhất có thể.
5. **Làm cho trạng thái sai không thể biểu diễn** (discriminated union thay cho nhiều boolean rời).
6. **Biên hệ thống là nơi không tin ai:** validate dữ liệu ngoài vào (API, URL, storage, form).
7. **Ít code hơn là tốt hơn.** Xoá được thì xoá. Đừng thêm trừu tượng cho tương lai chưa tới (YAGNI). Gộp trùng lặp khi đã thấy 3 lần **và** cùng khái niệm.
8. **Nhất quán thắng "đúng nhất".** Trong một codebase, một việc có một cách làm. Đã có quy ước thì theo, đừng đưa cách thứ ba vào.
9. **Hook/module đặt tên một khái niệm.** Di chuyển code sang file khác mà không đặt tên khái niệm chỉ dời sự rối.
10. **Đo trước khi tối ưu.** Không có số đo thì đó là gợi ý, không phải bug.

---

## 4. DANH MỤC QUY TẮC

Mỗi quy tắc có ID để trích dẫn trong báo cáo. Mức mặc định: **N** nghiêm trọng, **C** cao, **TB** trung bình, **T** thấp, **G** gợi ý. Mức thật phụ thuộc bằng chứng (H2, H3).

### ARC. Kiến trúc và cấu trúc thư mục

- **ARC-1** Tổ chức theo tính năng: `features/<tên>/{components,hooks,lib,api,types}`. Thư mục dùng chung (`components/ui`, `lib`, `hooks`) chỉ chứa thứ được ≥2 tính năng dùng. (T)
- **ARC-2** Phụ thuộc một chiều: `app → features → shared`. Tính năng không import nội bộ của tính năng khác (đi qua public API hoặc đưa phần chung xuống `shared`). `shared` không import `features`. `lib/` (logic thuần) không import React/component. Không có import vòng. (TB)
- **ARC-3** `app/` chỉ chứa file định tuyến (`page`, `layout`, `loading`, `error`, `not-found`, `route.ts`), mỏng, chỉ ghép các thành phần từ `features`. Không nhét logic và JSX lớn vào `page.tsx`. (T)
- **ARC-4** Dùng alias (`@/...`) nhất quán; không chuỗi `../../../`. (G)
- **ARC-5** Barrel file (`index.ts` re-export): chấp nhận làm public API nhỏ của một tính năng. Tránh barrel tổng khổng lồ (dễ gây import vòng, chậm build/HMR, khó tree-shake). (T)
- **ARC-6** Không có `utils.ts`/`helpers.ts`/`common.ts`/`types.ts` toàn cục khổng lồ. Tách theo chủ đề. (T)
- **ARC-7** Hằng số có tên, tập trung: đường dẫn route, storage key, query key, breakpoint, timeout, giới hạn. Không rải chuỗi/số "ma thuật". (T)
- **ARC-8** Named export, trừ những file Next.js bắt buộc default export (`page`, `layout`...). Mỗi file một trách nhiệm chính, tên file = tên export chính. (G)

### RSC. Server / Client Component

- **RSC-1** Mặc định là Server Component. Chỉ thêm `'use client'` khi cần state, effect, event handler, hoặc API trình duyệt. (TB)
- **RSC-2** Đặt `'use client'` ở **lá** (component nhỏ nhất cần tương tác), không ở layout/page lớn. Provider client bọc `children` (nhận `children` từ server). (TB)
- **RSC-3** Client Component không import Server Component trực tiếp; truyền qua `children`/props. (TB)
- **RSC-4** Props từ Server sang Client phải serialize được và **không chứa dữ liệu nhạy cảm** (mọi thứ đó lộ ra trình duyệt). (N nếu lộ)
- **RSC-5** Module chỉ chạy ở server (DB, secret, service) có `import 'server-only'`. (C)
- **RSC-6** Không dùng `window`, `document`, `localStorage` lúc render. Chỉ trong effect hoặc handler. (C)
- **RSC-7** Hydration: render đầu phải giống nhau ở server và client. Nguồn hay gặp: `Date.now()`, `Math.random()`, `window/localStorage`, `Intl` khác locale/timezone, HTML lồng sai (`div` trong `p`), giá trị persist từ store. Không dùng `suppressHydrationWarning` để che lỗi thật. (C)
- **RSC-8** Fetch ở Server Component khi có thể; chạy song song bằng `Promise.all` khi độc lập (tránh waterfall); dùng `Suspense` để stream phần chậm. (TB)
- **RSC-9** Không gọi route `/api` nội bộ của chính app từ Server Component bằng HTTP; gọi thẳng hàm/service. (T)
- **RSC-10** Mỗi route quan trọng có `loading.tsx`, `error.tsx`; có `not-found.tsx` khi dùng `notFound()`. (TB)
- **RSC-11** Hành vi phụ thuộc version Next (kiểm tra bảng mục 1): `params`/`searchParams`/`cookies()`/`headers()` async từ Next 15; mặc định cache của `fetch`/route đã đổi giữa 14/15/16; tên và cách dùng `middleware`/`proxy` đổi theo version; React 19 có `useActionState`, `ref` như prop. Luôn đọc docs/type đúng version trước khi kết luận. (TB)

### ST. State

Thứ tự cân nhắc, dừng ở bước đầu tiên phù hợp (xem cây quyết định mục 6):
tính được từ thứ khác → URL → server data (Query/RSC) → `useState` cục bộ → lift lên cha chung → Context → Zustand.

- **ST-1** State tính được từ state/props khác thì **không lưu**; tính trong render. (TB)
- **ST-2** State người dùng cần giữ khi reload/chia sẻ link (filter, tab, trang, sort, chương) nằm ở **URL**. (TB)
- **ST-3** Dữ liệu server chỉ có **một nơi sống** (Query/RSC). Cấm copy vào `useState`/Zustand rồi tự đồng bộ. (TB)
- **ST-4** `useEffect` chỉ để đồng bộ state này sang state kia là dấu hiệu sai. Đổi sang derived, event handler, hoặc `key`. (TB)
- **ST-5** Vòng đời state khớp danh tính nó mô tả. Nếu ref/state mô tả "chương này/user này" mà sống lâu hơn danh tính đó: dùng `key={id}` ở component cha (cách React khuyến nghị, thường ít bug nhất; chỉ cân nhắc kỹ khi con rất nặng), hoặc biến cục bộ trong effect, hoặc reset khi id đổi. Triệu chứng: giá trị của id=A vẫn đọc được khi id đã là B. (C)
- **ST-6** Giá trị mặc định có thể đang giấu trạng thái. `||` gộp mọi falsy (`0`, `''`, `NaN`, `false`, `null`, `undefined`); `??` chỉ gộp `null/undefined`. Nếu cần phân biệt "chưa biết" với "đã biết là 0/rỗng" thì dùng `??` hoặc union. Nếu không cần thì `|| 0` là ổn, đừng sửa. (TB)
- **ST-7** Dữ liệu async có đủ 4 trạng thái được xử lý: pending, error, empty, có dữ liệu. (TB)
- **ST-8** Trạng thái loại trừ nhau dùng discriminated union, không nhiều boolean rời (`isLoading`, `isError`, `isEmpty` có thể mâu thuẫn). (T)
- **ST-9** Nhiều `useState` đổi cùng nhau theo quy luật → `useReducer`. (T)
- **ST-10** Context chỉ cho giá trị **ít đổi** (theme, user, locale). Chia Context theo miền, bọc `value` ổn định. Không dùng Context cho state đổi nhanh. (TB)
- **ST-11** Prop drilling > 2 tầng: thử composition (`children`/slot) trước, rồi Context/store. (T)

### HK. Hook và Component

- **HK-1** Hook **đặt tên cho một khái niệm nghiệp vụ**. Phép thử: mô tả bằng một câu **không có chữ "và"**. Tên kiểu `useXxxPage`, `useXxxLogic`, `Manager`, `Handler` là dấu hiệu god hook. (TB)
- **HK-2** Hook trả ít giá trị có nghĩa, nhận ít tham số; không nhận `ref`/`setState` của hook khác; không phụ thuộc hook anh em qua ref. Ngưỡng cảnh báo ở mục 5. (TB)
- **HK-3** Component đọc như mục lục: nhìn phần đầu hiểu luồng mà không phải mở hook. (T)
- **HK-4** State và JSX dùng nó ở **cùng chỗ**. Vùng UI có state riêng (thanh tiến độ, panel cài đặt, nút điều hướng) tách thành component con có hook riêng; cha không cần biết. (TB)
- **HK-5** Logic thuần (không dùng React) nằm trong `lib/`, có test. Hook chỉ nối React với logic. (T)
- **HK-6** Không định nghĩa component bên trong component (mỗi render sinh type mới → remount, mất state). (C)
- **HK-7** Props ít và rõ. Nhiều boolean prop → dùng `variant`/composition. Không truyền cả object lớn khi chỉ dùng vài field (trừ khi cố ý). (T)
- **HK-8** Hook dùng theo quy tắc (không gọi có điều kiện); không side effect trong lúc render; không mutate state/props. (C)
- **HK-9** Không tạo hook bọc một dòng `useState` mà không thêm ý nghĩa. Không tách thành nhiều hook chằng chịt nhau qua ref/setter (tệ hơn gộp lại). (T)
- **HK-10** `key` của list là id ổn định, không `index` với list có thể sắp xếp/chèn/xoá, không `Math.random()`. (TB)

### EF. Effect

- **EF-1** Effect dành cho **đồng bộ với thứ ngoài React** (DOM API, subscription, timer, kết nối). Phản ứng với hành động người dùng đặt trong event handler. (TB)
- **EF-2** Deps đầy đủ. `eslint-disable react-hooks/exhaustive-deps` phải kèm lý do. Kiểm tra deps có ổn định không **trước khi** kết luận "effect không chạy lại/không reset". (TB)
- **EF-3** Mọi effect có đăng ký (listener, timer, observer, subscription, request) có cleanup. Request dùng `AbortController` hoặc cờ bỏ qua kết quả cũ để chống race. (TB)
- **EF-4** **Cleanup không phải chỗ đọc DOM sống.** Với `useEffect` (passive), khi đổi danh tính thứ tự là: render mới → commit (DOM đã là của B) → cleanup effect cũ → effect mới. Cleanup mang dữ liệu A nhưng thấy DOM B, ghi dữ liệu sai. Dùng giá trị đã capture trong closure của effect, hoặc lưu trước khi điều hướng. `useLayoutEffect` thứ tự khác, không khái quát. Vấn đề gốc là đọc DOM sống trong cleanup, không phải bản thân cleanup. (C)
- **EF-5** "Lưu lần cuối": tách theo thời điểm so với lúc DOM đổi. Rời/ẩn tab: `visibilitychange` (+ `pagehide` cho mobile/Safari), gửi bằng `navigator.sendBeacon` hoặc `fetch(..., { keepalive: true })`. Đổi route/chương trong app: lưu bằng giá trị capture hoặc trong handler điều hướng. (C)
- **EF-6** Không fetch dữ liệu trong effect; dùng Query hoặc Server Component. (TB)
- **EF-7** Effect phải **idempotent**: Strict Mode (dev) chạy mount → cleanup → mount; không giả định chạy một lần. (TB)
- **EF-8** Sự kiện tần suất cao (scroll, resize, pointermove): tách "ai xử lý" khỏi "ai render lại". Tần suất xử lý: `requestAnimationFrame` cho hiển thị, throttle/debounce cho gọi API/lưu. Gom/bỏ giá trị không dùng. Chỉ component nhỏ cần nó được re-render; hiệu ứng thuần hiển thị (thanh 1px) cập nhật qua `ref`/CSS variable, không qua state. Listener scroll/touch dùng `{ passive: true }`. Cân nhắc `IntersectionObserver`. Không xen kẽ đọc và ghi layout (thrashing). **Đo bằng Profiler trước khi kết luận render thừa.** (TB)

### DT. Dữ liệu và API

- **DT-1** React Query v5: dùng `useQuery({ queryKey, queryFn })`; `isPending` (không `status: 'loading'`); `gcTime` (không `cacheTime`); `placeholderData: keepPreviousData`; `throwOnError` (không `useErrorBoundary`); `useSuspenseQuery` (không `suspense: true`); `HydrationBoundary` (không `Hydrate`); `useInfiniteQuery` có `initialPageParam`; `queryFn` không trả `undefined`; **không còn `onSuccess/onError/onSettled` trong `useQuery`** (vẫn có trong `useMutation`). Cú pháp v4 còn sót là lỗi. (C)
- **DT-2** `queryKey` ổn định và **đủ mọi biến** `queryFn` phụ thuộc. Dùng key factory / `queryOptions()` thay vì gõ chuỗi rời rạc. (TB)
- **DT-3** `QueryClient` tạo trong `useState`/`useRef` ở Provider client; không singleton module-level phía server (bị chia sẻ giữa request/user). (C)
- **DT-4** `staleTime` có chủ đích. Mutation invalidate **đúng** key cần thiết (không `invalidateQueries()` toàn bộ). Optimistic update có snapshot + rollback khi lỗi + đồng bộ lại khi xong, và `cancelQueries` trước khi ghi cache (hoặc dùng `variables`/`useMutationState` cho UI đơn giản). (TB)
- **DT-5** Phụ thuộc giữa query dùng `enabled`, không dùng effect. Dùng `select` để lấy phần cần thay vì copy vào state. Truyền `signal` của `queryFn` vào `fetch`. (T)
- **DT-6** Chỉ có **một lớp gọi HTTP** (client wrapper): base URL, auth, chuẩn hoá lỗi, parse/validate response. Component/hook không gọi `fetch` thô rải rác. (TB)
- **DT-7** Validate dữ liệu từ API tại biên bằng schema (Zod/Valibot), suy ra type từ schema. Cân nhắc map DTO → model của UI ở lớp API để UI không phụ thuộc shape thô của backend. (TB)
- **DT-8** Ghi tiến độ/sự kiện tần suất cao: throttle/debounce + mutation, không gọi mỗi lần scroll. (TB)
- **DT-9** Lỗi không bị nuốt: hiển thị, có retry hợp lý (không retry lỗi 4xx vô ích). (TB)
- **DT-10** Bật `@tanstack/eslint-plugin-query` nếu có thể (bắt thiếu biến trong `queryKey`). (G)

### ZS. Zustand

- **ZS-1** Luôn dùng selector: `useStore(s => s.x)`. Không `useStore()` không tham số (đăng ký cả store). Selector trả object/array mới mỗi lần thì dùng `useShallow` hoặc tách selector; ở Zustand v5 selector không ổn định có thể gây render lặp/vô hạn (kiểm tra version). (TB)
- **ZS-2** Actions nằm trong store; component không tự ghép `set` rời rạc. Store lớn chia slice theo miền. (T)
- **ZS-3** Không lưu derived state; không lưu dữ liệu server (xem ST-3). (TB)
- **ZS-4** Không đưa giá trị đổi liên tục (scroll/pointer) vào store dùng chung. Cần đọc ngoài React dùng `getState()`/`subscribe`. (TB)
- **ZS-5** SSR: store module-level là singleton, phía server bị **chia sẻ giữa request**. Store chứa dữ liệu theo người dùng phải tạo theo request (`createStore` + Provider) hoặc chỉ khởi tạo/đọc ở client. (C)
- **ZS-6** `persist` + hydration: giá trị từ `localStorage` khác server render gây mismatch. Dùng `skipHydration` + rehydrate trong effect, hoặc cờ `hasHydrated`; có `version` + `migrate` khi đổi shape; không persist thứ không serialize được. (C)
- **ZS-7** Store sống lâu hơn component/danh tính: phải có chỗ reset rõ ràng khi đổi user/chương/sách. (C)
- **ZS-8** `devtools` chỉ bật ở dev. (G)

### TS. TypeScript

- **TS-1** `strict: true`. Nên bật `noUncheckedIndexedAccess`. (G)
- **TS-2** Không `any` (dùng `unknown` rồi thu hẹp). `@ts-ignore` thay bằng `@ts-expect-error` kèm lý do. `as` chỉ khi có lý do và comment. Không `!` (non-null assertion) để "cho qua". (TB)
- **TS-3** Dữ liệu ngoài (API, `searchParams`, form, storage, `postMessage`) là không tin cậy: validate ở biên (xem DT-7). (C)
- **TS-4** Discriminated union + `switch` exhaustive với `never`. Dùng `satisfies` để kiểm tra mà giữ type hẹp. (G)
- **TS-5** Không định nghĩa trùng type; suy ra từ một nguồn (schema, type API). Tránh type quá generic khó đọc. (T)
- **TS-6** Props có type rõ; hàm công khai của `lib/` có type trả về rõ. (T)

### PF. Hiệu năng

- **PF-1** **Đo trước khi tối ưu** (React Profiler, Performance tab, `next build` output, bundle analyzer). Không có số đo thì báo là Gợi ý. (TB)
- **PF-2** `useMemo/useCallback/React.memo` chỉ khi có bằng chứng, hoặc khi giá trị là deps/prop của component đã memo. Nếu bật React Compiler thì hạn chế memo thủ công. Memo dư thừa là nhiễu. (T)
- **PF-3** List dài (hàng trăm item trở lên) dùng virtualization hoặc phân trang. (TB)
- **PF-4** `next/image` đúng `width/height` hoặc `fill` + `sizes`; ảnh LCP có `priority`; cấu hình `remotePatterns`. `next/font` thay link font ngoài. Script bên thứ ba qua `next/script`. (TB)
- **PF-5** Không import cả thư viện lớn cho một hàm nhỏ (icon pack, lodash, moment). `next/dynamic` cho component nặng chỉ hiện sau tương tác (editor, chart, modal). (TB)
- **PF-6** Tránh layout shift: đặt kích thước cho ảnh/embed, giữ chỗ cho nội dung tải sau. Theo dõi LCP, INP, CLS. (TB)
- **PF-7** Không tính toán nặng trong render mà không cần; không tạo object/array/hàm mới truyền vào component đã memo nếu đang cố memo. (T)

### UI. Tailwind v4 và shadcn/ui

**Tailwind v4 (không áp dụng cú pháp v3):**
- **UI-1** Cấu hình kiểu CSS-first: `@import "tailwindcss";` (không còn `@tailwind base/components/utilities`); token trong `@theme { ... }`; `tailwind.config.js` chỉ có tác dụng khi được nạp bằng `@config`. Không cần khai báo `content` (tự phát hiện); thêm nguồn bằng `@source`. PostCSS dùng `@tailwindcss/postcss` (hoặc plugin Vite). Utility/variant tuỳ chỉnh dùng `@utility`/`@custom-variant`. (TB)
- **UI-2** Tên utility đổi so với v3: `shadow-sm→shadow-xs`, `shadow→shadow-sm`; `rounded-sm→rounded-xs`, `rounded→rounded-sm`; `blur-sm→blur-xs`, `blur→blur-sm`; `outline-none→outline-hidden`; `ring` (3px) → `ring-3`, `ring` nay 1px. `bg-opacity-*`/`text-opacity-*` bỏ, dùng `bg-black/50`. `!important` viết cuối (`bg-red-500!`). Biến thể xếp chồng áp dụng trái → phải. Màu viền/ring mặc định là `currentColor`. (TB)
- **UI-3** `@apply`/`theme()` trong CSS module/`<style>` riêng cần `@reference`. Hạn chế `@apply`. (T)
- **UI-4** `prettier-plugin-tailwindcss` với v4 cần `tailwindStylesheet` trỏ tới CSS chính. Yêu cầu trình duyệt tối thiểu của v4 cao hơn v3; nếu sản phẩm cần trình duyệt cũ hơn thì báo chủ dự án. (G)

**Quy tắc styling chung:**
- **UI-5** **Không ghép class động** kiểu `` `text-${color}-500` `` (Tailwind không thấy được). Dùng map đầy đủ tên class, `cva`, `data-*`, hoặc CSS variable. (C)
- **UI-6** Gộp class bằng `cn()` (`clsx` + `tailwind-merge`). Biến thể component dùng `cva`. Chuỗi class dài lặp lại → tách **component**, không `@apply`. (T)
- **UI-7** Màu, spacing, radius, font lấy từ token của theme; không lặp giá trị tuỳ ý (`w-[137px]`, `text-[#abc123]`). Thang `z-index` thống nhất. (T)
- **UI-8** Mobile-first (mặc định cho mobile, thêm `sm:/md:/lg:`). Dark mode qua `dark:` hoặc token, không hard-code màu sáng. Không phụ thuộc hover cho chức năng chính; vùng bấm đủ lớn. `motion-reduce:` cho animation. (TB)
- **UI-9** Không dùng `style={{}}` cho thứ Tailwind làm được (giá trị thật sự động như % tiến độ thì truyền qua CSS variable). (T)

**shadcn/ui:**
- **UI-10** `components/ui/*` là code của dự án (được copy vào). Sửa có chủ đích ở một chỗ, không chèn class ghi đè chồng chéo ở từng nơi dùng. Thêm component bằng CLI. Không tự viết lại primitive có sẵn. (T)
- **UI-11** Giữ accessibility của Radix: `Dialog` cần `DialogTitle` (có thể `sr-only`, không xoá); dùng `asChild` đúng khi bọc `Link`; không thay trigger bằng `div onClick`. (TB)
- **UI-12** Theme qua CSS variables trong `globals.css`. Kiểm tra component shadcn có phải bản tương thích Tailwind v4 (`components.json` trỏ đúng CSS, `tw-animate-css` thay `tailwindcss-animate`, `@theme inline`). Component sinh từ bản v3 có thể chứa utility đã đổi tên: báo **Rủi ro**, đừng sửa hàng loạt khi chưa thấy khác biệt thật. (TB)
- **UI-13** Form: shadcn `Form` + `react-hook-form` + schema Zod; lỗi gắn với field; disable khi submitting; chống double-submit. Không logic nghiệp vụ trong `components/ui/*`. (TB)

### A11Y. Khả năng tiếp cận

- **A11Y-1** Thẻ ngữ nghĩa đúng: `button` cho hành động, `a/Link` cho điều hướng, `nav/main/header/footer`, heading đúng thứ tự. Không `div onClick`. (TB)
- **A11Y-2** Mọi điều khiển dùng được bằng bàn phím; focus nhìn thấy; thứ tự tab hợp lý. Modal: khoá focus, đóng bằng `Esc`, trả focus. (TB)
- **A11Y-3** Ảnh có `alt` phù hợp (rỗng nếu trang trí). Input có `label`. Icon-button có `aria-label`. (TB)
- **A11Y-4** Không chỉ dùng màu để truyền thông tin; tương phản đủ. Tôn trọng `prefers-reduced-motion`. (TB)
- **A11Y-5** Trạng thái loading/lỗi/thành công được thông báo cho công nghệ hỗ trợ khi cần (`aria-live`, `role="alert"`). (T)

### SEC. Bảo mật

- **SEC-1** Chỉ `NEXT_PUBLIC_*` vào bundle trình duyệt và **công khai**; không đặt key/secret vào đó. `.env*` không bị commit; có `.env.example`; validate env lúc khởi động. (N)
- **SEC-2** Server Action và Route Handler là **API công khai**: luôn xác thực, phân quyền và validate input ở server dù UI đã chặn. Không tin id/giá/role do client gửi. Không lộ chi tiết lỗi nội bộ. (N)
- **SEC-3** Không `dangerouslySetInnerHTML` với nội dung chưa sanitize. Kiểm tra scheme của URL từ người dùng (`javascript:`). (N)
- **SEC-4** Token nhạy cảm ưu tiên cookie `HttpOnly; Secure; SameSite` hơn `localStorage`. (C)
- **SEC-5** `target="_blank"` có `rel="noopener noreferrer"`. Cân nhắc CSP và security headers. Không log dữ liệu nhạy cảm. (T)
- **SEC-6** Ẩn nút ở UI chỉ là UX, không phải bảo mật. Middleware/proxy là lớp chặn sớm, không thay kiểm tra quyền tại nơi truy cập dữ liệu. (C)

### ERR. Lỗi, trạng thái và quan sát

- **ERR-1** Có error boundary ở mức route (`error.tsx`, `global-error.tsx`) và quanh vùng có thể lỗi. Không `catch {}` rỗng. (TB)
- **ERR-2** Lỗi được chuẩn hoá ở lớp API (một dạng lỗi thống nhất), UI hiển thị thông điệp thân thiện; hành động thất bại có phản hồi (toast/inline) và đường thử lại. (TB)
- **ERR-3** Ghi log qua một wrapper (hoặc dịch vụ theo dõi lỗi nếu dự án có), không `console.log` rải rác ở production. (T)
- **ERR-4** Mỗi nơi hiển thị dữ liệu async có skeleton/loading, empty state, error state (xem ST-7). (TB)

### TST. Kiểm thử

- **TST-1** Logic thuần → unit test. Component tương tác → Testing Library theo **hành vi người dùng** (truy vấn theo role/label, không theo chi tiết cài đặt). Luồng chính → E2E. (TB)
- **TST-2** Sửa bug thì có test tái hiện khi có thể. Test ổn định: không phụ thuộc thời gian thật/mạng thật (fake timers, mock mạng bằng công cụ dự án đang dùng). (TB)
- **TST-3** Không snapshot cả cây component lớn. Không test chi tiết cài đặt nội bộ (tên state, số lần render). (T)
- **TST-4** Không thêm công cụ test mới khi chưa được duyệt; nếu chưa có test, đề xuất ưu tiên test cho `lib/` trước. (G)

### CQ. Chất lượng code (clean code)

- **CQ-1** Đặt tên: nêu ý nghĩa nghiệp vụ; boolean bắt đầu `is/has/can/should`; handler trong component `handleX`, prop callback `onX`; một từ cho một khái niệm (đừng lẫn `get/fetch/load/retrieve`); tránh tên trống nghĩa (`data`, `info`, `temp`, `obj`, `handle`, `process`), viết tắt khó hiểu. (T)
- **CQ-2** Hàm nhỏ, một mức trừu tượng; dùng **early return**; độ lồng ≤ 3; tránh boolean parameter (dùng options object hoặc hai hàm); > 3-4 tham số thì gom object. (T)
- **CQ-3** Điều kiện phức tạp đặt tên bằng biến/hàm (`const canSubmit = ...`). Không ternary lồng nhau. Trong JSX ưu tiên early return hoặc component con. **Cẩn thận `count && <X/>`: khi `count` là `0` React render ra `0`** → dùng `count > 0 &&` hoặc ternary. (TB)
- **CQ-4** Không magic number/string (xem ARC-7); dùng `as const` object hoặc union thay cho chuỗi rời. (T)
- **CQ-5** Comment giải thích **vì sao**, không phải **làm gì**. Xoá code bị comment. `TODO` có ngữ cảnh (ai/vì sao/issue). Workaround có link/giải thích. (T)
- **CQ-6** Không code chết: import thừa, biến/hàm/file/export không ai dùng, `console.log`, feature flag cũ, dependency không dùng. (T)
- **CQ-7** Trùng lặp: gộp khi đã lặp ~3 lần **và** là cùng khái niệm nghiệp vụ (đổi cùng lý do). Hai đoạn giống hình thức nhưng đổi vì lý do khác nhau thì để riêng. Dấu hiệu khó thấy: cùng phép tính, đặt tên biến khác nhau. (T)
- **CQ-8** Bất biến: không mutate state/props/tham số; cập nhật theo giá trị cũ dùng dạng hàm `setX(prev => ...)`. (TB)
- **CQ-9** Một việc một cách làm trong repo (một cách fetch, một cách form, một cách modal, một cách toast). Phát hiện hai cách → đề xuất theo cách đã chiếm đa số, không đưa cách thứ ba. (T)
- **CQ-10** Async: không floating promise (luôn `await`/`.catch`/`void` có chủ đích); không `async` trong `forEach`; việc độc lập chạy `Promise.all`. (TB)
- **CQ-11** Module không có side effect lúc import (gọi API, đọc `window`, đăng ký listener ở top-level). (TB)
- **CQ-12** Export tối thiểu; giữ nội bộ thứ không cần công khai. (G)
- **CQ-13** `==`, `parseInt` thiếu radix, tính tiền bằng số thực, tính ngày/giờ thủ công, `Array.index` làm id: các mẫu dễ lỗi cần xem xét. (T)
- **CQ-14** Kích thước: dùng ngưỡng mục 5 như **đèn cảnh báo**, không phải luật. Tách theo khái niệm, không theo số dòng. (G)

### DX. Công cụ và quy trình

- **DX-1** ESLint (`next/core-web-vitals`, `react-hooks`, `@typescript-eslint`, cân nhắc `no-floating-promises`) và Prettier chạy sạch. Không tắt rule tràn lan; mỗi `eslint-disable` có lý do. (T)
- **DX-2** Có script `typecheck`, `lint`, `test`, `build`; CI chạy các script này. README ghi cách chạy và biến môi trường. (T)
- **DX-3** Dependency: không giữ gói không dùng; không thêm gói nặng cho việc nhỏ; không có hai thư viện làm cùng một việc (ví dụ hai thư viện date, hai thư viện state-form). Báo `npm audit`/cảnh báo bảo mật nếu có (không tự nâng version, H6). (T)
- **DX-4** Commit nhỏ, một chủ đề; thông điệp rõ. (G)

---

## 5. NGƯỠNG CẢNH BÁO (HEURISTIC, KHÔNG PHẢI LUẬT CỨNG)

Dùng để **phát hiện ứng viên cần đọc kỹ**. Vượt ngưỡng chưa phải lỗi; quyết định dựa vào khái niệm và bằng chứng.

| Đối tượng | Đèn vàng |
|---|---|
| File component | > ~250 dòng |
| Hàm | > ~50 dòng hoặc độ lồng > 3 |
| Hook: số giá trị trả về | > ~6 |
| Hook: số tham số | > ~4 |
| Hook: số `useState`/`useEffect` không liên quan nhau | ≥ 3 nhóm |
| Props của component | > ~7 |
| `page.tsx` | > ~80 dòng |
| Tầng prop drilling | > 2 |
| `useEffect` trong một component | > ~3 |
| Import vòng | bất kỳ |
| `any`, `as any`, `@ts-ignore` | bất kỳ |
| Tên hook là tên trang hoặc kết thúc bằng `Manager/Logic/Handler` | bất kỳ (dấu hiệu god hook) |
| Sửa một tính năng nhỏ mà phải sửa nhiều hook | bất kỳ (dấu hiệu rò rỉ khái niệm) |

---

## 6. CÂY QUYẾT ĐỊNH

### 6.1 State này nên sống ở đâu?
1. Tính được từ state/props khác? → **Derived**, không lưu.
2. Người dùng cần giữ khi reload/chia sẻ link? → **URL**.
3. Server biết giá trị này? → **Query / Server Component**.
4. Chỉ một component đọc? → **`useState`/`useReducer` cục bộ**.
5. Vài component gần nhau đọc? → **Lift lên cha chung**.
6. Nhiều nhánh cây, ít đổi (theme/user/locale)? → **Context**.
7. Nhiều nơi đọc, đổi thường, xuyên trang? → **Zustand với selector**.

### 6.2 Logic này đặt ở đâu?
- Không dùng React? → `lib/` (hàm thuần, có test).
- Nối React với một khái niệm (state + effect + query)? → **hook theo khái niệm**.
- Chỉ phục vụ một vùng UI? → **component con** chứa state và hook của vùng đó.
- Phản ứng với click/submit? → **event handler**.
- Đồng bộ với thứ ngoài React? → **effect** (có cleanup).

### 6.3 Server hay Client?
Cần state/effect/handler/API trình duyệt? Không → Server. Có → Client, nhưng chỉ **lá nhỏ nhất** cần tương tác; phần còn lại giữ Server và truyền qua `children`/props.

### 6.4 Quy trình refactor hook (làm đúng thứ tự)
1. **Kiểm kê**: Lập bảng các `useState`, `useEffect`, `useMemo`, v.v. ghi rõ ai đọc/ghi, chạy khi nào.
2. **Phân loại vào đúng chỗ**:
   - Fetch, cache → **React Query**
   - State tính được → **Derived state** (tính trong render)
   - Effect đồng bộ state → **Xoá effect**, tính trực tiếp
   - Filter, tab, trang → **URL**
   - Phản ứng với click/submit trong effect → **Event handler**
   - Logic thuần không React → **`lib/`**
   - State phục vụ vùng UI nhỏ → **Component con**
   - Cấu hình dùng chung → **Zustand**
   - Nhiều state đổi cùng nhau → **`useReducer`**
3. **Nhóm phần còn lại**: Gom các phần phục vụ cùng một khái niệm thành hook theo khái niệm.
4. **Làm ranh giới đơn giản**: Hook nhận ít tham số, không nhận ref/setter của hook khác. Không trả về "túi đồ" khổng lồ.

---

## 7. NHỮNG THỨ KHÔNG NÊN "SỬA" (CHỐNG SỬA LAN MAN)

- `|| 0`, `|| ''` khi không cần phân biệt "chưa biết" và "rỗng".
- Lặp lại giữa hai khái niệm nghiệp vụ khác nhau.
- `useState` cục bộ mà chỉ component đó đọc (đừng đẩy lên store).
- Thiếu `useMemo/useCallback` khi chưa có vấn đề hiệu năng đo được.
- Đổi tên, thứ tự import, kiểu quote nếu Prettier/ESLint đã chấp nhận.
- Chuỗi class Tailwind dài nhưng đúng và dễ đọc (đừng ép `@apply`/CSS riêng).
- Viết lại/đổi style `components/ui/*` vì sở thích.
- Store Zustand nhỏ đang chạy tốt: đừng chia slice/đổi middleware khi chưa có vấn đề.
- `staleTime`/`retry` mặc định của Query nếu dữ liệu không đòi hỏi khác.
- Đổi sang thư viện/pattern mới chỉ vì "hiện đại hơn".
- Tách file/component chỉ để đạt số dòng tối đa.
- "Bug" chưa có kịch bản tái hiện cụ thể.

---

## 8. ĐỊNH DẠNG BÁO CÁO AUDIT

### 8.1 Mở đầu
- Bảng bối cảnh đã điền (mục 1).
- **Độ phủ:** bảng `Thư mục/tính năng | Đã đọc kỹ | Chỉ lướt | Chưa xem`.
- **Baseline:** kết quả `tsc`, lint, test, build (số lỗi/cảnh báo có sẵn).

### 8.2 Bảng điểm sức khoẻ (đánh giá tổng quan, chủ quan, dựa trên phát hiện có bằng chứng)

| Vùng | Tình trạng (Tốt / Ổn / Cần sửa / Nguy hiểm) | Số phát hiện (N/C/TB/T) | Ghi chú 1 dòng |
|---|---|---|---|
| ARC, RSC, ST, HK, EF, DT, ZS, TS, PF, UI, A11Y, SEC, ERR, TST, CQ, DX | | | |

### 8.3 Từng phát hiện

```
### [MỨC] <ID quy tắc> — Tiêu đề ngắn
- Loại: Bug | Rủi ro | Gợi ý
- Vị trí: path/to/file.tsx:42 (và các nơi liên quan)
- Đã xác minh: <cơ chế thật: deps, điều kiện chạy, ai gọi> | "Chưa xác minh"
- Kịch bản: khi người dùng ..., thì ...
- Cách sửa đề xuất (tối thiểu): ... (kèm diff ngắn)
- Rủi ro của bản sửa / có thể đổi hành vi không: ...
- Công sức: nhỏ | vừa | lớn
```

Sắp xếp: Nghiêm trọng → Cao → Trung bình → Thấp → Gợi ý.

### 8.4 Kết thúc
1. **Đã kiểm tra, không phải vấn đề:** chỗ nghi ngờ nhưng loại trừ, kèm lý do.
2. **Câu hỏi cần người dùng quyết định** (gom một chỗ).
3. **Đề xuất kế hoạch sửa theo lô** (mục 9), có thứ tự và ước lượng.
4. **Bug phát hiện ngoài phạm vi refactor** (nếu có).

---

## 9. GIAO THỨC SỬA (CHẾ ĐỘ FIX)

Chỉ bắt đầu sau khi người dùng duyệt báo cáo và chỉ định lô nào làm.

### 9.1 Thứ tự ưu tiên lô
1. Bảo mật và nguy cơ mất/lộ dữ liệu (SEC, RSC-4/5).
2. Bug sai hành vi đã xác minh (EF-4/5, ST-5, DT-1/3, HK-6, RSC-7...).
3. Cấu trúc state/hook/component (ST, HK, EF, ZS).
4. Hiệu năng **có số đo** (PF).
5. Nhất quán và clean code (CQ, ARC, UI, DX).
6. Gợi ý (chỉ khi được yêu cầu).

### 9.2 Quy tắc mỗi lô
- **Một chủ đề một lô**, diff nhỏ (vài file), commit riêng. Không trộn sửa bug với refactor cấu trúc.
- Trước khi sửa: nêu file sẽ đụng, hành vi hiện tại, hành vi mong muốn.
- **Giữ nguyên hành vi** trừ chỗ lô được duyệt để sửa. Bất cứ thay đổi thứ tự side effect, thời điểm lưu dữ liệu, cache key, hoặc dữ liệu gửi server phải được nêu rõ.
- Khi di chuyển logic sang `lib/`: giữ nguyên công thức; nếu đã có hạ tầng test thì thêm test đặc tả cho hàm đó (không thêm công cụ mới).
- Không xoá `useEffect/useRef/state` khi chưa xác minh cơ chế (ai đọc, khi nào chạy, deps).
- Sau mỗi lô: chạy `typecheck`, lint, test, build; so với baseline; cung cấp **kịch bản kiểm tra tay** cụ thể (ví dụ: mở chương, cuộn, đổi chương, reload, ẩn tab).
- Tóm tắt diff: cái gì chuyển đi đâu, vì sao, rủi ro còn lại.

### 9.3 Dừng và hỏi khi
- Có test/lint/build **mới** fail mà chưa giải thích được.
- Cần quyết định sản phẩm hoặc không rõ hành vi mong muốn.
- Thay đổi lan sang nhiều file ngoài phạm vi lô.
- Phát hiện bug thật trong lúc refactor (ghi lại, hỏi có sửa không).
- Cần thêm dependency hoặc đổi cấu hình build.

### 9.4 Định nghĩa "xong"
- [ ] Mọi phát hiện trong lô đã xử lý hoặc có lý do hoãn.
- [ ] `typecheck`, lint, test, build không tệ hơn baseline (nêu rõ lỗi có sẵn còn lại).
- [ ] Hành vi không đổi ngoài phạm vi; đã nêu kịch bản kiểm tra tay.
- [ ] Không thêm dependency; không sửa file thuộc H7.
- [ ] Báo cáo tổng kết: trước/sau (số dòng file lớn nhất, số giá trị hook trả về, số effect, số `any`, số `'use client'`), các chỗ đã kiểm tra nhưng quyết định giữ nguyên, bug/rủi ro còn lại ngoài phạm vi.

---

## 10. CHECKLIST NHANH TRƯỚC KHI KẾT THÚC BẤT KỲ PHIÊN NÀO

- [ ] Đã điền bối cảnh và xác nhận version thật
- [ ] Mỗi phát hiện có `file:dòng` + kịch bản + cơ chế đã xác minh (hoặc ghi "Chưa xác minh")
- [ ] Không gán mức độ khi chưa xác minh cơ chế
- [ ] Đã nêu độ phủ (đã xem / chưa xem)
- [ ] Đã ghi "đã kiểm tra, không phải vấn đề"
- [ ] `'use client'` chỉ ở lá cần thiết; không secret trong `NEXT_PUBLIC_*` hay props sang Client
- [ ] Server Action/Route Handler có auth + validate
- [ ] Effect có cleanup, deps đúng, không đọc DOM sống trong cleanup
- [ ] Dữ liệu server chỉ ở Query/RSC; không state thừa (derived/URL/trùng server state)
- [ ] Zustand có selector, không rò state giữa request, `persist` không gây hydration mismatch
- [ ] React Query đúng cú pháp v5; Tailwind đúng cú pháp v4
- [ ] Hook mô tả được bằng một câu không có chữ "và"
- [ ] Không refactor ngoài phạm vi; không thêm dependency
- [ ] Kết quả `typecheck/lint/test/build` báo trung thực

---

## PHỤ LỤC A. LỆNH KHẢO SÁT (dùng để TÌM CHỖ CẦN ĐỌC, không để kết luận)

Dùng `rg` (ripgrep); không có thì dùng `grep -rnE`. Sửa đường dẫn `src/` theo dự án (có thể là `app/`, `features/`...).

```bash
# Tổng quan
cat package.json; ls -la; cat next.config.*; cat tsconfig.json
find src app -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 2>/dev/null | xargs -0 wc -l | sort -rn | head -30

# Ranh giới server/client (RSC)
rg -n "^['\"]use client['\"]" src app | wc -l
rg -n "^['\"]use client['\"]" src app -l
rg -n "window\.|document\.|localStorage|sessionStorage" src app --glob '!**/*.test.*'
rg -n "NEXT_PUBLIC_" src app .env.example
rg -n "server-only" src app

# State / hook / effect
rg -n "useEffect\(" src app -c | sort -t: -k2 -rn | head -20
rg -n "useState\(" src app -c | sort -t: -k2 -rn | head -20
rg -n "eslint-disable" src app
rg -n "set[A-Z]\w*\(" src app   # xem effect chỉ để set state
rg -n "\|\| 0|\|\| ''|\|\| false" src app
rg -n "createContext" src app

# React Query v4 còn sót (DT-1)
rg -n "cacheTime|keepPreviousData:|useErrorBoundary|suspense:\s*true|\bHydrate\b|status === ['\"]loading['\"]" src app
rg -n "onSuccess|onError|onSettled" src app         # kiểm tra có nằm trong useQuery không
rg -n "new QueryClient\(" src app                   # DT-3: nằm ở đâu?
rg -n "queryKey:\s*\[" src app                      # key rải rác?

# Zustand
rg -n "use\w*Store\(\)" src app                     # ZS-1: không selector
rg -n "create\(|createStore\(" src app
rg -n "persist\(" src app

# Tailwind v4 / UI
rg -n "@tailwind |bg-opacity-|text-opacity-|outline-none|\bring\b(?!-)" src app --pcre2
rg -n '`[^`]*\$\{[^}]*\}[^`]*(text|bg|border|p|m|w|h)-' src app   # class ghép động
rg -n "style=\{\{" src app
rg -n "@apply" src app

# TypeScript / chất lượng
rg -n ":\s*any\b|as any|@ts-ignore|\w!\." src app
rg -n "console\.(log|debug)" src app
rg -n "TODO|FIXME|HACK" src app
rg -n "key=\{(i|idx|index)\}" src app
rg -n "\{\s*\w+\s*&&\s*<" src app                    # kiểm tra `0 &&` (CQ-3)
rg -n "\.forEach\(async" src app

# Bảo mật
rg -n "dangerouslySetInnerHTML" src app
rg -n "target=\"_blank\"" src app
rg -n "'use server'|\"use server\"" src app          # Server Action: có auth/validate?
rg -n "export async function (GET|POST|PUT|PATCH|DELETE)" src app   # route handler

# Import vòng (chỉ nếu đã có sẵn công cụ trong dự án, không cài thêm)
# npx madge --circular --extensions ts,tsx src   (hỏi trước khi chạy nếu chưa cài)
```

Kết quả của các lệnh trên chỉ là **ứng viên**. Mỗi ứng viên phải được đọc kỹ theo H1-H3 trước khi trở thành phát hiện.

---

## PHỤ LỤC B. MẪU TRƯỚC / SAU

**God hook → hook theo khái niệm**
```tsx
// Trước
const { chapter, isLoading, progress, setProgress, fontSize, setFontSize,
        showControls, toggleControls, handleKeyDown, goNext, goPrev /* ... */ } = useReaderPage(id);

// Sau
const chapter = useChapter(id);                        // Query
const { save } = useReadingProgress(id);               // khái niệm: tiến độ
const { goNext, goPrev } = useChapterNavigation(id);   // khái niệm: điều hướng
useReaderShortcuts({ onNext: goNext, onPrev: goPrev }); // khái niệm: phím tắt
const fontSize = useReaderSettings((s) => s.fontSize);  // Zustand (nhiều trang đọc)
// showControls → useState trong component điều khiển (chỉ nó đọc)
```

**State dẫn xuất**
```tsx
const [items, setItems] = useState(data);
const [count, setCount] = useState(0);
useEffect(() => setCount(items.length), [items]);
// →
const count = items.length;
```

**Effect thừa cho logic của sự kiện**
```tsx
useEffect(() => { if (submitted) { track(); navigate(); } }, [submitted]);
// →
function onSubmit() { track(); navigate(); }
```

**Reset theo danh tính bằng `key`**
```tsx
<ChapterReader key={chapterId} chapterId={chapterId} />  // state con tự reset khi đổi chương
```

**Cleanup không đọc DOM sống**
```tsx
useEffect(() => {
  const id = chapterId;                     // capture theo closure
  return () => { saveProgress(id, lastKnownProgressRef.current); };  // KHÔNG đọc lại DOM trong cleanup
}, [chapterId]);
// Ẩn/đóng tab: thêm listener visibilitychange + pagehide, gửi bằng sendBeacon/keepalive
```

**Sự kiện tần suất cao: không qua state của component lớn**
```tsx
function ReadingProgressBar() {           // component nhỏ tự lắng nghe
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ref.current?.style.setProperty('--progress', String(getContentProgress()));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="h-px origin-left scale-x-[var(--progress)] bg-primary" />;
}
```

**Class Tailwind động**
```tsx
className={`text-${color}-500`}                       // sai: Tailwind không thấy class
const tone = { red: 'text-red-500', blue: 'text-blue-500' } as const;
className={tone[color]}                               // đúng
```

**`0 &&` trong JSX**
```tsx
{count && <Badge />}        // count = 0 → render ra "0"
{count > 0 && <Badge />}    // đúng
```

---

## PHỤ LỤC C. PROMPT MẪU CHO NGƯỜI DÙNG

**Audit một khu vực (khuyến nghị bắt đầu thế này):**
> Đọc `frontend-master-rules.md` và làm theo chính xác. Chế độ AUDIT, **không sửa file nào**. Phạm vi: `src/features/reader` và các file nó import. Làm Phase 0-3, xuất báo cáo theo mục 8 (có độ phủ, baseline, bảng sức khoẻ, từng phát hiện có bằng chứng). Không chắc điều gì thì ghi "Chưa xác minh" hoặc hỏi tôi.

**Sửa một lô đã duyệt:**
> Chế độ FIX. Làm đúng lô sau trong báo cáo: [dán danh sách phát hiện đã duyệt]. Theo mục 9: diff nhỏ, không đổi hành vi ngoài phạm vi, chạy typecheck/lint/test/build sau mỗi bước, so với baseline, đưa kịch bản kiểm tra tay. Gặp điều kiện ở 9.3 thì dừng và hỏi.

**Kiểm chứng sau khi sửa:**
> Chế độ VERIFY. Chạy lại toàn bộ kiểm tra, so với baseline, tóm tắt trước/sau theo mục 9.4, và liệt kê những gì tôi cần thử tay.

---

# FRONTEND LEAN CODE RULES
Bộ quy tắc để AI **viết ít code hơn** (và rà soát code thừa) mà **vẫn đúng UI, đúng hành vi, an toàn, truy cập được**.

Stack: Next.js (App Router) · React · TypeScript · Zustand · TanStack React Query v5 (`^5.67.2`) · Tailwind CSS v4 (`^4.0.0`) · shadcn/ui.

Dùng kèm `frontend-master-rules.md` (luật H1-H12 và quy trình audit/fix ở file đó vẫn áp dụng). Nếu hai file mâu thuẫn, **mục 2 "Danh sách KHÔNG ĐƯỢC CẮT" của file này và luật H5/H6/H7 của master thắng**.

---

## 0. ĐỊNH NGHĨA "NGẮN" ĐÚNG

**Ngắn không phải là ít ký tự hay ít dòng. Ngắn là ít _khái niệm_ phải nắm.**

Cách giảm code đúng là **xoá thứ không cần tồn tại**:
- state không cần lưu (tính được),
- effect không cần chạy (xử lý trong handler),
- memo không cần viết (compiler lo),
- wrapper/hook/component không thêm ý nghĩa,
- code JS mà nền tảng (HTML/CSS/Next/React/Tailwind) đã làm sẵn,
- thư viện/file/export/CSS không ai dùng.

Cách giảm code **sai** là nén: ternary lồng nhau, `reduce` một dòng khó đọc, bỏ tên biến, bỏ type, bỏ xử lý lỗi, gộp nhiều việc vào một component cho "đỡ file". Những thứ này làm code ngắn hơn nhưng khó maintain hơn và thường mất tính đúng đắn. **Cấm.**

### Phép thử chấp nhận một thay đổi "làm gọn"
Một thay đổi chỉ được giữ nếu **cả ba** đúng:
1. Số *khái niệm* giảm (ít state/effect/branch/wrapper/file/dependency hơn), không chỉ số dòng.
2. Hành vi người dùng thấy và dữ liệu gửi/lưu **không đổi** (hoặc đổi có chủ đích và đã được duyệt).
3. Không chạm vào mục nào ở **mục 2 (KHÔNG ĐƯỢC CẮT)**.

Nếu số dòng giảm nhưng số khái niệm không giảm (hoặc code khó đọc hơn) → **từ chối thay đổi đó**.

---

## 1. LUẬT CỨNG

| # | Luật |
|---|---|
| L1 | **Chỉ cắt khi đã chứng minh là thừa.** Chứng minh = đã xác minh ai đọc/ai ghi/khi nào chạy/deps là gì, và nêu được "mất cái này thì gì xảy ra: không gì cả". Không chứng minh được → giữ nguyên, hoặc hỏi. |
| L2 | **Không đổi hành vi.** Đặc biệt: thời điểm side effect, thứ tự, cache key, dữ liệu gửi server, timing lưu dữ liệu, trạng thái hiển thị (loading/lỗi/rỗng). |
| L3 | **Không đụng mục 2.** Nếu thấy "có vẻ thừa" nhưng nó thuộc mục 2 → để nguyên. |
| L4 | **Rủi ro cắt tăng theo kích thước vùng cắt.** Làm từng lô nhỏ, mỗi lô chạy được. Không viết lại hàng loạt. |
| L5 | **Dùng API theo đúng version dự án** (React/Next/Tailwind/Query). Tính năng mới (React 19, Next 16, scroll-driven CSS...) chỉ dùng khi đã xác minh version và hỗ trợ trình duyệt (mục 4). |
| L6 | **Xác minh bằng nguồn thật** (`package.json`, type `.d.ts` trong `node_modules`, config), không dựa trí nhớ. Không bịa API. |
| L7 | **Không thêm dependency.** Xoá dependency hoặc component `components/ui/*` không dùng chỉ được **đề xuất**, chờ duyệt. |
| L8 | **Không đổi style/đặt tên hàng loạt** vì "cho gọn". Không refactor ngoài phạm vi. |
| L9 | **Không chắc → hỏi**, gom câu hỏi một lần. |
| L10 | **Báo cáo trung thực** số liệu trước/sau và kết quả `typecheck/lint/test/build`. |

---

## 2. DANH SÁCH KHÔNG ĐƯỢC CẮT (BẤT BIẾN)

Dù code "dài", những thứ sau **không được xoá, thu gọn hay "đơn giản hoá" mất ý nghĩa**:

**Hành vi và trạng thái UI**
- Trạng thái **loading, error, empty** của mọi nơi hiển thị dữ liệu async (có thể chuyển sang `loading.tsx/error.tsx/Suspense` nhưng phải còn đủ).
- Skeleton/placeholder chống layout shift; kích thước ảnh/embed.
- Xử lý lỗi và phản hồi cho hành động thất bại (toast/inline), đường thử lại.
- Disabled/pending khi submit; chống double-submit.

**Đúng đắn và an toàn**
- `key` ổn định cho list.
- `cleanup` của effect, `AbortController`, chống race.
- Idempotency của effect (Strict Mode).
- Xác thực/phân quyền/validate **ở server** (Server Action, Route Handler). UI chặn không thay thế.
- Validate dữ liệu ngoài vào (API, URL, storage, form) bằng schema.
- Sanitize khi `dangerouslySetInnerHTML`; `rel="noopener noreferrer"`; kiểm tra scheme URL.
- Phân biệt `null`/`undefined` với `0`/`''`/`false` ở chỗ cần (ST-6 của master).
- Hydration an toàn (không đọc `window`/`Date.now()`/`Math.random()` lúc render).
- Ranh giới `server-only`, không lộ secret qua `NEXT_PUBLIC_*` hoặc props sang Client.

**Truy cập được và trải nghiệm**
- Thẻ ngữ nghĩa, `label`, `alt`, `aria-*`, `DialogTitle` (có thể `sr-only`), focus management, điều hướng bàn phím.
- `prefers-reduced-motion`, tương phản, vùng bấm đủ lớn.
- Responsive thật sự cần cho mobile; dark mode nếu dự án hỗ trợ.

**Kiểu và chất lượng**
- Type cho ranh giới công khai (props, hàm `lib/`, response API). Không thay bằng `any`.
- Tên biến/hàm nói rõ nghĩa nghiệp vụ; biến trung gian đặt tên cho điều kiện phức tạp.
- Test hiện có (không xoá test để "gọn"); test tái hiện bug.
- Comment giải thích **vì sao** (workaround, ràng buộc).

---

## 3. QUY TRÌNH

1. **Khảo sát:** đọc `package.json`, `next.config.*`, `tsconfig.json`, cấu hình ESLint, CSS chính. Điền mục 5 (bối cảnh). Chụp **số đo trước** (mục 8).
2. **Audit độ thừa (chỉ đọc, không sửa):** quét theo danh mục LEAN ở mục 4, đọc kỹ từng ứng viên, phân loại theo mục 6.
3. **Báo cáo và xin duyệt** (định dạng mục 9). Dừng chờ.
4. **Sửa theo lô nhỏ**, mỗi lô một chủ đề (ví dụ "gỡ state dẫn xuất ở feature reader"). Mỗi lô: typecheck, lint, test, build, so với baseline, kịch bản kiểm tra tay.
5. **Số đo sau + tổng kết**, gồm cả mục "cân nhắc nhưng giữ nguyên vì thuộc mục 2/không chắc".

Khi **viết code mới**, áp dụng cùng danh mục: đi qua mục 4 như checklist *trước khi* gõ (ví dụ "tính được từ state khác chưa? Server làm được chưa? CSS làm được chưa?").

Thứ tự ưu tiên khi chọn việc cắt (lợi nhiều, rủi ro thấp trước):
1. Xoá code chết (import/biến/hàm/file/export không dùng, code bị comment, `console.log`).
2. State dẫn xuất, effect đồng bộ state, effect phục vụ sự kiện.
3. Wrapper/hook một dòng, boilerplate đã có API thay thế (`forwardRef`, `.Provider`...).
4. Class Tailwind lặp, `useMediaQuery`/resize hook thay bằng CSS.
5. Memo thủ công (chỉ khi compiler đã bật và đã xác minh, xem LEAN-A5).
6. Chuyển sang Server Component / Server Action (rủi ro cao hơn, làm cuối, từng route).

---

## 4. DANH MỤC QUY TẮC LEAN

Mỗi quy tắc có điều kiện áp dụng. **Ghi chú "Cần xác minh"** là việc phải kiểm tra trước khi cắt.

### LEAN-A. Xoá khái niệm trong React (state, effect, memo)

- **A1. State dẫn xuất → tính trong render.** Nếu giá trị tính được từ state/props khác thì xoá `useState` + `useEffect` đồng bộ nó. React docs: Effect chỉ để đồng bộ với hệ thống bên ngoài; không cần Effect để biến đổi dữ liệu cho render. *Cần xác minh:* không có side effect thật trong effect đó.
- **A2. Effect phục vụ sự kiện → chuyển vào event handler.** Mẫu: `useEffect(() => { if (submitted) {...} }, [submitted])`. *Cần xác minh:* hành động chỉ xảy ra do click/submit, không phải do thay đổi từ nguồn khác.
- **A3. Reset state khi danh tính đổi → `key={id}`** ở component cha, thay cho effect `setState` khi prop đổi. *Cần xác minh:* component con không quá nặng/không giữ thứ cần sống qua id mới.
- **A4. Gọi callback của cha khi state đổi → gọi trong handler gây ra thay đổi**, không dùng effect theo dõi state rồi gọi `onChange`.
- **A5. `useMemo`/`useCallback`/`React.memo` thủ công.**
  - React Compiler 1.0 đã stable; Next.js 16 hỗ trợ stable (`reactCompiler: true`, cần `babel-plugin-react-compiler`); khuyến nghị Next ≥ 15.3.1 khi dùng compiler. `useMemo/useCallback` vẫn dùng được như "lối thoát" khi cần kiểm soát chính xác.
  - **Chỉ gỡ memo khi đã xác minh:** (1) compiler thực sự **được bật** trong config và file/component đó được compile (DevTools hiện badge `Memo ✨`), (2) ESLint `react-hooks` (preset có chẩn đoán compiler) không báo lỗi ở file đó, (3) giá trị memo **không** là deps của effect hoặc không được truyền cho thư viện ngoài React cần identity ổn định (ví dụ handler đăng ký vào chart/map; gỡ `useCallback` có thể làm effect đăng ký lại).
  - Với code **hiện có**: không gỡ hàng loạt; lợi ít, rủi ro đổi hành vi. Chỉ áp dụng cho code mới, hoặc khi memo rõ ràng thừa (memo giá trị rẻ, memo prop primitive).
  - Compiler chưa bật → **không gỡ gì cả.**
- **A6. Hook/component bọc một dòng** không thêm ý nghĩa (ví dụ `useToggle` chỉ bọc `useState(false)` dùng một chỗ) → inline. Nhưng giữ hook đặt tên một khái niệm nghiệp vụ (HK-1 của master).
- **A7. Nhiều `useState` đổi cùng nhau + effect nối chúng** → một `useReducer` hoặc một state object dạng union; thường ngắn hơn và đúng hơn.
- **A8. State cục bộ thay vì store/context.** Nếu chỉ một component đọc, bỏ khỏi Zustand/Context, dùng `useState`. Bỏ cả Provider/hook truy cập đi kèm.

### LEAN-B. API mới của React 19 (CHỈ khi React ≥ 19; xác minh trong `package.json` và type)

- **B1. `ref` là prop** (React 19): bỏ `forwardRef` wrapper, nhận `ref` trong props. (`element.ref` bị deprecate, dùng `props.ref`.) *Cần xác minh:* React ≥ 19, và component bên thứ ba bạn bọc cũng hỗ trợ. shadcn: không sửa `components/ui/*` (H7), chỉ báo.
- **B2. Form với Action:** `useActionState` (trạng thái + pending của action), `useFormStatus` (pending cho nút con), `useOptimistic` (UI lạc quan có tự rollback), `use` (đọc promise/context trong render, có thể gọi có điều kiện) thay cho tổ hợp `useState(pending)`, `useState(error)`, `try/finally` viết tay. *Cần xác minh:* luồng đó thực sự là form/Action; **không thay** React Query nếu dữ liệu cần cache/refetch/invalidate.
- **B3. `<Context value={...}>`** thay `<Context.Provider>` (React 19).
- **B4.** Không dùng B1-B3 nếu React < 19 hoặc type chưa hỗ trợ.

### LEAN-C. Server-first (Next.js App Router)

- **C1. Dữ liệu tĩnh/ít tương tác → fetch ở Server Component**, bỏ `useQuery` + loading branch + `'use client'` ở đó. Thêm `loading.tsx`/`Suspense` để giữ trạng thái chờ. *Cần xác minh:* dữ liệu không cần refetch/optimistic/polling phía client; không lộ dữ liệu nhạy cảm qua props (RSC-4).
- **C2. Hạ `'use client'` xuống lá.** Tách phần tương tác nhỏ ra; phần còn lại thành Server Component (bớt bundle và bớt code truyền state).
- **C3. Form đơn giản → `<form action={serverAction}>`** thay cho `onSubmit` + `fetch` + state. *Giữ nguyên:* auth, validate, trả lỗi có cấu trúc, trạng thái pending (SEC-2).
- **C4. Dùng sẵn của Next thay vì tự viết:** `next/image` (không tự lazy/resize), `next/font`, `next/link`, Metadata API, `loading.tsx`/`error.tsx`/`not-found.tsx` thay cho state loading/error lặp ở từng trang, `notFound()`/`redirect()` thay cho `useEffect + router.push`.
- **C5. State điều hướng ở URL** (`searchParams`/segment) thay cho `useState` + `useEffect` đồng bộ URL. Giữ chức năng share/reload (ST-2).
- **C6. Next 16:** `proxy.ts` thay `middleware.ts`; `use cache` + `cacheComponents` là mô hình cache tường minh. Chỉ dùng nếu đã xác minh version thật; **không** đổi cơ chế cache chỉ để "gọn".

### LEAN-D. Lớp dữ liệu (React Query v5, API, kiểu)

- **D1. Một `queryOptions()` / key factory dùng chung** cho `useQuery`, `prefetchQuery`, `getQueryData` thay vì lặp key + fn nhiều nơi.
- **D2. Bỏ cờ loading/error tự quản** (`useState` + `try/catch` + `useEffect` fetch) → `useQuery`/`useMutation`. Dùng `select` thay vì copy `data` vào state rồi biến đổi.
- **D3. `useSuspenseQuery`** bỏ nhánh `isPending`/`error` trong component **chỉ khi** đã có `Suspense` + error boundary ở trên (nếu không, bạn *mất* trạng thái loading/lỗi: vi phạm mục 2).
- **D4. Một client gọi HTTP** (wrapper) thay cho `fetch` thô lặp base URL/auth/parse/lỗi ở khắp nơi.
- **D5. Suy ra type từ schema** (`z.infer`) thay vì viết type và validator riêng giống nhau. Vẫn **giữ validate ở biên**. Bỏ lớp map DTO → model **chỉ khi** shape API đã bằng shape UI cần (nếu không, giữ).
- **D6. Mutation:** `onSettled` invalidate đúng key thay vì tự cập nhật cache ở nhiều nơi, trừ khi cần optimistic (khi đó giữ snapshot/rollback, hoặc dùng `variables`/`useOptimistic`).

### LEAN-E. Zustand

- **E1. Store nhỏ, ít boilerplate:** `create<State>()((set) => ({ x, setX }))`; không tách action-type/reducer/selector hook cho từng field nếu không có lý do. Dùng selector tại chỗ (`useStore(s => s.x)`) thay vì tạo một hook cho mỗi field.
- **E2. Xoá store (hoặc field) khi state chỉ một component dùng** (A8) hoặc khi dữ liệu là server data (để Query lo).
- **E3. Không viết `persist` thủ công** nếu middleware đáp ứng; nhưng **giữ** xử lý hydration/migrate (mục 2: hydration an toàn).

### LEAN-F. Tailwind v4 và shadcn/ui (bớt class, bớt JS giao diện)

- **F1. Viết gọn bằng utility có sẵn:** `size-*` thay `w-* h-*` cùng giá trị; `px-*/py-*`, `inset-*`, `gap-*` thay cho nhiều margin/padding riêng; thuộc tính logic (`ms-*`, `me-*`, `ps-*`...) khi cần RTL. Giá trị bất kỳ dùng được trực tiếp (v4: dynamic utility values, ví dụ `grid-cols-15`, `w-17`) → bỏ `[...]` và bỏ phần `extend` không cần.
- **F2. Biến thể trạng thái bằng CSS thay vì JS:** `hover:`, `focus-visible:`, `group-*`/`peer-*`, `has-*`, `not-*` (v4), `data-[state=open]:`/`aria-*:` (hợp với Radix/shadcn) thay cho `useState` + ghép className để biểu diễn trạng thái hiển thị. `starting:` (`@starting-style`) cho hiệu ứng vào mà không cần JS.
- **F3. Responsive bằng CSS:** breakpoint (`sm:`, `md:`) và **container queries** (`@container`, `@md:`; first-class trong v4) thay cho hook `useMediaQuery`/`useWindowSize`/`ResizeObserver` chỉ để đổi bố cục. *Cần xác minh:* hook đó không phục vụ logic (ví dụ chọn render component khác vì lý do hành vi, không phải bố cục).
- **F4. Token ngữ nghĩa thay cặp `dark:`:** dùng `bg-background text-foreground` (CSS variables của theme/shadcn) thay vì lặp `bg-white dark:bg-zinc-900` ở khắp nơi.
- **F5. Chuỗi class lặp → tách thành component** (hoặc `cva` nếu có biến thể), không dùng `@apply`. Gộp class xung đột bằng `cn()`; xoá class bị ghi đè/vô hiệu (ví dụ `p-4 px-6` thừa phần xung đột).
- **F6. Dùng component shadcn có sẵn** thay vì dựng lại (Dialog, Sheet, Tabs, Select, Tooltip, Skeleton, Sonner...). Không sửa nội bộ `components/ui/*` (H7). Component ui không dùng → **chỉ đề xuất xoá**.
- **F7. Xoá CSS/class không dùng** (selector không còn phần tử, biến `@theme` không dùng) *sau khi* xác minh bằng tìm kiếm.

### LEAN-G. Nền tảng trước, JS sau (HTML/CSS/Browser)

Mỗi mục dưới đây phải kiểm tra **trình duyệt cần hỗ trợ** (mục 5) và có phương án dự phòng (mục 2: không mất chức năng):
- **G1. Thanh tiến độ cuộn chỉ để hiển thị** có thể làm bằng CSS `animation-timeline: scroll()`, không cần listener/state. Hỗ trợ (tính đến giữa 2026): Chrome/Edge từ 115, Safari từ 26; **Firefox bản stable vẫn sau cờ (flag)** (Firefox 152, tháng 6/2026; có trong Interop 2026). → Bọc trong `@supports (animation-timeline: scroll())` và có phương án dự phòng (thanh ẩn, hoặc JS rAF/ref nhỏ). **Nếu giá trị tiến độ còn dùng cho logic (lưu tiến độ, hiện số %)** thì vẫn cần JS cho phần đó; CSS chỉ thay phần vẽ.
- **G2. Dùng thuộc tính HTML có sẵn** trước JS: `<details>/<summary>` cho phần mở/đóng đơn giản, `required/pattern/type=email/min/max` cho validate cơ bản (vẫn validate lại ở server), `loading="lazy"`, `<form action>`. Nếu dự án đã có shadcn (Radix), ưu tiên component shadcn thay vì tự viết bằng `<dialog>`/popover, trừ khi shadcn không có mà native đủ dùng và đạt a11y.
- **G3. CSS làm được thì không dùng JS:** `position: sticky`, `scroll-behavior`, `aspect-ratio`, `text-wrap: balance`, `:has()`, `gap`, grid/flex thay cho tính toán vị trí bằng JS.
- **G4. API chuẩn thay tiện ích tự viết/thư viện:** `?.`, `??`, `structuredClone`, `Array.prototype.at/flat/flatMap`, `Intl`, `AbortSignal.timeout`... thay cho hàm tự viết hoặc phần nhỏ của lodash/moment. *Cần xác minh:* hỗ trợ trình duyệt/Node của dự án. Xoá dependency chỉ được **đề xuất** (L7).

### LEAN-H. Kiểu (TypeScript) gọn nhưng chặt

- **H1. Để suy luận kiểu lo biến cục bộ**; chú thích ở ranh giới công khai (props, hàm xuất ra, response API). Xoá annotation thừa (`const x: number = 1`).
- **H2. Dùng `Pick/Omit/Partial/ReturnType/Parameters/z.infer`** thay vì viết lại type gần giống nhau. Dùng `satisfies` để kiểm tra mà không mất type hẹp.
- **H3. Union + `as const`** thay cho enum/chuỗi rời; tránh generic phức tạp không cần.
- **H4. Không** đổi sang `any`/`as`/`!` để "ngắn hơn" (mục 2).

### LEAN-I. JSX và component

- **I1. Composition thay vì nhiều prop:** truyền `children`/slot thay vì chuỗi boolean prop và nhánh `if` bên trong; gộp prop lặp bằng object khi chúng luôn đi chung. Không dùng `{...props}` mù quáng làm lộ prop không mong muốn.
- **I2. Điều khiển bằng dữ liệu (table-driven):** lặp JSX/`if-else`/`switch` gần giống nhau → mảng/object cấu hình + `map`/tra bảng. Chỉ khi các nhánh thực sự cùng cấu trúc (CQ-7 của master).
- **I3. Early return và guard** thay cho nhánh lồng; bỏ biến trung gian vô nghĩa. **Giữ** biến đặt tên cho điều kiện phức tạp (đó là tài liệu, không phải code thừa).
- **I4. Xoá wrapper `<div>`/Fragment thừa**, nhưng không phá ngữ nghĩa/a11y/layout (kiểm tra bằng mắt hoặc test).
- **I5. Bỏ `React.FC`, import `React` không cần**, `export default` + named lặp, props type bọc thừa.

### LEAN-J. Xoá thứ không dùng

- **J1.** Import/biến/hàm/file/export/component/hook không còn nơi nào dùng (xác minh bằng tìm kiếm toàn repo, nhớ kiểm tra dynamic import/chuỗi tên/Next convention file).
- **J2.** Code bị comment, `console.log`, `TODO` chết, feature flag đã hết hạn, polyfill cho thứ mọi trình duyệt cần hỗ trợ đã có.
- **J3.** Hai thư viện làm cùng một việc (hai thư viện date, hai kiểu form...). Chọn cách đã chiếm đa số trong repo (CQ-9 master). Xoá dependency = **đề xuất**.
- **J4.** Test/comment/type "trang trí" lặp lại điều code đã tự nói: có thể xoá, **nhưng không xoá test bảo vệ hành vi** (mục 2).

---

## 5. BỐI CẢNH (AI ĐIỀN TRƯỚC KHI CẮT)

| Mục | Giá trị | Ảnh hưởng quy tắc |
|---|---|---|
| React version | | B1-B4 (≥19) |
| Next.js version | | C6; compiler (≥15.3.1 khuyến nghị; `reactCompiler` stable ở 16) |
| React Compiler đã bật? (config + plugin + DevTools badge) | | A5 |
| Zustand version | | E |
| shadcn: bản tương thích Tailwind v4? | | F6 |
| Trình duyệt phải hỗ trợ (tối thiểu) | | G1-G4, F |
| Dự án dùng React Query ở đâu (client-only hay có prefetch ở server) | | C1, D3 |
| Có test? chạy bằng gì? | | mục 2, L10 |

Điểm nào không xác định được → hỏi người dùng.

---

## 6. QUYẾT ĐỊNH CHO TỪNG ỨNG VIÊN (6 CÂU HỎI)

Trước khi cắt/viết gọn bất kỳ thứ gì, trả lời:
1. Nó có thuộc **mục 2 (KHÔNG ĐƯỢC CẮT)** không? → Có: dừng.
2. Nó **bảo vệ hành vi gì**? Nếu bỏ đi, hành vi nào đổi? (Phải trả lời cụ thể.)
3. Có bằng chứng nó thừa không (ai đọc, ai ghi, deps, kịch bản)? Không có → giữ, hoặc ghi "Chưa xác minh".
4. Nền tảng/thư viện đã làm sẵn việc này **ở version của dự án** và **ở trình duyệt cần hỗ trợ** chưa?
5. Thay đổi có đổi **thời điểm/thứ tự** side effect, cache key, hoặc dữ liệu gửi đi không?
6. Sau khi cắt, người đọc có **hiểu dễ hơn** không (ít khái niệm hơn, tên rõ hơn)? Không → bỏ thay đổi.

Phân loại kết quả: **Cắt an toàn** · **Cắt có điều kiện (cần xác minh/duyệt)** · **Giữ nguyên (thuộc mục 2 / không chứng minh được)**.

---

## 7. MẪU "LÀM GỌN" SAI (CẤM)

- Nén nhiều nhánh vào ternary lồng nhau, `&&`/`||` chuỗi dài, `reduce` dày đặc.
- Xoá biến trung gian đặt tên cho điều kiện/ý nghĩa; đặt tên một chữ cái.
- Gộp nhiều trách nhiệm vào một component/hook "cho đỡ file" (đảo ngược mục tiêu của master HK-1).
- Bỏ type, thay bằng `any`/`as`/`!`; bỏ schema validate "vì đã có type".
- Bỏ nhánh loading/error/empty; bỏ `key`; bỏ cleanup; bỏ `AbortController`.
- Bỏ `aria-*`, `alt`, `label`, `DialogTitle`, hoặc đổi `button` thành `div`.
- Bỏ kiểm tra quyền/validate ở server vì "UI đã chặn".
- Over-DRY: mọi thứ thành config khổng lồ với nhiều cờ để dùng chung hai chỗ gần giống nhau.
- Thay đổi hàng loạt dạng "find & replace" không đọc từng nơi.
- Dùng tính năng quá mới mà không kiểm tra version/trình duyệt (mục 4, L5).
- Gỡ `useCallback/useMemo` hàng loạt khi compiler chưa bật hoặc giá trị là deps của effect.

---

## 8. SỐ ĐO TRƯỚC / SAU

Đo **trước** và **sau** trên phạm vi được giao. LOC chỉ là một chỉ số phụ.

| Chỉ số | Cách đo (gợi ý) |
|---|---|
| LOC (không tính dòng trống/comment) của các file trong phạm vi | `cloc` nếu có, hoặc `wc -l` trừ dòng trống |
| Số `useState`, `useEffect`, `useMemo/useCallback`, `useRef` | `rg -c` |
| Số file `'use client'` | `rg -l "^['\"]use client['\"]"` |
| Số giá trị mỗi hook trả về / số props lớn nhất | đọc |
| Số branch/ternary lồng, độ lồng lớn nhất | đọc |
| Số file/export/dependency không dùng | tìm kiếm; không tự xoá dependency |
| Kích thước bundle/route (từ output `next build`) | so output trước/sau |
| Kết quả `typecheck/lint/test/build` | chạy thật |

**Điều kiện chấp nhận lô:** các chỉ số *khái niệm* (state/effect/client file/branch/wrapper) giảm hoặc giữ nguyên; không có chỉ số an toàn nào xấu đi (mục 2); lệnh kiểm tra không tệ hơn baseline. Nếu chỉ LOC giảm → từ chối.

---

## 9. ĐỊNH DẠNG BÁO CÁO

**Mở đầu:** bảng bối cảnh (mục 5) đã điền, số đo trước (mục 8), độ phủ (đã đọc kỹ/chỉ lướt/chưa xem), baseline lệnh kiểm tra.

**Mỗi ứng viên:**
```
### [Cắt an toàn | Cắt có điều kiện | Giữ nguyên] LEAN-<ID> — Tiêu đề ngắn
- Vị trí: path/to/file.tsx:42
- Hiện trạng: (đoạn code ngắn)
- Đề xuất: (đoạn code ngắn sau khi làm gọn)
- Số khái niệm giảm: (ví dụ: -1 state, -1 effect, -1 wrapper)
- Hành vi được bảo toàn như thế nào: (kịch bản cụ thể)
- Đã xác minh: (ai đọc/ai ghi/deps/version/trình duyệt) | "Chưa xác minh"
- Chạm mục 2 không: không | có (và vì sao vẫn an toàn / hoặc giữ nguyên)
- Rủi ro đổi hành vi + cách kiểm tra tay:
```

**Kết thúc:** (1) danh sách "Giữ nguyên" kèm lý do (đặc biệt các thứ trông thừa nhưng bảo vệ hành vi), (2) câu hỏi cần quyết định, (3) kế hoạch lô, (4) số đo sau (khi đã sửa).

**Giao thức sửa:** mỗi lô một chủ đề, diff nhỏ, chạy `typecheck/lint/test/build` sau mỗi lô, kịch bản kiểm tra tay, dừng và hỏi khi có kiểm tra mới fail, cần quyết định sản phẩm, lan ra ngoài phạm vi, hoặc cần đổi dependency/config build.

---

## PHỤ LỤC A. LỆNH TÌM ỨNG VIÊN (chỉ để tìm chỗ cần đọc)

```bash
# State/effect/memo nhiều bất thường
rg -c "useEffect\(" src app | sort -t: -k2 -rn | head -20
rg -c "useState\(" src app | sort -t: -k2 -rn | head -20
rg -c "useMemo\(|useCallback\(|React\.memo|memo\(" src app | sort -t: -k2 -rn | head -20

# Effect đồng bộ state (A1), effect cho sự kiện (A2)
rg -n -U "useEffect\(\(\) => \{\s*set[A-Z]\w*\(" src app
rg -n -U "useEffect\(\(\) => \{\s*if \(" src app

# forwardRef / Provider cũ (B1, B3; chỉ khi React >= 19)
rg -n "forwardRef\(|\.Provider" src app

# useMediaQuery / resize chỉ để đổi bố cục (F3)
rg -n "useMediaQuery|useWindowSize|matchMedia|ResizeObserver|addEventListener\(['\"]resize" src app

# Listener scroll chỉ để vẽ (G1)
rg -n "addEventListener\(['\"]scroll" src app

# Class lặp / cặp w-h cùng giá trị (F1) / cặp dark: lặp (F4)
rg -n "\bw-(\d+)\b.*\bh-\1\b|\bh-(\d+)\b.*\bw-\2\b" src app
rg -c "dark:" src app | sort -t: -k2 -rn | head -20

# useQuery/fetch viết tay (D2), key rải rác (D1)
rg -n "fetch\(" src app
rg -n "queryKey:\s*\[" src app

# Client component có thể hạ xuống lá (C2)
rg -l "^['\"]use client['\"]" src app | xargs wc -l | sort -rn | head -20

# Code chết (J1/J2) — đọc kỹ trước khi xoá
rg -n "console\.(log|debug)|TODO|FIXME" src app
# Export không dùng: dùng công cụ sẵn có trong dự án (ví dụ knip/ts-prune) nếu đã cài; không cài mới (L7)
```

---

## PHỤ LỤC B. TRƯỚC / SAU

**A1 State dẫn xuất**
```tsx
const [items, setItems] = useState(data);
const [count, setCount] = useState(0);
useEffect(() => setCount(items.length), [items]);
// →
const count = items.length;
```

**A2 Effect cho sự kiện**
```tsx
useEffect(() => { if (submitted) { track(); navigate(); } }, [submitted]);
// →
function onSubmit() { track(); navigate(); }
```

**A3 Reset bằng key**
```tsx
useEffect(() => { setDraft(''); }, [chapterId]);
// →
<ChapterNotes key={chapterId} chapterId={chapterId} />
```

**B1 `ref` là prop (React ≥ 19)**
```tsx
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} {...props} />);
// →
function Input({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

**B2 Form Action (React ≥ 19)**
```tsx
const [pending, setPending] = useState(false);
const [error, setError] = useState<string | null>(null);
async function onSubmit(e) { e.preventDefault(); setPending(true); setError(null);
  try { await save(...); } catch (err) { setError(msg(err)); } finally { setPending(false); } }
// →
const [error, action, pending] = useActionState(saveAction, null);
<form action={action}>…<button disabled={pending}>Lưu</button>{error && <p role="alert">{error}</p>}</form>
// Giữ nguyên: validate/auth ở server, thông báo lỗi, disabled khi pending
```

**F1 Tailwind gọn**
```tsx
<div className="w-10 h-10 mt-4 mb-4 ml-2 mr-2">
// →
<div className="size-10 my-4 mx-2">
```

**F2/F3 Trạng thái và bố cục bằng CSS thay JS**
```tsx
const isDesktop = useMediaQuery('(min-width: 768px)');           // chỉ để đổi bố cục
<div className={isDesktop ? 'flex-row' : 'flex-col'}>
// →
<div className="flex flex-col md:flex-row">
// Container query: <div className="@container"><div className="flex flex-col @md:flex-row">…
```

**F4 Token ngữ nghĩa**
```tsx
className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"
// →
className="bg-background text-foreground"
```

**G1 Thanh tiến độ (chỉ hiển thị) bằng CSS, có dự phòng**
```css
@supports (animation-timeline: scroll()) {
  .progress { animation: grow linear both; animation-timeline: scroll(root block); }
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
}
/* Trình duyệt chưa hỗ trợ: .progress ẩn hoặc dùng bản JS nhỏ (ref + rAF) làm dự phòng.
   Nếu cần giá trị % cho logic lưu tiến độ thì vẫn cần JS cho phần đó. */
```

**I2 Điều khiển bằng dữ liệu**
```tsx
{type === 'a' && <Row icon={A} label="..." />}
{type === 'b' && <Row icon={B} label="..." />}
{type === 'c' && <Row icon={C} label="..." />}
// →
const META = { a: { icon: A, label: '...' }, b: { icon: B, label: '...' }, c: { icon: C, label: '...' } } as const;
<Row {...META[type]} />
```

**D1 Dùng chung `queryOptions`**
```ts
export const chapterQuery = (id: string) =>
  queryOptions({ queryKey: ['chapter', id], queryFn: ({ signal }) => api.getChapter(id, signal) });
// useQuery(chapterQuery(id)) · queryClient.prefetchQuery(chapterQuery(id))
```

---

## PHỤ LỤC C. PROMPT MẪU

**Audit độ thừa (khuyến nghị bắt đầu):**
> Đọc `frontend-lean-code-rules.md` và `frontend-master-rules.md`, làm đúng. Chế độ AUDIT, **không sửa file**. Phạm vi: `src/features/reader`. Điền mục 5, đo số trước (mục 8), quét mục 4, đọc kỹ từng ứng viên, phân loại theo mục 6 và xuất báo cáo theo mục 9. Cái nào thuộc mục 2 thì ghi "Giữ nguyên". Không chắc thì ghi "Chưa xác minh" hoặc hỏi.

**Sửa một lô đã duyệt:**
> Chế độ FIX. Làm đúng các mục sau: [dán mục đã duyệt]. Diff nhỏ, không đổi hành vi, không chạm mục 2, không thêm/xoá dependency. Chạy typecheck/lint/test/build sau mỗi bước, so baseline, đưa kịch bản kiểm tra tay, và số đo trước/sau.

**Viết code mới ít thừa:**
> Trước khi viết, đi qua mục 4 như checklist (tính được chưa? server làm được chưa? CSS/HTML làm được chưa? đã có component shadcn chưa?). Viết bản ngắn nhất **đúng** mà vẫn đủ loading/error/empty, a11y, validate ở server, và type ở ranh giới.

---

## PHỤ LỤC D. NGUỒN ĐÃ THAM KHẢO (kiểm tra lại khi nâng version)

- React docs, "You Might Not Need an Effect" (react.dev/learn/you-might-not-need-an-effect).
- React 19 release notes (react.dev/blog/2024/12/05/react-19) và changelog: `ref` là prop, `useActionState`, `useOptimistic`, `use`.
- React Compiler v1.0 (react.dev/blog/2025/10/07/react-compiler-1): memoization tự động, `useMemo/useCallback` còn là lối thoát, khuyến nghị Next ≥ 15.3.1.
- Tailwind CSS v4.0 (tailwindcss.com/blog/tailwindcss-v4): dynamic utility values, container queries, `not-*`, `@starting-style`.
- Next.js 16 (nextjs.org/blog/next-16): React Compiler stable, `proxy.ts` thay `middleware.ts`, Cache Components/`use cache`.
- CSS scroll-driven animations: tài liệu Chrome for Developers (developer.chrome.com/docs/css-ui/scroll-driven-animations) và các bài tổng hợp hỗ trợ trình duyệt 2026; trạng thái hỗ trợ **thay đổi nhanh**, kiểm tra caniuse/MDN trước khi dựa vào.
