-- Complete Relation Database Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  headline TEXT,
  location TEXT,
  about TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  linkedin_url TEXT,
  website TEXT,
  industry TEXT,
  stage TEXT,
  raising BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raising BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view connected profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view request sender profiles" ON profiles;

-- Policies
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;

-- Policies
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_a);

CREATE POLICY "Users can delete own connections" ON connections
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- =====================================================
-- CONNECTION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_phone TEXT NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make to_name nullable if it exists with NOT NULL
ALTER TABLE connection_requests ALTER COLUMN to_name DROP NOT NULL;

-- Enable RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can create requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can delete sent requests" ON connection_requests;

-- Policies
CREATE POLICY "Users can view own requests" ON connection_requests
  FOR SELECT USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can create requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete sent requests" ON connection_requests
  FOR DELETE USING (auth.uid() = from_user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to normalize phone numbers
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, avatar_url, headline)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'headline'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to match connection request to user by phone
CREATE OR REPLACE FUNCTION match_connection_request_to_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_user_id UUID;
  normalized_phone TEXT;
BEGIN
  normalized_phone := normalize_phone(NEW.to_phone);

  SELECT id INTO matched_user_id
  FROM profiles
  WHERE normalize_phone(phone) = normalized_phone
  LIMIT 1;

  IF matched_user_id IS NOT NULL THEN
    NEW.to_user_id := matched_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to match phone on request insert
DROP TRIGGER IF EXISTS on_connection_request_created ON connection_requests;
CREATE TRIGGER on_connection_request_created
  BEFORE INSERT ON connection_requests
  FOR EACH ROW EXECUTE FUNCTION match_connection_request_to_user();

-- Function to match pending requests when user updates phone
CREATE OR REPLACE FUNCTION match_pending_requests_on_phone_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND (OLD.phone IS NULL OR NEW.phone != OLD.phone) THEN
    UPDATE connection_requests
    SET to_user_id = NEW.id,
        updated_at = NOW()
    WHERE normalize_phone(to_phone) = normalize_phone(NEW.phone)
      AND to_user_id IS NULL
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to match requests on phone update
DROP TRIGGER IF EXISTS on_profile_phone_updated ON profiles;
CREATE TRIGGER on_profile_phone_updated
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION match_pending_requests_on_phone_update();

DROP TRIGGER IF EXISTS on_profile_phone_inserted ON profiles;
CREATE TRIGGER on_profile_phone_inserted
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION match_pending_requests_on_phone_update();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'connections', 'connection_requests');

-- List all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
