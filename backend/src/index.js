require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');
const { runSeedIfEmpty } = require('./utils/seed');

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Attach prisma & io to req
app.use((req, _res, next) => {
  req.prisma = prisma;
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wiki', require('./routes/wiki'));
app.use('/api/items', require('./routes/items'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/news', require('./routes/news'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));


// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io handlers
let onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user:join', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', onlineUsers.size);
    }
  });

  socket.on('chat:message', (data) => {
    io.emit('chat:message', {
      ...data,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) { onlineUsers.delete(uid); break; }
    }
    io.emit('users:online', onlineUsers.size);
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    await runSeedIfEmpty(prisma);
    httpServer.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
  } catch (e) {
    logger.error('Failed to start:', e);
    process.exit(1);
  }
}

main();
