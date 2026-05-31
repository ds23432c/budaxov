const router = require('express').Router();

router.get('/', async (req, res) => {
  const { season = 1, limit = 50 } = req.query;
  const rows = await req.prisma.leaderboard.findMany({
    where: { season: +season },
    orderBy: { score: 'desc' },
    take: +limit,
    include: { user: { select: { id: true, username: true, avatarUrl: true, role: true } } }
  });
  res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
});

module.exports = router;
