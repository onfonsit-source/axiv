import requests
import re
import os
import yt_dlp
from duckduckgo_search import DDGS
from geopy.geocoders import Nominatim
from dotenv import load_dotenv

load_dotenv()

def extract_video_id(url):
    """YouTube URL에서 video_id를 추출합니다."""
    pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def get_coordinates(address):
    """주소를 기반으로 위도, 경도를 무료로 가져옵니다 (OpenStreetMap)"""
    if not address or address == "":
        return 37.5665, 126.9780 # 기본값: 서울시청

    try:
        # user_agent는 필수입니다.
        geolocator = Nominatim(user_agent="axiv_analyzer")
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print(f"📍 Geocoding Error ({address}): {e}")
    
    return 37.5665, 126.9780 # 실패 시 기본값

def get_youtube_full_data(url):
    """yt-dlp를 사용하여 유튜브 메타데이터와 자막을 추출합니다."""
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'quiet': True,
        'no_warnings': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        title = info.get('title', '')
        description = info.get('description', '')
        uploader = info.get('uploader', '')
        thumbnail_url = info.get('thumbnail', '')
        
        # 자막 추출
        transcript_text = ""
        sub_url = None
        if 'ko' in info.get('subtitles', {}):
            subs = info['subtitles']['ko']
            sub_url = subs[0]['url'] if isinstance(subs, list) else subs.get('url')
        elif 'ko' in info.get('automatic_captions', {}):
            subs = info['automatic_captions']['ko']
            sub_url = subs[0]['url'] if isinstance(subs, list) else subs.get('url')

        if sub_url:
            if 'fmt=json3' not in sub_url: sub_url += '&fmt=json3'
            res = requests.get(sub_url)
            events = res.json().get('events', [])
            transcript_text = " ".join(["".join([s.get('utf8', '') for s in e.get('segs', [])]) for e in events if 'segs' in e])

        return {
            "video_id": info.get('id'),
            "title": title,
            "description": description,
            "uploader": uploader,
            "thumbnail_url": thumbnail_url,
            "transcript": transcript_text
        }
    except Exception as e:
        print(f"yt-dlp Error: {e}")
        return None

def perform_free_search(query):
    """DuckDuckGo를 이용해 무료 웹 검색을 수행하고 컨텍스트를 생성합니다."""
    try:
        with DDGS() as dg:
            results = dg.text(query, max_results=5)
            context = ""
            for r in results:
                context += f"[Source: {r['href']}] {r['body']}\n\n"
            return context
    except Exception as e:
        print(f"Search Error: {e}")
        return ""

def call_ai_model(prompt):
    """NVIDIA NIM API를 사용하여 AI 분석을 수행합니다."""
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
    NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL = "google/gemma-4-31b-it"
    
    if not NVIDIA_API_KEY:
        return "AI API 키가 설정되지 않았습니다."

    payload = {
        "model": NVIDIA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    
    try:
        response = requests.post(f"{NVIDIA_BASE_URL}/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        print(f"AI API Error: {e}")
        return f"AI 분석 중 오류 발생: {str(e)}"
