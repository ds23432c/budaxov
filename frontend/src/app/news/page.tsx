'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { newsAPI } from '@/lib/api';
import { NewsCard, SkeletonCard } from '@/components/Cards';

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    newsAPI.getAll({ page, limit: 9 })
      .then(r => { setNews(r.data.news || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-pixel text-3xl text-gold mb-2">📰 НОВОСТИ</h1>
          <p className="text-slate-400">Обновления игры и события сообщества. Всего: {total}</p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {news.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <NewsCard news={n} />
              </motion.div>
            ))}
          </div>
        )}

        {total > 9 && (
          <div className="flex justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-30">← Назад</button>
            <span className="glass px-4 py-2 rounded-xl border border-white/10 text-sm">{page} / {Math.ceil(total / 9)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={news.length < 9} className="btn-secondary py-2 px-4 text-sm disabled:opacity-30">Вперёд →</button>
          </div>
        )}
      </div>
    </div>
  );
}
