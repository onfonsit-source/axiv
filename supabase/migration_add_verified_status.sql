-- places 테이블에 verified 컬럼 추가 (관리자 승인 상태)
ALTER TABLE places ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- 인덱스: 승인된/미승인 장소 조회 최적화
CREATE INDEX IF NOT EXISTS idx_places_verified ON places(verified);