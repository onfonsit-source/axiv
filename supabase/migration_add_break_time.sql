-- break_time 컬럼 추가: 장소의 브레이크타임 정보 저장
ALTER TABLE places ADD COLUMN IF NOT EXISTS break_time TEXT DEFAULT '';