const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Zа-яёА-ЯЁ0-9_\- ]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signTokens(user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await req.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] }
    });
    if (exists) return res.status(400).json({ error: 'Пользователь с таким именем или email уже существует' });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await req.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(data.username)}`,
        profile: { create: { totalScore: 0, level: 1 } }
      },
      select: { id: true, username: true, email: true, role: true, avatarUrl: true }
    });

    // Welcome notification
    await req.prisma.notification.create({
      data: { userId: user.id, type: 'SYSTEM', title: 'Добро пожаловать!', body: `Привет, ${user.username}! Добро пожаловать на Budaxov!`, link: '/profile' }
    });

    const tokens = signTokens(user);
    res.json({ user, ...tokens });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Неверные данные', details: e.errors });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await req.prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, username: true, email: true, role: true, avatarUrl: true, passwordHash: true, isBanned: true, banReason: true }
    });
    if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });
    if (user.isBanned) return res.status(403).json({ error: `Аккаунт заблокирован: ${user.banReason || 'нарушение правил'}` });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Неверный email или пароль' });

    await req.prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });

    const { passwordHash, ...safeUser } = user;
    const tokens = signTokens(safeUser);
    res.json({ user: safeUser, ...tokens });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Неверные данные' });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = await req.prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
      updatedAt: true,
      lastSeen: true,
      profile: true,
      userAchievements: { select: { id: true, earnedAt: true, achievement: true }, orderBy: { earnedAt: 'desc' }, take: 5 }
    }
  });
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

module.exports = router;
