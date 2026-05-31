const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const where = { isApproved: true };
  if (type) where.type = type;
  const [items, total] = await Promise.all([
    req.prisma.mediaGallery.findMany({ where, skip: (page-1)*limit, take: +limit, orderBy: { votes: 'desc' }, include: { user: { select: { id: true, username: true, avatarUrl: true } } } }),
    req.prisma.mediaGallery.count({ where })
  ]);
  res.json({ items, total, page: +page, pages: Math.ceil(total/limit) });
});

router.post('/', authMiddleware, async (req, res) => {
  const { url, title, description, type } = req.body;
  const item = await req.prisma.mediaGallery.create({ data: { userId: req.user.id, url, title, description, type: type || 'SCREENSHOT', isApproved: false } });
  res.status(201).json(item);
});

router.patch('/:id/approve', authMiddleware, requireRole('ADMIN', 'MODERATOR', 'SUPERADMIN'), async (req, res) => {
  const item = await req.prisma.mediaGallery.update({ where: { id: +req.params.id }, data: { isApproved: true } });
  res.json(item);
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  const item = await req.prisma.mediaGallery.update({ where: { id: +req.params.id }, data: { votes: { increment: 1 } } });
  res.json(item);
});

module.exports = router;
