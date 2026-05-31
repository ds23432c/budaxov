const bcrypt = require('bcryptjs');
const logger = require('./logger');

async function runSeedIfEmpty(prisma) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    logger.info('📦 База данных уже заполнена, пропускаем seed');
    return;
  }
  logger.info('🌱 Запускаем начальное заполнение базы данных...');
  await seedAll(prisma);
  logger.info('✅ База данных успешно заполнена!');
}

async function seedAll(prisma) {
  // 1. Users
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'Администратор',
      email: 'admin@budaxov.ru',
      passwordHash,
      role: 'SUPERADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin&backgroundColor=b6e3f4',
      profile: {
        create: {
          bio: 'Главный администратор проекта Budaxov. Играю в Terraria с 2011 года.',
          playtimeHours: 2847,
          country: 'Россия',
          totalScore: 99999,
          level: 50,
        }
      }
    }
  });

  const mod = await prisma.user.create({
    data: {
      username: 'МодерДракон',
      email: 'moderator@budaxov.ru',
      passwordHash,
      role: 'MODERATOR',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dragon&backgroundColor=c0aede',
      profile: { create: { bio: 'Модератор сообщества. Слежу за порядком.', playtimeHours: 1200, country: 'Россия', totalScore: 45000, level: 35 } }
    }
  });

  const users = await Promise.all([
    prisma.user.create({ data: { username: 'Копатель2000', email: 'kopatel@mail.ru', passwordHash: userPasswordHash, avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=kopatel', profile: { create: { bio: 'Люблю строить замки и фармить боссов!', playtimeHours: 450, country: 'Москва', totalScore: 12500, level: 18 } } } }),
    prisma.user.create({ data: { username: 'ТерраМастер', email: 'terramaster@yandex.ru', passwordHash: userPasswordHash, avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=terramaster', profile: { create: { bio: 'Прошёл игру в режиме Эксперт. Знаю все секреты.', playtimeHours: 890, country: 'Санкт-Петербург', totalScore: 28000, level: 28 } } } }),
    prisma.user.create({ data: { username: 'НочнойСтроитель', email: 'builder@rambler.ru', passwordHash: userPasswordHash, avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=builder', profile: { create: { bio: 'Специализируюсь на мегабилдах. Мой дворец занял 3 часа!', playtimeHours: 1500, country: 'Екатеринбург', totalScore: 35000, level: 32 } } } }),
    prisma.user.create({ data: { username: 'ФанатБоссов', email: 'bossfan@gmail.com', passwordHash: userPasswordHash, avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=bossfan', profile: { create: { bio: 'Убил каждого босса 100+ раз. Это не шутка.', playtimeHours: 2200, country: 'Новосибирск', totalScore: 58000, level: 42 } } } }),
    prisma.user.create({ data: { username: 'РудникоВед', email: 'miner@inbox.ru', passwordHash: userPasswordHash, avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=miner', profile: { create: { bio: 'Добываю ресурсы и торгую. Богатейший игрок сервера!', playtimeHours: 700, country: 'Казань', totalScore: 19000, level: 22 } } } }),
  ]);

  // 2. Items (wiki content)
  const items = await Promise.all([
    prisma.item.create({ data: { name: 'Терра-клинок', slug: 'terra-blade', type: 'WEAPON', rarity: 'YELLOW', description: 'Легендарный меч, выкованный из Истинного Кинжала Ночи и Истинного Экскалибура. Выпускает мощный луч при ударе.', damage: 115, craftable: true, craftRecipe: 'Истинный Кинжал Ночи + Истинный Экскалибур', biome: 'Подземелье', imageUrl: 'https://terraria.wiki.gg/images/thumb/3/3d/Terra_Blade.png/32px-Terra_Blade.png' } }),
    prisma.item.create({ data: { name: 'Звёздный гнев', slug: 'star-fury', type: 'WEAPON', rarity: 'BLUE', description: 'Волшебный меч, призывающий звёзды с небес при каждом ударе. Отлично подходит для начинающих магов.', damage: 28, craftable: false, biome: 'Летающий остров', imageUrl: 'https://terraria.wiki.gg/images/thumb/8/8e/Starfury.png/32px-Starfury.png' } }),
    prisma.item.create({ data: { name: 'Громовой жезл', slug: 'thunder-staff', type: 'WEAPON', rarity: 'ORANGE', description: 'Мощный магический посох, мечущий молнии во врагов. Требует 10 единиц маны.', damage: 72, craftable: true, craftRecipe: '15 Мифрила + Стержень грозы' } }),
    prisma.item.create({ data: { name: 'Кирка Молнии', slug: 'lightning-pickaxe', type: 'TOOL', rarity: 'GREEN', description: 'Быстрая кирка из молниевого сплава. Отлично добывает руду в аду.', damage: 0, craftable: true, craftRecipe: '18 Молниевой руды + 4 Алмаза' } }),
    prisma.item.create({ data: { name: 'Адский камень', slug: 'hellstone-bar', type: 'MATERIAL', rarity: 'ORANGE', description: 'Слиток из адского камня. Нужен обсидиановый череп для добычи без урона.', craftable: false, biome: 'Преисподняя' } }),
    prisma.item.create({ data: { name: 'Кольцо акробата', slug: 'acrobat-ring', type: 'ACCESSORY', rarity: 'BLUE', description: 'Позволяет совершать двойной прыжок. Отличный предмет в начале игры.', craftable: false, biome: 'Подземелье' } }),
    prisma.item.create({ data: { name: 'Зелье быстрого бега', slug: 'swiftness-potion', type: 'CONSUMABLE', rarity: 'BLUE', description: 'Увеличивает скорость передвижения на 25% на 8 минут.', craftable: true, craftRecipe: '1 Желудь + 1 Дневной цветок' } }),
    prisma.item.create({ data: { name: 'Обсидиановый щит', slug: 'obsidian-shield', type: 'ARMOR', rarity: 'ORANGE', description: 'Даёт иммунитет к нокбэку и защиту от огня. Крафтится из Кобальтового щита.', defense: 8, craftable: true, craftRecipe: 'Кобальтовый щит + Обсидиановый череп' } }),
    prisma.item.create({ data: { name: 'Крылья ангела', slug: 'angel-wings', type: 'ACCESSORY', rarity: 'YELLOW', description: 'Позволяют летать. Одни из первых крыльев, доступных в хардмоде.', craftable: true, craftRecipe: '10 Перьев + 25 Душ Света + 1 Душа Полёта' } }),
    prisma.item.create({ data: { name: 'Солнечное копьё', slug: 'solar-spear', type: 'WEAPON', rarity: 'RED', description: 'Оружие из солнечных фрагментов. Один из лучших образцов снаряжения в конце игры.', damage: 180, craftable: true, craftRecipe: '18 Солнечных фрагментов' } }),
  ]);

  // 3. Wiki pages
  await Promise.all([
    prisma.wikiPage.create({ data: { title: 'Лесной биом', slug: 'forest-biome', content: `# Лесной биом\n\nЛесной биом — стартовая локация в Terraria. Здесь игрок начинает своё путешествие.\n\n## Особенности\n\n- Мирные существа (кролики, птицы, золотые рыбки)\n- Деревья для получения дерева\n- Базовые ресурсы: камень, земля, древесина\n\n## Враги ночью\n\nС наступлением ночи в лесу появляются:\n- **Зомби** — медленные, но опасные в начале игры\n- **Летучие мыши-демоны** — летают, труднее убить\n- **Слизни** — могут воровать монеты!\n\n## Советы для новичков\n\n1. Сразу стройте дом для НПС-торговца\n2. Собирайте грибы для зелий\n3. Не забывай про ямы — можно упасть и умереть`, category: 'BIOME', authorId: admin.id, isPublished: true, views: 1247, excerpt: 'Стартовая локация. Мирные существа, базовые ресурсы.' } }),
    prisma.wikiPage.create({ data: { title: 'Глаз Ктулху', slug: 'eye-of-cthulhu', content: `# Глаз Ктулху\n\nПервый настоящий босс в Terraria. Появляется автоматически ночью, когда у вас 200+ HP и 10+ брони.\n\n## Фазы боя\n\n### Фаза 1: Атаки рывками\nГлаз летает и делает рывки на игрока. Спавнит маленьких слуг.\n\n### Фаза 2: Трансформация\nКогда HP < 50%, глаз трансформируется! Раскрывается огромный рот.\n\n## Стратегия\n\n- Используй арену с платформами\n- Запасись зельями восстановления\n- Огненные стрелы наносят отличный урон\n\n## Дроп\n\n- Подозрительный глаз (для призыва)\n- Когти демона\n- 3-11 Слез щита`, category: 'BOSS', authorId: admin.id, isPublished: true, views: 3891, excerpt: 'Первый босс Terraria. Атакует рывками, трансформируется при низком HP.' } }),
    prisma.wikiPage.create({ data: { title: 'Хардмод: что изменится', slug: 'hardmode-guide', content: `# Хардмод: Полное руководство\n\nХардмод активируется после убийства Стены Плоти. Это меняет всё!\n\n## Что появляется в хардмоде\n\n1. **Новые биомы**: Священные земли, Малиновый мир\n2. **Механические боссы**: Разрушитель, Двойники, Скелетрон Прайм\n3. **Новые руды**: Кобальт, Мифрил, Адамантит\n4. **Пиратское нашествие** — появляется при открытии моря\n\n## Первые шаги в хардмоде\n\n- НЕМЕДЛЕННО добудь Кобальтовую броню\n- Не ходи в Малиновый мир без подготовки\n- Сделай арену для механических боссов`, category: 'GUIDE', authorId: mod.id, isPublished: true, views: 5623, excerpt: 'Всё о переходе в хардмод. Что делать в первую очередь.' } }),
    prisma.wikiPage.create({ data: { title: 'Преисподняя (Ад)', slug: 'underworld-biome', content: `# Преисподняя\n\nПреисподняя — самый нижний биом в Terraria. Огонь, демоны, и Стена Плоти.\n\n## Ресурсы\n\n- **Адский камень** — нужен обсидиановый череп\n- **Адские руны** — для строительства\n- **Тень тени** — от теневых орб\n\n## Важные НПС\n\n- **Шаман воглема** — единственный в преисподней\n\n## Стена Плоти\n\nГлавный босс преисподней. Убийство активирует хардмод!`, category: 'BIOME', authorId: admin.id, isPublished: true, views: 2341, excerpt: 'Нижний биом. Адский камень, демоны, Стена Плоти.' } }),
  ]);

  // 4. News
  await Promise.all([
    prisma.news.create({ data: { title: 'Добро пожаловать на Budaxov — лучший Terraria-портал!', content: `Мы рады приветствовать вас на нашем новом портале, посвящённом замечательной игре Terraria!\n\nЗдесь вы найдёте:\n- 📖 Подробную вики по всем предметам и биомам\n- 🏆 Таблицу лидеров\n- 💬 Живое сообщество игроков\n- 🎨 Галерею лучших билдов и скриншотов\n\nРегистрируйтесь и присоединяйтесь к нашему сообществу!`, excerpt: 'Открытие нового портала для русскоязычных игроков Terraria!', coverUrl: 'https://i.imgur.com/terraria_cover.jpg', authorId: admin.id, isPublished: true, isPinned: true, publishedAt: new Date(), views: 1547 } }),
    prisma.news.create({ data: { title: 'Гайд по первым часам в Terraria для новичков', content: `Terraria — это игра с огромным количеством контента. Вот с чего начать:\n\n**1. Первые 10 минут**\nНикуда не уходи далеко от спавна. Срубай деревья, копай камень.\n\n**2. Первый дом**\nДом обязателен — без него не появятся НПС.\n\n**3. Первая ночь**\nЖди рассвета. Ночью пока опасно.\n\n**4. Торговец**\nКак только у тебя будет 50 монет, появится торговец.`, excerpt: 'С чего начать в Terraria? Полный гайд для начинающих.', coverUrl: 'https://i.imgur.com/guide_cover.jpg', authorId: mod.id, isPublished: true, publishedAt: new Date(Date.now() - 86400000 * 2), views: 892 } }),
    prisma.news.create({ data: { title: 'Топ-10 лучших строек нашего сообщества', content: `Наши игроки создают удивительные постройки! Представляем топ-10 за этот месяц.\n\n**1. Замок НочногоСтроителя**\nМегазамок с 7 башнями, занял 40 часов строительства.\n\n**2. Пиксельный арт ТерраМастера**\nПортрет Глаза Ктулху из блоков, виден только издалека.\n\n*Хочешь попасть в следующий топ? Загружай скриншоты в галерею!*`, excerpt: 'Лучшие постройки игроков Budaxov за месяц!', coverUrl: 'https://i.imgur.com/builds_cover.jpg', authorId: admin.id, isPublished: true, publishedAt: new Date(Date.now() - 86400000 * 5), views: 1203 } }),
  ]);

  // 5. Posts
  const post1 = await prisma.post.create({ data: { title: 'Как победить Лунного лорда в соло режиме?', body: `Привет всем! Застрял на Лунном лорде уже 3 дня. Какие советы?\n\nМой текущий билд:\n- Солнечная броня\n- Копьё хлора\n- Зелья атаки, скорости, защиты\n\nНо всё равно умираю на третьей фазе. Помогите!`, excerpt: 'Советы по бою с Лунным лордом в одиночку.', category: 'HELP', authorId: users[0].id, isPublished: true, views: 234 } });

  const post2 = await prisma.post.create({ data: { title: 'Мой замок — 40 часов работы [МНОГО СКРИНШОТОВ]', body: `Всем привет! Наконец-то завершил свой главный проект — средневековый замок!\n\nФакты:\n- 40+ часов строительства\n- Более 50,000 блоков\n- 12 комнат НПС\n- Собственное подземелье\n\nСпасибо всем кто поддерживал меня в чате!`, excerpt: 'Огромный замок — результат 40 часов работы.', category: 'BUILD', authorId: users[2].id, isPublished: true, views: 891, isPinned: true } });

  await prisma.post.create({ data: { title: '[Гайд] Идеальная магическая сборка для хардмода', body: `**Лучший билд мага в хардмоде**\n\nЭтот гайд расскажет как стать непобедимым магом.\n\n## Броня\n- До механических боссов: Мифриловая/Орихалк\n- После: Призрачная броня\n- Конец игры: Небулярная броня\n\n## Оружие по этапам\n1. Магическая ракетница\n2. Ядовитый жезл\n3. Стафф Левиафана\n\n## Аксессуары\n- Эмблема мага\n- Небесные крылья\n- Манафлауэр`, excerpt: 'Полная сборка мага от хардмода до конца игры.', category: 'GUIDE', authorId: users[1].id, isPublished: true, views: 1456 } });

  // Comments
  await prisma.comment.create({ data: { postId: post1.id, authorId: users[1].id, body: 'Попробуй использовать Звёздную хмару! Она лечит тебя при нанесении урона. И обязательно зелье жизни кражи.' } });
  await prisma.comment.create({ data: { postId: post1.id, authorId: users[3].id, body: 'Лунный лорд — это проверка на реакцию. Главное уворачиваться от лазера глаз. Зелье маны жизненно необходимо!' } });
  await prisma.comment.create({ data: { postId: post2.id, authorId: admin.id, body: 'Невероятная работа! Добавляем в галерею лучших строек месяца!' } });
  await prisma.comment.create({ data: { postId: post2.id, authorId: users[4].id, body: 'Сколько тебе потребовалось ресурсов? Я тоже хочу построить замок, но боюсь что не хватит материалов.' } });

  // Post likes
  await prisma.postLike.createMany({ data: [
    { postId: post1.id, userId: users[1].id },
    { postId: post1.id, userId: users[2].id },
    { postId: post2.id, userId: admin.id },
    { postId: post2.id, userId: users[0].id },
    { postId: post2.id, userId: users[3].id },
    { postId: post2.id, userId: mod.id },
  ]});

  // 6. Achievements
  const achievements = await Promise.all([
    prisma.achievement.create({ data: { name: 'Первые шаги', description: 'Создай свой первый предмет', iconUrl: '🪓', xpReward: 50, rarity: 'COMMON' } }),
    prisma.achievement.create({ data: { name: 'Убийца боссов', description: 'Победи 10 боссов', iconUrl: '⚔️', xpReward: 500, rarity: 'RARE' } }),
    prisma.achievement.create({ data: { name: 'Строитель-мастер', description: 'Построй дом для всех НПС', iconUrl: '🏰', xpReward: 300, rarity: 'RARE' } }),
    prisma.achievement.create({ data: { name: 'Легенда Terraria', description: 'Пройди игру на сложности Мастер', iconUrl: '👑', xpReward: 2000, rarity: 'LEGENDARY' } }),
    prisma.achievement.create({ data: { name: 'Исследователь', description: 'Открой все биомы', iconUrl: '🗺️', xpReward: 400, rarity: 'EPIC' } }),
    prisma.achievement.create({ data: { name: 'Добытчик', description: 'Выкопай 10,000 блоков', iconUrl: '⛏️', xpReward: 100, rarity: 'COMMON' } }),
  ]);

  // Grant some achievements to users
  await prisma.userAchievement.createMany({ data: [
    { userId: users[0].id, achievementId: achievements[0].id },
    { userId: users[1].id, achievementId: achievements[0].id },
    { userId: users[1].id, achievementId: achievements[1].id },
    { userId: users[2].id, achievementId: achievements[2].id },
    { userId: users[3].id, achievementId: achievements[1].id },
    { userId: users[3].id, achievementId: achievements[3].id },
  ]});

  // 7. Leaderboard
  await prisma.leaderboard.createMany({ data: [
    { userId: users[3].id, score: 58000, season: 1, kills: 12500, deaths: 89, playtime: 2200 },
    { userId: users[2].id, score: 35000, season: 1, kills: 7800, deaths: 145, playtime: 1500 },
    { userId: mod.id,      score: 45000, season: 1, kills: 9200, deaths: 67, playtime: 1200 },
    { userId: users[1].id, score: 28000, season: 1, kills: 5500, deaths: 210, playtime: 890 },
    { userId: users[4].id, score: 19000, season: 1, kills: 3200, deaths: 180, playtime: 700 },
    { userId: users[0].id, score: 12500, season: 1, kills: 2100, deaths: 320, playtime: 450 },
    { userId: admin.id,    score: 99999, season: 1, kills: 50000, deaths: 0, playtime: 2847 },
  ]});

  // 8. Site settings
  await prisma.siteSettings.createMany({ data: [
    { key: 'site_name', value: 'Budaxov' },
    { key: 'site_description', value: 'Лучший русскоязычный портал по Terraria' },
    { key: 'online_count', value: '42' },
    { key: 'season_number', value: '1' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'registration_open', value: 'true' },
  ]});

  // 9. Notifications for users
  await prisma.notification.createMany({ data: [
    { userId: users[0].id, type: 'SYSTEM', title: 'Добро пожаловать!', body: 'Добро пожаловать на Budaxov! Исследуй вики, участвуй в форуме.', link: '/' },
    { userId: users[0].id, type: 'ACHIEVEMENT', title: 'Новая ачивка!', body: 'Вы получили ачивку "Первые шаги"!', link: '/profile' },
    { userId: users[1].id, type: 'COMMENT', title: 'Ответ на ваш пост', body: 'ФанатБоссов ответил на ваш пост о магическом билде', link: '/posts/3' },
  ]});
}

module.exports = { runSeedIfEmpty };
