-- Relation Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/ufwqkoenmcngcynjiqaz/sql)

-- Profiles table (extends Supabase auth.users)
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
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can view profiles of their connections (for later)
CREATE POLICY "Users can view connected profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_b FROM connections WHERE user_a = auth.uid()
      UNION
      SELECT user_a FROM connections WHERE user_b = auth.uid()
    )
  );

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- Enable Row Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Policy: Users can insert connections where they are user_a
CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_a);

-- Policy: Users can delete their own connections
CREATE POLICY "Users can delete own connections" ON connections
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_email TEXT NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests they sent or received
CREATE POLICY "Users can view own requests" ON connection_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy: Users can create requests
CREATE POLICY "Users can create requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Policy: Users can update requests they received
CREATE POLICY "Users can update received requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Policy: Users can delete requests they sent
CREATE POLICY "Users can delete sent requests" ON connection_requests
  FOR DELETE USING (auth.uid() = from_user_id);

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
