const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

const uploadRoot = path.join(__dirname, '..', '..', 'uploads');
const galleryDir = path.join(uploadRoot, 'gallery');
fs.mkdirSync(galleryDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, galleryDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Можно загружать только изображения'));
    }
    cb(null, true);
  },
});

function isRemoteUrl(value) {
  return /^https?:\/\/.+/i.test(String(value || '').trim());
}

router.get('/', async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const where = { isApproved: true };
  if (type) where.type = type;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    req.prisma.mediaGallery.findMany({
      where,
      skip: (currentPage - 1) * currentLimit,
      take: currentLimit,
      orderBy: { votes: 'desc' },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    }),
    req.prisma.mediaGallery.count({ where }),
  ]);

  res.json({ items, total, page: currentPage, pages: Math.ceil(total / currentLimit) });
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  const { url, title, description, type, thumbUrl } = req.body;
  const file = req.file;
  const hasUrl = Boolean(String(url || '').trim());
  const hasFile = Boolean(file);

  if (hasUrl && hasFile) {
    return res.status(400).json({ error: 'Укажите либо ссылку, либо файл — только один источник' });
  }

  if (!hasUrl && !hasFile) {
    return res.status(400).json({ error: 'Нужно указать ссылку или загрузить файл' });
  }

  let sourceType = 'LINK';
  let finalUrl = String(url || '').trim();
  let fileName = null;
  let finalThumbUrl = String(thumbUrl || '').trim() || null;

  if (hasFile) {
    sourceType = 'FILE';
    finalUrl = `/uploads/gallery/${file.filename}`;
    fileName = file.originalname;
    if (!finalThumbUrl) finalThumbUrl = finalUrl;
  } else if (!isRemoteUrl(finalUrl)) {
    return res.status(400).json({ error: 'Ссылка должна начинаться с http:// или https://' });
  }

  const item = await req.prisma.mediaGallery.create({
    data: {
      userId: req.user.id,
      sourceType,
      url: finalUrl,
      fileName,
      thumbUrl: finalThumbUrl,
      title,
      description,
      type: type || 'SCREENSHOT',
      isApproved: false,
    },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

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
