'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Заполните все поля');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.accessToken);
      toast.success(`Добро пожаловать, ${data.user.username}!`);
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="font-pixel text-2xl text-gold mb-2">ВХОД</h1>
            <p className="text-slate-400 text-sm">Добро пожаловать на Budaxov!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
              <input
                type="email"
                className="input-terra"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Пароль</label>
              <input
                type="password"
                className="input-terra"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? '⏳ Вход...' : '🎮 Войти'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Зарегистрироваться
            </Link>
          </p>

          <div className="mt-6 p-3 glass rounded-xl border border-yellow-400/10">
            <p className="text-xs text-slate-500 text-center">Тестовый аккаунт: admin@budaxov.ru / Admin123!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
