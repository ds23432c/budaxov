'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const CATEGORIES = [
  { value: 'DISCUSSION', label: '💬 Обсуждение' },
  { value: 'GUIDE', label: '📖 Гайд' },
  { value: 'BUILD', label: '🏰 Постройка' },
  { value: 'HELP', label: '❓ Помощь' },
  { value: 'FANART', label: '🎨 Фанарт' },
];

export default function NewPostPage() {
  const [form, setForm] = useState({ title: '', body: '', category: 'DISCUSSION', excerpt: '' });
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);
  const router = useRouter();

  if (!user) { router.push('/auth/login'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Заполните заголовок и текст'); return; }
    setLoading(true);
    try {
      const { data } = await postsAPI.create(form);
      toast.success('Пост опубликован!');
      router.push(`/forum/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка публикации');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">← Назад</button>
          <h1 className="font-pixel text-2xl text-gold mb-8">НОВЫЙ ПОСТ</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass rounded-2xl border border-white/10 p-6 space-y-5">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, category: c.value }))}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${form.category === c.value ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'glass border border-white/10 text-slate-300 hover:text-white'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Заголовок *</label>
                <input type="text" className="input-terra" placeholder="Интересный заголовок поста..." maxLength={300}
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Краткое описание</label>
                <input type="text" className="input-terra" placeholder="Кратко о чём пост (необязательно)..." maxLength={500}
                  value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Текст * (поддерживается Markdown)</label>
                <textarea className="input-terra w-full min-h-[300px] resize-y font-mono text-sm" placeholder={`**Жирный текст**\n*Курсив*\n# Заголовок\n- Список\n\nПиши свободно!`}
                  value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading ? '⏳ Публикуем...' : '🚀 Опубликовать'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
