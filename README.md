# VoiceRX

A healthcare management system with voice-enabled features.

## Quick Start with Docker

**Prerequisites:** Docker Desktop installed and running

### One Command Setup

```bash
# Clone the repository
git clone https://github.com/MosesOnerhime/voicerx.git
cd voicerx
git checkout kosi-front

# Start everything
docker compose up
```

That's it! Wait for all services to start, then open:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001

### Demo Credentials

On the **Login page**, click "Demo Login" to auto-fill credentials.

On the **Sign Up page**, click "Fill Demo Data" to generate random hospital data.

## Project Structure

```
voicerx/
├── frontend-new/     # React + Vite frontend
├── backend/          # Next.js API backend
├── docker-compose.yml
└── README.md
```

## Manual Setup (Without Docker)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev

# Start PostgreSQL first (Docker or local)
docker run --name voicerx-postgres \
  -e POSTGRES_USER=voicerx \
  -e POSTGRES_PASSWORD=voicerx123 \
  -e POSTGRES_DB=voicerx \
  -p 5432:5432 \
  -d postgres:15

npm run dev
```

### Frontend

```bash
cd frontend-new
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL=postgresql://voicerx:voicerx123@localhost:5432/voicerx
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router

**Backend:**
- Next.js 16 API Routes
- Prisma ORM
- PostgreSQL
- JWT Authentication
- OpenAI (Voice Transcription)

## Useful Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up --build

# Reset database
docker compose down -v
docker compose up
```

## Ports

| Service   | Port |
|-----------|------|
| Frontend  | 5173 |
| Backend   | 5001 |
| PostgreSQL| 5432 |
