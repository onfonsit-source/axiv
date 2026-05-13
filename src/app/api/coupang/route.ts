import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY || "f33510e9-fd10-4cbe-9b34-b905c4db07cb";
const SECRET_KEY = process.env.COUPANG_SECRET_KEY || "3167194fdcc9765cd85893d860c96b863ce3392c";

function generateHmac(method: string, path: string, secretKey: string, accessKey: string) {
  // 가이드에서 제공한 YYMMDDTHHMMSSZ 형식
  const now = new Date();
  const datetime = now.toISOString().replace(/[-:]/g, '').split('.')[0].substring(2) + 'Z';
  
  const message = datetime + method + path;
  const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export async function GET() {
  if (!ACCESS_KEY || !SECRET_KEY) {
    return NextResponse.json({ error: 'Coupang API keys not configured' }, { status: 500 });
  }

  const DOMAIN = 'https://api-gateway.coupang.com';
  const PATH = '/v2/providers/affiliate_open_api/apis/openapi/v2/products/reco';

  const requestBody = {
    "site": {
      "id": "1",
      "domain": "blog.naver.com" 
    },
    "device": {
      "id": "32chars_random_device_id_12345", 
      "lmt": 0
    },
    "imp": {
      "imageSize": "300x300"
    },
    "user": {
      "puid": "fonsinfo"
    }
  };

  try {
    const authorization = generateHmac('POST', PATH, SECRET_KEY, ACCESS_KEY);
    
    const response = await fetch(DOMAIN + PATH, {
      method: 'POST', // 가이드에 따라 POST 사용
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // API 응답 구조에 맞게 데이터 가공 (data.data에 배열이 들어있을 것으로 예상)
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Coupang API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
