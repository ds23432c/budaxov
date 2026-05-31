'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    authAPI.me().then(r => setProfile(r.data)).catch(() => toast.error('Ошибка загрузки профиля')).finally(() => setLoading(false));
  }, [user]);

  const roleLabels: Record<string, string> = { USER: 'Игрок', MODERATOR: 'Модератор', ADMIN: 'Администратор', SUPERADMIN: 'Суперадмин' };
  const achRarityColors: Record<string, string> = { COMMON: 'border-slate-500', RARE: 'border-blue-500', EPIC: 'border-purple-500', LEGENDARY: 'border-yellow-400 shadow-[0_0_10px_rgba(255,215,0,0.4)]' };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="text-slate-400">⏳ Загрузка профиля...</div></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.username}`}
                className="w-24 h-24 rounded-2xl border-2 border-yellow-400/30" alt="" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#060d1a]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`role-badge role-${profile.role}`}>{roleLabels[profile.role] || profile.role}</span>
                {profile.profile?.country && <span className="text-xs glass px-2 py-0.5 rounded-full border border-white/10">📍 {profile.profile.country}</span>}
              </div>
              {profile.profile?.bio && <p className="text-slate-300 text-sm leading-relaxed">{profile.profile.bio}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="glass rounded-xl px-4 py-3 border border-white/10">
                <div className="font-pixel text-gold text-sm">{profile.profile?.level || 1}</div>
                <div className="text-slate-500 text-xs">Уровень</div>
              </div>
              <div className="glass rounded-xl px-4 py-3 border border-white/10">
                <div className="font-pixel text-gold text-sm">{(profile.profile?.totalScore || 0).toLocaleString()}</div>
                <div className="text-slate-500 text-xs">Очки</div>
              </div>
              <div className="glass rounded-xl px-4 py-3 border border-white/10">
                <div className="font-pixel text-gold text-sm">{profile.profile?.playtimeHours || 0}ч</div>
                <div className="text-slate-500 text-xs">Игровых часов</div>
              </div>
              <div className="glass rounded-xl px-4 py-3 border border-white/10">
                <div className="font-pixel text-gold text-sm">{profile._count?.posts || 0}</div>
                <div className="text-slate-500 text-xs">Постов</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        {profile.userAchievements?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl border border-white/10 p-6 mb-6">
            <h2 className="font-pixel text-sm text-gold mb-4">🏅 ДОСТИЖЕНИЯ</h2>
            <div className="flex flex-wrap gap-3">
              {profile.userAchievements.map((ua: any) => (
                <div key={ua.id} title={ua.achievement.description} className={`glass rounded-xl p-3 border-2 ${achRarityColors[ua.achievement.rarity] || 'border-white/10'} hover:scale-105 transition-transform cursor-help`}>
                  <div className="text-2xl mb-1 text-center">{ua.achievement.iconUrl}</div>
                  <div className="text-xs text-center whitespace-nowrap max-w-[80px] truncate">{ua.achievement.name}</div>
                  <div className="text-xs text-center text-yellow-400">+{ua.achievement.xpReward} XP</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent posts */}
        {profile.posts?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="font-pixel text-sm text-gold mb-4">💬 ПОСЛЕДНИЕ ПОСТЫ</h2>
            <div className="space-y-2">
              {profile.posts.map((p: any) => (
                <a href={`/forum/${p.id}`} key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <span className="text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                  <span className="text-sm group-hover:text-yellow-400 transition-colors flex-1 truncate">{p.title}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
