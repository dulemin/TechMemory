-- Allow anonymous users to read their own just-inserted pending contributions
-- This is needed for the INSERT...RETURNING pattern in upload components

DROP POLICY IF EXISTS "Anyone can read just inserted contributions" ON contributions;

CREATE POLICY "Anyone can read just inserted contributions"
  ON contributions FOR SELECT
  USING (
    -- Allow reading pending contributions that were just created (within last 60 seconds)
    status = 'pending' AND created_at > NOW() - INTERVAL '60 seconds'
  );
