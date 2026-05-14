-- places 테이블에 누락된 컬럼들 추가
ALTER TABLE places
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS representative_menu TEXT,
ADD COLUMN IF NOT EXISTS place_description TEXT,
ADD COLUMN IF NOT EXISTS waiting_tip TEXT,
ADD COLUMN IF NOT EXISTS parking_info TEXT;