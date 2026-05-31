'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { itemsAPI } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = { WEAPON: '⚔️ Оружие', ARMOR: '🛡️ Броня', TOOL: '⛏️ Инструмент', MATERIAL: '💎 Материал', CONSUMABLE: '🧪 Расходник', ACCESSORY: '💍 Аксессуар', BLOCK: '🟫 Блок', FURNITURE: '🪑 Мебель', BOSS_LOOT: '👑 Дроп босса' };
const RARITY_LABELS: Record<string, string> = { GREY: 'Серый', WHITE: 'Белый', BLUE: 'Синий', GREEN: 'Зелёный', ORANGE: 'Оранжевый', RED: 'Красный', PURPLE: 'Фиолетовый', YELLOW: 'Жёлтый', CYAN: 'Голубой', RAINBOW: 'Радужный' };

export default function ItemDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    itemsAPI.getOne(String(slug!)).then(r => setItem(r.data)).catch(() => router.push('/wiki')).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-slate-400">⏳ Загрузка...</div>;
  if (!item) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/wiki')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2">← Вики</button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/10 p-8">
          <div className="flex items-start gap-6 mb-6">
            {item.imageUrl ? (
              <div className="w-20 h-20 glass rounded-xl flex items-center justify-center border border-white/10">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain" onError={e => e.currentTarget.style.display='none'} />
              </div>
            ) : (
              <div className="w-20 h-20 glass rounded-xl flex items-center justify-center text-4xl border border-white/10">💎</div>
            )}
            <div>
              <h1 className={`text-2xl font-bold rarity-${item.rarity} mb-1`}>{item.name}</h1>
              <p className="text-slate-400 text-sm">{TYPE_LABELS[item.type]} · {RARITY_LABELS[item.rarity] || item.rarity}</p>
            </div>
          </div>

          {item.description && <p className="text-slate-300 leading-relaxed mb-6">{item.description}</p>}

          <div className="grid grid-cols-2 gap-3">
            {item.damage != null && <div className="glass rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-500">⚔️ Урон</p><p className="font-pixel text-gold text-sm">{item.damage}</p></div>}
            {item.defense != null && <div className="glass rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-500">🛡️ Защита</p><p className="font-pixel text-gold text-sm">{item.defense}</p></div>}
            {item.biome && <div className="glass rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-500">🗺️ Биом</p><p className="text-sm">{item.biome}</p></div>}
            {item.boss && <div className="glass rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-500">👹 Босс</p><p className="text-sm">{item.boss}</p></div>}
          </div>

          {item.craftable && item.craftRecipe && (
            <div className="mt-4 glass rounded-xl p-4 border border-yellow-400/20 bg-yellow-400/5">
              <p className="text-xs text-yellow-400 mb-1">⚒️ Крафт</p>
              <p className="text-sm text-slate-300">{item.craftRecipe}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
