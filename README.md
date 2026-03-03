# SocialBook 📚

<div align="center">

**A feature-rich social network platform for book lovers — combining reading tracking, social interaction, gamification, and AI-powered features.**

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Book Management** | Browse, read, and track books with chapter and review support |
| 🤝 **Social Interaction** | Follow users, like books/comments, and receive real-time notifications |
| 🎮 **Gamification** | Earn achievements, maintain reading streaks, and complete daily goals for XP |
| 🤖 **AI Integration** | Chapter summaries (Gemini AI), Text-to-Speech, and vector search (ChromaDB) |
| 🔐 **Auth & Onboarding** | Secure JWT-based auth with user preference setup |
| 🔍 **Search & Recommendations** | Full-text search and AI-powered book recommendations |
| 📊 **Statistics** | Personal reading stats and gamification progress tracking |

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** TailwindCSS 4, Radix UI, Framer Motion
- **State Management:** Redux Toolkit, RTK Query
- **Real-time:** Socket.IO Client
- **Charts / Maps:** Recharts, React Map GL

### Backend
- **Framework:** NestJS 11 — structured with **Clean Architecture**
- **Language:** TypeScript
- **Databases:** MongoDB (Mongoose), Redis (Caching/Queues), ChromaDB (Vector Search)
- **Authentication:** JWT, Passport
- **Real-time:** Socket.IO Gateway
- **AI Integration:**
  - Google Gemini — Chapter summarization
  - OpenAI / LangChain
  - HuggingFace Embeddings
  - Google Cloud Text-to-Speech
- **Documentation:** Swagger / OpenAPI

### DevOps / Infrastructure
- **Containerization:** Docker (Redis & ChromaDB via Docker Compose)
- **Build Tools:** Turbopack

---

## 🏗️ Architecture

The backend follows **Clean Architecture** principles, separating concerns into four distinct layers:

```
backend/src/
├── domain/            # 🔵 Enterprise business rules
│   ├── entities/      #    Core domain entities
│   ├── value-objects/ #    Immutable value objects
│   └── repositories/  #    Repository interfaces (contracts)
│
├── application/       # 🟢 Application business rules
│   └── {feature}/
│       ├── use-cases/ #    One use case per file
│       ├── dtos/      #    Data Transfer Objects
│       └── mappers/   #    Domain ↔ DTO mapping
│
├── infrastructure/    # 🟡 Frameworks & external adapters
│   ├── database/      #    Mongoose schemas & repository implementations
│   ├── external/      #    Third-party integrations (Cloudinary, etc.)
│   └── gateways/      #    Socket.IO gateways
│
├── presentation/      # 🔴 Delivery mechanism
│   └── {feature}/
│       └── *.controller.ts  # HTTP controllers (REST API)
│
└── shared/            # ⚪ Cross-cutting concerns
    ├── cache/         #    Redis cache utilities
    ├── domain/        #    Shared base classes (Entity, AggregateRoot)
    └── database/      #    Database abstraction helpers
```

### Domain Modules
`auth` · `users` · `books` · `chapters` · `authors` · `genres` · `comments` · `likes` · `follows` · `reviews` · `library` · `posts` · `notifications` · `gamification` · `statistics` · `search` · `recommendations` · `onboarding` · `scraper` · `chroma` · `gemini` · `text-to-speech`

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Docker Desktop (for Redis & ChromaDB)

### 1. Clone the repository
```bash
git clone <repository_url>
cd socialbook_dev_thien
```

### 2. Start infrastructure services
```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

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

Start the backend server:
```bash
npm run start:dev
```
> API available at `http://localhost:5000`
> Swagger docs at `http://localhost:5000/api`

### 4. Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_NEST_API_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXT_PUBLIC_SOCKET_URL=
```

Start the frontend dev server:
```bash
npm run dev
```
> App available at `http://localhost:3000`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
