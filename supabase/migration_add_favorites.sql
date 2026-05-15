-- favorites 테이블 생성
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, place_id)
);

-- 인덱스: 특정 유저의 즐겨찾기 목록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- 인덱스: 특정 장소가 즐겨찾기된 횟수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_favorites_place_id ON favorites(place_id);