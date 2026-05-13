'use client';

import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

const categories = [
  { id: 'all', label: '전체', icon: '🌈' },
  { id: 'food', label: '맛집', icon: '🍕' },
  { id: 'cafe', label: '카페', icon: '☕' },
  { id: 'camping', label: '캠핑', icon: '⛺' },
  { id: 'fishing', label: '낚시', icon: '🎣' },
  { id: 'travel', label: '여행', icon: '✈️' },
  { id: 'accommodation', label: '숙소', icon: '🏨' },
];

export default function CategoryBar() {
  const { selectedCategory, setSelectedCategory } = useAppStore();

  return (
    <nav className="flex gap-2 overflow-x-auto py-1 custom-scrollbar px-2 items-center no-scrollbar">
      {categories.map((c) => (
        <motion.button
          key={c.id}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setSelectedCategory(c.id)}
          className={`
            group relative flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap
            ${selectedCategory === c.id
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }
          `}
        >
          <span className={`text-base transition-transform duration-300 group-hover:scale-125 ${selectedCategory === c.id ? 'scale-110' : ''}`}>
            {c.icon}
          </span>
          <span className="tracking-tight uppercase">{c.label}</span>
          
          {/* Subtle Indicator */}
          {selectedCategory === c.id && (
            <motion.div 
              layoutId="glow"
              className="absolute inset-0 bg-emerald-500 rounded-xl -z-10 blur-md opacity-20"
            />
          )}
        </motion.button>
      ))}
    </nav>
  );
}
