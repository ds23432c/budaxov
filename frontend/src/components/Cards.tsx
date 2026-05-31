'use client';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';

export function NewsCard({ news }: { news: any }) {
  return (
    <Link href={`/news/${news.id}`} className="block glass rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-400/30 transition-all duration-300 hover:-translate-y-1 group">
      {news.coverUrl && (
        <div className="h-40 overflow-hidden bg-white/5">
          <img src={news.coverUrl} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
      )}
      <div className="p-5">
        {news.isPinned && <span className="text-xs text-yellow-400 font-pixel mb-2 block">📌 ЗАКРЕПЛЕНО</span>}
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">{news.title}</h3>
        {news.excerpt && <p className="text-slate-400 text-sm line-clamp-2 mb-3">{news.excerpt}</p>}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{news.views} просмотров</span>
          <span>{news.publishedAt ? formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true, locale: ru }) : ''}</span>
        </div>
      </div>
    </Link>
  );
}

export function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-center border border-white/10 hover:border-yellow-400/20 transition-all duration-300">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-pixel text-xl text-gold mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}

export function ItemCard({ item }: { item: any }) {
  const rarityLabels: Record<string, string> = {
    GREY: 'Серый', WHITE: 'Белый', BLUE: 'Синий', GREEN: 'Зелёный',
    ORANGE: 'Оранжевый', RED: 'Красный', PURPLE: 'Фиолетовый',
    YELLOW: 'Жёлтый', CYAN: 'Голубой', RAINBOW: 'Радужный',
  };
  const typeLabels: Record<string, string> = {
    WEAPON: '⚔️ Оружие', ARMOR: '🛡️ Броня', TOOL: '⛏️ Инструмент',
    MATERIAL: '💎 Материал', CONSUMABLE: '🧪 Расходник', ACCESSORY: '💍 Аксессуар',
    BLOCK: '🟫 Блок', FURNITURE: '🪑 Мебель', BOSS_LOOT: '👑 Дроп босса',
  };

  return (
    <Link href={`/wiki/items/${item.slug}`} className="block glass rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain rounded" onError={(e) => { e.currentTarget.style.display='none'; }} />
        ) : (
          <div className="w-10 h-10 glass rounded-lg flex items-center justify-center text-xl">💎</div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm rarity-${item.rarity} line-clamp-1`}>{item.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">{typeLabels[item.type] || item.type}</p>
          <p className="text-slate-600 text-xs">{rarityLabels[item.rarity] || item.rarity}</p>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: any }) {
  const categoryLabels: Record<string, string> = {
    NEWS: '📰 Новость', GUIDE: '📖 Гайд', DISCUSSION: '💬 Обсуждение',
    FANART: '🎨 Фанарт', BUILD: '🏰 Постройка', HELP: '❓ Помощь',
  };

  return (
    <Link href={`/forum/${post.id}`} className="block glass rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 group">
      {post.isPinned && <span className="text-xs text-yellow-400 font-pixel mb-2 block">📌</span>}
      <div className="flex items-start gap-3">
        <img src={post.author?.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.author?.username}`} className="w-9 h-9 rounded-full border border-white/10" alt="" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-slate-500">{categoryLabels[post.category] || post.category}</span>
          <h3 className="font-medium text-white group-hover:text-yellow-400 transition-colors line-clamp-2 mt-0.5">{post.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>👤 {post.author?.username}</span>
            <span>💬 {post._count?.comments || 0}</span>
            <span>❤️ {post._count?.likes || 0}</span>
            <span>👁️ {post.views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-xl p-5 border border-white/10">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton rounded h-4 mb-3 ${i === 0 ? 'w-3/4' : i === 1 ? 'w-full' : 'w-1/2'}`} />
      ))}
    </div>
  );
}

export default function StatCardDefault(props: any) { return <StatCard {...props} />; }
