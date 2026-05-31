'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { leaderboardAPI } from '@/lib/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.get({ limit: 50, season: 1 })
      .then(r => setRows(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-pixel text-3xl text-gold mb-2">🏆 ЛИДЕРБОРД</h1>
          <p className="text-slate-400">Сезон 1 · Рейтинг обновляется в реальном времени</p>
        </motion.div>

        {/* Top 3 podium */}
        {!loading && rows.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4 mb-10">
            {[rows[1], rows[0], rows[2]].map((entry, i) => {
              const rank = [2, 1, 3][i];
              const heights = ['h-28', 'h-36', 'h-24'];
              return (
                <div key={entry.id} className={`glass rounded-2xl border flex flex-col items-center justify-end pb-4 px-3 ${rank === 1 ? 'border-yellow-400/40 bg-yellow-400/5' : rank === 2 ? 'border-slate-400/30' : 'border-amber-600/30'} ${heights[i]}`}>
                  <img src={entry.user?.avatarUrl || ''} className="w-12 h-12 rounded-full border-2 border-white/20 mb-2" alt="" />
                  <p className="text-xs font-medium truncate w-full text-center">{entry.user?.username}</p>
                  <p className="font-pixel text-xs text-gold">{entry.score?.toLocaleString()}</p>
                  <div className="text-xl mt-1">{MEDALS[rank - 1]}</div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Full table */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_100px_100px_100px] text-xs text-slate-500 px-5 py-3 border-b border-white/5">
            <span>#</span><span>Игрок</span><span className="text-center">Очки</span><span className="text-center">Убийства</span><span className="text-center">Часов</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Загрузка...</div>
          ) : rows.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 1) }}
              className={`grid grid-cols-[50px_1fr_100px_100px_100px] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-yellow-400/3' : ''}`}
            >
              <span className={`font-pixel text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <div className="flex items-center gap-3">
                <img src={entry.user?.avatarUrl || ''} className="w-9 h-9 rounded-full border border-white/10" alt="" />
                <div>
                  <p className="font-medium text-sm">{entry.user?.username}</p>
                  <p className="text-xs text-slate-500">Ур. {Math.floor(entry.score / 2000) + 1}</p>
                </div>
              </div>
              <span className="text-center font-pixel text-xs text-gold">{entry.score?.toLocaleString()}</span>
              <span className="text-center text-sm text-slate-300">{entry.kills?.toLocaleString()}</span>
              <span className="text-center text-sm text-slate-400">{entry.playtime}ч</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
