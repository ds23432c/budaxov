// news.js
const newsRouter = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

newsRouter.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const [news, total] = await Promise.all([
    req.prisma.news.findMany({
      where: { isPublished: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        authorId: true,
        isPublished: true,
        isPinned: true,
        views: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    req.prisma.news.count({ where: { isPublished: true } }),
  ]);

  res.json({ news, total, page, pages: Math.ceil(total / limit) });
});

newsRouter.get('/:id', async (req, res) => {
  const n = await req.prisma.news.findUnique({ where: { id: parseInt(req.params.id, 10) } });
  if (!n) return res.status(404).json({ error: 'Новость не найдена' });

  await req.prisma.news.update({
    where: { id: n.id },
    data: { views: { increment: 1 } },
  });

  res.json(n);
});

newsRouter.post('/', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const n = await req.prisma.news.create({
    data: { ...req.body, authorId: req.user.id, publishedAt: new Date() },
  });
  res.status(201).json(n);
});

newsRouter.patch('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const n = await req.prisma.news.update({
    where: { id: parseInt(req.params.id, 10) },
    data: req.body,
  });
  res.json(n);
});

newsRouter.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  await req.prisma.news.delete({ where: { id: parseInt(req.params.id, 10) } });
  res.json({ success: true });
});

module.exports = newsRouter;
