-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (triggered on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Events Policies
-- Hosts can view their own events
CREATE POLICY "Hosts can view own events"
  ON events FOR SELECT
  USING (auth.uid() = host_user_id);

-- Anyone can view events by event_code (for guest access)
CREATE POLICY "Anyone can view events by code"
  ON events FOR SELECT
  USING (true);

-- Hosts can create events
CREATE POLICY "Hosts can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- Hosts can update their own events
CREATE POLICY "Hosts can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = host_user_id);

-- Hosts can delete their own events
CREATE POLICY "Hosts can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = host_user_id);

-- Contributions Policies
-- Anyone can insert contributions (guest access)
CREATE POLICY "Anyone can create contributions"
  ON contributions FOR INSERT
  WITH CHECK (true);

-- Hosts can view contributions for their events
CREATE POLICY "Hosts can view event contributions"
  ON contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
      AND events.host_user_id = auth.uid()
    )
  );

-- Anyone can view approved contributions (for live wall)
CREATE POLICY "Anyone can view approved contributions"
  ON contributions FOR SELECT
  USING (status = 'approved');

-- Hosts can update contributions for their events
CREATE POLICY "Hosts can update event contributions"
  ON contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
      AND events.host_user_id = auth.uid()
    )
  );

-- Hosts can delete contributions for their events
CREATE POLICY "Hosts can delete event contributions"
  ON contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
      AND events.host_user_id = auth.uid()
    )
  );

-- Subscriptions Policies
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
