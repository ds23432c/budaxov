# 🎮 Budaxov — Terraria Portal

Полный стек русскоязычного Terraria-портала.  
**Backend**: Node.js + Express + Prisma + MySQL  
**Frontend**: Next.js 14 + Tailwind CSS + Framer Motion  
**Deploy**: Railway (backend + MySQL) + Vercel (frontend)

---

## 🚀 Быстрый старт

### 1. Клонируй репо
```bash
git clone https://github.com/ds23432c/budaxov.git
cd budaxov
```

### 2. Настрой backend

```bash
cd backend
cp .env.example .env
```

Заполни `.env` своими данными из Railway MySQL Variables:
```env
DATABASE_URL="mysql://root:QfPjfROyvhtHLwwOvAIKWtWVlRLzFEuN@mysql.railway.internal:3306/railway"
JWT_SECRET="придумай_длинный_секрет_тут"
JWT_REFRESH_SECRET="другой_секрет"
PORT=3001
FRONTEND_URL="https://your-vercel-app.vercel.app"
```

```bash
npm install
npm run db:generate  # генерирует Prisma Client
npm run db:push      # создаёт таблицы в MySQL
npm start            # запускает сервер (seed запустится автоматически!)
```

### 3. Настрой frontend

```bash
cd ../frontend
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

```bash
npm install
npm run dev
```

Открой http://localhost:3000

---

## 📦 Деплой на Railway + Vercel

### Railway (Backend)

1. Зайди на [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → выбери репо `budaxov`
3. Установи **Root Directory** = `backend`
4. Добавь переменные в Settings → Variables:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` (Variable Reference) |
| `JWT_SECRET` | твой секретный ключ |
| `JWT_REFRESH_SECRET` | другой секретный ключ |
| `FRONTEND_URL` | https://твой-домен.vercel.app |
| `NODE_ENV` | production |

5. Railway автоматически выполнит: `prisma generate && prisma db push && node src/index.js`
6. **БД заполнится сидом автоматически при первом запуске!**

### Vercel (Frontend)

1. Зайди на [vercel.com](https://vercel.com)
2. New Project → Import from GitHub → выбери репо
3. **Framework**: Next.js
4. **Root Directory**: `frontend`
5. Добавь Environment Variables:

| Переменная | Значение |
|---|---|
| `NEXT_PUBLIC_API_URL` | https://твой-backend.railway.app |
| `NEXT_PUBLIC_WS_URL` | https://твой-backend.railway.app |

6. Deploy!

---

## 🔐 Тестовые аккаунты

После первого запуска в БД создадутся:

| Email | Пароль | Роль |
|---|---|---|
| admin@budaxov.ru | Admin123! | SUPERADMIN |
| moderator@budaxov.ru | Admin123! | MODERATOR |

---

## 📁 Структура проекта

```
budaxov/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Схема БД (15 таблиц)
│   ├── src/
│   │   ├── index.js            # Точка входа + Socket.io
│   │   ├── middleware/auth.js  # JWT middleware
│   │   ├── routes/             # REST API роуты
│   │   │   ├── auth.js
│   │   │   ├── admin.js        # Вся админ-панель
│   │   │   ├── posts.js        # Форум + лайки + комменты
│   │   │   ├── items.js        # Вики предметы
│   │   │   ├── wiki.js         # Вики страницы
│   │   │   ├── news.js
│   │   │   ├── leaderboard.js
│   │   │   ├── achievements.js
│   │   │   ├── gallery.js
│   │   │   ├── users.js
│   │   │   └── notifications.js
│   │   └── utils/
│   │       ├── seed.js         # Автозаполнение БД
│   │       └── logger.js
│   └── railway.json            # Конфиг деплоя
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx         # Главная с parallax
        │   ├── auth/            # Вход/регистрация
        │   ├── wiki/            # Вики предметы
        │   ├── forum/           # Форум
        │   ├── news/            # Новости
        │   ├── leaderboard/     # Рейтинг
        │   ├── profile/         # Профиль
        │   └── admin/           # Админ-панель
        ├── components/
        │   ├── Navbar.tsx       # Glassmorphism навбар
        │   ├── Cards.tsx        # NewsCard, ItemCard, PostCard...
        │   ├── ParticleCanvas.tsx # Пиксельные частицы
        │   └── AuthProvider.tsx
        └── lib/
            ├── api.ts           # Axios + все API хелперы
            └── store.ts         # Zustand auth store
```

---

## ✨ Фишки

- 🎆 **Pixel particle system** — пиксельные частицы на фоне
- 🌄 **Parallax hero** — многоуровневый параллакс с деревьями и горами
- 🪟 **Glassmorphism navbar** — стекловидный навбар с blur
- 💫 **Framer Motion** — все элементы анимированы при скролле
- 🌙 **Тёмная тема** — только тёмная, по умолчанию
- 🏅 **Достижения** — система ачивок с редкостью
- 💬 **Socket.io** — онлайн-чат и счётчик игроков в реальном времени
- 🎨 **Pixel font** — Press Start 2P для заголовков
- 📊 **Admin panel** — полноценная с управлением юзерами, жалобами, галереей
- 🔐 **JWT auth** — полная авторизация с refresh токенами
