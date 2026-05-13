'use client';

import { GoogleMap, LoadScriptNext, Marker, InfoWindow, Circle, OverlayView } from '@react-google-maps/api';

import { motion, AnimatePresence } from 'framer-motion';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ExternalLink, Phone, ShoppingBag, Navigation, Clock, MapPin, Star, X } from 'lucide-react';




const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 37.5665, lng: 126.9780 };

const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f8fafc" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  }
];

const categoryColors: Record<string, string> = {
  food: '#10B981',
  cafe: '#F59E0B',
  camping: '#059669',
  fishing: '#2563EB',
  travel: '#8B5CF6',
  hiking: '#15803D',
  sightseeing: '#FBBF24',
  accommodation: '#EC4899',
};

interface MapProps {
  places: any[];
  onBoundsChange?: (bounds: any) => void;
}

export default function MapContainer({ places, onBoundsChange }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'info'>('basic');

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.log('Geolocation failed')
      );
    }
  }, []);

  const handleCenterUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onIdle = useCallback(() => {
    if (mapRef.current && onBoundsChange) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        });
      }
    }
  }, [onBoundsChange]);

  if (!apiKey) return <div className="h-full bg-slate-50 flex items-center justify-center font-black text-slate-300">API Key Missing</div>;

  return (
    <div className="relative h-full w-full">
      <LoadScriptNext googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || defaultCenter}
          zoom={13}
          onLoad={onMapLoad}
          onIdle={onIdle}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: mapStyles,
          }}
        >
          {/* User Location Marker */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={200}
                options={{
                  fillColor: '#3B82F6',
                  fillOpacity: 0.15,
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.3,
                  strokeWeight: 1,
                }}
              />
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                }}
              />
            </>
          )}

          {/* Place Markers */}
          {places.map((place) => (
            <Marker
              key={place.id}
              position={{ lat: Number(place.lat), lng: Number(place.lng) }}
              onClick={() => setSelectedPlace(place)}
              label={{
                text: place.place_name,
                color: "#10B981",
                fontWeight: "900",
                fontSize: "11px",
                className: "marker-label bg-white/90 px-2 py-1 rounded-lg border border-emerald-500 shadow-xl backdrop-blur-md translate-y-8"
              }}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: categoryColors[place.category] || '#10B981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.6,
              }}
            />
          ))}

          {selectedPlace && (
            <OverlayView
              position={{ lat: Number(selectedPlace.lat), lng: Number(selectedPlace.lng) }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="absolute -translate-x-1/2 -translate-y-[calc(100%+60px)] z-[1000]">
                <div className="w-[300px] bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 relative">
                  {/* Persistent Header: Shop Name & Category */}
                  <div className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-slate-900 text-lg tracking-tighter leading-tight">{selectedPlace.place_name}</h3>
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 rounded-md">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            <span className="text-[9px] font-black text-amber-600">4.5</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPlace.category}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedPlace(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0 ml-4"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Tab Header */}
                  <div className="flex bg-slate-50 border-y border-slate-100 mt-4">
                    <button 
                      onClick={() => setActiveTab('basic')}
                      className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all ${activeTab === 'basic' ? 'bg-white text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      BASIC
                    </button>
                    <button 
                      onClick={() => setActiveTab('info')}
                      className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      INFO
                    </button>
                  </div>

                  <div className="p-4 pt-4">
                    {activeTab === 'basic' ? (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        {/* Video Thumbnail (Clickable) */}
                        {selectedPlace.content_places?.[0]?.contents?.thumbnail_url && (
                          <a 
                            href={`https://youtube.com/watch?v=${selectedPlace.content_places[0].contents.video_id}&t=${selectedPlace.content_places[0].timeline_seconds}s`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block w-full h-32 rounded-2xl overflow-hidden group"
                          >
                            <img src={selectedPlace.content_places[0].contents.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="thumb" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                               <Play className="w-8 h-8 text-white fill-white opacity-80" />
                            </div>
                            <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white">
                              {selectedPlace.content_places[0].contents.creator_name} 추천 영상
                            </span>
                          </a>
                        )}

                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Representative Menu</p>
                          <p className="text-xs font-bold text-slate-700 line-clamp-2">
                            {selectedPlace.representative_menu || '상세 정보에서 확인하세요'}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                          <button 
                            onClick={() => router.push(`/place/${selectedPlace.id}`)}
                            className="w-full py-3 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-emerald-600 transition-all active:scale-95 shadow-xl"
                          >
                            상세보기 및 리뷰
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 group">
                            <Clock className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hours</p>
                              <p className="text-xs font-bold text-slate-700">{selectedPlace.business_hours || '상세 정보 없음'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Address</p>
                              <p className="text-xs font-bold text-slate-700 leading-snug">{selectedPlace.address}</p>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(selectedPlace.address); alert('주소가 복사되었습니다.'); }}
                                className="mt-2 text-[10px] font-black text-emerald-600 hover:underline"
                              >
                                주소 복사하기
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact</p>
                              {selectedPlace.phone ? (
                                <a href={`tel:${selectedPlace.phone}`} className="text-xs font-black text-emerald-600 underline underline-offset-2">{selectedPlace.phone}</a>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">전화번호 정보 없음</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direction Links */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                          <a 
                            href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.place_name)}`}
                            target="_blank"
                            className="flex items-center justify-center gap-2 py-2.5 bg-[#03C75A] text-white rounded-xl text-[10px] font-black hover:opacity-90 transition-all active:scale-95 shadow-md"
                          >
                            <span className="w-4 h-4 bg-white text-[#03C75A] rounded flex items-center justify-center text-[10px]">N</span>
                            네이버 지도
                          </a>
                          <a 
                            href={`https://map.kakao.com/link/search/${encodeURIComponent(selectedPlace.place_name)}`}
                            target="_blank"
                            className="flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] text-[#3C1E1E] rounded-xl text-[10px] font-black hover:opacity-90 transition-all active:scale-95 shadow-md"
                          >
                            <span className="w-4 h-4 bg-[#3C1E1E] text-[#FEE500] rounded flex items-center justify-center text-[10px]">K</span>
                            카카오 맵
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </LoadScriptNext>


      {/* Floating Controls */}
      <div className="absolute bottom-10 right-6 z-20 flex flex-col gap-3">
        <button 
          onClick={handleCenterUser}
          className="w-12 h-12 bg-white rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center group hover:bg-emerald-500 transition-all active:scale-90"
        >
          <Navigation className="w-5 h-5 text-slate-600 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
