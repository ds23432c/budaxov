const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/items
router.get('/', async (req, res) => {
  const { search, type, rarity, page = 1, limit = 20 } = req.query;
  const where = { isPublished: true };
  if (search) where.name = { contains: search };
  if (type) where.type = type;
  if (rarity) where.rarity = rarity;

  const [items, total] = await Promise.all([
    req.prisma.item.findMany({ where, skip: (page - 1) * limit, take: +limit, orderBy: { name: 'asc' } }),
    req.prisma.item.count({ where })
  ]);
  res.json({ items, total, page: +page, pages: Math.ceil(total / limit) });
});

// GET /api/items/:slug
router.get('/:slug', async (req, res) => {
  const item = await req.prisma.item.findUnique({ where: { slug: req.params.slug } });
  if (!item) return res.status(404).json({ error: 'Предмет не найден' });
  res.json(item);
});

// POST /api/items (admin only)
router.post('/', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const item = await req.prisma.item.create({ data: req.body });
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/items/:id
router.patch('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const item = await req.prisma.item.update({ where: { id: +req.params.id }, data: req.body });
  res.json(item);
});

// DELETE /api/items/:id
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  await req.prisma.item.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

module.exports = router;
