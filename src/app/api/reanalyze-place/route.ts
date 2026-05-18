import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { place_name } = body;

    if (!place_name || place_name.trim().length < 2) {
      return NextResponse.json({ places: [] }, { status: 400 });
    }

    const response = await fetch(`${PYTHON_SERVER_URL}/api/reanalyze-place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_name: place_name.trim() }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(`Python server error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Reanalyze API Error:', error);
    return NextResponse.json(
      { error: error.message || '재검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}