CREATE TABLE "t_user" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "t_video" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "file_key" TEXT NOT NULL,
  "tags" TEXT[],
  "regions_blocked" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "t_video_comment" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "video_id" TEXT NOT NULL REFERENCES "t_video"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "t_user"("id") ON DELETE CASCADE,
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "t_video" ("id", "title", "description", "file_key", "regions_blocked", "tags", "created_at", "updated_at")
VALUES
('1bd3148c-c784-44fe-ae85-a581cdaa2523', 'Fish detective', 'Cartoon about fish detective', 'videos/1bd3148c-c784-44fe-ae85-a581cdaa2523/856787-hd_1920_1080_30fps.mp4', ARRAY['France', 'Germany', 'South Korea', 'Netherlands', 'Japan'], ARRAY['Cartoon', '12+'], '2025-06-12T19:17:50.248Z', '2025-06-13T15:57:10.221Z'),
('5e32b2d8-712e-4349-b82f-c616666b4a63', 'Blocked in Turkey', 'Something interesting but blocked in Turkey', 'videos/5e32b2d8-712e-4349-b82f-c616666b4a63/5795049-uhd_4096_2160_25fps.mp4', ARRAY['Turkey'], ARRAY['18+', 'Criminal'], '2025-06-12T21:57:28.329Z', '2025-06-12T21:57:28.329Z'),
('8a86ad2b-6868-40e3-9d55-5c174ff19d46', 'Super Cat!', 'Small story about cat', 'videos/8a86ad2b-6868-40e3-9d55-5c174ff19d46/3116737-hd_1920_1080_25fps.mp4', ARRAY[]::text[], ARRAY['Comedy', 'Children'], '2025-06-12T15:50:18.970Z', '2025-06-12T15:50:18.970Z');

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "t_video" ADD COLUMN "search_combined" TEXT;

UPDATE "t_video"
SET "search_combined" = coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' ');

CREATE FUNCTION trg_search_combined_update() RETURNS trigger AS $$
BEGIN
  NEW.search_combined := coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '') || ' ' || array_to_string(NEW.tags, ' ');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_search_combined
BEFORE INSERT OR UPDATE ON "t_video"
FOR EACH ROW EXECUTE FUNCTION trg_search_combined_update();

CREATE INDEX idx_video_combined_trgm ON "t_video"
USING GIN ("search_combined" gin_trgm_ops);

ALTER TABLE "t_video"
ADD COLUMN "search_vector" tsvector;

UPDATE "t_video" SET "search_vector" =
  to_tsvector('english', search_combined);

CREATE FUNCTION trg_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.search_combined);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_search_vector
BEFORE INSERT OR UPDATE ON "t_video"
FOR EACH ROW EXECUTE FUNCTION trg_search_vector_update();

CREATE INDEX idx_video_search_vector ON "t_video"
USING GIN ("search_vector");
