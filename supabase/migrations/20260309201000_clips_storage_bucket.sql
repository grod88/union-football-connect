-- Create storage bucket for clips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clips',
  'clips',
  true,
  524288000,  -- 500MB limit per file
  ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to clips bucket
CREATE POLICY "Public read access for clips" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'clips');

-- Allow authenticated uploads (or all for MVP)
CREATE POLICY "Allow uploads to clips" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'clips');

-- Allow updates
CREATE POLICY "Allow updates to clips" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'clips');

-- Allow deletes
CREATE POLICY "Allow deletes from clips" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'clips');
