const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const where = { isPublished: true };
  if (category) where.category = category;
  if (search) where.OR = [{ title: { contains: search } }, { content: { contains: search } }];

  const [pages, total] = await Promise.all([
    req.prisma.wikiPage.findMany({ where, skip: (page-1)*limit, take: +limit, orderBy: { views: 'desc' }, include: { author: { select: { id: true, username: true, avatarUrl: true } } }, omit: { content: true } }),
    req.prisma.wikiPage.count({ where })
  ]);
  res.json({ pages, total, page: +page, pages_count: Math.ceil(total/limit) });
});

router.get('/:slug', async (req, res) => {
  const page = await req.prisma.wikiPage.findUnique({ where: { slug: req.params.slug }, include: { author: { select: { id: true, username: true, avatarUrl: true } } } });
  if (!page) return res.status(404).json({ error: 'Страница не найдена' });
  await req.prisma.wikiPage.update({ where: { id: page.id }, data: { views: { increment: 1 } } });
  res.json(page);
});

router.post('/', authMiddleware, requireRole('ADMIN', 'MODERATOR', 'SUPERADMIN'), async (req, res) => {
  const page = await req.prisma.wikiPage.create({ data: { ...req.body, authorId: req.user.id } });
  res.status(201).json(page);
});

router.patch('/:id', authMiddleware, requireRole('ADMIN', 'MODERATOR', 'SUPERADMIN'), async (req, res) => {
  const page = await req.prisma.wikiPage.update({ where: { id: +req.params.id }, data: req.body });
  res.json(page);
});

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  await req.prisma.wikiPage.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

module.exports = router;
