from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .utils import extract_video_id, get_youtube_full_data, perform_free_search, call_ai_model, get_coordinates
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="YouTube Analysis Python Server")

class AnalyzeRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"message": "YouTube Analysis Server is running!"}

@app.post("/analyze-video")
async def analyze_video(request: AnalyzeRequest):
    url = request.url
    
    # 1. 유튜브 데이터 추출 (yt-dlp)
    raw_data = get_youtube_full_data(url)
    if not raw_data:
        raise HTTPException(status_code=400, detail="유튜브 데이터를 추출할 수 없습니다.")

    # 2. 무료 검색 수행 (영상 정보 기반 장소 수집)
    search_query = f"{raw_data['title']} {raw_data['uploader']} 식당 장소 위치 주소 메뉴"
    search_context = perform_free_search(search_query)

    # 3. AI 분석 프롬프트 (DB 저장 구조 최적화)
    prompt = f"""
    당신은 유튜브 영상 정보를 분석하여 DB에 저장할 최적의 장소 정보를 추출하는 전문가입니다.
    제공된 정보를 종합하여 크리에이터가 실제로 방문한 장소들을 추출하세요.

    [입력 데이터]
    - 제목: {raw_data['title']}
    - 채널: {raw_data['uploader']}
    - 상세설명: {raw_data['description'][:1500]}
    - 자막: {raw_data['transcript'][:10000]}
    - 웹검색결과: {search_context}

    추출 규칙:
    1. 반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 설명은 일절 배제하십시오.
    2. 각 항목은 DB 저장용으로 최대한 구체적이어야 합니다.
    3. menu_with_prices는 "메뉴명 가격\\n" 형태로 최대한 상세히 나열하세요.
    4. business_hours는 영업시간, 휴무일을 상세히 적으세요.
    5. place_description에는 주차, 예약, 웨이팅, 분위기 정보를 포함하세요.
    6. timeline_seconds는 장소가 등장하는 시간을 유추하여 숫자로 기입하세요 (모르면 0).
    7. 정보를 찾을 수 없는 필드는 빈 문자열 ""로 처리하세요.

    응답 JSON 형식:
    [
      {{
        "place_name": "확정된 상호명",
        "address": "상세 도로명 주소",
        "phone": "전화번호",
        "category": "정밀 카테고리",
        "business_hours": "상세 영업시간 및 휴무 정보",
        "menu_with_prices": "메뉴명 가격\\n메뉴명 가격",
        "place_description": "주차, 웨이팅, 분위기 등 상세 특징",
        "creator_review": "유튜브 리뷰 핵심 요약",
        "summary": "장소 종합 요약",
        "timeline_seconds": 120
      }}
    ]
    """

    raw_analysis = call_ai_model(prompt)
    
    # JSON 추출 및 파싱
    places = []
    try:
        json_match = re.search(r'\[\s*\{.*\}\s*\]', raw_analysis, re.DOTALL)
        if json_match:
            places = json.loads(json_match.group(0))
        else:
            places = json.loads(raw_analysis)
            
        # 4. 주소 기반 좌표 추출 (Geocoding)
        for place in places:
            addr = place.get('address', '')
            lat, lng = get_coordinates(addr)
            place['lat'] = lat
            place['lng'] = lng
            
    except Exception as e:
        print(f"JSON Parse/Geocode Error: {e}")
        places = []

    return {
        "video_id": raw_data['video_id'],
        "metadata": {
            "title": raw_data['title'],
            "creator_name": raw_data['uploader'],
            "thumbnail_url": raw_data['thumbnail_url'],
            "url": url
        },
        "places": places 
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
