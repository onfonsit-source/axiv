import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.VWORLD_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'VWORLD_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { query, address } = await req.json();

    // === 모드 1: 상호명(place_name)으로 검색 ===
    if (query && query.length >= 2) {
      // VWorld Search API: 상호명으로 주소+좌표 검색
      const searchUrl = `https://api.vworld.kr/req/search?service=search&request=search&key=${apiKey}&query=${encodeURIComponent(query)}&type=place&page=1&size=5&format=json`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (data?.response?.status === 'OK' && data?.response?.result?.items?.length > 0) {
        const first = data.response.result.items[0];
        const roadAddr = first.address?.road || '';
        const parcelAddr = first.address?.parcel || '';
        return NextResponse.json({
          lat: parseFloat(first.point?.y || 0),
          lng: parseFloat(first.point?.x || 0),
          fullAddress: roadAddr || parcelAddr || '',
          roadAddress: roadAddr,
          parcelAddress: parcelAddr,
          placeName: first.title || query,
          source: 'vworld-search'
        });
      }
      // 검색 실패 시 address 기반 fallback
    }

    // === 모드 2: 주소로 좌표 변환 (fallback) ===
    if (address && address.length >= 2) {
      const addrUrl = `https://api.vworld.kr/req/address?service=address&request=getCoord&key=${apiKey}&address=${encodeURIComponent(address)}&type=PARCEL&epsg=4326`;
      const res = await fetch(addrUrl);
      const data = await res.json();

      if (data?.response?.status === 'OK' && data?.response?.result?.point) {
        const { x: lng, y: lat } = data.response.result.point;
        return NextResponse.json({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          fullAddress: address,
          source: 'vworld-coord'
        });
      }
    }

    return NextResponse.json({ error: 'VWORLD geocoding failed' }, { status: 404 });
  } catch (err) {
    console.error('VWORLD geocoding error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}