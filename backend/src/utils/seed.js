const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.example') });

if (!process.env.DATABASE_URL && process.env.MYSQLHOST && process.env.MYSQLPORT && process.env.MYSQLDATABASE && process.env.MYSQLUSER && process.env.MYSQLPASSWORD) {
  process.env.DATABASE_URL = `mysql://${process.env.MYSQLUSER}:${encodeURIComponent(process.env.MYSQLPASSWORD)}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQLDATABASE}`;
}

const { PrismaClient } = require('@prisma/client');

const TARGET = 10;

function avatar(seed) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function titleize(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function ensureUser(prisma, template, passwordHash) {
  return prisma.user.upsert({
    where: { email: template.email },
    create: {
      username: template.username,
      email: template.email,
      passwordHash,
      role: template.role,
      avatarUrl: template.avatarUrl,
      isActive: true,
      isBanned: false,
      profile: {
        create: template.profile,
      },
    },
    update: {
      username: template.username,
      role: template.role,
      avatarUrl: template.avatarUrl,
      isActive: true,
      isBanned: false,
      banReason: null,
      profile: {
        upsert: {
          create: template.profile,
          update: template.profile,
        },
      },
    },
    include: { profile: true },
  });
}

async function ensureByUnique(prisma, model, uniqueWhere, createData, select) {
  const existing = await prisma[model].findFirst({ where: uniqueWhere, select: select || { id: true } });
  if (existing) return existing;
  return prisma[model].create({ data: createData, select });
}

async function ensureManyByUnique(prisma, model, items) {
  for (const item of items) {
    const existing = await prisma[model].findFirst({ where: item.where, select: { id: true } });
    if (!existing) {
      await prisma[model].create({ data: item.data });
    }
  }
}

async function ensureSettings(prisma, settings) {
  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
}

async function ensureUserAchievements(prisma, rows) {
  await prisma.userAchievement.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

async function ensureLeaderboard(prisma, rows) {
  for (const row of rows) {
    await prisma.leaderboard.upsert({
      where: { userId_season: { userId: row.userId, season: row.season } },
      create: row,
      update: row,
    });
  }
}

async function ensureSeedData(prisma) {
  logger.info('🌱 Обновляем/заполняем тестовые данные...');
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const userTemplates = [
    {
      username: 'Администратор',
      email: 'admin@budaxov.ru',
      role: 'SUPERADMIN',
      avatarUrl: avatar('admin'),
      profile: {
        bio: 'Главный администратор проекта Budaxov. Играю в Terraria с 2011 года.',
        playtimeHours: 2847,
        country: 'Россия',
        website: 'https://budaxov.ru',
        totalScore: 99999,
        level: 50,
        discord: 'admin#0001',
      },
    },
    {
      username: 'МодерДракон',
      email: 'moderator@budaxov.ru',
      role: 'MODERATOR',
      avatarUrl: avatar('dragon'),
      profile: {
        bio: 'Модератор сообщества. Слежу за порядком и помогаю новичкам.',
        playtimeHours: 1200,
        country: 'Россия',
        website: null,
        totalScore: 45000,
        level: 35,
        discord: 'dragon#2026',
      },
    },
    {
      username: 'Копатель2000',
      email: 'kopatel@mail.ru',
      role: 'USER',
      avatarUrl: avatar('kopatel'),
      profile: {
        bio: 'Люблю строить замки и фармить боссов.',
        playtimeHours: 450,
        country: 'Москва',
        website: null,
        totalScore: 12500,
        level: 18,
        discord: 'miner#1188',
      },
    },
    {
      username: 'ТерраМастер',
      email: 'terramaster@yandex.ru',
      role: 'USER',
      avatarUrl: avatar('terramaster'),
      profile: {
        bio: 'Прошёл игру в режиме Эксперт. Знаю все секреты.',
        playtimeHours: 890,
        country: 'Санкт-Петербург',
        website: 'https://example.com/terramaster',
        totalScore: 28000,
        level: 28,
        discord: 'terra#8844',
      },
    },
    {
      username: 'НочнойСтроитель',
      email: 'builder@rambler.ru',
      role: 'USER',
      avatarUrl: avatar('builder'),
      profile: {
        bio: 'Специализируюсь на мегабилдах. Мой дворец занял 3 часа.',
        playtimeHours: 1500,
        country: 'Екатеринбург',
        website: null,
        totalScore: 35000,
        level: 32,
        discord: 'builder#3321',
      },
    },
    {
      username: 'ФанатБоссов',
      email: 'bossfan@gmail.com',
      role: 'USER',
      avatarUrl: avatar('bossfan'),
      profile: {
        bio: 'Убил каждого босса больше 100 раз.',
        playtimeHours: 2200,
        country: 'Новосибирск',
        website: null,
        totalScore: 58000,
        level: 42,
        discord: 'boss#9000',
      },
    },
    {
      username: 'РудникоВед',
      email: 'miner@inbox.ru',
      role: 'USER',
      avatarUrl: avatar('miner'),
      profile: {
        bio: 'Добываю ресурсы и торгую. Богатейший игрок сервера.',
        playtimeHours: 700,
        country: 'Казань',
        website: null,
        totalScore: 19000,
        level: 22,
        discord: 'ore#4422',
      },
    },
    {
      username: 'Луноход',
      email: 'moonwalker@budaxov.ru',
      role: 'USER',
      avatarUrl: avatar('moonwalker'),
      profile: {
        bio: 'Охочусь на Лунного Лорда и собираю эндгейм-сеты.',
        playtimeHours: 980,
        country: 'Минск',
        website: null,
        totalScore: 31000,
        level: 29,
        discord: 'moon#5511',
      },
    },
    {
      username: 'ПиксельАрт',
      email: 'pixelart@budaxov.ru',
      role: 'USER',
      avatarUrl: avatar('pixelart'),
      profile: {
        bio: 'Рисую фанарт и оформляю базы в стиле ретро.',
        playtimeHours: 530,
        country: 'Тула',
        website: 'https://art.example.com',
        totalScore: 14200,
        level: 19,
        discord: 'art#7712',
      },
    },
    {
      username: 'ХардмодГуру',
      email: 'hardmode@budaxov.ru',
      role: 'USER',
      avatarUrl: avatar('hardmode'),
      profile: {
        bio: 'Помогаю игрокам пережить переход в хардмод без боли.',
        playtimeHours: 1760,
        country: 'Самара',
        website: null,
        totalScore: 40200,
        level: 36,
        discord: 'hard#7733',
      },
    },
  ];

  const users = [];
  for (const template of userTemplates) {
    const user = await ensureUser(prisma, template, template.role === 'SUPERADMIN' || template.role === 'MODERATOR' ? passwordHash : userPasswordHash);
    users.push(user);
  }

  const itemTemplates = [
    { name: 'Терра-клинок', slug: 'terra-blade', type: 'WEAPON', rarity: 'YELLOW', description: 'Легендарный меч, выкованный из лучших клинков игры.', damage: 115, craftable: true, craftRecipe: 'Истинный Кинжал Ночи + Истинный Экскалибур', biome: 'Подземелье', imageUrl: 'https://terraria.wiki.gg/images/thumb/3/3d/Terra_Blade.png/32px-Terra_Blade.png' },
    { name: 'Звёздный гнев', slug: 'star-fury', type: 'WEAPON', rarity: 'BLUE', description: 'Волшебный меч, призывающий звёзды с небес.', damage: 28, craftable: false, biome: 'Летающий остров', imageUrl: 'https://terraria.wiki.gg/images/thumb/8/8e/Starfury.png/32px-Starfury.png' },
    { name: 'Громовой жезл', slug: 'thunder-staff', type: 'WEAPON', rarity: 'ORANGE', description: 'Мощный магический посох, мечущий молнии во врагов.', damage: 72, craftable: true, craftRecipe: '15 Мифрила + Стержень грозы' },
    { name: 'Кирка Молнии', slug: 'lightning-pickaxe', type: 'TOOL', rarity: 'GREEN', description: 'Быстрая кирка из молниевого сплава.', craftable: true, craftRecipe: '18 Молниевой руды + 4 Алмаза' },
    { name: 'Адский камень', slug: 'hellstone-bar', type: 'MATERIAL', rarity: 'ORANGE', description: 'Слиток из адского камня.', craftable: false, biome: 'Преисподняя' },
    { name: 'Кольцо акробата', slug: 'acrobat-ring', type: 'ACCESSORY', rarity: 'BLUE', description: 'Позволяет совершать двойной прыжок.', craftable: false, biome: 'Подземелье' },
    { name: 'Зелье быстрого бега', slug: 'swiftness-potion', type: 'CONSUMABLE', rarity: 'BLUE', description: 'Увеличивает скорость передвижения на 25% на 8 минут.', craftable: true, craftRecipe: '1 Желудь + 1 Дневной цветок' },
    { name: 'Обсидиановый щит', slug: 'obsidian-shield', type: 'ACCESSORY', rarity: 'ORANGE', description: 'Даёт иммунитет к нокбэку и огню.', defense: 8, craftable: true, craftRecipe: 'Кобальтовый щит + Обсидиановый череп' },
    { name: 'Крылья ангела', slug: 'angel-wings', type: 'ACCESSORY', rarity: 'YELLOW', description: 'Позволяют летать. Один из первых вариантов в хардмоде.', craftable: true, craftRecipe: '10 Перьев + 25 Душ Света + 1 Душа Полёта' },
    { name: 'Солнечное копьё', slug: 'solar-spear', type: 'WEAPON', rarity: 'RED', description: 'Оружие из солнечных фрагментов.', damage: 180, craftable: true, craftRecipe: '18 Солнечных фрагментов' },
  ];

  const items = [];
  for (const template of itemTemplates) {
    const item = await ensureByUnique(prisma, 'item', { slug: template.slug }, template, { id: true, slug: true, name: true });
    items.push(item);
  }

  const wikiTemplates = [
    { title: 'Лесной биом', slug: 'forest-biome', category: 'BIOME', author: users[0], excerpt: 'Стартовая локация. Мирные существа, базовые ресурсы.', views: 1247 },
    { title: 'Глаз Ктулху', slug: 'eye-of-cthulhu', category: 'BOSS', author: users[1], excerpt: 'Первый босс Terraria. Атакует рывками.', views: 3891 },
    { title: 'Хардмод: что изменится', slug: 'hardmode-guide', category: 'GUIDE', author: users[9], excerpt: 'Всё о переходе в хардмод.', views: 5623 },
    { title: 'Преисподняя (Ад)', slug: 'underworld-biome', category: 'BIOME', author: users[0], excerpt: 'Нижний биом. Адский камень, демоны, Стена Плоти.', views: 2341 },
    { title: 'Разрушитель', slug: 'destroyer', category: 'BOSS', author: users[1], excerpt: 'Механический червь и один из первых хардмод-боссов.', views: 1550 },
    { title: 'Мифриловая руда', slug: 'mythril-ore', category: 'ITEM', author: users[9], excerpt: 'Ключевая руда раннего хардмода.', views: 980 },
    { title: 'Стены и освещение', slug: 'building-lighting', category: 'MECHANIC', author: users[4], excerpt: 'Советы по строительству баз и красивому свету.', views: 760 },
    { title: 'Оружие мага', slug: 'mage-weapons', category: 'GUIDE', author: users[3], excerpt: 'Подборка оружия для магического билда.', views: 1320 },
    { title: 'Лор мира Terraria', slug: 'terraria-lore', category: 'LORE', author: users[0], excerpt: 'Коротко о происхождении мира и древних силах.', views: 640 },
    { title: 'Пиксельные постройки', slug: 'pixel-builds', category: 'GUIDE', author: users[8], excerpt: 'Как делать выразительные постройки в стиле ретро.', views: 830 },
  ];

  for (const template of wikiTemplates) {
    await ensureByUnique(
      prisma,
      'wikiPage',
      { slug: template.slug },
      {
        title: template.title,
        slug: template.slug,
        content: `# ${template.title}\n\nЭто тестовая статья для раздела вики. Она создана, чтобы в админке и на сайте всегда было достаточно контента.\n\n## Ключевые пункты\n- Запись №${template.slug}\n- Автор: ${template.author.username}\n- Категория: ${template.category}\n`,
        excerpt: template.excerpt,
        coverUrl: avatar(template.slug),
        category: template.category,
        authorId: template.author.id,
        views: template.views,
        isPublished: true,
      },
    );
  }

  const newsTemplates = [
    { title: 'Добро пожаловать на Budaxov', excerpt: 'Открытие нового портала для русскоязычных игроков Terraria.', author: users[0], isPinned: true, views: 1547 },
    { title: 'Гайд по первым часам в Terraria', excerpt: 'С чего начать в Terraria? Полный гайд для начинающих.', author: users[1], views: 892 },
    { title: 'Топ-10 лучших строек нашего сообщества', excerpt: 'Лучшие постройки игроков Budaxov за месяц.', author: users[0], views: 1203 },
    { title: 'Секреты хардмода для новичков', excerpt: 'Переход в хардмод без лишней боли.', author: users[9], views: 765 },
    { title: 'Как быстро собрать крылья', excerpt: 'Порядок действий для раннего флай-гирa.', author: users[3], views: 654 },
    { title: 'Обновление галереи и модерации', excerpt: 'Новые правила и больше контента в галерее.', author: users[1], views: 430 },
    { title: 'Лучшие аксессуары для мага', excerpt: 'Подборка аксессуаров для сильного магического билда.', author: users[3], views: 988 },
    { title: 'Босс недели: Глаз Ктулху', excerpt: 'Подготовка и тактика для первого босса.', author: users[5], views: 1100 },
    { title: 'Постройка месяца', excerpt: 'Новая подборка лучших пользовательских строек.', author: users[4], views: 800 },
    { title: 'Что добавить в вики дальше', excerpt: 'План развития раздела справки и гайдов.', author: users[0], views: 522 },
  ];

  for (const template of newsTemplates) {
    await ensureByUnique(
      prisma,
      'news',
      { title: template.title },
      {
        title: template.title,
        content: `${template.title}\n\nТестовая новость для наполнения админки и главной страницы.`,
        excerpt: template.excerpt,
        coverUrl: avatar(template.title),
        authorId: template.author.id,
        isPublished: true,
        isPinned: Boolean(template.isPinned),
        views: template.views,
        publishedAt: new Date(),
      },
    );
  }

  const postTemplates = [
    { title: 'Как победить Лунного лорда в соло режиме?', category: 'HELP', author: users[2], views: 234, pinned: false },
    { title: 'Мой замок — 40 часов работы', category: 'BUILD', author: users[4], views: 891, pinned: true },
    { title: 'Идеальная магическая сборка для хардмода', category: 'GUIDE', author: users[3], views: 1456, pinned: false },
    { title: 'Какие крылья вы советуете?', category: 'DISCUSSION', author: users[7], views: 322, pinned: false },
    { title: 'Фанарт Глаза Ктулху', category: 'FANART', author: users[8], views: 640, pinned: false },
    { title: 'Гайд по фарму руд', category: 'GUIDE', author: users[6], views: 510, pinned: false },
    { title: 'Скриншоты моей базы в аду', category: 'BUILD', author: users[5], views: 780, pinned: false },
    { title: 'Помогите с боссами механики', category: 'HELP', author: users[9], views: 610, pinned: false },
    { title: 'Новая идея для ивента сообщества', category: 'DISCUSSION', author: users[1], views: 205, pinned: false },
    { title: 'Тестовый тред для модерации', category: 'NEWS', author: users[0], views: 999, pinned: false },
  ];

  const posts = [];
  for (const template of postTemplates) {
    const post = await ensureByUnique(
      prisma,
      'post',
      { title: template.title },
      {
        title: template.title,
        body: `# ${template.title}\n\nЭто тестовый пост для форума. Он нужен, чтобы раздел не был пустым и админка показывала живые данные.\n\n- Автор: ${template.author.username}\n- Категория: ${template.category}\n- Тестовый контент для заполнения БД.\n`,
        excerpt: `${template.title} — тестовый пост для наполнения форума.`,
        coverUrl: avatar(template.title),
        category: template.category,
        authorId: template.author.id,
        views: template.views,
        isPinned: Boolean(template.pinned),
        isPublished: true,
      },
    );
    posts.push(post);
  }

  const commentTemplates = [
    { post: posts[0], author: users[1], body: 'Попробуй использовать Звёздную хмару и уклоняться рывками.' },
    { post: posts[0], author: users[5], body: 'Добавь зелья защиты и аренообразную платформу.' },
    { post: posts[1], author: users[0], body: 'Отличная работа, строение выглядит очень цельным.' },
    { post: posts[1], author: users[8], body: 'Сколько блоков ушло на башни?' },
    { post: posts[2], author: users[9], body: 'Для мага обязательно взять Манафлауэр и хороший посох.' },
    { post: posts[3], author: users[4], body: 'Я бы советовал крылья ангела как стартовый вариант.' },
    { post: posts[4], author: users[2], body: 'Фанарт получился очень атмосферным.' },
    { post: posts[5], author: users[6], body: 'Руда лучше фармится на большой шахте под спавном.' },
    { post: posts[6], author: users[3], body: 'Невероятно атмосферная база, особенно нижний этаж.' },
    { post: posts[7], author: users[7], body: 'Для механических боссов нужен отдельный набор арены.' },
  ];

  for (const template of commentTemplates) {
    await ensureByUnique(
      prisma,
      'comment',
      { body: template.body },
      {
        postId: template.post.id,
        authorId: template.author.id,
        body: template.body,
        parentId: null,
        isDeleted: false,
      },
    );
  }

  const postLikeRows = [];
  const likePairs = [
    [posts[0], users[1]],
    [posts[0], users[2]],
    [posts[1], users[0]],
    [posts[1], users[3]],
    [posts[2], users[4]],
    [posts[3], users[5]],
    [posts[4], users[6]],
    [posts[5], users[7]],
    [posts[6], users[8]],
    [posts[7], users[9]],
  ];
  for (const [post, user] of likePairs) {
    postLikeRows.push({ postId: post.id, userId: user.id });
  }
  await prisma.postLike.createMany({ data: postLikeRows, skipDuplicates: true });

  const achievementTemplates = [
    { name: 'Первые шаги', description: 'Создай свой первый предмет', iconUrl: '🪓', xpReward: 50, rarity: 'COMMON' },
    { name: 'Убийца боссов', description: 'Победи 10 боссов', iconUrl: '⚔️', xpReward: 500, rarity: 'RARE' },
    { name: 'Строитель-мастер', description: 'Построй дом для всех НПС', iconUrl: '🏰', xpReward: 300, rarity: 'RARE' },
    { name: 'Легенда Terraria', description: 'Пройди игру на сложности Мастер', iconUrl: '👑', xpReward: 2000, rarity: 'LEGENDARY' },
    { name: 'Исследователь', description: 'Открой все биомы', iconUrl: '🗺️', xpReward: 400, rarity: 'EPIC' },
    { name: 'Добытчик', description: 'Выкопай 10,000 блоков', iconUrl: '⛏️', xpReward: 100, rarity: 'COMMON' },
    { name: 'Мастер арены', description: 'Победи босса без урона', iconUrl: '🛡️', xpReward: 650, rarity: 'EPIC' },
    { name: 'Коллекционер', description: 'Собери 100 уникальных предметов', iconUrl: '📦', xpReward: 250, rarity: 'RARE' },
    { name: 'Любитель фанарта', description: 'Опубликуй 5 работ в галерее', iconUrl: '🎨', xpReward: 180, rarity: 'COMMON' },
    { name: 'Хранитель знаний', description: 'Добавь 20 правок в вики', iconUrl: '📚', xpReward: 900, rarity: 'EPIC' },
  ];

  const achievements = [];
  for (const template of achievementTemplates) {
    const achievement = await ensureByUnique(
      prisma,
      'achievement',
      { name: template.name },
      template,
    );
    achievements.push(achievement);
  }

  await ensureUserAchievements(prisma, [
    { userId: users[2].id, achievementId: achievements[0].id },
    { userId: users[3].id, achievementId: achievements[1].id },
    { userId: users[4].id, achievementId: achievements[2].id },
    { userId: users[5].id, achievementId: achievements[3].id },
    { userId: users[6].id, achievementId: achievements[4].id },
    { userId: users[7].id, achievementId: achievements[5].id },
    { userId: users[8].id, achievementId: achievements[6].id },
    { userId: users[9].id, achievementId: achievements[7].id },
    { userId: users[1].id, achievementId: achievements[8].id },
    { userId: users[0].id, achievementId: achievements[9].id },
  ]);

  await ensureLeaderboard(prisma, users.map((user, index) => ({
    userId: user.id,
    score: 100000 - index * 7000,
    season: 1,
    kills: 50000 - index * 3200,
    deaths: 10 + index * 7,
    playtime: 3000 - index * 180,
  })));

  const galleryEntries = [];
  for (let i = 0; i < TARGET; i += 1) {
    galleryEntries.push({
      userId: users[i % users.length].id,
      url: avatar(`gallery-approved-${i + 1}`),
      thumbUrl: avatar(`gallery-approved-thumb-${i + 1}`),
      title: `Одобренный скриншот #${i + 1}`,
      description: `Тестовая галерея: одобренная запись номер ${i + 1}.`,
      type: i % 3 === 0 ? 'SCREENSHOT' : i % 3 === 1 ? 'BUILD' : 'FANART',
      votes: 25 + i * 3,
      isApproved: true,
    });
    galleryEntries.push({
      userId: users[(i + 3) % users.length].id,
      url: avatar(`gallery-pending-${i + 1}`),
      thumbUrl: avatar(`gallery-pending-thumb-${i + 1}`),
      title: `Ожидает проверки #${i + 1}`,
      description: `Тестовая галерея: запись на модерации номер ${i + 1}.`,
      type: i % 3 === 0 ? 'SCREENSHOT' : i % 3 === 1 ? 'BUILD' : 'VIDEO',
      votes: 2 + i,
      isApproved: false,
    });
  }

  await ensureManyByUnique(
    prisma,
    'mediaGallery',
    galleryEntries.map((entry) => ({
      where: { url: entry.url },
      data: entry,
    })),
  );

  const reports = [];
  const reportTargets = [
    { targetType: 'POST', targetId: posts[0].id, reporterId: users[1].id, targetUserId: posts[0].authorId, reason: 'Подозрительный контент в треде' },
    { targetType: 'COMMENT', targetId: 1, reporterId: users[2].id, targetUserId: null, reason: 'Оскорбительный комментарий' },
    { targetType: 'USER', targetId: users[6].id, reporterId: users[0].id, targetUserId: users[6].id, reason: 'Спам в личных сообщениях' },
    { targetType: 'MEDIA', targetId: 1, reporterId: users[4].id, targetUserId: null, reason: 'Нарушение правил галереи' },
    { targetType: 'POST', targetId: posts[2].id, reporterId: users[5].id, targetUserId: posts[2].authorId, reason: 'Нецелевой пост' },
    { targetType: 'POST', targetId: posts[3].id, reporterId: users[6].id, targetUserId: posts[3].authorId, reason: 'Флуд в теме' },
    { targetType: 'COMMENT', targetId: 2, reporterId: users[7].id, targetUserId: null, reason: 'Провокационный ответ' },
    { targetType: 'MEDIA', targetId: 2, reporterId: users[8].id, targetUserId: null, reason: 'Слишком низкое качество изображения' },
    { targetType: 'USER', targetId: users[8].id, reporterId: users[9].id, targetUserId: users[8].id, reason: 'Подозрение на накрутку' },
    { targetType: 'POST', targetId: posts[4].id, reporterId: users[1].id, targetUserId: posts[4].authorId, reason: 'Неверный тег категории' },
  ];

  for (const report of reportTargets) {
    reports.push(await ensureByUnique(
      prisma,
      'report',
      { reason: report.reason },
      {
        ...report,
        status: 'PENDING',
        resolvedBy: null,
        resolution: null,
      },
    ));
  }

  const notifications = [
    { userId: users[0].id, type: 'SYSTEM', title: 'Добро пожаловать!', body: 'Добро пожаловать на Budaxov! Исследуй вики, участвуй в форуме.', link: '/' },
    { userId: users[0].id, type: 'ACHIEVEMENT', title: 'Новая ачивка!', body: 'Вы получили ачивку "Первые шаги"!', link: '/profile' },
    { userId: users[1].id, type: 'COMMENT', title: 'Ответ на ваш пост', body: 'ФанатБоссов ответил на ваш пост о магическом билде.', link: `/forum/${posts[2].id}` },
    { userId: users[2].id, type: 'LIKE', title: 'Ваш пост лайкнули', body: 'Ваш тред получил новые лайки от сообщества.', link: `/forum/${posts[0].id}` },
    { userId: users[3].id, type: 'MODERATION', title: 'Гайд на проверке', body: 'Ваш материал отправлен на модерацию.', link: '/gallery' },
    { userId: users[4].id, type: 'SYSTEM', title: 'Новый сезон', body: 'Начался новый сезон рейтинга.', link: '/leaderboard' },
    { userId: users[5].id, type: 'ACHIEVEMENT', title: 'Ачивка разблокирована', body: 'Вы получили новое достижение.', link: '/profile' },
    { userId: users[6].id, type: 'COMMENT', title: 'Вам ответили', body: 'На ваш комментарий пришёл ответ.', link: `/forum/${posts[4].id}` },
    { userId: users[7].id, type: 'SYSTEM', title: 'Новая статья в вики', body: 'Вики была пополнена свежими статьями.', link: '/wiki' },
    { userId: users[8].id, type: 'LIKE', title: 'Галерея ожила', body: 'Ваш скриншот получил голоса.', link: '/gallery' },
  ];

  for (const notification of notifications) {
    await ensureByUnique(
      prisma,
      'notification',
      { title: notification.title, body: notification.body, userId: notification.userId },
      notification,
    );
  }

  const adminLogs = [
    { adminId: users[0].id, action: 'SEED_USERS', details: 'Добавлено тестовых пользователей и профилей', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_ITEMS', details: 'Добавлено 10 тестовых предметов', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_WIKI', details: 'Добавлено 10 статей в вики', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_NEWS', details: 'Добавлено 10 новостей', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_POSTS', details: 'Добавлено 10 постов форума', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_GALLERY', details: 'Добавлены тестовые записи галереи', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_REPORTS', details: 'Добавлены тестовые жалобы', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_ACHIEVEMENTS', details: 'Добавлены достижения и выдачи', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_LEADERBOARD', details: 'Заполнена таблица лидеров', ip: '127.0.0.1' },
    { adminId: users[0].id, action: 'SEED_SETTINGS', details: 'Обновлены системные настройки', ip: '127.0.0.1' },
  ];

  for (const log of adminLogs) {
    await ensureByUnique(
      prisma,
      'adminLog',
      { action: log.action, details: log.details },
      log,
    );
  }

  await ensureSettings(prisma, [
    { key: 'site_name', value: 'Budaxov' },
    { key: 'site_description', value: 'Лучший русскоязычный портал по Terraria' },
    { key: 'online_count', value: '42' },
    { key: 'season_number', value: '1' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'registration_open', value: 'true' },
    { key: 'forum_enabled', value: 'true' },
    { key: 'gallery_enabled', value: 'true' },
    { key: 'news_enabled', value: 'true' },
    { key: 'seed_version', value: '2' },
  ]);

  logger.info('✅ Тестовые данные обновлены');
}

async function runSeedIfEmpty(prisma) {
  await ensureSeedData(prisma);
}

module.exports = { runSeedIfEmpty };

if (require.main === module) {
  const prisma = new PrismaClient();

  prisma
    .$connect()
    .then(() => runSeedIfEmpty(prisma))
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      logger.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
