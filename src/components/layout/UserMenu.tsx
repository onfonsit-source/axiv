'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, LogOut, PlusCircle, Search, User, Settings, MessageCircle } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import CategoryBar from './CategoryBar';


export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: PlusCircle, label: '장소 등록', action: () => { router.push('/register'); setIsOpen(false); } },
    { icon: User, label: '마이페이지', action: () => { router.push('/mypage'); setIsOpen(false); } },
    { icon: MessageCircle, label: '제보 및 문의', action: () => { router.push('/contact'); setIsOpen(false); } },
  ];



  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-[100]"
      >
        {isOpen ? <X className="w-5 h-5 text-slate-900 dark:text-white" /> : <Menu className="w-5 h-5 text-slate-900 dark:text-white" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 dark:border-slate-800 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</p>
                <SearchBar />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</p>
                <CategoryBar />
              </div>
            </div>

            {user && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
              </div>
            )}


            <div className="p-2">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group text-left"
                >
                  <item.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group text-left"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">로그아웃</span>
                </button>
              ) : (
                <button
                  onClick={() => { router.push('/login'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors group text-left"
                >
                  <LogIn className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">로그인</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
