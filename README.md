# 🎮 Budaxov — Terraria Portal

Полный стек русскоязычного Terraria-портала.

**Стек**
- Backend: Node.js + Express + Prisma + MySQL
- Frontend: Next.js 14 + Tailwind CSS + Framer Motion
- Deploy: **Railway only** — один сервис для сайта и API + отдельная MySQL база

## Как это работает

В Railway запускается **один root-сервис** из корня репозитория:
- `scripts/start.js`:
  - генерирует Prisma Client
  - применяет схему к MySQL
  - собирает frontend
  - запускает backend на `3001`
  - запускает Next.js на публичном `PORT` Railway, обычно `8080`

Frontend и backend доступны через **один домен Railway**:
- сайт открывается по публичному домену Railway
- API доступен через `/api/*`

---

## Локальный запуск

### 1. Установи зависимости

```bash
npm install
```

### 2. Backend env

```bash
cd backend
cp .env.example .env
```

Пример `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/budaxov"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Frontend env

```bash
cd ../frontend
cp .env.example .env.local
```

Пример `.env.local`:
```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=
```

### 4. Запуск

Из корня репозитория:

```bash
npm start
```

---

## Railway deploy

### 1. Создай проект
- New Project → Deploy from GitHub
- выбери репозиторий `budaxov`
- **Root Directory: репозиторий целиком, не `backend` и не `frontend`**

### 2. Добавь MySQL
- создай Railway MySQL сервис
- подключи его к проекту

### 3. Переменные окружения для root app service

```env
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-other-long-secret
FRONTEND_URL=https://your-railway-app.up.railway.app
NODE_ENV=production
```

### 4. Проверка
После деплоя:
- `https://your-railway-app.up.railway.app/` — открывает сайт
- `https://your-railway-app.up.railway.app/api/health` — healthcheck API

---

## Команды

### Root
```bash
npm start
```

### Backend
```bash
cd backend
npm run db:generate
npm run db:push
npm run start
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```

---

## Тестовые аккаунты

После первого запуска в БД создаются:

| Email | Пароль | Роль |
|---|---|---|
| admin@budaxov.ru | Admin123! | SUPERADMIN |
| moderator@budaxov.ru | Admin123! | MODERATOR |

---

## Структура проекта

```text
budaxov/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   └── next.config.js
├── scripts/
│   └── start.js
├── package.json
└── railway.json
```

---

## Важно

- Vercel больше не нужен.
- Один домен Railway обслуживает и сайт, и API.
- Если меняешь домен Railway, обнови `FRONTEND_URL`.
