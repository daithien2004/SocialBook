# SocialBook 📚

<div align="center">

**A comprehensive, feature-rich social network platform for book lovers — combining advanced reading tracking, social interaction, real-time collaboration, and AI-powered capabilities.**

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Advanced Book Management** | Browse, search (full-text + vector), filter by genre/tag. Supports importing multiple formats (EPUB, PDF, MOBI) with parsing capabilities. |
| 📖 **Immersive Chapter Reading** | Rich reading experience with customizable themes/fonts, progress tracking, bookmarks, highlights, and AI-generated chapter summaries. |
| 🤝 **Social & Community** | Follow users, like books/posts/comments, write reviews, rate books, and receive real-time notifications. |
| 💬 **Real-time Reading Rooms** | Collaborative reading spaces with sync/free/discussion modes, real-time presence, highlights, and live interactions. |
| 🤖 **AI-Powered Capabilities** | Google Gemini 2.5 Flash for summaries, LangChain integration, ChromaDB for semantic vector search, automated content moderation, and Text-to-Speech (Google Cloud & ElevenLabs). |
| 🔐 **Security & Authentication** | JWT access/refresh tokens, OAuth (Google), OTP verification, and strictly enforced Role-Based Access Control (RBAC) via CASL. |
| 🔍 **Discovery & Recommendations** | Multi-modal search (MongoDB text index + ChromaDB vector search) and AI-driven personalized book recommendations. |
| 📊 **Analytics & Visualization** | Comprehensive reading stats, admin analytics dashboard with Recharts/D3 charts, and force-directed connection graphs. |
| 📥 **Background Processing** | Asynchronous task execution using BullMQ for book imports (two-phase import), data scraping, and heavy background jobs. |

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS 4, Radix UI Primitives, Framer Motion, shadcn/ui
- **State Management:** TanStack React Query (server state), Zustand (client/UI state), Context API
- **Real-time:** Socket.IO Client (namespace-based)
- **Data Visualization:** Recharts, D3.js, React Force Graph, React Map GL
- **Security & Auth:** Next-Auth, CASL (RBAC)
- **Testing:** Playwright (E2E), Jest + React Testing Library
- **Design Tokens:** Style Dictionary (Amazon), DTCG format

### Backend
- **Framework:** NestJS 11 — **Clean Architecture** (domain/application/infrastructure/presentation)
- **Language:** TypeScript
- **Databases:** MongoDB 7 (Mongoose), Redis 7 (Caching, Queues, Presence), ChromaDB (Vector DB)
- **Authentication:** JWT, Passport (Local, JWT strategies), OTP, bcrypt
- **Real-time:** Socket.IO Gateway (Redis adapter for horizontal scaling)
- **Background Jobs:** BullMQ (Redis-backed queues)
- **File Upload:** Multer + Cloudinary (images, media)
- **AI Integration:** Google Gemini 2.5 Flash, LangChain, HuggingFace, ChromaDB, ElevenLabs / Google Cloud TTS
- **File Parsing:** `epub2`, `pdf-parse`, `@lingo-reader/mobi-parser`
- **Email:** Resend / Nodemailer
- **API Docs:** Swagger / OpenAPI
- **Testing:** Jest (unit, integration, e2e), mongodb-memory-server

### DevOps / Infrastructure
- **Containerization:** Docker Compose (6 services: nginx, backend x2, frontend, mongo, redis, chroma)
- **CI/CD:** GitHub Actions (linting, testing, building, deployment)
- **Reverse Proxy:** Nginx with WebSocket support, load balancing, Gzip, security headers
- **Monitoring:** Custom Logger, Global Exception Filters, Sentry integration on frontend

---

## 🏗️ Architecture

The backend strictly follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles, separating concerns into four distinct layers:

```text
backend/src/
├── domain/            # 🔵 Enterprise Business Rules (Entities, Value Objects, Port Interfaces)
├── application/       # 🟢 Application Business Rules (CQRS: Commands, Queries, Use Cases)
├── infrastructure/    # 🟡 Frameworks & External Adapters (Mongoose, Redis, AI APIs, Gateways)
├── presentation/      # 🔴 Delivery Mechanism (REST Controllers, WebSocket Gateways)
└── shared/            # ⚪ Cross-cutting Concerns (Logger, Base Classes, Decorators)
```

### Domain Modules (29 distinct bounded contexts)
`ai` · `analytics` · `auth` · `authors` · `bookmarks` · `books` · `chapters` · `chroma` · `cloudinary` · `comments` · `content-moderation` · `follows` · `genres` · `library` · `likes` · `notifications` · `posts` · `progress` · `reading-room-interactions` · `reading-rooms` · `recommendations` · `reviews` · `roles` · `scraper` · `search` · `statistics` · `text-to-speech` · `user-highlights` · `users`

---

## 🧪 Testing

### Backend Tests
```bash
npm run test:unit        # Unit tests — entities, value objects, use cases (mocked deps)
npm run test:integration # Integration tests — repositories with mongodb-memory-server
npm run test:e2e         # E2E tests — full HTTP flow with Supertest
npm run test:cov         # With coverage report
```

### Frontend Tests
```bash
npm run test:e2e         # Playwright E2E tests
npm run test             # Jest unit tests
```

---

## 📊 Performance & Optimization

### Frontend
- **Rendering:** Server-Side Rendering (SSR) & Static Site Generation (SSG) via Next.js App Router.
- **Dynamic Imports:** Heavy components (graphs, charts) loaded via `next/dynamic`.
- **State Optimizations:** `React.memo` on lists, IntersectionObserver for infinite scroll, debounced inputs.
- **Image Optimization:** Next.js `<Image>` integrated with Cloudinary for automatic format/size selection.

### Backend
- **Caching Strategy:** Cache-aside pattern via Redis with TTL-based eviction.
- **Database Optimization:** MongoDB compound indexes, text indexes, and partial filters. Efficient aggregation pipelines (`$facet`).
- **Pagination:** Cursor-based pagination (O(1) complexity).
- **Rate Limiting:** Throttler applied globally (100 req/min) and aggressively on auth routes (5 req/min).
- **Asynchronous Processing:** BullMQ delegates heavy CPU tasks (file parsing, PDF processing, AI generation) to background workers.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v20+
- MongoDB (local or Atlas)
- Docker & Docker Compose

### 1. Clone the repository
```bash
git clone <repository_url>
cd sb_develop
```

### 2. Start infrastructure services (Redis, Mongo, Chroma, Nginx)
```bash
docker compose up -d
```

### 3. Setup Backend

```bash
cd backend
cp .env.example .env    # Edit with your credentials/keys
npm install
npm run start:dev
```
> REST API available at `http://localhost:5000`
> Swagger Docs at `http://localhost:5000/docs`

### 4. Setup Frontend

```bash
cd frontend
cp .env.example .env.local  # Edit with your URLs
npm install
npm run dev
```
> Application available at `http://localhost:3000`

### 5. Seed database (Optional)
```bash
cd backend
npm run seed
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the strict architectural guidelines detailed in `AGENTS.md`.
4. Run tests: `npm run test:unit && npm run lint`
5. Commit with conventional commit messages
6. Push and create a Pull Request

All PRs automatically run lint + unit tests + build via GitHub Actions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
