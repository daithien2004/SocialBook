# Product Requirements Document (PRD): Hệ thống Tích điểm (Reading Points System)

## 1. Giới thiệu chức năng / Tính năng
- **Tên tính năng:** Hệ thống Tích điểm Đọc/Nghe sách (Reading Points System).
- **Mục tiêu:** Khuyến khích người dùng duy trì thói quen đọc sách bằng cách tặng "Điểm" (Points) tương ứng với thời lượng hoặc khối lượng sách họ tiêu thụ. Điểm này đóng vai trò như một loại tiền tệ ảo (virtual currency) để người dùng có thể "tiêu xài" đổi lấy các quyền lợi hoặc mở khóa các tính năng đặc biệt trong tương lai.

## 2. Phạm vi yêu cầu (Scope)

### In Scope (Sẽ làm trong giai đoạn này - MVP)
- **Tạo ra khái niệm "Points" (Điểm):** Cập nhật hệ thống Gamification hiện tại (vốn chỉ có XP và Streak) để hỗ trợ thêm `Points`. Điểm khác biệt cốt lõi: XP chỉ tăng để lên cấp, còn Points có thể kiếm được và tiêu đi.
- **Cơ chế cộng điểm tự động:** 
  - Cộng điểm mỗi khi người dùng hoàn thành 1 chương sách.
  - Cộng điểm khi người dùng đọc/nghe liên tục trong X phút.
  - Thưởng điểm bonus khi người dùng đạt chuỗi (Streak) đọc sách liên tiếp 3 ngày, 7 ngày, v.v.
- **API truy vấn Điểm:** Giao diện Frontend có thể lấy được số điểm hiện tại của người dùng để hiển thị trên Header (Ví dụ: 🪙 150 Điểm).
- **Hạ tầng trừ điểm (Spend Points):** Xây dựng sẵn hàm ở Backend để trừ điểm (với các logic kiểm tra số dư hợp lệ) chuẩn bị cho việc mở khóa tính năng.

### Out of Scope (Không làm trong giai đoạn này)
- Vòng quay may mắn (Gacha) tiêu điểm.
- Thanh toán/Nạp tiền thật mua điểm.
- Dùng điểm để mua sách bản quyền (cần hệ thống thanh toán phức tạp).

## 3. Kiến trúc & Thiết kế kỹ thuật (áp dụng Clean Architecture & DDD)

### 3.1. Domain Layer (Lõi nghiệp vụ)
- **Value Object `Points`:** Sẽ được tạo tại `src/domain/gamification/value-objects/points.vo.ts`. Chứa logic không cho phép số điểm bị âm (`points >= 0`), hàm `add(amount)` và `subtract(amount)`.
- **Entity `UserGamification`:** Bổ sung thuộc tính `_points: Points`. Bổ sung các methods nghiệp vụ:
  - `addPoints(amount: number): void`
  - `spendPoints(amount: number): boolean` (Trả về false nếu không đủ điểm).
- **Domain Events:** Cần bắn event `PointsEarnedEvent` và `PointsSpentEvent` để phục vụ audit/log (ví dụ: Lưu lịch sử giao dịch điểm người dùng dễ dàng theo dõi).

### 3.2. Application Layer & Infrastructure (Backend NestJS)
- **Use Cases / Services:** Tạo service xử lý việc tính toán điểm dựa trên `ReadingProgress` (tiến độ đọc). Khi user gửi API cập nhật tiến độ đọc, hệ thống sẽ tính xem đã đạt điều kiện thưởng điểm chưa (dựa theo Rule/Công thức).
- **Mongoose Schema:** Cập nhật file Schema của collection `gamifications` (trong DB) để cho phép lưu thêm trường `points` (kiểu Number, default: 0).

### 3.3. Frontend (Next.js 15)
- **UI Components:** Bổ sung một component `PointsBadge.tsx` hiển thị ở khu vực User Profile hoặc Header.
- **State Management:** Cập nhật Redux store (Zustand/RTK) chứa thông tin `currentPoints` của User lấy từ API.

## 4. Các trường hợp kiểm thử (Test Cases - BDD)
- **Scenario 1: Kiếm điểm (Earn Points)**
  - *Given* người dùng đang có 100 điểm.
  - *When* người dùng hoàn thành 1 chương sách mới (được thưởng 10 điểm).
  - *Then* hệ thống phải gọi hàm `addPoints(10)` và ghi nhận tổng điểm là 110 điểm.
- **Scenario 2: Tiêu điểm (Spend Points) - Thành công**
  - *Given* người dùng đang có 50 điểm.
  - *When* người dùng dùng 30 điểm để mở khóa tính năng X.
  - *Then* hàm `spendPoints(30)` trả về true, điểm còn lại là 20.
- **Scenario 3: Tiêu điểm (Spend Points) - Thất bại do thiếu điểm**
  - *Given* người dùng đang có 10 điểm.
  - *When* người dùng cố gắng mở khóa tính năng giá 50 điểm.
  - *Then* hàm `spendPoints(50)` ném ra Exception (VD: `InsufficientPointsException`) hoặc trả về `false`, và số điểm vẫn giữ nguyên là 10.

## 5. Kế hoạch chia nhỏ (Phases)
- **Phase 1: Domain & DB Modeling (1 ngày):** Cập nhật `UserGamification`, viết Unit Test (TDD) cho Value Object `Points`. Cập nhật Mongoose Schema.
- **Phase 2: Use Cases & Endpoints (1 ngày):** Viết logic API thưởng điểm khi đọc sách. Viết API lấy số dư điểm.
- **Phase 3: Frontend Integration (1 ngày):** Tích hợp UX/UI hiển thị điểm trên Web App.
