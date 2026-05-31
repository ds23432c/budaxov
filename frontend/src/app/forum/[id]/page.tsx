'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    postsAPI.getOne(+id!)
      .then(r => setPost(r.data))
      .catch(() => router.push('/forum'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) { toast.error('Войдите чтобы лайкать'); return; }
    const { data } = await postsAPI.like(+id!);
    setPost((p: any) => ({ ...p, _count: { ...p._count, likes: data.count }, likes: data.liked ? [{ id: 1 }] : [] }));
  };

  const handleComment = async () => {
    if (!user) { toast.error('Войдите чтобы комментировать'); return; }
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await postsAPI.addComment(+id!, { body: comment, parentId: replyTo });
      setPost((p: any) => ({
        ...p,
        comments: replyTo
          ? p.comments.map((c: any) => c.id === replyTo ? { ...c, replies: [...(c.replies || []), data] } : c)
          : [...p.comments, { ...data, replies: [] }]
      }));
      setComment('');
      setReplyTo(null);
      toast.success('Комментарий добавлен!');
    } catch { toast.error('Ошибка'); }
    finally { setSubmitting(false); }
  };

  const roleColors: Record<string, string> = { USER: 'text-slate-400', MODERATOR: 'text-blue-400', ADMIN: 'text-purple-400', SUPERADMIN: 'text-yellow-400' };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-slate-400">⏳ Загрузка...</div>;
  if (!post) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button onClick={() => router.push('/forum')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
          ← Назад к форуму
        </button>

        {/* Post */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <img src={post.author?.avatarUrl || ''} className="w-10 h-10 rounded-full border border-white/10" alt="" />
            <div>
              <p className={`font-medium text-sm ${roleColors[post.author?.role] || ''}`}>{post.author?.username}</p>
              <p className="text-slate-500 text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ru })}</p>
            </div>
            <div className="ml-auto text-xs text-slate-500">👁️ {post.views}</div>
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

          <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
            <ReactMarkdown>{post.body}</ReactMarkdown>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <button onClick={handleLike} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all ${post.likes?.length ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'glass border border-white/10 hover:border-red-500/30 hover:text-red-400'}`}>
              ❤️ {post._count?.likes || 0}
            </button>
            <span className="text-slate-500 text-sm">💬 {post._count?.comments || 0} комментариев</span>
          </div>
        </motion.div>

        {/* Comments */}
        <div className="space-y-3 mb-6">
          <h2 className="font-pixel text-sm text-gold">КОММЕНТАРИИ</h2>
          {post.comments?.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <div className="glass rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={c.author?.avatarUrl || ''} className="w-7 h-7 rounded-full border border-white/10" alt="" />
                  <span className={`text-sm font-medium ${roleColors[c.author?.role] || ''}`}>{c.author?.username}</span>
                  <span className="text-xs text-slate-500 ml-auto">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ru })}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{c.body}</p>
                {user && <button onClick={() => setReplyTo(c.id)} className="text-xs text-slate-500 hover:text-yellow-400 mt-2 transition-colors">↩️ Ответить</button>}
              </div>
              {c.replies?.map((r: any) => (
                <div key={r.id} className="ml-6 mt-2 glass rounded-xl border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={r.author?.avatarUrl || ''} className="w-6 h-6 rounded-full" alt="" />
                    <span className="text-xs font-medium">{r.author?.username}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{r.body}</p>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Comment form */}
        {user ? (
          <div className="glass rounded-xl border border-white/10 p-4">
            {replyTo && <p className="text-xs text-yellow-400 mb-2">↩️ Ответ на комментарий <button onClick={() => setReplyTo(null)} className="text-slate-400 ml-2">✕</button></p>}
            <textarea
              className="input-terra w-full h-28 resize-none"
              placeholder="Напиши комментарий..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button onClick={handleComment} disabled={submitting || !comment.trim()} className="btn-primary text-sm py-2 disabled:opacity-50">
                {submitting ? '⏳...' : '💬 Отправить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 glass rounded-xl border border-white/10">
            <p>Войдите чтобы оставить комментарий</p>
          </div>
        )}
      </div>
    </div>
  );
}
