import asyncio
import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .utils import extract_video_id, get_youtube_full_data, perform_free_search, call_ai_model, get_coordinates, perform_deep_search
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

    # 2. 3단계 검색 (제목 → 장소명 → 상세정보)
    search_context = perform_deep_search(raw_data['title'], raw_data['uploader'])

    # 3. AI 분석 프롬프트 — 강화 버전
    prompt = f"""
    당신은 유튜브 영상 정보를 분석하여 DB에 저장할 최적의 장소 정보를 추출하는 전문가입니다.
    제공된 정보를 종합하여 크리에이터가 실제로 방문한 장소들을 추출하세요.

    [입력 데이터]
    - 제목: {raw_data['title']}
    - 채널: {raw_data['uploader']}
    - 상세설명: {raw_data['description'][:1500]}
    - 자막: {raw_data['transcript'][:10000]}
    - 웹검색결과: {search_context[:8000]}

    중요 지침:
    1. 제공된 웹검색결과에는 실제 장소의 전화번호, 주소, 영업시간, 메뉴 정보가 포함되어 있습니다. 이를 적극 활용하세요.
    2. 장소 이름이 확실하지 않으면 영상 제목과 자막에서 가장 자주 언급된 장소명을 사용하세요.
    3. 전화번호는 반드시 웹검색결과에서 찾아서 채우세요. "000-0000-0000" 형식.
    4. 주소는 웹검색결과에서 찾아서 상세 도로명 주소로 채우세요.
    5. 모든 필드를 가능한 한 채우려고 노력하세요. 정보가 불완전해도 최선을 다해 유추하세요.
    6. 절대 빈 문자열("")로 남겨두지 마세요. 정보가 없더라도 웹검색결과나 자막에서 추론 가능한 내용을 채우세요.
    7. menu_with_prices는 자막이나 웹검색에서 찾은 실제 메뉴 정보를 "메뉴명 가격원\\n메뉴명 가격원" 형식으로 작성하세요.
    8. business_hours는 검색 결과에서 찾은 영업시간과 휴무일 정보를 함께 작성하세요 (예: "매일 11:00-22:00 (일요일 휴무)").
    9. waiting_tip에는 웨이팅/대기/줄서기 관련 정보를 작성하세요 (예: "점심시간 대기 있음, 평일 오후 추천"). 정보가 없으면 "정보 없음"으로 남기지 말고 "없음"으로 표시.
    10. parking_info에는 주차 가능 여부와 주차 관련 정보를 작성하세요 (예: "주차 가능 (건물 지하 1층)", "인근 유료 주차장 이용"). 정보가 없으면 "없음"으로 표시.
    11. place_description에는 장소 분위기, 특징, 추천 이유를 자연스럽게 작성하세요.

    응답 JSON 형식 — 반드시 배열로만 응답:
    [
      {{
        "place_name": "확정된 상호명",
        "address": "상세 도로명 주소 (몰라도 검색결과나 맥락에서 추론)",
        "phone": "전화번호 (몰라도 검색결과에서 찾아서)",
        "category": "카테고리 (food/cafe/camping/fishing/travel/accommodation 중 가장 적합한 하나. 음식점은 food, 카페는 cafe, 숙박은 accommodation으로 통일)",
        "business_hours": "영업시간 및 휴무일 정보 (예: 매일 11:00-22:00 / 일요일 휴무)",
        "menu_with_prices": "메뉴명 가격원\\n메뉴명 가격원",
        "place_description": "장소 분위기, 특징, 추천 이유",
        "waiting_tip": "웨이팅/대기 관련 정보 (없으면 '없음')",
        "parking_info": "주차 가능 여부 및 주차 정보 (없으면 '없음')",
        "creator_review": "유튜브 리뷰 핵심 요약",
        "summary": "이 장소가 어떤 곳인지 종합 요약 (음식 종류, 분위기, 가격대 포함)",
        "timeline_seconds": 0
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
