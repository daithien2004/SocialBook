# SocialBook

SocialBook là một nền tảng mạng xã hội đa tính năng dành riêng cho những người yêu sách. Dự án kết hợp việc theo dõi đọc sách truyền thống với mạng xã hội hiện đại, gamification (trò chơi hóa) và các tính năng AI để nâng cao trải nghiệm đọc sách.

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Ngôn ngữ:** TypeScript
- **Styling:** TailwindCSS 4, Radix UI, Framer Motion
- **Quản lý trạng thái:** Redux Toolkit, RTK Query
- **Real-time:** Socket.IO Client
- **Biểu đồ/Bản đồ:** Recharts, React Map GL

### Backend
- **Framework:** NestJS 11
- **Ngôn ngữ:** TypeScript
- **Cơ sở dữ liệu:** MongoDB (via Mongoose), Redis (Caching/Queues), ChromaDB (Vector Search)
- **Xác thực:** JWT, Passport
- **Real-time:** Socket.IO Gateway
- **Tích hợp AI:** 
  - Google Gemini (Tóm tắt chương sách)
  - OpenAI / LangChain
  - HuggingFace
  - Google Cloud Text-to-Speech

### DevOps / Infrastructure
- **Containerization:** Docker (cho Redis & ChromaDB)
- **Build Tools:** Turbopack

## ✨ Tính Năng Chính

- **📚 Quản lý sách:** Duyệt, đọc và theo dõi sách. Hỗ trợ Quản lý Chương (Chapters) và Đánh giá (Reviews).
- **🤝 Tương tác xã hội:** Theo dõi người dùng khác, like sách/bình luận, và nhận thông báo thời gian thực.
- **🎮 Gamification:** Đạt thành tựu, duy trì chuỗi đọc sách (streak), và hoàn thành mục tiêu hàng ngày để nhận XP.
- **🤖 Hỗ trợ AI:** 
  - **Tóm tắt chương:** Nhận tóm tắt nhanh nội dung chương sách sử dụng Gemini AI.
  - **Text-to-Speech:** Nghe nội dung sách.
  - **Embeddings:** Tìm kiếm vector sử dụng ChromaDB.
- **🔐 Onboarding & Xác thực:** Quy trình đăng nhập/đăng ký bảo mật cùng với thiết lập sở thích người dùng.

## 🛠️ Cài Đặt & Thiết Lập

### Yêu cầu tiên quyết
- Node.js (v18+ khuyến nghị)
- MongoDB (Cài local hoặc dùng Atlas)
- Docker Desktop (để chạy Redis & ChromaDB)

### 1. Clone dự án
```bash
git clone <repository_url>
cd socialbook_dev_thien
```

### 2. Thiết lập Infrastructure
Khởi chạy các dịch vụ cần thiết (Redis, ChromaDB) bằng Docker Compose:
```bash
docker-compose up -d
```

### 3. Thiết lập Backend
Di chuyển vào thư mục backend và cài đặt dependencies:
```bash
cd backend
npm install
```

**Biến môi trường (.env):**
Tạo file `.env` trong thư mục `backend` với nội dung sau:

```env
PORT=5000
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=
FRONTEND_URL=
NODE_ENV=

EMAIL_USER=
EMAIL_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_API_KEY=

RAPID_MODER_API_KEY=
RAPID_API_HOST=
RAPID_API_URL=
```

Chạy backend server:
```bash
npm run start:dev
```
Server sẽ khởi chạy tại `http://localhost:5000`.

### 4. Thiết lập Frontend
Mở terminal mới, di chuyển vào thư mục frontend và cài đặt dependencies:
```bash
cd frontend
npm install
```

**Biến môi trường (.env.local):**
Tạo file `.env.local` trong thư mục `frontend` với nội dung sau:

```env
NEXT_PUBLIC_NEST_API_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXTAUTH_SECRET=

NEXT_PUBLIC_SOCKET_URL=
```

Chạy frontend development server:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:3000`.

## 📂 Cấu Trúc Dự Án

- **backend/**: Ứng dụng NestJS chứa toàn bộ logic API, schemas, và services.
  - `src/modules`: Các module theo tính năng (books, users, v.v.).
- **frontend/**: Ứng dụng Next.js cho giao diện người dùng.
  - `src/app`: Các trang App Router.
  - `src/components`: Các UI component tái sử dụng.
  - `src/store`: Quản lý trạng thái (State management).
