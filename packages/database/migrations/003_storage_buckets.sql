-- Storage Buckets Setup

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-media', 'event-media', true),
  ('qr-codes', 'qr-codes', true),
  ('exports', 'exports', false);

-- Storage Policies for event-media bucket
-- Anyone can upload to event-media (guest uploads)
CREATE POLICY "Anyone can upload event media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-media');

-- Anyone can view public event media
CREATE POLICY "Anyone can view event media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media');

-- Hosts can delete media from their events
CREATE POLICY "Hosts can delete event media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-media' AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = (storage.foldername(name))[1]
      AND events.host_user_id = auth.uid()
    )
  );

-- Storage Policies for qr-codes bucket
-- Hosts can upload QR codes
CREATE POLICY "Hosts can upload QR codes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-codes' AND
    auth.uid() IS NOT NULL
  );

-- Anyone can view QR codes
CREATE POLICY "Anyone can view QR codes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

-- Hosts can delete their own QR codes
CREATE POLICY "Hosts can delete own QR codes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'qr-codes' AND
    auth.uid() = owner
  );

-- Storage Policies for exports bucket
-- Hosts can upload exports
CREATE POLICY "Hosts can upload exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports' AND
    auth.uid() IS NOT NULL
  );

-- Hosts can view their own exports
CREATE POLICY "Hosts can view own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports' AND
    auth.uid() = owner
  );

-- Hosts can delete their own exports
CREATE POLICY "Hosts can delete own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports' AND
    auth.uid() = owner
  );
