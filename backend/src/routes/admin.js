const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const isAdmin = [authMiddleware, requireRole('ADMIN', 'SUPERADMIN', 'MODERATOR')];
const isSuperAdmin = [authMiddleware, requireRole('ADMIN', 'SUPERADMIN')];

// Dashboard stats
router.get('/stats', ...isAdmin, async (req, res) => {
  const [users, posts, news, gallery, reports, recentUsers] = await Promise.all([
    req.prisma.user.count(),
    req.prisma.post.count(),
    req.prisma.news.count(),
    req.prisma.mediaGallery.count(),
    req.prisma.report.count({ where: { status: 'PENDING' } }),
    req.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, username: true, avatarUrl: true, role: true, createdAt: true } })
  ]);
  res.json({ users, posts, news, gallery, pendingReports: reports, recentUsers });
});

// Users management
router.get('/users', ...isAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, role } = req.query;
  const where = {};
  if (search) where.OR = [{ username: { contains: String(search) } }, { email: { contains: String(search) } }];
  if (role) where.role = role;
  const [users, total] = await Promise.all([
    req.prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        profile: { select: { playtimeHours: true, level: true } }
      }
    }),
    req.prisma.user.count({ where })
  ]);
  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

router.patch('/users/:id', ...isSuperAdmin, async (req, res) => {
  const { role, isBanned, banReason, isActive } = req.body;
  await req.prisma.user.update({
    where: { id: +req.params.id },
    data: { role, isBanned, banReason, isActive }
  });
  const user = await req.prisma.user.findUnique({
    where: { id: +req.params.id },
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
      profile: { select: { playtimeHours: true, level: true } }
    }
  });
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'UPDATE_USER', details: `Updated user ${req.params.id}: ${JSON.stringify(req.body)}` } });
  res.json(user);
});

router.delete('/users/:id', ...isSuperAdmin, async (req, res) => {
  await req.prisma.user.delete({ where: { id: +req.params.id } });
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'DELETE_USER', details: `Deleted user ${req.params.id}` } });
  res.json({ success: true });
});

// Content moderation
router.get('/reports', ...isAdmin, async (req, res) => {
  const { status = 'PENDING', page = 1, limit = 20 } = req.query;
  const [reports, total] = await Promise.all([
    req.prisma.report.findMany({ where: { status }, skip: (page-1)*limit, take: +limit, orderBy: { createdAt: 'desc' }, include: { reporter: { select: { id: true, username: true } }, targetUser: { select: { id: true, username: true } } } }),
    req.prisma.report.count({ where: { status } })
  ]);
  res.json({ reports, total });
});

router.patch('/reports/:id', ...isAdmin, async (req, res) => {
  const { status, resolution } = req.body;
  const report = await req.prisma.report.update({ where: { id: +req.params.id }, data: { status, resolution, resolvedBy: req.user.id } });
  res.json(report);
});

// Gallery moderation
router.get('/gallery/pending', ...isAdmin, async (req, res) => {
  const items = await req.prisma.mediaGallery.findMany({ where: { isApproved: false }, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, username: true } } } });
  res.json(items);
});

// News CRUD
router.get('/news', ...isAdmin, async (req, res) => {
  const news = await req.prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(news);
});

// Admin logs
router.get('/logs', ...isSuperAdmin, async (req, res) => {
  const logs = await req.prisma.adminLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { admin: { select: { id: true, username: true } } } });
  res.json(logs);
});

// Site settings
router.get('/settings', ...isAdmin, async (req, res) => {
  const settings = await req.prisma.siteSettings.findMany();
  res.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
});

router.patch('/settings', ...isSuperAdmin, async (req, res) => {
  const updates = await Promise.all(
    Object.entries(req.body).map(([key, value]) =>
      req.prisma.siteSettings.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'UPDATE_SETTINGS', details: JSON.stringify(req.body) } });
  res.json({ success: true });
});

module.exports = router;
