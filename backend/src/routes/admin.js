const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

const isAdmin = [authMiddleware, requireRole('ADMIN', 'SUPERADMIN', 'MODERATOR')];
const isSuperAdmin = [authMiddleware, requireRole('ADMIN', 'SUPERADMIN')];

const CONTENT_SECTIONS = {
  news: {
    model: 'news',
    orderBy: { createdAt: 'desc' },
    searchFields: ['title', 'content', 'excerpt'],
  },
  items: {
    model: 'item',
    orderBy: { createdAt: 'desc' },
    searchFields: ['name', 'slug', 'description'],
  },
  wiki: {
    model: 'wikiPage',
    orderBy: { updatedAt: 'desc' },
    searchFields: ['title', 'slug', 'content', 'excerpt'],
    include: { author: { select: { id: true, username: true, avatarUrl: true } } },
  },
  posts: {
    model: 'post',
    orderBy: { updatedAt: 'desc' },
    searchFields: ['title', 'body', 'excerpt'],
    include: { author: { select: { id: true, username: true, avatarUrl: true, role: true } } },
  },
  achievements: {
    model: 'achievement',
    orderBy: { createdAt: 'desc' },
    searchFields: ['name', 'description'],
  },
  gallery: {
    model: 'mediaGallery',
    orderBy: { createdAt: 'desc' },
    searchFields: ['title', 'description', 'url'],
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  },
};

function parsePage(value) {
  return Math.max(1, parseInt(value, 10) || 1);
}

function parseLimit(value) {
  return Math.min(100, Math.max(1, parseInt(value, 10) || 20));
}

function getSectionConfig(section) {
  return CONTENT_SECTIONS[String(section || '').toLowerCase()] || null;
}

function buildSearchWhere(config, search) {
  if (!search) return {};
  return {
    OR: config.searchFields.map((field) => ({
      [field]: { contains: String(search) },
    })),
  };
}

function toInt(value, fallback = null) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

function normalizeContentPayload(section, body, currentUserId) {
  const data = { ...body };

  if (section === 'news' || section === 'wiki' || section === 'posts') {
    if (data.authorId !== undefined) data.authorId = toInt(data.authorId, currentUserId);
    if (!data.authorId) data.authorId = currentUserId;
  }

  if (section === 'gallery') {
    if (data.userId !== undefined) data.userId = toInt(data.userId, currentUserId);
    if (!data.userId) data.userId = currentUserId;
    if (data.votes !== undefined) data.votes = toInt(data.votes, 0);
    if (data.isApproved !== undefined) data.isApproved = toBoolean(data.isApproved);
  }

  if (section === 'items') {
    if (data.damage !== undefined) data.damage = data.damage === '' ? null : toInt(data.damage, null);
    if (data.defense !== undefined) data.defense = data.defense === '' ? null : toInt(data.defense, null);
    if (data.craftable !== undefined) data.craftable = toBoolean(data.craftable);
    if (data.isPublished !== undefined) data.isPublished = toBoolean(data.isPublished, true);
  }

  if (section === 'achievements') {
    if (data.xpReward !== undefined) data.xpReward = toInt(data.xpReward, 100);
    if (data.isSecret !== undefined) data.isSecret = toBoolean(data.isSecret);
  }

  if (section === 'posts') {
    if (data.views !== undefined) data.views = toInt(data.views, 0);
    if (data.isPinned !== undefined) data.isPinned = toBoolean(data.isPinned);
    if (data.isPublished !== undefined) data.isPublished = toBoolean(data.isPublished, true);
  }

  if (section === 'wiki') {
    if (data.views !== undefined) data.views = toInt(data.views, 0);
    if (data.isPublished !== undefined) data.isPublished = toBoolean(data.isPublished, true);
  }

  if (section === 'news') {
    if (data.views !== undefined) data.views = toInt(data.views, 0);
    if (data.isPublished !== undefined) data.isPublished = toBoolean(data.isPublished, true);
    if (data.isPinned !== undefined) data.isPinned = toBoolean(data.isPinned);
  }

  return data;
}

// Dashboard stats
router.get('/stats', ...isAdmin, async (req, res) => {
  const [users, posts, news, gallery, reports, recentUsers] = await Promise.all([
    req.prisma.user.count(),
    req.prisma.post.count(),
    req.prisma.news.count(),
    req.prisma.mediaGallery.count(),
    req.prisma.report.count({ where: { status: 'PENDING' } }),
    req.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, username: true, avatarUrl: true, role: true, createdAt: true } }),
  ]);
  res.json({ users, posts, news, gallery, pendingReports: reports, recentUsers });
});

// Users management
router.get('/users', ...isAdmin, async (req, res) => {
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
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
        profile: { select: { playtimeHours: true, level: true } },
      },
    }),
    req.prisma.user.count({ where }),
  ]);
  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

router.patch('/users/:id', ...isSuperAdmin, async (req, res) => {
  const { role, isBanned, banReason, isActive } = req.body;
  await req.prisma.user.update({
    where: { id: +req.params.id },
    data: { role, isBanned, banReason, isActive },
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
      profile: { select: { playtimeHours: true, level: true } },
    },
  });
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'UPDATE_USER', details: `Updated user ${req.params.id}: ${JSON.stringify(req.body)}` } });
  res.json(user);
});

router.delete('/users/:id', ...isSuperAdmin, async (req, res) => {
  await req.prisma.user.delete({ where: { id: +req.params.id } });
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'DELETE_USER', details: `Deleted user ${req.params.id}` } });
  res.json({ success: true });
});

// Content management
router.get('/content/:section', ...isSuperAdmin, async (req, res) => {
  const config = getSectionConfig(req.params.section);
  if (!config) return res.status(404).json({ error: 'Раздел не найден' });

  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const where = {
    ...buildSearchWhere(config, req.query.search),
  };

  const [items, total] = await Promise.all([
    req.prisma[config.model].findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: config.orderBy,
      include: config.include,
    }),
    req.prisma[config.model].count({ where }),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

router.post('/content/:section', ...isSuperAdmin, async (req, res) => {
  const config = getSectionConfig(req.params.section);
  if (!config) return res.status(404).json({ error: 'Раздел не найден' });

  const data = normalizeContentPayload(req.params.section, req.body, req.user.id);
  const payload = ['news', 'wiki', 'posts'].includes(req.params.section)
    ? { ...data, authorId: data.authorId || req.user.id }
    : req.params.section === 'gallery'
      ? { ...data, userId: data.userId || req.user.id }
      : data;

  const created = await req.prisma[config.model].create({
    data: payload,
    include: config.include,
  });

  await req.prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: `CREATE_${req.params.section.toUpperCase()}`,
      details: `Created ${req.params.section}: ${JSON.stringify(payload)}`,
    },
  });

  res.status(201).json(created);
});

router.patch('/content/:section/:id', ...isSuperAdmin, async (req, res) => {
  const config = getSectionConfig(req.params.section);
  if (!config) return res.status(404).json({ error: 'Раздел не найден' });

  const data = normalizeContentPayload(req.params.section, req.body, req.user.id);
  const updated = await req.prisma[config.model].update({
    where: { id: +req.params.id },
    data,
    include: config.include,
  });

  await req.prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: `UPDATE_${req.params.section.toUpperCase()}`,
      details: `Updated ${req.params.section} #${req.params.id}: ${JSON.stringify(data)}`,
    },
  });

  res.json(updated);
});

router.delete('/content/:section/:id', ...isSuperAdmin, async (req, res) => {
  const config = getSectionConfig(req.params.section);
  if (!config) return res.status(404).json({ error: 'Раздел не найден' });

  await req.prisma[config.model].delete({ where: { id: +req.params.id } });

  await req.prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: `DELETE_${req.params.section.toUpperCase()}`,
      details: `Deleted ${req.params.section} #${req.params.id}`,
    },
  });

  res.json({ success: true });
});

// Content moderation
router.get('/reports', ...isAdmin, async (req, res) => {
  const { status = 'PENDING', page = 1, limit = 20 } = req.query;
  const [reports, total] = await Promise.all([
    req.prisma.report.findMany({ where: { status }, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' }, include: { reporter: { select: { id: true, username: true } }, targetUser: { select: { id: true, username: true } } } }),
    req.prisma.report.count({ where: { status } }),
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
  res.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
});

router.patch('/settings', ...isSuperAdmin, async (req, res) => {
  await Promise.all(
    Object.entries(req.body).map(([key, value]) =>
      req.prisma.siteSettings.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
  await req.prisma.adminLog.create({ data: { adminId: req.user.id, action: 'UPDATE_SETTINGS', details: JSON.stringify(req.body) } });
  res.json({ success: true });
});

module.exports = router;
