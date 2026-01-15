-- FIX: Infinite recursion in RLS policies
-- The issue: profile policies query connection_requests, which queries profiles again

-- =====================================================
-- DROP ALL EXISTING POLICIES FIRST
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view connected profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view request sender profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;

DROP POLICY IF EXISTS "Users can view own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can create requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can delete sent requests" ON connection_requests;

-- =====================================================
-- PROFILES - Simple policies, no subqueries to other tables
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view ALL profiles (needed for connections display)
-- This is safe because profile data is meant to be shared with connections
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- CONNECTIONS - No circular dependencies
-- =====================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Users can create connections where they are user_a
CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_a);

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections" ON connections
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- =====================================================
-- CONNECTION_REQUESTS - Use auth.uid() directly, avoid profile lookups
-- =====================================================

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received (by to_user_id only)
CREATE POLICY "Users can view own requests" ON connection_requests
  FOR SELECT USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  );

-- Users can create requests
CREATE POLICY "Users can create requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update requests where they are the recipient
CREATE POLICY "Users can update received requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Users can delete requests they sent
CREATE POLICY "Users can delete sent requests" ON connection_requests
  FOR DELETE USING (auth.uid() = from_user_id);

-- =====================================================
-- SCHEMA UPDATE
-- =====================================================

-- Make to_name nullable
ALTER TABLE connection_requests ALTER COLUMN to_name DROP NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'connections', 'connection_requests');

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
