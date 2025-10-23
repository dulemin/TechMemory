-- Allow anonymous users to update their just-inserted pending contributions
-- This is needed for the storage upload pattern:
-- 1. INSERT contribution (get ID)
-- 2. Upload file to storage with contribution ID
-- 3. UPDATE contribution with content_url

CREATE POLICY "Anyone can update just inserted pending contributions"
  ON contributions FOR UPDATE
  USING (
    -- Allow updating pending contributions that were just created (within last 60 seconds)
    status = 'pending' AND created_at > NOW() - INTERVAL '60 seconds'
  )
  WITH CHECK (
    -- Only allow updating pending contributions (don't allow changing status to approved/rejected)
    status = 'pending' AND created_at > NOW() - INTERVAL '60 seconds'
  );
