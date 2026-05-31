'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('Заполните все поля');
    if (form.password !== form.confirm) return toast.error('Пароли не совпадают');
    if (form.password.length < 6) return toast.error('Пароль минимум 6 символов');
    setLoading(true);
    try {
      const { data } = await authAPI.register({ username: form.username, email: form.email, password: form.password });
      setAuth(data.user, data.accessToken);
      toast.success('🎮 Аккаунт создан! Добро пожаловать!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="font-pixel text-2xl text-gold mb-2">РЕГИСТРАЦИЯ</h1>
            <p className="text-slate-400 text-sm">Создай аккаунт и присоединяйся к сообществу!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: 'Имя пользователя', type: 'text', placeholder: 'КрутойИгрок2024' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { key: 'password', label: 'Пароль', type: 'password', placeholder: '••••••••' },
              { key: 'confirm', label: 'Подтвердите пароль', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm text-slate-400 mb-1.5 block">{f.label}</label>
                <input type={f.type} className="input-terra" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? '⏳ Создаём аккаунт...' : '⚔️ Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
