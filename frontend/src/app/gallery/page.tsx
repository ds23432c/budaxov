'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { galleryAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type UploadSource = 'url' | 'file';

type UploadState = {
  source: UploadSource;
  url: string;
  file: File | null;
  title: string;
  description: string;
  type: 'SCREENSHOT' | 'FANART' | 'BUILD';
};

const TYPES = [
  { value: '', label: '🖼️ Все' },
  { value: 'SCREENSHOT', label: '📷 Скриншоты' },
  { value: 'FANART', label: '🎨 Фанарт' },
  { value: 'BUILD', label: '🏰 Постройки' },
];

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [upload, setUpload] = useState<UploadState>({
    source: 'url',
    url: '',
    file: null,
    title: '',
    description: '',
    type: 'SCREENSHOT',
  });
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLoading(true);
    galleryAPI
      .getAll({ type, limit: 24 })
      .then((r) => setItems(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  const resetUpload = () => {
    setUpload({
      source: 'url',
      url: '',
      file: null,
      title: '',
      description: '',
      type: 'SCREENSHOT',
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasUrl = Boolean(upload.url.trim());
    const hasFile = Boolean(upload.file);

    if (hasUrl === hasFile) {
      toast.error('Нужно выбрать только один источник: ссылка или файл');
      return;
    }

    try {
      if (upload.source === 'file' && upload.file) {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('title', upload.title);
        formData.append('description', upload.description);
        formData.append('type', upload.type);
        await galleryAPI.upload(formData);
      } else {
        await galleryAPI.upload({
          url: upload.url,
          title: upload.title,
          description: upload.description,
          type: upload.type,
        });
      }

      toast.success('Загружено! Ожидает проверки модератора.');
      setShowUpload(false);
      resetUpload();
    } catch {
      toast.error('Ошибка загрузки');
    }
  };

  const handleVote = async (id: number) => {
    if (!user) {
      toast.error('Войдите чтобы голосовать');
      return;
    }
    await galleryAPI.vote(id);
    setItems((current) => current.map((i) => (i.id === id ? { ...i, votes: i.votes + 1 } : i)));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-pixel text-3xl text-gold mb-1">🎨 ГАЛЕРЕЯ</h1>
            <p className="text-slate-400 text-sm">Лучшие работы сообщества</p>
          </div>
          {user && (
            <button onClick={() => setShowUpload(true)} className="btn-primary text-sm py-2">
              + Загрузить
            </button>
          )}
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                type === t.value
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'glass border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg glass rounded-2xl border border-white/10 p-6"
            >
              <h2 className="font-pixel text-sm text-gold mb-5">ЗАГРУЗИТЬ РАБОТУ</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpload((u) => ({ ...u, source: 'url', file: null }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      upload.source === 'url'
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                        : 'glass border border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    🔗 Ссылка
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpload((u) => ({ ...u, source: 'file', url: '' }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      upload.source === 'file'
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                        : 'glass border border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    📁 Файл
                  </button>
                </div>

                {upload.source === 'file' ? (
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Файл изображения *</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-terra py-2"
                      onChange={(e) =>
                        setUpload((u) => ({
                          ...u,
                          file: e.target.files?.[0] || null,
                          url: '',
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">URL изображения *</label>
                    <input
                      type="url"
                      className="input-terra"
                      placeholder="https://i.imgur.com/example.jpg"
                      value={upload.url}
                      onChange={(e) =>
                        setUpload((u) => ({
                          ...u,
                          url: e.target.value,
                          file: null,
                        }))
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Название</label>
                  <input
                    type="text"
                    className="input-terra"
                    placeholder="Название работы"
                    value={upload.title}
                    onChange={(e) => setUpload((u) => ({ ...u, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Описание</label>
                  <textarea
                    className="input-terra w-full h-20 resize-none"
                    placeholder="Расскажи о своей работе"
                    value={upload.description}
                    onChange={(e) => setUpload((u) => ({ ...u, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Тип</label>
                  <select
                    className="input-terra"
                    value={upload.type}
                    onChange={(e) => setUpload((u) => ({ ...u, type: e.target.value as UploadState['type'] }))}
                  >
                    <option value="SCREENSHOT">📷 Скриншот</option>
                    <option value="FANART">🎨 Фанарт</option>
                    <option value="BUILD">🏰 Постройка</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">
                    📤 Отправить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpload(false);
                      resetUpload();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <div className="text-6xl mb-4">🖼️</div>
            <p>Галерея пока пуста. Будь первым!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.8) }}
                className="group relative aspect-square glass rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400/30 transition-all cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  {item.title && <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-300 text-xs">👤 {item.user?.username}</span>
                    <button
                      onClick={() => handleVote(item.id)}
                      className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1 text-xs hover:bg-white/30 transition-colors"
                    >
                      ❤️ {item.votes}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
