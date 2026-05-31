'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { newsAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsAPI.getOne(+id!).then(r => setNews(r.data)).catch(() => router.push('/news')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-slate-400">⏳ Загрузка...</div>;
  if (!news) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/news')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2">← Все новости</button>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/10 overflow-hidden">
          {news.coverUrl && (
            <div className="h-56 overflow-hidden bg-white/5">
              <img src={news.coverUrl} alt={news.title} className="w-full h-full object-cover opacity-60" onError={e => e.currentTarget.style.display='none'} />
            </div>
          )}
          <div className="p-8">
            {news.isPinned && <span className="text-xs text-yellow-400 font-pixel mb-3 block">📌 ЗАКРЕПЛЕНО</span>}
            <h1 className="text-2xl font-bold mb-4">{news.title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 pb-6 border-b border-white/10">
              {news.publishedAt && <span>📅 {formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true, locale: ru })}</span>}
              <span>👁️ {news.views} просмотров</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
              <ReactMarkdown>{news.content}</ReactMarkdown>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
