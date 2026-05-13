'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleChange = (val: string) => {
    setInputValue(val);
    setSearchQuery(val); // 즉시 검색 반영
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all"
    >
      <Search className="w-4 h-4 text-slate-400" />
      <input 
        type="text"
        placeholder="상호명, 채널명 검색..."
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
      />

      {inputValue && (
        <button 
          type="button" 
          onClick={clearSearch}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </div>

  );
}
