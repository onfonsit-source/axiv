-- places 테이블에 새 컬럼 추가
ALTER TABLE places
ADD COLUMN IF NOT EXISTS place_description TEXT,
ADD COLUMN IF NOT EXISTS waiting_tip TEXT,
ADD COLUMN IF NOT EXISTS parking_info TEXT;