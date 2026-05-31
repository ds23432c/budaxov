const router = require('express').Router();

router.get('/', async (req, res) => {
  const season = parseInt(req.query.season, 10) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const rows = await req.prisma.leaderboard.findMany({
    where: { season },
    orderBy: { score: 'desc' },
    take: limit,
  });

  const users = await req.prisma.user.findMany({
    where: { id: { in: rows.map((row) => row.userId) } },
    select: { id: true, username: true, avatarUrl: true, role: true },
  });

  const userById = new Map(users.map((user) => [user.id, user]));

  res.json(rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    user: userById.get(row.userId) || null,
  })));
});

module.exports = router;
