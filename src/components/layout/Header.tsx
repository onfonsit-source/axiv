'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { PlusCircle, LogOut, Search, Map as MapIcon, User } from 'lucide-react';

import UserMenu from './UserMenu';

export default function Header() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[110] px-6 py-4 pointer-events-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* Minimal Logo */}
        <Link href="/" className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 dark:border-slate-800 shadow-xl group">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <MapIcon className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">AXIV</span>
        </Link>

        {/* Global User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}

