'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Menu, X, Bell, LogOut, User, Shield } from 'lucide-react';

const navLinks = [
  { href: '/wiki', label: '📖 Вики' },
  { href: '/news', label: '📰 Новости' },
  { href: '/forum', label: '💬 Форум' },
  { href: '/leaderboard', label: '🏆 Рейтинг' },
  { href: '/gallery', label: '🎨 Галерея' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = user && ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#060d1a]/90 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-pixel text-gold text-lg hover:scale-105 transition-transform">
            BUDAXOV
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${pathname === link.href ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <img src={user.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} className="w-8 h-8 rounded-full border border-yellow-400/30" alt="" />
                  <span className="text-sm text-white">{user.username}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                    >
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-sm">
                        <User size={16} /> Мой профиль
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-sm text-yellow-400">
                          <Shield size={16} /> Админ-панель
                        </Link>
                      )}
                      <hr className="border-white/10" />
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors text-sm">
                        <LogOut size={16} /> Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary text-sm py-2">Войти</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2">Регистрация</Link>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[#060d1a]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/10 my-2" />
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-300 hover:text-white">👤 Профиль</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-yellow-400">🛡️ Админ-панель</Link>}
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="px-4 py-3 text-left text-red-400">🚪 Выйти</button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-center text-sm py-2">Войти</Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm py-2">Регистрация</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside close */}
      {userMenuOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setUserMenuOpen(false)} />}
    </nav>
  );
}
