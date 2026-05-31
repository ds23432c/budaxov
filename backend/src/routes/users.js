const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

router.get('/:id', async (req, res) => {
  const user = await req.prisma.user.findUnique({
    where: { id: +req.params.id },
    include: {
      profile: true,
      userAchievements: { include: { achievement: true }, orderBy: { earnedAt: 'desc' } },
      posts: { where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, category: true, createdAt: true } },
      _count: { select: { posts: true, comments: true } }
    },
    omit: { passwordHash: true, email: true }
  });
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

router.patch('/me', authMiddleware, async (req, res) => {
  const { bio, discord, country, website } = req.body;
  const profile = await req.prisma.userProfile.upsert({
    where: { userId: req.user.id },
    update: { bio, discord, country, website },
    create: { userId: req.user.id, bio, discord, country, website }
  });
  res.json(profile);
});

module.exports = router;
