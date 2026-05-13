import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: '유효한 URL이 아닙니다.' }, { status: 400 });
    }

    // 파이썬 서버 주소 (로컬 개발 환경 기준)
    const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:8000/analyze-video';

    console.log(`--- [Proxying to Python Server] ---`);
    console.log(`URL: ${url}`);

    const response = await fetch(PYTHON_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '파이썬 서버 분석 중 오류가 발생했습니다.');
    }

    const data = await response.json();

    // 프론트엔드에서 기대하는 형식으로 응답 (이미 파이썬 서버에서 맞춰둠)
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API Comprehensive Error:', error);
    return NextResponse.json({ 
      error: `서버 분석 오류: ${error.message}`,
      details: error.stack 
    }, { status: 500 });
  }
}
