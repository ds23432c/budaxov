const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const notifications = await req.prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(notifications);
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  const n = await req.prisma.notification.update({ where: { id: +req.params.id, userId: req.user.id }, data: { isRead: true } });
  res.json(n);
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  await req.prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
});

module.exports = router;
