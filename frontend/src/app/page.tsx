'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { newsAPI, leaderboardAPI } from '@/lib/api';
import NewsCard from '@/components/NewsCard';
import StatCard from '@/components/StatCard';

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const mountainY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const treeY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ['0%', '80%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [news, setNews] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    newsAPI.getAll({ limit: 3 }).then(r => setNews(r.data.news || [])).catch(() => {});
    leaderboardAPI.get({ limit: 5 }).then(r => setLeaderboard(r.data || [])).catch(() => {});
    setOnlineCount(Math.floor(Math.random() * 50) + 20);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
  };

  return (
    <div className="relative">
      {/* HERO SECTION - Parallax */}
      <section ref={heroRef} className="relative h-screen overflow-hidden flex items-center justify-center">
        {/* Sky layer */}
        <motion.div style={{ y: skyY }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e2a] via-[#0c1b4a] to-[#060d1a]" />
          {/* Stars */}
          <div className="stars-bg absolute inset-0 opacity-60" />
          {/* Moon */}
          <div className="absolute top-16 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-[0_0_60px_20px_rgba(255,215,0,0.3)] opacity-70" />
        </motion.div>

        {/* Mountain layer */}
        <motion.div style={{ y: mountainY }} className="absolute bottom-0 inset-x-0 z-1 pointer-events-none">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 320L240 120L480 200L720 80L960 180L1200 100L1440 160L1440 320Z" fill="rgba(10,20,50,0.9)" />
            <path d="M0 320L120 200L360 240L600 140L840 220L1080 120L1320 200L1440 160L1440 320Z" fill="rgba(8,16,40,0.95)" />
          </svg>
        </motion.div>

        {/* Tree/ground layer */}
        <motion.div style={{ y: treeY }} className="absolute bottom-0 inset-x-0 z-2 pointer-events-none">
          <div className="h-32 bg-gradient-to-t from-[#060d1a] to-transparent" />
          {/* Pixel trees SVG */}
          <svg viewBox="0 0 1440 200" className="w-full absolute bottom-0" fill="none">
            {[80, 200, 380, 520, 700, 850, 1000, 1150, 1300].map((x, i) => (
              <g key={i} transform={`translate(${x}, 40) scale(${0.8 + (i % 3) * 0.2})`}>
                <rect x="22" y="60" width="16" height="40" fill="#2d1b00" />
                <polygon points="30,0 0,70 60,70" fill="#1a4a1a" />
                <polygon points="30,15 5,70 55,70" fill="#1e5a1e" />
                <polygon points="30,25 8,70 52,70" fill="#226622" />
              </g>
            ))}
          </svg>
        </motion.div>

        {/* Hero content */}
        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 text-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'backOut' }}>
            <h1 className="font-pixel text-4xl md:text-6xl lg:text-7xl text-gold mb-4 drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">
              BUDAXOV
            </h1>
            <p className="font-pixel text-xs md:text-sm text-emerald-400 mb-8 tracking-widest">
              TERRARIA ПОРТАЛ
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Лучший русскоязычный портал по Terraria. Вики, форум, гайды, лидерборд и живое сообщество игроков.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/wiki" className="btn-primary inline-flex items-center gap-2">
              ⚔️ Открыть Вики
            </Link>
            <Link href="/forum" className="btn-secondary inline-flex items-center gap-2">
              💬 Форум
            </Link>
          </motion.div>

          {/* Online counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>{onlineCount} игроков онлайн</span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-50"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: '👥', value: '1,247', label: 'Игроков' },
              { icon: '📖', value: '340+', label: 'Вики статей' },
              { icon: '💬', value: '8,900+', label: 'Сообщений' },
              { icon: '🏆', value: 'Сезон 1', label: 'Активен' },
            ].map((stat, i) => (
              <motion.div key={i} custom={i} variants={fadeInUp}>
                <StatCard {...stat} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION - Apple scroll */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-pixel text-2xl md:text-3xl text-center text-gold mb-16"
          >
            ВСЁ ДЛЯ ИГРОКА
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚔️', title: 'Полная Вики', desc: 'База знаний по всем предметам, биомам, боссам и механикам игры', href: '/wiki', color: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/20' },
              { icon: '🏆', title: 'Лидерборд', desc: 'Соревнуйся с другими игроками. Рейтинг обновляется в реальном времени', href: '/leaderboard', color: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/20' },
              { icon: '💬', title: 'Форум', desc: 'Обсуждай стратегии, делись билдами, задавай вопросы сообществу', href: '/forum', color: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20' },
              { icon: '📰', title: 'Новости', desc: 'Обновления игры, патчноуты и события сообщества', href: '/news', color: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20' },
              { icon: '🎨', title: 'Галерея', desc: 'Лучшие билды и скриншоты от игроков нашего сообщества', href: '/gallery', color: 'from-pink-500/10 to-red-500/10', border: 'border-pink-500/20' },
              { icon: '🏅', title: 'Достижения', desc: 'Зарабатывай ачивки, прокачивай профиль и показывай мастерство', href: '/profile', color: 'from-amber-500/10 to-yellow-500/10', border: 'border-amber-500/20' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link href={f.href} className={`block p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} glass hover:scale-105 transition-all duration-300 group`}>
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                  <h3 className="font-pixel text-sm text-white mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS SECTION */}
      {news.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex items-center justify-between mb-10"
            >
              <h2 className="font-pixel text-xl text-gold">ПОСЛЕДНИЕ НОВОСТИ</h2>
              <Link href="/news" className="text-slate-400 hover:text-white text-sm transition-colors">Все новости →</Link>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {news.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <NewsCard news={n} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LEADERBOARD PREVIEW */}
      {leaderboard.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex items-center justify-between mb-10"
            >
              <h2 className="font-pixel text-xl text-gold">ТОП ИГРОКОВ</h2>
              <Link href="/leaderboard" className="text-slate-400 hover:text-white text-sm transition-colors">Полный рейтинг →</Link>
            </motion.div>
            <div className="glass rounded-2xl overflow-hidden border border-white/10">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <span className={`font-pixel text-lg w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <img src={entry.user?.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'} className="w-10 h-10 rounded-full border-2 border-white/10" alt="" />
                  <span className="flex-1 font-medium">{entry.user?.username}</span>
                  <span className="font-pixel text-xs text-gold">{entry.score?.toLocaleString()} XP</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="glass rounded-3xl p-12 border border-yellow-400/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <h2 className="font-pixel text-xl md:text-2xl text-gold mb-4">ПРИСОЕДИНЯЙСЯ!</h2>
              <p className="text-slate-300 mb-8 text-lg">Зарегистрируйся бесплатно и стань частью лучшего русскоязычного сообщества Terraria</p>
              <Link href="/auth/register" className="btn-primary text-lg px-10 py-4 inline-block">
                🎮 Начать играть
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-pixel text-gold text-lg">BUDAXOV</div>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link href="/wiki" className="hover:text-white transition-colors">Вики</Link>
              <Link href="/forum" className="hover:text-white transition-colors">Форум</Link>
              <Link href="/news" className="hover:text-white transition-colors">Новости</Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">Рейтинг</Link>
            </div>
            <p className="text-slate-500 text-sm">© 2026 Budaxov. Фан-сайт.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
