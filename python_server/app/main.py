import asyncio
import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .utils import extract_video_id, get_youtube_full_data, perform_free_search, call_ai_model, get_coordinates, perform_deep_search, perform_place_detail_search
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
    1. 웹검색결과([일반검색], [전화번호주소], [영업시간], [메뉴정보], [블로그리뷰])에는 전화번호, 주소, 영업시간, 메뉴/가격 정보가 포함되어 있습니다. 반드시 모든 섹션을 꼼꼼히 확인해서 정보를 채우세요.
    2. 장소 이름이 확실하지 않으면 영상 제목과 자막에서 가장 자주 언급된 장소명을 사용하세요.
    3. 전화번호는 반드시 웹검색결과 [전화번호주소] 섹션에서 찾아서 "000-0000-0000" 형식으로 채우세요.
    4. 주소는 웹검색결과 [전화번호주소] 섹션에서 찾아서 상세 도로명 주소로 채우세요.
    5. 모든 필드를 가능한 한 채우려고 노력하세요. 정보가 불완전해도 최선을 다해 유추하세요.
    6. 절대 빈 문자열("")로 남겨두지 마세요. 정보가 없더라도 웹검색결과나 자막에서 추론 가능한 내용을 채우세요.
    7. menu_with_prices는 [메뉴정보] 섹션에서 찾은 실제 메뉴명과 가격을 "메뉴명 가격원\\n메뉴명 가격원" 형식으로 빠짐없이 작성하세요. 메뉴가 여러 개면 모두 포함하세요.
    8. business_hours는 [영업시간] 섹션에서 찾은 영업시간과 휴무일 정보를 "매일 11:00-22:00 / 일요일 휴무" 형식으로 작성하세요. 브레이크타임 정보가 있으면 break_time에 별도로 기록하고 business_hours에는 포함하지 마세요. 웹검색결과에 정보가 없으면 제목이나 자막에서 추론하세요.
    9. waiting_tip에는 웨이팅/대기/줄서기 관련 정보를 작성하세요 (예: "점심시간 대기 있음, 평일 오후 추천"). [블로그리뷰] 섹션에서 찾아서 채우세요. 정보가 없으면 "없음".
    10. parking_info에는 주차 가능 여부와 주차 관련 정보를 작성하세요 (예: "주차 가능 (건물 지하 1층)", "인근 유료 주차장 이용"). [블로그리뷰] 섹션에서 찾아서 채우세요. 정보가 없으면 "없음".
    11. place_description은 장소 분위기, 특징, 추천 이유를 2-3문장으로 자연스럽게 작성하세요. [블로그리뷰]와 자막 정보를 종합해서 생생하게 묘사하세요.
    12. break_time은 [영업시간] 섹션에서 브레이크타임 정보를 찾아 "15:00-17:00" 형식으로 작성하세요. 브레이크타임 정보가 없으면 빈 문자열로 남기세요.

    응답 JSON 형식 — 반드시 배열로만 응답:
    [
      {{
        "place_name": "확정된 상호명",
        "address": "상세 도로명 주소 (몰라도 검색결과나 맥락에서 추론)",
        "phone": "전화번호 (몰라도 검색결과에서 찾아서)",
        "category": "카테고리 (food/cafe/camping/fishing/travel/accommodation 중 가장 적합한 하나. 음식점은 food, 카페는 cafe, 숙박은 accommodation으로 통일)",
        "business_hours": "영업시간 및 휴무일 정보 (예: 매일 11:00-22:00 / 일요일 휴무)",
        "break_time": "브레이크타임 정보 (예: 15:00-17:00, 없으면 빈 문자열)",
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

    # JSON 추출 및 파싱 (1차 분석)
    places = []
    try:
        json_match = re.search(r'\[\s*\{.*\}\s*\]', raw_analysis, re.DOTALL)
        if json_match:
            places = json.loads(json_match.group(0))
        else:
            places = json.loads(raw_analysis)
    except Exception as e:
        print(f"1st AI Parse Error: {e}")
        places = []

    # 4. 각 장소별 상세 검색 (상호명 기반)
    if places:
        print(f"1차 분석 완료: {len(places)}개 장소 발견. 상세 검색 시작...")
        place_detail_context = ""
        for i, place in enumerate(places):
            pname = place.get('place_name', '')
            if pname and '미상' not in pname:
                detail = perform_place_detail_search(pname)
                if detail:
                    place_detail_context += f"\n=== [{pname}] 상세 검색 결과 ===\n{detail}\n"

        # 5. 2차 AI 분석: 상세 검색 결과로 정보 보강
        if place_detail_context:
            print("2차 AI 분석 시작: 상세 정보 보강 중...")
            second_prompt = f"""
    1차 분석에서 추출된 장소 목록입니다:
    {json.dumps(places, ensure_ascii=False, indent=2)}

    각 장소별 상세 검색 결과입니다:
    {place_detail_context[:10000]}

    위 1차 분석 결과에 상세 검색 결과를 반영하여, 각 장소의 정보를 보강한 최종 JSON 배열만 응답하세요.

    중요 지침:
    1. [전화번호주소] 섹션에서 address와 phone 정보를 찾아 업데이트하세요.
    2. [영업시간] 섹션에서 business_hours 정보를 업데이트하세요. 브레이크타임 정보가 별도로 있으면 break_time 필드에 "15:00-17:00" 형식으로 작성하세요.
    3. [메뉴정보] 섹션에서 menu_with_prices 정보를 업데이트하세요.
    4. 1차 분석의 기존 정보는 최대한 유지하되, 상세 검색 결과가 더 정확하면 덮어쓰세요.
    5. 반드시 1차 분석과 동일한 개수의 장소를 동일한 순서로 유지하세요.
    6. 빈 문자열("")로 남겨두지 말고 최선을 다해 정보를 채우세요.

    응답 JSON 형식 — 반드시 배열만 응답:
    [
      {{
        "place_name": "상호명",
        "address": "상세 도로명 주소",
        "phone": "전화번호",
        "category": "카테고리",
        "business_hours": "영업시간 및 휴무일",
        "break_time": "브레이크타임 (없으면 빈 문자열)",
        "menu_with_prices": "메뉴명 가격원",
        "place_description": "장소 설명",
        "waiting_tip": "웨이팅 정보 (없으면 '없음')",
        "parking_info": "주차 정보 (없으면 '없음')",
        "creator_review": "크리에이터 리뷰 요약",
        "summary": "종합 요약",
        "timeline_seconds": 0
      }}
    ]
    """
            second_analysis = call_ai_model(second_prompt)
            try:
                json_match2 = re.search(r'\[\s*\{.*\}\s*\]', second_analysis, re.DOTALL)
                if json_match2:
                    places = json.loads(json_match2.group(0))
                else:
                    places = json.loads(second_analysis)
                print(f"2차 분석 완료: {len(places)}개 장소 정보 보강됨")
            except Exception as e:
                print(f"2nd AI Parse Error (1차 결과 유지): {e}")

        # 6. 주소 기반 좌표 추출 (Geocoding)
        for place in places:
            addr = place.get('address', '')
            lat, lng = get_coordinates(addr)
            place['lat'] = lat
            place['lng'] = lng

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
