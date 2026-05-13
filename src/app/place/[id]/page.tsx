'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, ShoppingBag, Clock, Play, ChevronLeft, Info, Star } from 'lucide-react';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [place, setPlace] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'onfons.it@gmail.com') {
        setIsAdmin(true);
      }
    };
    checkAdmin();

    const fetchDetails = async () => {
      const { data: placeData } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .single();

      const { data: contentData } = await supabase
        .from('content_places')
        .select(`
          timeline_seconds,
          creator_review,
          summary,
          contents (*)
        `)
        .eq('place_id', id);
      
      setPlace(placeData);
      setEditData({
        ...placeData,
        summary: contentData?.[0]?.summary || ''
      });

      // summary에서 전화번호 추출 시도 (데이터베이스 컬럼이 없는 경우 대비)
      if (placeData && !placeData.phone && contentData?.[0]?.summary) {
        const phoneMatch = contentData[0].summary.match(/\d{2,3}-\d{3,4}-\d{4}/);
        if (phoneMatch) {
          setPlace((prev: any) => ({ ...prev, phone: phoneMatch[0] }));
        }
      }

      setContents(contentData || []);
      setLoading(false);
    };


    if (id) fetchDetails();
  }, [id]);

  const handleUpdate = async () => {
    // 1. Update Places table
    const { error: placeErr } = await supabase
      .from('places')
      .update({
        place_name: editData.place_name,
        address: editData.address,
        phone: editData.phone,
        category: editData.category,
        business_hours: editData.business_hours,
        representative_menu: editData.representative_menu
      })
      .eq('id', id);


    // 2. Update Content_Places table (Summary info)
    const { error: summaryErr } = await supabase
      .from('content_places')
      .update({
        summary: editData.summary
      })
      .eq('place_id', id);

    if (placeErr || summaryErr) {
      alert('수정 실패: ' + (placeErr?.message || summaryErr?.message));
    } else {
      alert('수정되었습니다.');
      setPlace(editData);
      // Re-fetch or manually update contents state to reflect summary change
      setContents(prev => prev.map((item, idx) => idx === 0 ? {...item, summary: editData.summary} : item));
      setIsEditing(false);
    }
  };


  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;
    
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      alert('삭제되었습니다.');
      router.push('/');
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-emerald-500"></div>
    </div>
  );
  
  if (!place) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-6xl font-black text-slate-200 mb-4 tracking-tighter">404</h1>
      <p className="text-slate-500 font-bold mb-8">장소를 찾을 수 없습니다.</p>
      <button onClick={() => router.back()} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg">뒤로 가기</button>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Reduced Top Margin Header */}
      <div className="sticky top-0 z-[110] p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800 pointer-events-auto active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-white" />
        </button>

        {isAdmin && (
          <div className="flex gap-2 pointer-events-auto">
            {isEditing ? (
              <>
                <button onClick={handleUpdate} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg">저장</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-500 text-white rounded-xl font-black text-xs shadow-lg">취소</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs shadow-lg">수정</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-xs shadow-lg">삭제</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-32">
        
        {/* Immersive Hero Card */}
        <div className="relative h-[30vh] md:h-[40vh] rounded-[40px] overflow-hidden mb-8 shadow-2xl border-4 border-white dark:border-slate-900">
          {place.thumbnail_url ? (
            <Image
              src={place.thumbnail_url}
              alt={place.place_name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
               <span className="text-9xl opacity-20">📍</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-6 left-8 right-8">
            <div className="flex flex-col items-start gap-2">
              <div className="px-3 py-1 bg-emerald-500 text-white rounded-xl text-[10px] font-black tracking-widest uppercase">
                {isEditing ? (
                   <select 
                    value={editData.category} 
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                    className="bg-emerald-600 text-white border-none outline-none text-[10px] font-black"
                   >
                     <option value="food">FOOD</option>
                     <option value="cafe">CAFE</option>
                     <option value="travel">TRAVEL</option>
                   </select>
                ) : place.category}
              </div>
              {isEditing ? (
                <input 
                  value={editData.place_name}
                  onChange={(e) => setEditData({...editData, place_name: e.target.value})}
                  className="bg-white/20 backdrop-blur-md text-3xl md:text-5xl font-black text-white outline-none border-b-2 border-white/40 w-full"
                />
              ) : (
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                  {place.place_name}
                </h1>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl border border-white dark:border-slate-800">
              <h2 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest">Business Information</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                    {isEditing ? (
                      <input 
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm font-bold outline-none border-b-2 border-emerald-500"
                      />
                    ) : (
                      place.phone ? (
                        <a href={`tel:${place.phone}`} className="text-sm font-black text-emerald-600 underline decoration-2 underline-offset-4">
                          {place.phone}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-slate-400">등록된 번호 없음</p>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                    {isEditing ? (
                      <input 
                        value={editData.address || ''}
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm font-bold outline-none border-b-2 border-emerald-500"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{place.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Hours</p>
                    {isEditing ? (
                      <input 
                        value={editData.business_hours || ''}
                        onChange={(e) => setEditData({...editData, business_hours: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm font-bold outline-none border-b-2 border-emerald-500"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{place.business_hours || '정보 없음'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Representative Menu</p>
                    {isEditing ? (
                      <textarea 
                        value={editData.representative_menu || ''}
                        onChange={(e) => setEditData({...editData, representative_menu: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm font-bold outline-none border-b-2 border-emerald-500 min-h-[80px] resize-none"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line">{place.representative_menu || '정보 없음'}</p>
                    )}
                  </div>
                </div>




                {/* DB 정보를 그대로 보여주기 위해 summary 컬럼 활용 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service & Features</p>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <textarea 
                          value={editData.summary || ''}
                          onChange={(e) => setEditData({...editData, summary: e.target.value})}
                          className="w-full bg-transparent border-none outline-none min-h-[150px] resize-none text-sm font-bold"
                          placeholder="영업시간, 가격, 상세 정보를 입력하세요..."
                        />
                      ) : (
                        contents[0]?.summary || place.representative_menu || '상세 정보가 없습니다.'
                      )}
                    </div>
                  </div>

                </div>


                <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                   <a 
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(place.place_name + ' ' + place.address)}`}
                    target="_blank"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                   >
                    <span>네이버 지도에서 보기</span>
                   </a>
                </div>
              </div>
            </div>
          </div>

          {/* Video & Review Content */}
          <div className="lg:col-span-2">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-2 h-10 bg-emerald-500 rounded-full" />
               <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                 Recommenders
               </h2>
             </div>

             <div className="space-y-8">
               {contents.map((item, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 rounded-[40px] p-6 md:p-8 shadow-xl border border-white dark:border-slate-800 group">
                   <div className="flex flex-col md:flex-row gap-8">
                     <div className="w-full md:w-72 aspect-video relative rounded-3xl overflow-hidden shadow-2xl shrink-0">
                       <Image
                         src={item.contents.thumbnail_url}
                         alt={item.contents.title}
                         fill
                         className="object-cover group-hover:scale-110 transition-transform duration-700"
                       />
                       <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <Link 
                           href={`https://youtube.com/watch?v=${item.contents.video_id}&t=${item.timeline_seconds}s`}
                           target="_blank"
                           className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                         >
                           <Play className="w-6 h-6 text-white fill-white" />
                         </Link>
                       </div>
                       <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-xl text-[10px] font-black text-white border border-white/10">
                         {Math.floor(item.timeline_seconds / 60)}:{(item.timeline_seconds % 60).toString().padStart(2, '0')}
                       </div>
                     </div>

                     <div className="flex-1 flex flex-col justify-center">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-100 dark:border-red-800">
                           {item.contents.creator_name}
                         </div>
                       </div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-snug">
                         {item.contents.title}
                       </h3>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-l-4 border-emerald-500">
                         <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed font-bold">
                           "{item.creator_review}"
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
