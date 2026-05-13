'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryBar from '@/components/layout/CategoryBar';
import SearchBar from '@/components/layout/SearchBar';
import UserMenu from '@/components/layout/UserMenu';
import MapContainer from '@/components/map/MapContainer';


import PlaceCard from '@/components/place/PlaceCard';
import { supabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MainPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const { selectedCategory, searchQuery } = useAppStore();
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      // 기본적인 데이터 가져오기 (필터는 클라이언트 측에서 처리하여 에러 방지)
      let query = supabase.from('places').select(`
        *,
        content_places (
          timeline_seconds,
          creator_review,
          summary,
          contents (
            video_id,
            title,
            creator_name,
            thumbnail_url
          )
        )
      `);
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
      
      if (error) {
        console.error('Places fetch error:', error);
        return;
      }

      // 클라이언트 측 통합 검색 필터링 (상호명, 주소, 유튜버 이름)
      if (searchQuery) {
        const filtered = (data || []).filter(place => {
          const lowerQuery = searchQuery.toLowerCase();
          const matchesName = place.place_name?.toLowerCase().includes(lowerQuery);
          const matchesAddress = place.address?.toLowerCase().includes(lowerQuery);
          const matchesCreator = place.content_places?.some((cp: any) => 
            cp.contents?.creator_name?.toLowerCase().includes(lowerQuery)
          );
          return matchesName || matchesAddress || matchesCreator;
        });
        setPlaces(filtered);
      } else {
        setPlaces(data || []);
      }
    };
    fetchPlaces();
  }, [selectedCategory, searchQuery, mapBounds]);


  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Header is handled globally in layout.tsx */}





      <div className="flex flex-1 h-full relative overflow-hidden">
        
        {/* Sidebar - Minimalist Sliding interaction */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -420 }}
              animate={{ x: 0 }}
              exit={{ x: -420 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute md:relative bottom-0 left-0 right-0 md:right-auto w-full md:w-[400px] h-[60vh] md:h-full bg-white dark:bg-slate-950 z-[80] shadow-2xl md:shadow-none border-r border-slate-100 dark:border-slate-900 flex flex-col"
            >
              <div className="p-8 pb-4 mt-4">


                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Discover</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      {places.length} Places Found
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center transition-colors group"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar space-y-3">
                {places.map((place, idx) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <PlaceCard place={place} />
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Minimal Toggle Trigger */}
        {!isSidebarOpen && (
          <motion.button 
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-[85] w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          >
            <ChevronRight className="w-6 h-6 text-slate-900 dark:text-white" />
          </motion.button>
        )}

        {/* Immersive Map Container */}
        <div className="flex-1 h-full z-0">
          <MapContainer 
            places={places} 
            onBoundsChange={(bounds) => setMapBounds(bounds)} 
          />
        </div>

      </div>
    </div>
  );
}
