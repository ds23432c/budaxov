'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { itemsAPI } from '@/lib/api';
import { ItemCard, SkeletonCard } from '@/components/Cards';

const TYPES = [
  { value: '', label: 'Все типы' },
  { value: 'WEAPON', label: '⚔️ Оружие' },
  { value: 'ARMOR', label: '🛡️ Броня' },
  { value: 'TOOL', label: '⛏️ Инструмент' },
  { value: 'MATERIAL', label: '💎 Материал' },
  { value: 'CONSUMABLE', label: '🧪 Расходник' },
  { value: 'ACCESSORY', label: '💍 Аксессуар' },
];

const RARITIES = [
  { value: '', label: 'Любая редкость' },
  { value: 'GREY', label: 'Серый' },
  { value: 'WHITE', label: 'Белый' },
  { value: 'BLUE', label: 'Синий' },
  { value: 'GREEN', label: 'Зелёный' },
  { value: 'ORANGE', label: 'Оранжевый' },
  { value: 'RED', label: 'Красный' },
  { value: 'PURPLE', label: 'Фиолетовый' },
  { value: 'YELLOW', label: 'Жёлтый' },
  { value: 'RAINBOW', label: '🌈 Радужный' },
];

export default function WikiPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [rarity, setRarity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      itemsAPI.getAll({ search, type, rarity, page, limit: 24 })
        .then(r => { setItems(r.data.items || []); setTotal(r.data.total || 0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, type, rarity, page]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-pixel text-3xl text-gold mb-2">ВИКИ — ПРЕДМЕТЫ</h1>
          <p className="text-slate-400">База данных по всем предметам игры. Найдено: {total}</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-4 border border-white/10 mb-8 flex flex-wrap gap-3">
          <input
            type="text"
            className="input-terra flex-1 min-w-[200px] py-2"
            placeholder="🔍 Поиск предмета..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input-terra w-auto py-2" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="input-terra w-auto py-2" value={rarity} onChange={e => { setRarity(e.target.value); setPage(1); }}>
            {RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </motion.div>

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>Предметы не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 24 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: Math.ceil(total / 24) }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 3).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm transition-all ${p === page ? 'bg-yellow-400 text-black font-bold' : 'glass border border-white/10 hover:border-white/20'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
