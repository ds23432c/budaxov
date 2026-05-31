const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const achievements = await req.prisma.achievement.findMany({ orderBy: { xpReward: 'desc' } });
  res.json(achievements);
});

router.post('/grant', authMiddleware, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const { userId, achievementId } = req.body;
  const ua = await req.prisma.userAchievement.create({ data: { userId: +userId, achievementId: +achievementId } });
  await req.prisma.notification.create({
    data: { userId: +userId, type: 'ACHIEVEMENT', title: 'Новая ачивка!', body: 'Администратор выдал вам новое достижение!', link: '/profile' }
  });
  res.json(ua);
});

module.exports = router;
