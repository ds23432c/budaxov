const router = require('express').Router();
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  const { category, page = 1, limit = 10, sort = 'newest' } = req.query;
  const where = { isPublished: true };
  if (category) where.category = category;

  const orderBy = sort === 'popular' ? { views: 'desc' } : { createdAt: 'desc' };

  const [posts, total] = await Promise.all([
    req.prisma.post.findMany({
      where, skip: (page-1)*limit, take: +limit, orderBy: [{ isPinned: 'desc' }, orderBy],
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, role: true } },
        _count: { select: { comments: true, likes: true } },
        likes: req.user ? { where: { userId: req.user.id }, select: { id: true } } : false,
      },
      omit: { body: true }
    }),
    req.prisma.post.count({ where })
  ]);
  res.json({ posts, total, page: +page, pages: Math.ceil(total / limit) });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const post = await req.prisma.post.findUnique({
    where: { id: +req.params.id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true, role: true } },
      _count: { select: { comments: true, likes: true } },
      likes: req.user ? { where: { userId: req.user.id } } : false,
      comments: {
        where: { parentId: null, isDeleted: false },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          replies: { where: { isDeleted: false }, include: { author: { select: { id: true, username: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  await req.prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  res.json(post);
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, body, category, excerpt, coverUrl } = req.body;
  if (!title || !body || !category) return res.status(400).json({ error: 'Заполните все обязательные поля' });
  const post = await req.prisma.post.create({
    data: { title, body, category, excerpt, coverUrl, authorId: req.user.id },
    include: { author: { select: { id: true, username: true, avatarUrl: true } } }
  });
  res.status(201).json(post);
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  const postId = +req.params.id;
  const userId = req.user.id;
  const existing = await req.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await req.prisma.postLike.delete({ where: { id: existing.id } });
    const count = await req.prisma.postLike.count({ where: { postId } });
    return res.json({ liked: false, count });
  }
  await req.prisma.postLike.create({ data: { postId, userId } });
  const count = await req.prisma.postLike.count({ where: { postId } });
  res.json({ liked: true, count });
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { body, parentId } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Комментарий не может быть пустым' });
  const comment = await req.prisma.comment.create({
    data: { postId: +req.params.id, authorId: req.user.id, body, parentId: parentId || null },
    include: { author: { select: { id: true, username: true, avatarUrl: true } } }
  });
  res.status(201).json(comment);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const post = await req.prisma.post.findUnique({ where: { id: +req.params.id } });
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  const isOwner = post.authorId === req.user.id;
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Нет прав' });
  await req.prisma.post.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

module.exports = router;
