'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type Tab = 'dashboard' | 'users' | 'reports' | 'news' | 'gallery' | 'settings' | 'logs';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);
  const router = useRouter();

  const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.role);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) { router.push('/'); return; }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data);
    } catch {}
  };

  const loadTab = async (t: Tab) => {
    setTab(t);
    setLoading(true);
    try {
      if (t === 'users') { const r = await adminAPI.getUsers(); setUsers(r.data.users || []); }
      if (t === 'reports') { const r = await adminAPI.getReports(); setReports(r.data.reports || []); }
      if (t === 'gallery') { const r = await adminAPI.getPendingGallery(); setGallery(r.data || []); }
      if (t === 'logs') { const r = await adminAPI.getLogs(); setLogs(r.data || []); }
      if (t === 'settings') { const r = await adminAPI.getSettings(); setSettings(r.data || {}); }
      if (t === 'dashboard') loadDashboard();
    } catch (e) {
      toast.error('Ошибка загрузки');
    } finally { setLoading(false); }
  };

  const banUser = async (id: number, isBanned: boolean, reason = '') => {
    try {
      await adminAPI.updateUser(id, { isBanned, banReason: reason });
      toast.success(isBanned ? 'Пользователь заблокирован' : 'Блокировка снята');
      setUsers(u => u.map(x => x.id === id ? { ...x, isBanned, banReason: reason } : x));
    } catch { toast.error('Ошибка'); }
  };

  const changeRole = async (id: number, role: string) => {
    try {
      await adminAPI.updateUser(id, { role });
      toast.success('Роль изменена');
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
    } catch { toast.error('Ошибка'); }
  };

  const approveMedia = async (id: number) => {
    try {
      await adminAPI.approveMedia(id);
      setGallery(g => g.filter(x => x.id !== id));
      toast.success('Одобрено');
    } catch { toast.error('Ошибка'); }
  };

  const resolveReport = async (id: number, status: string) => {
    try {
      await adminAPI.resolveReport(id, { status, resolution: 'Обработано администратором' });
      setReports(r => r.filter(x => x.id !== id));
      toast.success('Жалоба обработана');
    } catch { toast.error('Ошибка'); }
  };

  const saveSettings = async () => {
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Настройки сохранены');
    } catch { toast.error('Ошибка'); }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 Дашборд' },
    { key: 'users', label: '👥 Пользователи' },
    { key: 'reports', label: '🚨 Жалобы' },
    { key: 'gallery', label: '🖼️ Галерея' },
    { key: 'settings', label: '⚙️ Настройки' },
    { key: 'logs', label: '📋 Логи' },
  ];

  const roleColors: Record<string, string> = {
    USER: 'bg-slate-700 text-slate-300',
    MODERATOR: 'bg-blue-800 text-blue-300',
    ADMIN: 'bg-purple-800 text-purple-300',
    SUPERADMIN: 'bg-yellow-800 text-yellow-300',
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-pixel text-2xl text-gold mb-1">🛡️ ПАНЕЛЬ АДМИНИСТРАТОРА</h1>
          <p className="text-slate-400 text-sm">Управление сайтом Budaxov</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(t => (
            <button key={t.key} onClick={() => loadTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${tab === t.key ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'glass border border-white/10 text-slate-300 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Пользователи', value: stats.users, icon: '👥' },
                { label: 'Посты', value: stats.posts, icon: '💬' },
                { label: 'Новости', value: stats.news, icon: '📰' },
                { label: 'Медиа', value: stats.gallery, icon: '🖼️' },
                { label: 'Жалоб ожидает', value: stats.pendingReports, icon: '🚨', alert: stats.pendingReports > 0 },
              ].map((s, i) => (
                <div key={i} className={`glass rounded-xl p-4 border ${s.alert ? 'border-red-500/40 bg-red-500/5' : 'border-white/10'}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-pixel text-xl text-gold">{s.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl border border-white/10 p-5">
              <h3 className="font-pixel text-sm text-gold mb-4">НОВЫЕ ПОЛЬЗОВАТЕЛИ</h3>
              <div className="space-y-3">
                {(stats.recentUsers || []).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <img src={u.avatarUrl || ''} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                    <span className="flex-1 text-sm">{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role] || ''}`}>{u.role}</span>
                    <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4 flex gap-3">
              <input type="text" className="input-terra flex-1" placeholder="🔍 Поиск пользователя..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} />
            </div>
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-slate-500 text-xs">
                  <th className="px-4 py-3 text-left">Пользователь</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Роль</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3 text-left">Действия</th>
                </tr></thead>
                <tbody>
                  {users.filter(u => !userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={u.avatarUrl || ''} className="w-7 h-7 rounded-full border border-white/10" alt="" />
                          <span>{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs">
                            {['USER','MODERATOR','ADMIN','SUPERADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBanned ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                          {u.isBanned ? '🔴 Заблокирован' : '🟢 Активен'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && (
                          <button onClick={() => banUser(u.id, !u.isBanned, u.isBanned ? '' : 'Нарушение правил')}
                            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${u.isBanned ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}
                          >
                            {u.isBanned ? 'Разблокировать' : 'Заблокировать'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {reports.length === 0 && !loading && <div className="text-center py-16 text-slate-400">✅ Жалоб нет</div>}
            {reports.map(r => (
              <div key={r.id} className="glass rounded-xl border border-white/10 p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Тип: {r.targetType} #{r.targetId}</p>
                  <p className="text-slate-400 text-xs mb-1">От: {r.reporter?.username}</p>
                  <p className="text-slate-300 text-sm">{r.reason}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20">✅ Решено</button>
                  <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="text-xs px-3 py-1 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20">❌ Отклонить</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Gallery moderation */}
        {tab === 'gallery' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-pixel text-sm text-gold mb-4">ОЖИДАЮТ ПРОВЕРКИ: {gallery.length}</h3>
            {gallery.length === 0 && !loading && <div className="text-center py-16 text-slate-400">✅ Нет медиа на проверке</div>}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map(item => (
                <div key={item.id} className="glass rounded-xl border border-white/10 overflow-hidden">
                  <div className="aspect-square bg-white/5 relative">
                    <img src={item.url} alt="" className="w-full h-full object-cover" onError={e => e.currentTarget.style.display='none'} />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-400 mb-2">{item.user?.username} · {item.type}</p>
                    {item.title && <p className="text-sm mb-2 truncate">{item.title}</p>}
                    <button onClick={() => approveMedia(item.id)} className="w-full text-xs py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors">✅ Одобрить</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {tab === 'settings' && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl border border-white/10 p-6 max-w-2xl">
            <h3 className="font-pixel text-sm text-gold mb-6">НАСТРОЙКИ САЙТА</h3>
            <div className="space-y-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1 block">{key}</label>
                  <input type="text" className="input-terra" value={String(value)} onChange={e => setSettings((s: any) => ({ ...s, [key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={saveSettings} className="btn-primary w-full mt-4">💾 Сохранить</button>
            </div>
          </motion.div>
        )}

        {/* Logs */}
        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {logs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-4 text-xs hover:bg-white/3">
                  <span className="text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                  <span className="text-blue-400">{log.admin?.username}</span>
                  <span className="text-yellow-400">{log.action}</span>
                  <span className="text-slate-400 flex-1 truncate">{log.details}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {loading && tab !== 'dashboard' && (
          <div className="text-center py-16 text-slate-400">⏳ Загрузка...</div>
        )}
      </div>
    </div>
  );
}
