'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type Tab = 'dashboard' | 'users' | 'reports' | 'gallery' | 'settings' | 'logs' | 'content';
type ContentSection = 'news' | 'items' | 'wiki' | 'posts' | 'achievements' | 'gallery';

type ContentFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'datetime';
type ContentRecord = Record<string, any>;

type ContentField = {
  key: string;
  label: string;
  type: ContentFieldType;
  placeholder?: string;
  options?: string[];
};

const CONTENT_SECTIONS: { key: ContentSection; label: string; hint: string }[] = [
  { key: 'news', label: '📰 Новости', hint: 'Новости и анонсы' },
  { key: 'items', label: '🧱 Предметы', hint: 'Предметы вики' },
  { key: 'wiki', label: '📚 Вики', hint: 'Статьи вики' },
  { key: 'posts', label: '💬 Посты', hint: 'Форумные посты' },
  { key: 'achievements', label: '🏅 Ачивки', hint: 'Достижения' },
  { key: 'gallery', label: '🖼️ Галерея', hint: 'Медиа записи' },
];

const CONTENT_FORM_SCHEMA: Record<ContentSection, ContentField[]> = {
  news: [
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'content', label: 'Текст', type: 'textarea' },
    { key: 'excerpt', label: 'Краткий текст', type: 'text' },
    { key: 'coverUrl', label: 'Обложка', type: 'text' },
    { key: 'authorId', label: 'Автор (никнейм, email или ID)', type: 'text', placeholder: 'Например: Alex, alex@mail.com или 12' },
    { key: 'isPublished', label: 'Опубликовано', type: 'checkbox' },
    { key: 'isPinned', label: 'Закреплено', type: 'checkbox' },
    { key: 'views', label: 'Просмотры', type: 'number' },
    { key: 'publishedAt', label: 'Дата публикации', type: 'datetime' },
  ],
  items: [
    { key: 'name', label: 'Название', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text' },
    { key: 'type', label: 'Тип', type: 'select', options: ['WEAPON', 'ARMOR', 'TOOL', 'MATERIAL', 'CONSUMABLE', 'ACCESSORY', 'BLOCK', 'FURNITURE', 'BOSS_LOOT'] },
    { key: 'rarity', label: 'Редкость', type: 'select', options: ['GREY', 'WHITE', 'BLUE', 'GREEN', 'ORANGE', 'RED', 'PURPLE', 'YELLOW', 'CYAN', 'RAINBOW'] },
    { key: 'description', label: 'Описание', type: 'textarea' },
    { key: 'spriteUrl', label: 'Sprite URL', type: 'text' },
    { key: 'imageUrl', label: 'Image URL', type: 'text' },
    { key: 'damage', label: 'Урон', type: 'number' },
    { key: 'defense', label: 'Защита', type: 'number' },
    { key: 'craftable', label: 'Крафтится', type: 'checkbox' },
    { key: 'craftRecipe', label: 'Рецепт', type: 'textarea' },
    { key: 'biome', label: 'Биом', type: 'text' },
    { key: 'boss', label: 'Босс', type: 'text' },
    { key: 'isPublished', label: 'Опубликовано', type: 'checkbox' },
  ],
  wiki: [
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text' },
    { key: 'content', label: 'Контент', type: 'textarea' },
    { key: 'excerpt', label: 'Краткий текст', type: 'text' },
    { key: 'coverUrl', label: 'Обложка', type: 'text' },
    { key: 'category', label: 'Категория', type: 'select', options: ['BIOME', 'BOSS', 'ITEM', 'MECHANIC', 'GUIDE', 'LORE'] },
    { key: 'authorId', label: 'Автор (никнейм, email или ID)', type: 'text', placeholder: 'Например: Alex, alex@mail.com или 12' },
    { key: 'views', label: 'Просмотры', type: 'number' },
    { key: 'isPublished', label: 'Опубликовано', type: 'checkbox' },
  ],
  posts: [
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'body', label: 'Тело', type: 'textarea' },
    { key: 'excerpt', label: 'Краткий текст', type: 'text' },
    { key: 'coverUrl', label: 'Обложка', type: 'text' },
    { key: 'category', label: 'Категория', type: 'select', options: ['NEWS', 'GUIDE', 'DISCUSSION', 'FANART', 'BUILD', 'HELP'] },
    { key: 'authorId', label: 'Автор (никнейм, email или ID)', type: 'text', placeholder: 'Например: Alex, alex@mail.com или 12' },
    { key: 'views', label: 'Просмотры', type: 'number' },
    { key: 'isPinned', label: 'Закреплено', type: 'checkbox' },
    { key: 'isPublished', label: 'Опубликовано', type: 'checkbox' },
  ],
  achievements: [
    { key: 'name', label: 'Название', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
    { key: 'iconUrl', label: 'Иконка', type: 'text' },
    { key: 'xpReward', label: 'XP', type: 'number' },
    { key: 'rarity', label: 'Редкость', type: 'select', options: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] },
    { key: 'isSecret', label: 'Секретная', type: 'checkbox' },
  ],
  gallery: [
    { key: 'userId', label: 'Пользователь (никнейм, email или ID)', type: 'text', placeholder: 'Например: Alex, alex@mail.com или 12' },
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'thumbUrl', label: 'Thumb URL', type: 'text' },
    { key: 'title', label: 'Заголовок', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
    { key: 'type', label: 'Тип', type: 'select', options: ['SCREENSHOT', 'FANART', 'BUILD', 'VIDEO'] },
    { key: 'votes', label: 'Голоса', type: 'number' },
    { key: 'isApproved', label: 'Одобрено', type: 'checkbox' },
  ],
};

const EMPTY_BY_SECTION: Record<ContentSection, ContentRecord> = {
  news: {
    title: '',
    content: '',
    excerpt: '',
    coverUrl: '',
    authorId: '',
    isPublished: true,
    isPinned: false,
    views: 0,
    publishedAt: new Date().toISOString(),
  },
  items: {
    name: '',
    slug: '',
    type: 'WEAPON',
    rarity: 'GREY',
    description: '',
    spriteUrl: '',
    imageUrl: '',
    damage: '',
    defense: '',
    craftable: false,
    craftRecipe: '',
    biome: '',
    boss: '',
    isPublished: true,
  },
  wiki: {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverUrl: '',
    category: 'GUIDE',
    authorId: '',
    views: 0,
    isPublished: true,
  },
  posts: {
    title: '',
    body: '',
    excerpt: '',
    coverUrl: '',
    category: 'DISCUSSION',
    authorId: '',
    views: 0,
    isPinned: false,
    isPublished: true,
  },
  achievements: {
    name: '',
    description: '',
    iconUrl: '',
    xpReward: 100,
    rarity: 'COMMON',
    isSecret: false,
  },
  gallery: {
    userId: '',
    url: '',
    thumbUrl: '',
    title: '',
    description: '',
    type: 'SCREENSHOT',
    votes: 0,
    isApproved: false,
  },
};

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

  const [contentSection, setContentSection] = useState<ContentSection>('news');
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSearch, setContentSearch] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [contentForm, setContentForm] = useState<ContentRecord>(EMPTY_BY_SECTION.news);
  const [authorDisplay, setAuthorDisplay] = useState('');
  const [authorOptions, setAuthorOptions] = useState<any[]>([]);
  const [authorLookupLoading, setAuthorLookupLoading] = useState(false);

  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdmin = !!user && ['ADMIN', 'SUPERADMIN'].includes(user.role);

  const currentContentLabel = useMemo(
    () => CONTENT_SECTIONS.find((section) => section.key === contentSection)?.label || contentSection,
    [contentSection],
  );

  const currentSchema = CONTENT_FORM_SCHEMA[contentSection];

  const getMediaPreviewUrl = (item: any) => item?.thumbUrl || item?.url || '';

  const getUserLabel = (item: any) => {
    const source = item?.author || item?.user;
    if (source?.username || source?.email) {
      return `${source.username || source.email}${source.email ? ` · ${source.email}` : ''}`;
    }
    const fallback = item?.authorId ?? item?.userId ?? '';
    return fallback ? String(fallback) : '';
  };

  const searchAuthors = async (query: string) => {
    const value = query.trim();
    if (value.length < 2) {
      setAuthorOptions([]);
      return;
    }

    setAuthorLookupLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ search: value, limit: 10 });
      setAuthorOptions(data.users || []);
    } catch {
      setAuthorOptions([]);
    } finally {
      setAuthorLookupLoading(false);
    }
  };

  const resolveUserReference = async (value: any, fallbackId?: number) => {
    const raw = String(value ?? '').trim();
    if (!raw) return fallbackId || null;
    if (/^\d+$/.test(raw)) return Number(raw);

    const { data } = await adminAPI.getUsers({ search: raw, limit: 10 });
    const users = data.users || [];
    const exact = users.find((u: any) => u.username === raw || u.email === raw);
    const found = exact || users[0];
    if (!found) throw new Error('Пользователь не найден');
    return found.id;
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
      router.push('/');
      return;
    }
    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (tab === 'content' && isSuperAdmin) {
      loadContent(contentSection);
    }
  }, [tab, contentSection, isSuperAdmin]);

  const loadDashboard = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data);
    } catch {
      toast.error('Не удалось загрузить дашборд');
    }
  };

  const loadTab = async (t: Tab) => {
    setTab(t);
    setLoading(true);
    try {
      if (t === 'users') {
        const r = await adminAPI.getUsers();
        setUsers(r.data.users || []);
      }
      if (t === 'reports') {
        const r = await adminAPI.getReports();
        setReports(r.data.reports || []);
      }
      if (t === 'gallery') {
        const r = await adminAPI.getPendingGallery();
        setGallery(r.data || []);
      }
      if (t === 'logs') {
        const r = await adminAPI.getLogs();
        setLogs(r.data || []);
      }
      if (t === 'settings') {
        const r = await adminAPI.getSettings();
        setSettings(r.data || {});
      }
      if (t === 'dashboard') {
        await loadDashboard();
      }
      if (t === 'content' && isSuperAdmin) {
        await loadContent(contentSection);
      }
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (section: ContentSection, search = contentSearch) => {
    setContentLoading(true);
    try {
      const { data } = await adminAPI.getContent(section, { search, limit: 100 });
      setContentItems(data.items || []);
      setSelectedContentId(null);
      setAuthorDisplay('');
      setAuthorOptions([]);
      setContentForm(EMPTY_BY_SECTION[section]);
    } catch {
      toast.error('Не удалось загрузить контент');
    } finally {
      setContentLoading(false);
    }
  };

  const selectContentItem = (item: ContentRecord) => {
    setSelectedContentId(item.id);
    setContentForm(mapRecordToForm(contentSection, item));
    setAuthorDisplay(getUserLabel(item));
    setAuthorOptions([]);
  };

  const mapRecordToForm = (section: ContentSection, item: ContentRecord) => {
    const base = EMPTY_BY_SECTION[section];
    const next = { ...base };

    Object.keys(base).forEach((key) => {
      if (item[key] !== undefined && item[key] !== null) {
        next[key] = item[key];
      }
    });

    if (section === 'news') {
      next.authorId = item.authorId ?? '';
      next.isPublished = !!item.isPublished;
      next.isPinned = !!item.isPinned;
    }
    if (section === 'items') {
      next.damage = item.damage ?? '';
      next.defense = item.defense ?? '';
      next.craftable = !!item.craftable;
      next.isPublished = !!item.isPublished;
    }
    if (section === 'wiki') {
      next.authorId = item.authorId ?? '';
      next.isPublished = !!item.isPublished;
    }
    if (section === 'posts') {
      next.authorId = item.authorId ?? '';
      next.isPublished = !!item.isPublished;
      next.isPinned = !!item.isPinned;
    }
    if (section === 'achievements') {
      next.xpReward = item.xpReward ?? 100;
      next.isSecret = !!item.isSecret;
    }
    if (section === 'gallery') {
      next.userId = item.userId ?? '';
      next.votes = item.votes ?? 0;
      next.isApproved = !!item.isApproved;
    }

    return next;
  };

  const resetContentForm = () => {
    setSelectedContentId(null);
    setAuthorDisplay('');
    setAuthorOptions([]);
    setContentForm(EMPTY_BY_SECTION[contentSection]);
  };

  const updateContentField = (field: string, value: any) => {
    setContentForm((current) => ({ ...current, [field]: value }));
  };

  const banUser = async (id: number, isBanned: boolean, reason = '') => {
    try {
      await adminAPI.updateUser(id, { isBanned, banReason: reason });
      toast.success(isBanned ? 'Пользователь заблокирован' : 'Блокировка снята');
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, isBanned, banReason: reason } : x)));
    } catch {
      toast.error('Ошибка');
    }
  };

  const changeRole = async (id: number, role: string) => {
    try {
      await adminAPI.updateUser(id, { role });
      toast.success('Роль изменена');
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, role } : x)));
    } catch {
      toast.error('Ошибка');
    }
  };

  const approveMedia = async (id: number) => {
    try {
      await adminAPI.approveMedia(id);
      setGallery((g) => g.filter((x) => x.id !== id));
      toast.success('Одобрено');
    } catch {
      toast.error('Ошибка');
    }
  };

  const resolveReport = async (id: number, status: string) => {
    try {
      await adminAPI.resolveReport(id, { status, resolution: 'Обработано администратором' });
      setReports((r) => r.filter((x) => x.id !== id));
      toast.success('Жалоба обработана');
    } catch {
      toast.error('Ошибка');
    }
  };

  const saveSettings = async () => {
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Настройки сохранены');
    } catch {
      toast.error('Ошибка');
    }
  };

  const saveContent = async () => {
    try {
      const payload = prepareContentPayload(contentSection, contentForm);

      if (contentSection === 'news' || contentSection === 'wiki' || contentSection === 'posts') {
        payload.authorId = await resolveUserReference(payload.authorId, user?.id);
      }

      if (contentSection === 'gallery') {
        payload.userId = await resolveUserReference(payload.userId, user?.id);
      }

      if (selectedContentId) {
        await adminAPI.updateContent(contentSection, selectedContentId, payload);
        toast.success('Запись обновлена');
      } else {
        await adminAPI.createContent(contentSection, payload);
        toast.success('Запись создана');
      }
      await loadContent(contentSection);
    } catch {
      toast.error('Не удалось сохранить запись');
    }
  };

  const deleteContent = async (id: number) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await adminAPI.deleteContent(contentSection, id);
      toast.success('Запись удалена');
      await loadContent(contentSection);
    } catch {
      toast.error('Не удалось удалить запись');
    }
  };

  const prepareContentPayload = (section: ContentSection, data: ContentRecord) => {
    const payload = { ...data };

    if (section === 'news' || section === 'wiki' || section === 'posts') {
      payload.authorId = payload.authorId ? Number(payload.authorId) : payload.authorId;
      if (!payload.authorId && user?.id) payload.authorId = user.id;
    }

    if (section === 'gallery') {
      payload.userId = payload.userId ? Number(payload.userId) : payload.userId;
      if (!payload.userId && user?.id) payload.userId = user.id;
      payload.votes = Number(payload.votes || 0);
      payload.isApproved = Boolean(payload.isApproved);
    }

    if (section === 'items') {
      payload.damage = payload.damage === '' ? null : payload.damage === null ? null : Number(payload.damage);
      payload.defense = payload.defense === '' ? null : payload.defense === null ? null : Number(payload.defense);
      payload.craftable = Boolean(payload.craftable);
      payload.isPublished = Boolean(payload.isPublished);
    }

    if (section === 'achievements') {
      payload.xpReward = Number(payload.xpReward || 100);
      payload.isSecret = Boolean(payload.isSecret);
    }

    if (section === 'posts') {
      payload.views = Number(payload.views || 0);
      payload.isPinned = Boolean(payload.isPinned);
      payload.isPublished = Boolean(payload.isPublished);
    }

    if (section === 'wiki' || section === 'news') {
      payload.views = Number(payload.views || 0);
      payload.isPublished = Boolean(payload.isPublished);
    }

    if (section === 'news') {
      payload.isPinned = Boolean(payload.isPinned);
      if (!payload.publishedAt) payload.publishedAt = new Date().toISOString();
    }

    return payload;
  };

  const renderContentField = (field: ContentField) => {
    const value = contentForm[field.key];

    if (field.key === 'authorId' || field.key === 'userId') {
      return (
        <div key={field.key} className="relative">
          <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
          <input
            type="text"
            value={authorDisplay}
            onChange={(e) => {
              const nextValue = e.target.value;
              setAuthorDisplay(nextValue);
              updateContentField(field.key, nextValue);
              searchAuthors(nextValue);
            }}
            onFocus={() => searchAuthors(authorDisplay || String(value ?? ''))}
            className="input-terra"
            placeholder={field.placeholder || 'Никнейм, email или ID'}
          />
          {authorLookupLoading && <p className="text-[11px] text-slate-500 mt-1">Поиск пользователя...</p>}
          {authorOptions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-xl border border-white/10 bg-[color:var(--bg-secondary)] shadow-xl">
              {authorOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setAuthorDisplay(`${option.username} · ${option.email}`);
                    updateContentField(field.key, String(option.id));
                    setAuthorOptions([]);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                >
                  <div className="font-medium">{option.username}</div>
                  <div className="text-xs text-slate-400">{option.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.key} className="flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateContentField(field.key, e.target.checked)}
            className="h-4 w-4"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
          <select
            value={String(value ?? '')}
            onChange={(e) => updateContentField(field.key, e.target.value)}
            className="input-terra"
          >
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
          <textarea
            value={String(value ?? '')}
            onChange={(e) => updateContentField(field.key, e.target.value)}
            className="input-terra min-h-[110px]"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
        <input
          type={field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => updateContentField(field.key, field.type === 'number' ? e.target.value : e.target.value)}
          className="input-terra"
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  const contentSummary = (item: ContentRecord) => {
    if (contentSection === 'items') return item.name || item.slug || `#${item.id}`;
    if (contentSection === 'achievements') return item.name || `#${item.id}`;
    return item.title || item.name || item.slug || `#${item.id}`;
  };

  const contentStatus = (item: ContentRecord) => {
    if (contentSection === 'gallery') return item.isApproved ? 'Одобрено' : 'На проверке';
    if (contentSection === 'items' || contentSection === 'wiki' || contentSection === 'news' || contentSection === 'posts') {
      return item.isPublished ? 'Опубликовано' : 'Черновик';
    }
    return '';
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 Дашборд' },
    { key: 'users', label: '👥 Пользователи' },
    { key: 'reports', label: '🚨 Жалобы' },
    { key: 'gallery', label: '🖼️ Галерея' },
    { key: 'settings', label: '⚙️ Настройки' },
    { key: 'logs', label: '📋 Логи' },
    ...(isSuperAdmin ? [{ key: 'content' as Tab, label: '🧩 Контент' }] : []),
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

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => loadTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                tab === t.key
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  : 'glass border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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

        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4 flex gap-3">
              <input
                type="text"
                className="input-terra flex-1"
                placeholder="🔍 Поиск пользователя..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-xs">
                    <th className="px-4 py-3 text-left">Пользователь</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Роль</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                    <th className="px-4 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(
                      (u) =>
                        !userSearch ||
                        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase()),
                    )
                    .map((u) => (
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
                            <select
                              value={u.role}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs"
                            >
                              {['USER', 'MODERATOR', 'ADMIN', 'SUPERADMIN'].map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBanned ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                            {u.isBanned ? '🔴 Заблокирован' : '🟢 Активен'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && (
                            <button
                              onClick={() => banUser(u.id, !u.isBanned, u.isBanned ? '' : 'Нарушение правил')}
                              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                                u.isBanned ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              }`}
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

        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {reports.length === 0 && !loading && <div className="text-center py-16 text-slate-400">✅ Жалоб нет</div>}
            {reports.map((r) => (
              <div key={r.id} className="glass rounded-xl border border-white/10 p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Тип: {r.targetType} #{r.targetId}</p>
                  <p className="text-slate-400 text-xs mb-1">От: {r.reporter?.username}</p>
                  <p className="text-slate-300 text-sm">{r.reason}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => resolveReport(r.id, 'RESOLVED')}
                    className="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    ✅ Решено
                  </button>
                  <button
                    onClick={() => resolveReport(r.id, 'DISMISSED')}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20"
                  >
                    ❌ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'gallery' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-pixel text-sm text-gold mb-4">ОЖИДАЮТ ПРОВЕРКИ: {gallery.length}</h3>
            {gallery.length === 0 && !loading && <div className="text-center py-16 text-slate-400">✅ Нет медиа на проверке</div>}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="glass rounded-xl border border-white/10 overflow-hidden">
                  <div className="aspect-square bg-white/5 relative">
                    <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-400 mb-2">
                      {item.user?.username} · {item.type}
                    </p>
                    {item.title && <p className="text-sm mb-2 truncate">{item.title}</p>}
                    <button
                      onClick={() => approveMedia(item.id)}
                      className="w-full text-xs py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      ✅ Одобрить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'settings' && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl border border-white/10 p-6 max-w-2xl">
            <h3 className="font-pixel text-sm text-gold mb-6">НАСТРОЙКИ САЙТА</h3>
            <div className="space-y-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1 block">{key}</label>
                  <input
                    type="text"
                    className="input-terra"
                    value={String(value)}
                    onChange={(e) => setSettings((s: any) => ({ ...s, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <button onClick={saveSettings} className="btn-primary w-full mt-4">
                💾 Сохранить
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
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

        {tab === 'content' && isSuperAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass rounded-xl border border-white/10 p-4">
              <h3 className="font-pixel text-sm text-gold mb-3">РАЗДЕЛЫ КОНТЕНТА</h3>
              <div className="flex flex-wrap gap-2">
                {CONTENT_SECTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => {
                      setContentSection(section.key);
                      setContentSearch('');
                      loadContent(section.key, '');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                      contentSection === section.key
                        ? 'bg-yellow-400/20 border-yellow-400/30 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-[360px,1fr] gap-6">
              <div className="glass rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-pixel text-sm text-gold">{currentContentLabel}</h3>
                    <p className="text-xs text-slate-400">{CONTENT_SECTIONS.find((s) => s.key === contentSection)?.hint}</p>
                  </div>
                  <button onClick={resetContentForm} className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    + Новая
                  </button>
                </div>

                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    className="input-terra flex-1"
                    placeholder="🔎 Поиск..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                  />
                  <button onClick={() => loadContent(contentSection, contentSearch)} className="btn-secondary text-xs px-3">
                    Найти
                  </button>
                </div>

                <div className="max-h-[540px] overflow-auto space-y-2 pr-1">
                  {contentLoading && <div className="text-sm text-slate-400 py-6 text-center">Загрузка...</div>}
                  {!contentLoading && contentItems.length === 0 && (
                    <div className="text-sm text-slate-400 py-6 text-center">Нет записей</div>
                  )}
                  {contentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectContentItem(item)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedContentId === item.id
                          ? 'border-yellow-400/30 bg-yellow-400/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {contentSection === 'gallery' && (
                          <img
                            src={getMediaPreviewUrl(item)}
                            alt={item.title || ''}
                            className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{contentSummary(item)}</p>
                          <p className="text-xs text-slate-500">
                            #{item.id} {contentStatus(item) ? `· ${contentStatus(item)}` : ''}
                          </p>
                          {contentSection === 'gallery' && (
                            <p className="text-xs text-slate-400 truncate mt-1">{getMediaPreviewUrl(item)}</p>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">{contentSection}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-pixel text-sm text-gold">
                      {selectedContentId ? `Редактирование #${selectedContentId}` : 'Новая запись'}
                    </h3>
                    <p className="text-xs text-slate-400">{currentContentLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedContentId && (
                      <button
                        onClick={() => deleteContent(selectedContentId)}
                        className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300"
                      >
                        Удалить
                      </button>
                    )}
                    <button onClick={saveContent} className="btn-primary text-xs px-3 py-2">
                      Сохранить
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {currentSchema.map(renderContentField)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading && tab !== 'dashboard' && <div className="text-center py-16 text-slate-400">⏳ Загрузка...</div>}
      </div>
    </div>
  );
}
