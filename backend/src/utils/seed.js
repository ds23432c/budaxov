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

const SEED_VERSION = '4';
const PINTEREST_BASES = [
  'https://i.pinimg.com/736x/75/de/e9/75dee9d9233dabd75d17632e24ca1ab7.jpg',
  'https://i.pinimg.com/474x/85/ec/2d/85ec2da103aa0b055fdb1e127e484b28.jpg',
];

function avatar(seed) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function pinterestImage(seed, variant = 0) {
  return `${PINTEREST_BASES[variant % PINTEREST_BASES.length]}?budaxov=${encodeURIComponent(seed)}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function clearSeedTables(prisma) {
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.mediaGallery.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.post.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.news.deleteMany();
  await prisma.item.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.user.deleteMany();
}

async function upsertUser(prisma, template, passwordHash) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: template.email }, { username: template.username }],
    },
    select: { id: true },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username: template.username,
        email: template.email,
        passwordHash,
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

  return prisma.user.create({
    data: {
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
    include: { profile: true },
  });
}

async function saveRecord(prisma, model, where, data) {
  const existing = await prisma[model].findFirst({ where, select: { id: true } });
  if (existing) {
    return prisma[model].update({ where: { id: existing.id }, data });
  }
  return prisma[model].create({ data });
}

async function saveSettings(prisma, settings) {
  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
}

async function saveLeaderboard(prisma, rows) {
  for (const row of rows) {
    const existing = await prisma.leaderboard.findFirst({
      where: { userId: row.userId, season: row.season },
      select: { id: true },
    });
    if (existing) {
      await prisma.leaderboard.update({ where: { id: existing.id }, data: row });
    } else {
      await prisma.leaderboard.create({ data: row });
    }
  }
}

async function ensureSeedData(prisma) {
  logger.info('🌱 Обновляем тестовые данные без удаления существующих записей...');

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const userTemplates = [
    { username: 'Администратор', email: 'admin@budaxov.ru', role: 'SUPERADMIN', avatarSeed: 'admin', profile: { bio: 'Главный администратор проекта Budaxov. Следит за развитием портала почти год.', playtimeHours: 2847, country: 'Россия', website: 'https://budaxov.ru', totalScore: 99999, level: 50, discord: 'admin#0001' } },
    { username: 'СтаршийМодератор', email: 'moderator@budaxov.ru', role: 'MODERATOR', avatarSeed: 'moderator', profile: { bio: 'Модерирую форум, галерею и вики. Помогаю новичкам и слежу за порядком.', playtimeHours: 1830, country: 'Россия', website: null, totalScore: 67000, level: 41, discord: 'mod#2026' } },
    { username: 'СистемныйАдмин', email: 'sysadmin@budaxov.ru', role: 'ADMIN', avatarSeed: 'sysadmin', profile: { bio: 'Настраиваю сайт, контент и тестовые окружения. Люблю чистую архитектуру.', playtimeHours: 1420, country: 'Казань', website: null, totalScore: 54000, level: 36, discord: 'sys#1100' } },
    { username: 'Копатель2000', email: 'kopatel2000@mail.ru', role: 'USER', avatarSeed: 'kopatel2000', profile: { bio: 'Люблю шахты, фермы и длинные экспедиции в подземелья.', playtimeHours: 760, country: 'Москва', website: null, totalScore: 18200, level: 21, discord: 'miner#1188' } },
    { username: 'ТерраМастер', email: 'terramaster@yandex.ru', role: 'USER', avatarSeed: 'terramaster', profile: { bio: 'Прошёл игру на экспертной сложности и собрал почти все руды.', playtimeHours: 980, country: 'Санкт-Петербург', website: 'https://example.com/terramaster', totalScore: 28400, level: 28, discord: 'terra#8844' } },
    { username: 'НочнойСтроитель', email: 'builder@rambler.ru', role: 'USER', avatarSeed: 'builder', profile: { bio: 'Построил десятки домов, арен и тематических баз в мире Terraria.', playtimeHours: 1500, country: 'Екатеринбург', website: null, totalScore: 35000, level: 32, discord: 'builder#3321' } },
    { username: 'ФанатБоссов', email: 'bossfan@gmail.com', role: 'USER', avatarSeed: 'bossfan', profile: { bio: 'Фармлю боссов, собираю дроп и помогаю с тактиками.', playtimeHours: 2200, country: 'Новосибирск', website: null, totalScore: 58000, level: 42, discord: 'boss#9000' } },
    { username: 'РудникоВед', email: 'miner@inbox.ru', role: 'USER', avatarSeed: 'miner', profile: { bio: 'Добываю ресурсы и держу склад в идеальном порядке.', playtimeHours: 710, country: 'Казань', website: null, totalScore: 19000, level: 22, discord: 'ore#4422' } },
    { username: 'Луноход', email: 'moonwalker@budaxov.ru', role: 'USER', avatarSeed: 'moonwalker', profile: { bio: 'Охочусь на Лунного Лорда и люблю поздний эндгейм-контент.', playtimeHours: 1080, country: 'Минск', website: null, totalScore: 31000, level: 29, discord: 'moon#5511' } },
    { username: 'ПиксельАрт', email: 'pixelart@budaxov.ru', role: 'USER', avatarSeed: 'pixelart', profile: { bio: 'Рисую фанарт и оформляю базы в стиле ретро-пикселя.', playtimeHours: 530, country: 'Тула', website: 'https://art.example.com', totalScore: 14200, level: 19, discord: 'art#7712' } },
    { username: 'ХардмодГуру', email: 'hardmode@budaxov.ru', role: 'USER', avatarSeed: 'hardmode', profile: { bio: 'Помогаю игрокам пережить хардмод и быстро выйти в прогресс.', playtimeHours: 1760, country: 'Самара', website: null, totalScore: 40200, level: 36, discord: 'hard#7733' } },
    { username: 'ЛеснойСкиталец', email: 'forestwalker@budaxov.ru', role: 'USER', avatarSeed: 'forestwalker', profile: { bio: 'Изучаю биомы, собираю редкие растения и пишу заметки по миру.', playtimeHours: 640, country: 'Пермь', website: null, totalScore: 13100, level: 18, discord: 'forest#1001' } },
    { username: 'АренаБилдер', email: 'arena@budaxov.ru', role: 'USER', avatarSeed: 'arena', profile: { bio: 'Строю арены под каждого босса и веду чертежи.', playtimeHours: 920, country: 'Воронеж', website: null, totalScore: 24000, level: 27, discord: 'arena#2404' } },
    { username: 'МагистрПикселей', email: 'pixelmaster@budaxov.ru', role: 'USER', avatarSeed: 'pixelmaster', profile: { bio: 'Люблю UI, пиксель-арт и аккуратные таблицы статистики.', playtimeHours: 870, country: 'Ярославль', website: 'https://ui.example.com', totalScore: 20300, level: 25, discord: 'ui#5544' } },
    { username: 'ДанжКрипер', email: 'dungeon@budaxov.ru', role: 'USER', avatarSeed: 'dungeon', profile: { bio: 'Почти весь лут добываю в данже и на ивентах.', playtimeHours: 1100, country: 'Челябинск', website: null, totalScore: 27500, level: 30, discord: 'dng#4477' } },
    { username: 'СолнечныйКузнец', email: 'forge@budaxov.ru', role: 'USER', avatarSeed: 'forge', profile: { bio: 'Собираю оружие ближнего боя и люблю крафтить легендарки.', playtimeHours: 1310, country: 'Омск', website: null, totalScore: 33900, level: 34, discord: 'forge#9900' } },
    { username: 'ХранительВики', email: 'wiki@budaxov.ru', role: 'USER', avatarSeed: 'wiki', profile: { bio: 'Редактирую справку, люблю точные формулировки и игровые механики.', playtimeHours: 1480, country: 'Белгород', website: null, totalScore: 35800, level: 35, discord: 'wiki#1010' } },
    { username: 'ОгненныйЛучник', email: 'ranger@budaxov.ru', role: 'USER', avatarSeed: 'ranger', profile: { bio: 'Играю за стрелка, держу инвентарь в порядке и строю платформы.', playtimeHours: 980, country: 'Ростов-на-Дону', website: null, totalScore: 26800, level: 29, discord: 'ranger#3311' } },
    { username: 'ТуманнаяФея', email: 'mist@budaxov.ru', role: 'USER', avatarSeed: 'mist', profile: { bio: 'Люблю атмосферные постройки, туман и светящиеся биомы.', playtimeHours: 730, country: 'Ижевск', website: null, totalScore: 16400, level: 20, discord: 'mist#7711' } },
    { username: 'КобальтовыйРыцарь', email: 'cobalt@budaxov.ru', role: 'USER', avatarSeed: 'cobalt', profile: { bio: 'Держу баланс между фермой, боёвкой и редкими находками.', playtimeHours: 1150, country: 'Томск', website: null, totalScore: 29200, level: 31, discord: 'cobalt#5005' } },
    { username: 'ПадшийАнгел', email: 'angel@budaxov.ru', role: 'USER', avatarSeed: 'angel', profile: { bio: 'Собираю крылья, аксессуары и люблю светлые постройки.', playtimeHours: 860, country: 'Самара', website: null, totalScore: 21900, level: 26, discord: 'angel#8808' } },
    { username: 'СтражЛунногоХрама', email: 'moontemple@budaxov.ru', role: 'USER', avatarSeed: 'moontemple', profile: { bio: 'Эндгейм, артефакты и лунные постройки — моя тема.', playtimeHours: 1650, country: 'Минск', website: null, totalScore: 39000, level: 37, discord: 'moon#7777' } },
    { username: 'СкоростнойФермер', email: 'farm@budaxov.ru', role: 'USER', avatarSeed: 'farm', profile: { bio: 'Фермы боссов, материалов и монет — моя специализация.', playtimeHours: 1030, country: 'Сочи', website: null, totalScore: 26000, level: 29, discord: 'farm#2222' } },
    { username: 'СеверныйСнайпер', email: 'sniper@budaxov.ru', role: 'USER', avatarSeed: 'sniper', profile: { bio: 'Стреляю точно, люблю дальний бой и снежные базы.', playtimeHours: 920, country: 'Архангельск', website: null, totalScore: 24800, level: 27, discord: 'snip#4444' } },
    { username: 'ПещерныйАрхитектор', email: 'cavebuilder@budaxov.ru', role: 'USER', avatarSeed: 'cavebuilder', profile: { bio: 'Перестраиваю подземелья в уютные базы и шахтёрские станции.', playtimeHours: 780, country: 'Уфа', website: null, totalScore: 18300, level: 22, discord: 'cave#6161' } },
    { username: 'ЗенитныйКоллекционер', email: 'zenith@budaxov.ru', role: 'USER', avatarSeed: 'zenith', profile: { bio: 'Собираю коллекции оружия, маунтов и артефактов.', playtimeHours: 1940, country: 'Калининград', website: null, totalScore: 47000, level: 39, discord: 'zen#9090' } },
  ];

  const users = [];
  for (const template of userTemplates) {
    const isStaff = ['SUPERADMIN', 'ADMIN', 'MODERATOR'].includes(template.role);
    const user = await upsertUser(prisma, {
      username: template.username,
      email: template.email,
      role: template.role,
      avatarUrl: avatar(template.avatarSeed),
      profile: template.profile,
    }, isStaff ? adminPasswordHash : userPasswordHash);
    users.push(user);
  }

  const authorAt = (index) => users[index % users.length];

  const itemTemplates = [
    ['Терра-клинок', 'terra-blade', 'WEAPON', 'YELLOW', 115, null, true, 'Истинный Экскалибур + Истинный Кинжал Ночи', 'Подземелье'],
    ['Зенит', 'zenith', 'WEAPON', 'RAINBOW', 190, null, false, null, 'Эндгейм'],
    ['Звёздный гнев', 'starfury', 'WEAPON', 'BLUE', 28, null, false, null, 'Летающий остров'],
    ['Край ночи', 'night-edge', 'WEAPON', 'GREEN', 42, null, true, 'Лезвие травы + Кровавый разрубатель + Каскад света', 'Подземелье'],
    ['Мегакула', 'megashark', 'WEAPON', 'ORANGE', 31, null, true, 'Мини-акулa + Мушкет + 5 Акулий плавников', 'Океан'],
    ['Дыхание земли', 'daedalus-stormbow', 'WEAPON', 'BLUE', 43, null, false, null, 'Небесные ящики'],
    ['Щит Анх', 'ankh-shield', 'ACCESSORY', 'YELLOW', null, 4, true, 'Щит Кобальта + 11 иммунитетов', 'Подземелье'],
    ['Селестиальный панцирь', 'celestial-shell', 'ACCESSORY', 'YELLOW', null, 5, true, 'Лунный талисман + Нептунова ракушка', 'Хардмод'],
    ['Жезл раздора', 'rod-of-discord', 'ACCESSORY', 'RED', null, null, false, null, 'Подземелье'],
    ['Червячий шарф', 'worm-scarf', 'ACCESSORY', 'ORANGE', null, 3, false, null, 'Коррупция'],
    ['Очиститель', 'clentaminator', 'TOOL', 'BLUE', null, null, false, null, 'Торговец'],
    ['Тигриный посох', 'storm-tiger-staff', 'MATERIAL', 'GREEN', null, null, false, null, 'Событие'],
    ['Шквал тени', 'shadowflame-knife', 'WEAPON', 'PURPLE', 45, null, false, null, 'Подземелье'],
    ['Лунное пламя', 'lunar-flare', 'WEAPON', 'RED', 89, null, false, null, 'Пост-лунный'],
    ['Фантасма', 'phantasm', 'WEAPON', 'YELLOW', 62, null, false, null, 'Лунный ивент'],
    ['Дракон Звёздной пыли', 'stardust-dragon-staff', 'MATERIAL', 'YELLOW', null, null, false, null, 'Лунный ивент'],
    ['Рассвет', 'daybreak', 'WEAPON', 'RED', 105, null, false, null, 'Лунный ивент'],
    ['Солнечная дуга', 'solar-eruption', 'WEAPON', 'RED', 128, null, false, null, 'Лунный ивент'],
    ['Праздничная пушка Mk2', 'celebration-mk2', 'WEAPON', 'ORANGE', 72, null, false, null, 'Пост-лунный'],
    ['Захваченный топор', 'possessed-hatchet', 'WEAPON', 'BLUE', 80, null, false, null, 'Плантера'],
    ['Молот паладина', 'paladins-hammer', 'WEAPON', 'ORANGE', 67, null, false, null, 'Подземелье'],
    ['Кристальный змей', 'crystal-serpent', 'WEAPON', 'BLUE', 40, null, false, null, 'Священный биом'],
    ['Клинок-слуга', 'blade-staff', 'MATERIAL', 'BLUE', null, null, false, null, 'Подземелье'],
    ['Крылья Фишрона', 'fishron-wings', 'ACCESSORY', 'YELLOW', null, null, false, null, 'Океан'],
    ['Летающий ковёр', 'flying-carpet', 'ACCESSORY', 'GREEN', null, null, false, null, 'Пустыня'],
  ];

  for (const [index, template] of itemTemplates.entries()) {
    const [name, slug, type, rarity, damage, defense, craftable, recipe, biome] = template;
    await saveRecord(prisma, 'item', { slug }, {
      name,
      slug,
      type,
      rarity,
      description: `${name} — предмет для ${type === 'WEAPON' ? 'боёвки' : type === 'ACCESSORY' ? 'сборки билда' : type === 'TOOL' ? 'добычи' : 'прогресса'}. Тестовая запись для полного наполнения каталога.`,
      spriteUrl: null,
      imageUrl: pinterestImage(slug, index),
      damage,
      defense,
      craftable: Boolean(craftable),
      craftRecipe: recipe,
      biome,
      boss: null,
      isPublished: true,
      createdAt: daysAgo(index * 12),
    });
  }

  const wikiTemplates = [
    ['Лесной биом', 'forest-biome', 'BIOME', 'Стартовый биом с базовыми ресурсами и безопасной зоной.', 0],
    ['Искажение', 'corruption', 'BIOME', 'Опасный биом с древними формами жизни и осквернённой почвой.', 1],
    ['Багровый биом', 'crimson', 'BIOME', 'Альтернативный вариант зла с кровавой флорой и сильными монстрами.', 2],
    ['Священный биом', 'hallow', 'BIOME', 'Красочный послехардмодный биом с сильными противниками.', 3],
    ['Преисподняя', 'underworld', 'BIOME', 'Нижний уровень мира с лавой, адским камнем и Стеной Плоти.', 4],
    ['Джунгли', 'jungle', 'BIOME', 'Густой биом с редкими материалами и сильными врагами.', 5],
    ['Данж', 'dungeon', 'BIOME', 'Сложная локация с книгами, ловушками и редким лутом.', 6],
    ['Храм джунглей', 'jungle-temple', 'MECHANIC', 'Поздняя локация с ловушками и сундуками.', 7],
    ['Глаз Ктулху', 'eye-of-cthulhu', 'BOSS', 'Первый крупный босс для старта прогресса.', 8],
    ['Король слизней', 'king-slime', 'BOSS', 'Простой, но полезный ранний босс.', 9],
    ['Скелетрон', 'skeletron', 'BOSS', 'Охраняет вход в Данж и проверяет готовность игрока.', 10],
    ['Стена Плоти', 'wall-of-flesh', 'BOSS', 'Финал пре-хардмода и точка входа в новую фазу мира.', 11],
    ['Разрушитель', 'destroyer', 'BOSS', 'Механический босс-червь с огромным запасом здоровья.', 12],
    ['Близнецы', 'the-twins', 'BOSS', 'Два механических глаза с разными атаками и скоростями.', 13],
    ['Скелетрон Прайм', 'skeletron-prime', 'BOSS', 'Механическая версия хранителя Данжа.', 14],
    ['Плантера', 'plantera', 'BOSS', 'Цветок джунглей, открывающий следующий этап мира.', 15],
    ['Голем', 'golem', 'BOSS', 'Поздний босс из храма джунглей.', 16],
    ['Марсианское безумие', 'martian-madness', 'MECHANIC', 'Ивент с инопланетной тематикой и мощным лутом.', 17],
    ['Лунный Лорд', 'moon-lord', 'BOSS', 'Главный финальный босс Terraria.', 18],
    ['Мастер-режим', 'master-mode', 'GUIDE', 'Усложнённый режим прохождения с особыми наградами.', 19],
    ['Эксперт-режим', 'expert-mode', 'GUIDE', 'Режим для игроков, которым нужен более сложный прогресс.', 20],
    ['Крылья и полёт', 'wings-guide', 'GUIDE', 'Как быстро получить первые крылья и летать по миру.', 21],
    ['Зелья и баффы', 'potions-guide', 'GUIDE', 'Полезные зелья для боёвки, шахт и построек.', 22],
    ['Сборка мага', 'mage-build', 'GUIDE', 'Оптимальная магическая сборка для середины и конца игры.', 23],
    ['Сборка стрелка', 'ranger-build', 'GUIDE', 'Дальнобойный билд для комфортного фарма боссов.', 24],
  ];

  for (const [index, template] of wikiTemplates.entries()) {
    const [title, slug, category, excerpt, authorIndex] = template;
    await saveRecord(prisma, 'wikiPage', { slug }, {
      title,
      slug,
      content: `# ${title}\n\n${excerpt}\n\nЭто тестовая статья, которая делает раздел вики насыщенным и похожим на живой проект.\n\n## Что важно\n- Автор: ${authorAt(authorIndex).username}\n- Категория: ${category}\n- Публикация: ${daysAgo(index * 14).toLocaleDateString('ru-RU')}\n`,
      excerpt,
      coverUrl: pinterestImage(slug, index),
      category,
      authorId: authorAt(authorIndex).id,
      views: 750 + index * 93,
      isPublished: true,
      createdAt: daysAgo(index * 14),
    });
  }

  const newsTemplates = [
    ['Открытие портала Budaxov', 'Запустили новую версию портала для русскоязычных игроков Terraria.', 0, true, 1860],
    ['Новый режим галереи', 'Галерея получила модерацию и две формы загрузки — ссылка или файл.', 1, false, 1210],
    ['Гайд по первым часам', 'Полный стартовый гайд теперь доступен в разделе новостей и вики.', 2, false, 990],
    ['Сезон рейтинга открыт', 'Начался новый сезон лидерборда с обновлёнными таблицами.', 0, true, 830],
    ['Лучшие стройки месяца', 'Собрали подборку самых красивых баз сообщества.', 4, false, 920],
    ['Хардмод без боли', 'Подготовили советы по переходу в хардмод для новичков.', 10, false, 760],
    ['Магический билд недели', 'Подборка экипировки и оружия для магов.', 23, false, 680],
    ['Босс недели: Глаз Ктулху', 'Тактика, арена и базовые советы для первого босса.', 5, false, 1120],
    ['Вики пополнилась статьями', 'Добавили 25 новых материалов о биомах, боссах и механиках.', 16, false, 740],
    ['Праздничный ивент сообщества', 'Совместное строительство, фанарт и конкурс на лучшую базу.', 8, false, 510],
    ['Тестовый патч форумов', 'Добавили улучшенный редактор, новые теги и модерацию.', 2, false, 470],
    ['Океан и рыбный промысел', 'Публикуем заметки о рыбалке, сундуках и морских событиях.', 6, false, 520],
    ['Постройки в джунглях', 'Набор идей для зелёных баз, теплиц и храмов.', 4, false, 610],
    ['Данж: советы выживания', 'Обновлённый материал для тех, кто только открыл Данж.', 1, false, 550],
    ['Турнир по боссам', 'Игроки соревнуются в скорости убийства механических боссов.', 5, false, 430],
    ['Новые ачивки и награды', 'Система достижений стала заметнее и интереснее для игроков.', 0, false, 420],
    ['Обзор арены с ловушками', 'Публикуем построенную арену для поздней игры.', 14, false, 360],
    ['Топ аксессуаров для выживания', 'Разбираем лучшие аксессуары для соло-прохождения.', 17, false, 580],
    ['Пещерные базы и шахты', 'Делимся красивыми подземными проектами и удобными планировками.', 24, false, 390],
    ['Лунный Лорд побеждён', 'Сообщество закрыло серию рейдов и открыло новый лут-пул.', 9, true, 1040],
    ['Будущие обновления сайта', 'В планах — больше гайдов, карточек предметов и улучшенная галерея.', 0, false, 250],
    ['Летний набор строек', 'Тёплые базы, озеленение и декоративные элементы.', 4, false, 360],
    ['Фанарт-пятница', 'Каждую неделю показываем лучшие рисунки сообщества.', 8, false, 290],
    ['Зимние биомы и снег', 'Заметки по снежным домам и атмосферному освещению.', 18, false, 380],
    ['Сборки стрелка', 'Подготовили свежий материал по рэнджеру для хардмода.', 17, false, 410],
  ];

  for (const [index, template] of newsTemplates.entries()) {
    const [title, excerpt, authorIndex, pinned, views] = template;
    await saveRecord(prisma, 'news', { title }, {
      title,
      content: `${title}\n\n${excerpt}\n\nТестовая новость, чтобы сайт выглядел живым почти год. Внутри — короткое описание обновления, события или подборки сообщества.`,
      excerpt,
      coverUrl: pinterestImage(title, index),
      authorId: authorAt(authorIndex).id,
      isPublished: true,
      isPinned: Boolean(pinned),
      views,
      publishedAt: daysAgo(index * 13),
      createdAt: daysAgo(index * 13),
    });
  }

  const postTemplates = [
    ['Как победить Лунного Лорда в соло?', 'HELP', 3, false, 320],
    ['Мой замок — 40 часов работы', 'BUILD', 4, true, 910],
    ['Идеальная магическая сборка для хардмода', 'GUIDE', 2, false, 1450],
    ['Какие крылья вы советуете?', 'DISCUSSION', 7, false, 340],
    ['Фанарт Глаза Ктулху', 'FANART', 8, false, 660],
    ['Гайд по фарму руд', 'GUIDE', 6, false, 520],
    ['Скриншоты моей базы в аду', 'BUILD', 5, false, 780],
    ['Помогите с боссами механики', 'HELP', 9, false, 610],
    ['Идея для ивента сообщества', 'DISCUSSION', 1, false, 205],
    ['Тестовый тред для модерации', 'NEWS', 0, false, 990],
    ['Арены против механических боссов', 'BUILD', 14, false, 720],
    ['Зелья, которые реально помогают', 'GUIDE', 22, false, 430],
    ['Лучшие аксессуары до Плантеры', 'DISCUSSION', 20, false, 510],
    ['Мой мир в мастер-режиме', 'DISCUSSION', 11, false, 450],
    ['Руда и реликвии подземелья', 'NEWS', 12, false, 280],
    ['Сравнение билдов мага и стрелка', 'DISCUSSION', 23, false, 650],
    ['Дом для всех NPC', 'BUILD', 13, true, 800],
    ['Что брать на хардмод?', 'HELP', 10, false, 560],
    ['Фанарт: ночной храм', 'FANART', 19, false, 390],
    ['Первые крылья без мучений', 'GUIDE', 21, false, 570],
    ['Советы по рыбалке и сундукам', 'GUIDE', 6, false, 260],
    ['Арена для Королевы Слизней', 'BUILD', 15, false, 430],
    ['Гайд по Данжу', 'GUIDE', 16, false, 470],
    ['Смешная подборка багов', 'DISCUSSION', 18, false, 160],
    ['Лучший лут с марсианского ивента', 'NEWS', 17, false, 350],
  ];

  const posts = [];
  for (const [index, template] of postTemplates.entries()) {
    const [title, category, authorIndex, pinned, views] = template;
    const post = await saveRecord(prisma, 'post', { title }, {
      title,
      body: `# ${title}\n\nЭто тестовый форумный пост, который делает раздел живым и заполненным.\n\n- Автор: ${authorAt(authorIndex).username}\n- Категория: ${category}\n- Создано для демонстрации реальной активности.\n`,
      excerpt: `${title} — подробный тред сообщества Budaxov.`,
      coverUrl: pinterestImage(title, index),
      category,
      authorId: authorAt(authorIndex).id,
      views,
      isPinned: Boolean(pinned),
      isPublished: true,
      createdAt: daysAgo(index * 11),
    });
    posts.push(post);
  }

  const commentBodies = [
    'Отличная идея, я тоже так делал на прошлом прохождении.',
    'Попробуй добавить ещё один уровень платформ для уклонения.',
    'Мне помогли крылья и зелья скорости, советую собрать заранее.',
    'Очень полезный гайд, сохранил в закладки.',
    'Арена выглядит отлично, особенно освещение и фон.',
    'Скриншоты реально атмосферные, приятно смотреть.',
    'Для мага лучше взять ещё и Манафлауэр.',
    'Спасибо, теперь понятно, как проходить этот этап.',
    'Зелья и баффы сильно ускоряют фарм, поддерживаю.',
    'Если сделать ферму чуть шире, будет ещё удобнее.',
    'Босс сложный, но после нескольких попыток схема понятна.',
    'Хорошая подборка предметов, спасибо за список.',
    'Мой любимый стиль постройки — именно такой.',
    'Вики стала очень удобной после обновления.',
    'Проверил на своём мире, всё работает.',
    'Добавил бы ещё рыбу на примере для рыбалки.',
    'Люблю такие треды: коротко, по делу и без воды.',
    'Для стрелка этот аксессуар просто находка.',
    'Согласен с автором, соло-игра даётся легче с подготовкой.',
    'Очень понравилась форма подачи материала.',
    'Надо бы сделать похожий пост по джунглям.',
    'Спасибо за подробности по Днж-аренам.',
    'Интересно, сколько времени ушло на эту базу?',
    'Похоже на серьёзный лейтгейм-контент, круто.',
    'Сделаю по этому гайд на нашем сервере.',
  ];

  for (const [index, body] of commentBodies.entries()) {
    const post = posts[index % posts.length];
    const author = authorAt((index + 1) % users.length);
    await saveRecord(prisma, 'comment', { body }, {
      postId: post.id,
      authorId: author.id,
      body,
      parentId: null,
      isDeleted: false,
      createdAt: daysAgo(index * 9),
    });
  }

  const likeRows = [];
  for (let i = 0; i < 25; i += 1) {
    likeRows.push({ postId: posts[i % posts.length].id, userId: authorAt(i + 1).id });
  }
  await prisma.postLike.createMany({ data: likeRows, skipDuplicates: true });

  const achievementTemplates = [
    ['Первые шаги', 'Создай первый предмет и открой свой путь в мире Terraria.', '🪓', 50, 'COMMON'],
    ['Добытчик', 'Добудь 10 000 блоков и стань мастером шахт.', '⛏️', 100, 'COMMON'],
    ['Убийца слизней', 'Победи 100 слизней и разгони раннюю скуку.', '🟢', 150, 'COMMON'],
    ['Охотник на боссов', 'Победи 10 боссов на разных этапах мира.', '⚔️', 500, 'RARE'],
    ['Строитель-мастер', 'Построй полноценный город для всех NPC.', '🏰', 300, 'RARE'],
    ['Исследователь', 'Открой все основные биомы и внеси их в вики.', '🗺️', 400, 'RARE'],
    ['Переход в хардмод', 'Переживи переход в хардмод и не потеряй прогресс.', '🔥', 650, 'EPIC'],
    ['Мастер арены', 'Победи босса без единого лишнего шага назад.', '🛡️', 700, 'EPIC'],
    ['Коллекционер', 'Собери 100 уникальных предметов в инвентаре.', '📦', 250, 'COMMON'],
    ['Любитель фанарта', 'Опубликуй 5 работ в галерее сообщества.', '🎨', 180, 'COMMON'],
    ['Хранитель знаний', 'Добавь 20 правок в вики и помоги другим игрокам.', '📚', 900, 'EPIC'],
    ['Тихий охотник', 'Победи 20 мини-боссов без смертей.', '🏹', 350, 'RARE'],
    ['Фермер сезона', 'Построй и поддерживай 3 автоматические фермы.', '🌾', 220, 'COMMON'],
    ['Рейдер храма', 'Пройди Храм джунглей и собери все ключевые предметы.', '🗿', 800, 'EPIC'],
    ['Пиксельный архитектор', 'Создай 10 тематических построек на сервере.', '🧱', 260, 'COMMON'],
    ['Светлый путь', 'Собери 25 светильников и оформь базу красиво.', '💡', 120, 'COMMON'],
    ['Аренный тактик', 'Построй арену под каждого механического босса.', '🎯', 420, 'RARE'],
    ['Магистр зелий', 'Используй 50 различных баффов в бою и в шахтах.', '🧪', 200, 'COMMON'],
    ['Лунный авангард', 'Победи Лунного Лорда и открой эндгейм-награды.', '🌙', 2000, 'LEGENDARY'],
    ['Снежный инженер', 'Построй базу в снежном биоме и выживи там.', '❄️', 160, 'COMMON'],
    ['Пустынный исследователь', 'Собери все важные материалы пустыни.', '🏜️', 140, 'COMMON'],
    ['Теневой мастер', 'Открой и используй редкое оружие теневого пути.', '🌑', 600, 'EPIC'],
    ['Звёздный кузнец', 'Создай легендарное оружие из небесных фрагментов.', '⭐', 1200, 'LEGENDARY'],
    ['Хардмодный эксперт', 'Пройди 3 хардмодных босса подряд без телепорта.', '🏆', 1500, 'LEGENDARY'],
    ['Легенда Budaxov', 'Собери весь набор достижений сообщества.', '👑', 2500, 'LEGENDARY'],
  ];

  const achievements = [];
  for (const [index, template] of achievementTemplates.entries()) {
    const [name, description, iconUrl, xpReward, rarity] = template;
    const achievement = await saveRecord(prisma, 'achievement', { name }, {
      name,
      description,
      iconUrl,
      xpReward,
      rarity,
      isSecret: index % 7 === 0,
      createdAt: daysAgo(index * 10),
    });
    achievements.push(achievement);
  }

  const userAchievementRows = [];
  for (let i = 0; i < 25; i += 1) {
    userAchievementRows.push({
      userId: users[i % users.length].id,
      achievementId: achievements[i % achievements.length].id,
      earnedAt: daysAgo(i * 8),
    });
  }
  await prisma.userAchievement.createMany({ data: userAchievementRows, skipDuplicates: true });

  const leaderboardRows = users.slice(0, 25).map((user, index) => ({
    userId: user.id,
    score: 100000 - index * 3200,
    season: 1,
    kills: 50000 - index * 2100,
    deaths: 10 + index * 4,
    playtime: 3000 - index * 120,
  }));
  await saveLeaderboard(prisma, leaderboardRows);

  const galleryTemplates = [
    ['Японский дом у озера', 'Тихая тематическая база с мостом и фонарями.', 'BUILD', 4, true],
    ['Адская крепость', 'Крепость в подземном мире с лавовыми деталями.', 'BUILD', 5, true],
    ['Снежный замок', 'Светлая зимняя база с башнями и флагами.', 'BUILD', 13, true],
    ['Джунглевая теплица', 'Зелёная база с фермой и натуральным светом.', 'BUILD', 14, true],
    ['Лунная обсерватория', 'Поздняя эндгейм-постройка для Лунного Лорда.', 'SCREENSHOT', 18, true],
    ['Пагода в лесу', 'Японская пагода в стиле Terraria.', 'BUILD', 22, true],
    ['Океанский пирс', 'Береговая зона с лодками и декоративным светом.', 'SCREENSHOT', 6, true],
    ['Храм в пустыне', 'Песчаная база с арками и колоннами.', 'BUILD', 7, true],
    ['Багровый собор', 'Тёмная постройка с кровавой палитрой.', 'SCREENSHOT', 2, true],
    ['Коррупционный страж', 'Скриншот боевой арены на фоне искажений.', 'SCREENSHOT', 1, true],
    ['Мирный рыбацкий дом', 'Небольшой уютный домик для рыбалки и хранения трофеев.', 'BUILD', 16, true],
    ['Подземная мастерская', 'Индустриальная база шахтёра и кузнеца.', 'BUILD', 15, true],
    ['Мост над лавой', 'Короткий скриншот арены с ярким освещением.', 'SCREENSHOT', 17, true],
    ['Ферма на облаках', 'Летающая ферма и хранилище редких ресурсов.', 'BUILD', 20, true],
    ['Морской маяк', 'Высокая постройка на берегу для навигации.', 'BUILD', 8, true],
    ['Арена Плантеры', 'Широкая арена для сражения в джунглях.', 'SCREENSHOT', 11, true],
    ['Данж-библиотека', 'Стеллажи, фонари и редкие книги.', 'BUILD', 10, true],
    ['Звёздная башня', 'Высотная башня на фоне ночного неба.', 'BUILD', 19, true],
    ['Туманная долина', 'Атмосферная зона с мягким светом и водой.', 'SCREENSHOT', 3, true],
    ['Пещерный вход', 'Простой, но аккуратный вход в сеть шахт.', 'BUILD', 23, true],
    ['Лесная терраса', 'Многоуровневый дом с деревьями и балконами.', 'BUILD', 9, true],
    ['Храм луны', 'Эндгейм-постройка для позднего прохождения.', 'SCREENSHOT', 0, true],
    ['Галерея трофеев', 'Стена с наградами, трофеями и лучшими предметами.', 'BUILD', 12, true],
    ['Оазис в пустыне', 'Песчаный дом с водой и пальмами.', 'BUILD', 21, true],
    ['Ночной дворец', 'Светящийся дворец с фиолетовой палитрой.', 'SCREENSHOT', 24, true],
    ['Заброшенный бастион', 'Полузаброшенный замок для позднего сюжета.', 'BUILD', 4, false],
    ['Кристальная башня', 'Тестовая запись на модерации с ярким освещением.', 'SCREENSHOT', 5, false],
    ['Дом-купол', 'Минималистичный купол с декоративными блоками.', 'BUILD', 6, false],
    ['Идиллия в джунглях', 'Небольшая база рядом с деревьями и фонтаном.', 'SCREENSHOT', 7, false],
    ['Арена в пустоте', 'Проверочная запись для модерации.', 'BUILD', 8, false],
  ];

  for (const [index, template] of galleryTemplates.entries()) {
    const [title, description, type, authorIndex, approved] = template;
    const seed = `gallery-${index + 1}`;
    await saveRecord(prisma, 'mediaGallery', { title }, {
      userId: authorAt(authorIndex).id,
      sourceType: 'LINK',
      url: pinterestImage(seed, index),
      fileName: null,
      thumbUrl: pinterestImage(`${seed}-thumb`, index + 1),
      title,
      description,
      type,
      votes: approved ? 25 + index * 2 : 2 + index,
      isApproved: Boolean(approved),
      createdAt: daysAgo(index * 6),
    });
  }

  const reportTemplates = [
    ['POST', posts[0].id, 1, users[1].id, 'Подозрительный контент в треде'],
    ['COMMENT', 1, 2, null, 'Оскорбительный комментарий'],
    ['USER', users[6].id, 0, users[6].id, 'Спам в личных сообщениях'],
    ['MEDIA', 1, 4, null, 'Нарушение правил галереи'],
    ['POST', posts[2].id, 5, posts[2].authorId, 'Нецелевой пост'],
    ['POST', posts[3].id, 6, posts[3].authorId, 'Флуд в теме'],
    ['COMMENT', 2, 7, null, 'Провокационный ответ'],
    ['MEDIA', 2, 8, null, 'Слишком низкое качество изображения'],
    ['USER', users[8].id, 9, users[8].id, 'Подозрение на накрутку'],
    ['POST', posts[4].id, 1, posts[4].authorId, 'Неверный тег категории'],
    ['POST', posts[5].id, 2, posts[5].authorId, 'Слишком короткий текст'],
    ['COMMENT', 3, 3, null, 'Не по теме'],
    ['MEDIA', 3, 4, null, 'Изображение без описания'],
    ['USER', users[10].id, 5, users[10].id, 'Жалоба на никнейм'],
    ['POST', posts[6].id, 6, posts[6].authorId, 'Повторный пост'],
    ['COMMENT', 4, 7, null, 'Токсичный тон'],
    ['MEDIA', 4, 8, null, 'Слишком тёмный снимок'],
    ['USER', users[11].id, 9, users[11].id, 'Подозрительное имя'],
    ['POST', posts[7].id, 1, posts[7].authorId, 'Неправильная категория'],
    ['COMMENT', 5, 2, null, 'Спорный совет'],
    ['MEDIA', 5, 3, null, 'Слишком яркая обработка'],
    ['POST', posts[8].id, 4, posts[8].authorId, 'Мало информации'],
    ['USER', users[12].id, 5, users[12].id, 'Спам в профиле'],
    ['COMMENT', 6, 6, null, 'Оскорбительное сообщение'],
    ['MEDIA', 6, 7, null, 'Нет подписи к работе'],
  ];

  for (const [index, template] of reportTemplates.entries()) {
    const [targetType, targetId, reporterIndex, targetUserId, reason] = template;
    await saveRecord(prisma, 'report', { reason }, {
      targetType,
      targetId,
      reporterId: authorAt(reporterIndex).id,
      targetUserId,
      reason,
      status: 'PENDING',
      resolvedBy: null,
      resolution: null,
      createdAt: daysAgo(index * 5),
      updatedAt: daysAgo(index * 5),
    });
  }

  const notificationTemplates = [
    [0, 'SYSTEM', 'Добро пожаловать!', 'Добро пожаловать на Budaxov. Здесь уже много свежего контента.', '/'],
    [1, 'ACHIEVEMENT', 'Новая ачивка!', 'Вы получили достижение "Первые шаги".', '/profile'],
    [2, 'COMMENT', 'Ответ на ваш пост', 'На ваш тред в форуме пришёл новый ответ.', `/forum/${posts[2].id}`],
    [3, 'LIKE', 'Пост получил лайк', 'Ваш тред стал чуть популярнее.', `/forum/${posts[0].id}`],
    [4, 'MODERATION', 'Галерея на проверке', 'Ваше изображение было отправлено на модерацию.', '/gallery'],
    [5, 'SYSTEM', 'Новый сезон рейтинга', 'На лидерборде стартовал новый сезон.', '/leaderboard'],
    [6, 'ACHIEVEMENT', 'Ачивка разблокирована', 'Вы получили новое достижение и XP.', '/profile'],
    [7, 'COMMENT', 'Вам ответили', 'На ваш комментарий пришёл развернутый ответ.', `/forum/${posts[4].id}`],
    [8, 'SYSTEM', 'Вики обновлена', 'Вики пополнилась свежими статьями и гайдами.', '/wiki'],
    [9, 'LIKE', 'Галерея ожила', 'Ваш скриншот получил новые голоса.', '/gallery'],
    [10, 'SYSTEM', 'Новая подборка строек', 'Мы добавили лучшие работы месяца.', '/gallery'],
    [11, 'COMMENT', 'Форумный ответ', 'В вашей теме появился полезный комментарий.', `/forum/${posts[6].id}`],
    [12, 'MODERATION', 'Предмет проверен', 'Новое изображение предмета прошло модерацию.', '/gallery'],
    [13, 'SYSTEM', 'Тематический ивент', 'Стартовал общий строительный ивент.', '/news'],
    [14, 'ACHIEVEMENT', 'XP начислен', 'Вы открыли ещё одно достижение.', '/profile'],
    [15, 'LIKE', 'Пост оценили', 'Сообщество оценило ваш материал.', `/forum/${posts[8].id}`],
    [16, 'SYSTEM', 'Обновление форума', 'Улучшили редактор и список категорий.', '/forum'],
    [17, 'COMMENT', 'Полезный совет', 'На ваш пост дали хороший совет.', `/forum/${posts[10].id}`],
    [18, 'SYSTEM', 'Новые гайды', 'Добавили 25 материалов в вики.', '/wiki'],
    [19, 'MODERATION', 'Работа принята', 'Ваш рисунок прошёл модерацию.', '/gallery'],
    [20, 'LIKE', 'Понравилась запись', 'Ваше изображение набрало больше голосов.', '/gallery'],
    [21, 'SYSTEM', 'Сводка недели', 'Собрали лучшие новости и активности недели.', '/news'],
    [22, 'ACHIEVEMENT', 'Награда получена', 'Новая награда уже в профиле.', '/profile'],
    [23, 'COMMENT', 'Продолжение обсуждения', 'На тему появился ещё один ответ.', `/forum/${posts[12].id}`],
    [24, 'SYSTEM', 'Лайв-контент', 'Сайт выглядит активным почти год.', '/'],
  ];

  for (const [index, template] of notificationTemplates.entries()) {
    const [userIndex, type, title, body, link] = template;
    await saveRecord(prisma, 'notification', { title, userId: authorAt(userIndex).id }, {
      userId: authorAt(userIndex).id,
      type,
      title,
      body,
      link,
      isRead: index % 4 === 0,
      createdAt: daysAgo(index * 4),
    });
  }

  const adminLogTemplates = [
    ['IMPORT_USERS', 'Импортировано 25 реалистичных пользователей и профилей.'],
    ['IMPORT_ITEMS', 'Заполнен каталог предметов, оружия и аксессуаров.'],
    ['IMPORT_WIKI', 'Добавлены статьи о биомах, боссах и механиках.'],
    ['IMPORT_NEWS', 'Опубликованы новости почти за год активности.'],
    ['IMPORT_POSTS', 'Созданы треды форума с обсуждениями и гайдами.'],
    ['IMPORT_ACHIEVEMENTS', 'Заполнены достижения и награды.'],
    ['IMPORT_GALLERY', 'Галерея наполнена красивыми постройками и скриншотами.'],
    ['IMPORT_REPORTS', 'Добавлены тестовые жалобы для модерации.'],
    ['IMPORT_NOTIFICATIONS', 'Система уведомлений наполнена живыми событиями.'],
    ['IMPORT_LEADERBOARD', 'Лидерборд заполнен рейтингом игроков.'],
    ['MONTHLY_SYNC_01', 'Синхронизация базы после январского обновления.'],
    ['MONTHLY_SYNC_02', 'Синхронизация базы после февральского обновления.'],
    ['MONTHLY_SYNC_03', 'Синхронизация базы после мартовского обновления.'],
    ['MONTHLY_SYNC_04', 'Синхронизация базы после апрельского обновления.'],
    ['MONTHLY_SYNC_05', 'Синхронизация базы после майского обновления.'],
    ['MONTHLY_SYNC_06', 'Синхронизация базы после июньского обновления.'],
    ['MONTHLY_SYNC_07', 'Синхронизация базы после июльского обновления.'],
    ['MONTHLY_SYNC_08', 'Синхронизация базы после августовского обновления.'],
    ['MONTHLY_SYNC_09', 'Синхронизация базы после сентябрьского обновления.'],
    ['MONTHLY_SYNC_10', 'Синхронизация базы после октябрьского обновления.'],
    ['MONTHLY_SYNC_11', 'Синхронизация базы после ноябрьского обновления.'],
    ['MONTHLY_SYNC_12', 'Синхронизация базы после декабрьского обновления.'],
    ['ADMIN_PANEL_REFRESH', 'Админ-панель получила полный CRUD по контенту.'],
    ['GALLERY_FILE_UPLOAD', 'Галерея научилась принимать файлы и ссылки отдельно.'],
    ['DATABASE_REBUILD', 'База данных полностью пересобрана под реалистичный контент.'],
  ];

  for (const [index, template] of adminLogTemplates.entries()) {
    const [action, details] = template;
    await saveRecord(prisma, 'adminLog', { action, details }, {
      adminId: users[0].id,
      action,
      details,
      ip: '127.0.0.1',
      createdAt: daysAgo(index * 5),
    });
  }

  await saveSettings(prisma, [
    { key: 'site_name', value: 'Budaxov' },
    { key: 'site_description', value: 'Русскоязычный портал Terraria с форумом, вики и галереей' },
    { key: 'online_count', value: '42' },
    { key: 'season_number', value: '3' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'registration_open', value: 'true' },
    { key: 'forum_enabled', value: 'true' },
    { key: 'gallery_enabled', value: 'true' },
    { key: 'news_enabled', value: 'true' },
    { key: 'seed_version', value: SEED_VERSION },
    { key: 'featured_biome', value: 'jungle' },
    { key: 'featured_boss', value: 'moon-lord' },
    { key: 'featured_theme', value: 'terraria-builds' },
    { key: 'seed_notes', value: 'Полная реалистичная тестовая база с контентом за почти год' },
  ]);

  logger.info('✅ Тестовые данные полностью пересобраны');
}

async function shouldReseed(prisma) {
  const setting = await prisma.siteSettings.findUnique({ where: { key: 'seed_version' } });
  return setting?.value !== SEED_VERSION;
}

async function runSeedIfEmpty(prisma) {
  const needReseed = await shouldReseed(prisma);
  if (!needReseed) {
    logger.info('📦 Seed уже актуален, пропускаем');
    return;
  }
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
