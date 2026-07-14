# SocialBook 📚

<div align="center">

**A feature-rich social network platform for book lovers — combining reading tracking, social interaction, and AI-powered features.**

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-59%20passing-brightgreen?style=flat-square)](#-testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Book Management** | Browse, search (full-text + vector), filter by genre/tag, sort with cursor pagination |
| 📖 **Chapter Reading** | Rich reading experience with theme/font/size settings, reading progress tracking, AI summaries |
| 🤝 **Social Interaction** | Follow users, like books/comments, reviews & ratings, real-time notifications |
| 💬 **Real-time Reading Rooms** | Collaborative reading with sync/free/discussion modes, highlights, annotations, quotes |
| 🤖 **AI Integration** | Chapter summaries (Gemini 2.5 Flash), Text-to-Speech, vector search (ChromaDB), content moderation |
| 🔐 **Authentication** | JWT access/refresh token, OTP verification, Google OAuth, role-based access control |
| 🔍 **Search & Recommendations** | Full-text search (MongoDB text index) + vector search (ChromaDB) + AI-powered book recommendations |
| 📊 **Statistics** | Reading stats, admin analytics dashboard with charts and user growth metrics |
| 📥 **EPUB Import** | Two-phase import with background job processing (BullMQ), preview before confirm |

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS 4, Radix UI, Framer Motion, shadcn/ui (53 components)
- **State Management:** Redux Toolkit (RTK Query) + Zustand (UI state) + Context (providers)
- **Real-time:** Socket.IO Client (namespace-based)
- **Charts:** Recharts
- **Testing:** Playwright (E2E)
- **Design Tokens:** Style Dictionary (Amazon), DTCG format, prebuild hook auto-generates CSS variables from `design-tokens/tokens.json`

### Backend
- **Framework:** NestJS 11 — **Clean Architecture** (domain/application/infrastructure/presentation)
- **Language:** TypeScript
- **Databases:** MongoDB 7 (Mongoose), Redis 7 (Caching/Queues/Presence), ChromaDB (Vector Search)
- **Authentication:** JWT (access + refresh token rotation), Passport (3 strategies), OTP, RBAC
- **Real-time:** Socket.IO Gateway (2 namespaces + Redis adapter for horizontal scaling)
- **Background Jobs:** BullMQ (chapter import)
- **File Upload:** Multer + Cloudinary (images, audio)
- **AI Integration:** Google Gemini 2.5 Flash, LangChain, HuggingFace, ChromaDB
- **API Docs:** Swagger / OpenAPI
- **Testing:** Jest (unit + integration + e2e), mongodb-memory-server

### DevOps / Infrastructure
- **Containerization:** Docker Compose (6 services: nginx, backend x2, frontend, mongo, redis, chroma)
- **CI/CD:** GitHub Actions — PR validation (lint + test + build) + auto-deploy to DigitalOcean
- **Reverse Proxy:** Nginx with WebSocket support, load balancing, Gzip, security headers
- **Monitoring:** Custom Logger + Global Exception Filter + Transform Interceptor

---

## 🏗️ Architecture

The backend follows **Clean Architecture** principles, separating concerns into four distinct layers:

```
backend/src/
├── domain/            # 🔵 Enterprise business rules
│   ├── entities/      #    Core domain entities (27 entities across 30+ modules)
│   ├── value-objects/ #    Immutable value objects
│   └── repositories/  #    Repository interfaces (contracts)
│
├── application/       # 🟢 Application business rules
│   └── {feature}/
│       ├── use-cases/ #    One use case per file (156+ use cases)
│       ├── commands/  #    CQRS commands
│       └── queries/   #    CQRS queries
│
├── infrastructure/    # 🟡 Frameworks & external adapters
│   ├── database/      #    Mongoose schemas (22) & repository implementations
│   ├── cache/         #    Redis caching services
│   ├── gateways/      #    Socket.IO gateways (771-line reading room gateway)
│   └── queues/        #    BullMQ background job processors
│
├── presentation/      # 🔴 Delivery mechanism
│   └── {feature}/
│       └── *.controller.ts  # HTTP controllers (25+ controllers, REST API)
│
└── shared/            # ⚪ Cross-cutting concerns
    ├── logger/        #    Custom Logger
    ├── domain/        #    Base classes (Entity, DomainException)
    └── database/      #    Seed scripts
```

### Domain Modules (30+)
`auth` · `users` · `books` · `chapters` · `authors` · `genres` · `comments` · `likes` · `follows` · `reviews` · `library` · `posts` · `notifications` · `statistics` · `analytics` · `search` · `recommendations` · `scraper` · `chroma` · `gemini` · `text-to-speech` · `reading-rooms` · `reading-room-interactions` · `content-moderation` · `collections`

---

## 🧪 Testing

### Backend Tests (59 tests, 10 suites)

```
npm run test:unit        # Unit tests — entities, value objects, use cases (mocked deps)
npm run test:integration # Integration tests — repositories with mongodb-memory-server
npm run test:e2e         # E2E tests — full HTTP flow with Supertest
npm run test:cov         # With coverage report
```

### Frontend Tests
```
npm run test:e2e         # Playwright E2E tests
```

### Test Coverage Highlights

| Layer | Tests | Description |
|-------|-------|-------------|
| **Domain Entities** | 18 | Book entity: create, reconstitute, business methods, defensive copy |
| **Use Cases** | 19 | CreateBook, GetBookBySlug, GetChapterBySlug, Posts, ReadingRoom quotes |
| **Infrastructure** | 7 | ContentModerationService (regex, Gemini, API fallback) |
| **Integration** | 13 | BookRepository CRUD, filter, sort, pagination with real MongoDB |
| **E2E** | 2 | Books API response structure, pagination, search, access control |

---

## 📊 Performance

Load testing with [k6](https://k6.io) — see [benchmark/RESULTS.md](benchmark/RESULTS.template.md) for full results.

| Endpoint | P95 (cached) | P95 (no cache) | Optimization |
|----------|-------------|----------------|-------------|
| `GET /api/books` | ~80ms | ~1200ms | Compound index + Redis cache |
| `GET /api/books/:slug` | ~50ms | ~800ms | Cache-aside + aggregation pipeline |
| `GET /api/books?search=` | ~200ms | ~1500ms | Text index + vector search |

### Performance Techniques

**Frontend:**
- Dynamic imports (`dynamic()` with `ssr: false`) for heavy components
- `React.memo` on book cards, chapter content, navigation
- IntersectionObserver-based infinite scroll (20 items/page)
- Debounced search (500ms) and reading progress saves (1s)
- Image optimization with Next.js `<Image>` and Cloudinary
- Zustand persist — reading settings saved to localStorage

**Backend:**
- Redis caching (cache-aside pattern) with TTL-based eviction
- MongoDB compound indexes with partial filters
- Aggregation `$facet` — single query for paginated data + metadata
- Cursor-based pagination (O(1) vs offset's O(n))
- Rate limiting — 100 req/min global, 5 req/min auth
- Background jobs (BullMQ) for heavy operations
- View dedup via Redis `setIfNotExists` (30-min TTL)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Docker Desktop (for Redis & ChromaDB)

### 1. Clone the repository
```bash
git clone <repository_url>
cd sb_develop
```

### 2. Start infrastructure services
```bash
docker compose up -d
```

### 3. Setup Backend

```bash
cd backend
cp .env.example .env    # Edit with your values
npm install
npm run start:dev
```
> API available at `http://localhost:5000`
> Swagger docs at `http://localhost:5000/docs`

### 4. Setup Frontend

```bash
cd frontend
cp .env.example .env.local  # Edit with your values
npm install
npm run dev
```
> App available at `http://localhost:3000`

### 5. Seed database (optional)
```bash
cd backend
npm run seed
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests: `npm run test:unit && npm run lint`
4. Commit with conventional commit messages
5. Push and create a Pull Request

All PRs automatically run lint + unit tests + build via GitHub Actions.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
