'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { postsAPI } from '@/lib/api';
import { PostCard, SkeletonCard } from '@/components/Cards';
import { useAuthStore } from '@/lib/store';

const CATEGORIES = [
  { value: '', label: '📋 Все' },
  { value: 'NEWS', label: '📰 Новости' },
  { value: 'GUIDE', label: '📖 Гайды' },
  { value: 'DISCUSSION', label: '💬 Обсуждения' },
  { value: 'BUILD', label: '🏰 Постройки' },
  { value: 'FANART', label: '🎨 Фанарт' },
  { value: 'HELP', label: '❓ Помощь' },
];

export default function ForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    setLoading(true);
    postsAPI.getAll({ category, page, sort, limit: 15 })
      .then(r => { setPosts(r.data.posts || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, page, sort]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-pixel text-3xl text-gold mb-1">ФОРУМ</h1>
            <p className="text-slate-400 text-sm">Тем: {total}</p>
          </div>
          {user && (
            <Link href="/forum/new" className="btn-primary text-sm py-2">✏️ Новый пост</Link>
          )}
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => { setCategory(c.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${category === c.value ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'glass border border-white/10 text-slate-300 hover:text-white'}`}
            >
              {c.label}
            </button>
          ))}
          <div className="ml-auto">
            <select className="input-terra py-2 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Новые</option>
              <option value="popular">Популярные</option>
            </select>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={3} />)
            : posts.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="text-5xl mb-4">💬</div>
                <p>Постов пока нет. Будь первым!</p>
              </div>
            ) : posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <PostCard post={post} />
              </motion.div>
            ))
          }
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">← Назад</button>
            <span className="glass px-4 py-2 rounded-xl border border-white/10 text-sm">{page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={posts.length < 15} className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Вперёд →</button>
          </div>
        )}
      </div>
    </div>
  );
}
