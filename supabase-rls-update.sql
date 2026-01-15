-- RLS Policy Updates for Relation App
-- Run this in Supabase SQL Editor to update existing tables
-- This ensures comprehensive Row Level Security across all tables

-- =====================================================
-- PROFILES TABLE RLS
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view connected profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view request sender profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view profiles of their connections
CREATE POLICY "Users can view connected profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_b FROM connections WHERE user_a = auth.uid()
      UNION
      SELECT user_a FROM connections WHERE user_b = auth.uid()
    )
  );

-- Users can view profiles of people who sent them connection requests
CREATE POLICY "Users can view request sender profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT from_user_id FROM connection_requests
      WHERE to_user_id = auth.uid()
         OR normalize_phone(to_phone) = normalize_phone((SELECT phone FROM profiles WHERE id = auth.uid()))
    )
  );

-- =====================================================
-- CONNECTIONS TABLE RLS
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;

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
-- CONNECTION_REQUESTS TABLE RLS
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can create requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can delete sent requests" ON connection_requests;

-- Users can view requests they sent, received (by user_id), or matched by phone
CREATE POLICY "Users can view own requests" ON connection_requests
  FOR SELECT USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
    OR normalize_phone(to_phone) = normalize_phone((SELECT phone FROM profiles WHERE id = auth.uid()))
  );

-- Users can create requests (must be the sender)
CREATE POLICY "Users can create requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update requests they received (by user_id or phone match)
CREATE POLICY "Users can update received requests" ON connection_requests
  FOR UPDATE USING (
    auth.uid() = to_user_id
    OR normalize_phone(to_phone) = normalize_phone((SELECT phone FROM profiles WHERE id = auth.uid()))
  );

-- Users can delete requests they sent
CREATE POLICY "Users can delete sent requests" ON connection_requests
  FOR DELETE USING (auth.uid() = from_user_id);

-- =====================================================
-- SCHEMA UPDATES
-- =====================================================

-- Make to_name nullable (no longer required)
ALTER TABLE connection_requests ALTER COLUMN to_name DROP NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'connections', 'connection_requests');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
