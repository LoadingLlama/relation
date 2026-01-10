-- Relation App Database Schema v2
-- Full MVP with mutual verification, progressive unlock, and insights

-- ============================================
-- 1. Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone_hash TEXT, -- Hashed phone number for verification
  avatar_url TEXT,
  contribution_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. Relationship Requests (pending connections)
-- ============================================
CREATE TABLE IF NOT EXISTS relationship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  to_phone_hash TEXT NOT NULL, -- Hashed phone of target person
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Set when matched
  to_name TEXT NOT NULL, -- Name provided by requester
  relationship_type TEXT NOT NULL CHECK (char_length(relationship_type) <= 30),
  hide_reason BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE relationship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their requests" ON relationship_requests
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    (to_user_id IS NULL AND to_phone_hash IN (SELECT phone_hash FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create requests" ON relationship_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests to them" ON relationship_requests
  FOR UPDATE USING (
    auth.uid() = to_user_id OR
    (to_user_id IS NULL AND to_phone_hash IN (SELECT phone_hash FROM users WHERE id = auth.uid()))
  );

-- ============================================
-- 3. Relationships (verified connections)
-- ============================================
CREATE TABLE IF NOT EXISTS relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  hide_reason BOOLEAN DEFAULT false,
  strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  last_interaction DATE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships they're part of" ON relationships
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Public can view non-hidden relationships" ON relationships
  FOR SELECT USING (hide_reason = false);

-- ============================================
-- 4. Functions
-- ============================================

-- Hash phone number function
CREATE OR REPLACE FUNCTION hash_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(phone::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Accept relationship request
CREATE OR REPLACE FUNCTION accept_relationship_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  req relationship_requests%ROWTYPE;
BEGIN
  -- Get the request
  SELECT * INTO req FROM relationship_requests WHERE id = request_id;

  IF req.id IS NULL THEN
    RETURN false;
  END IF;

  -- Update request status
  UPDATE relationship_requests
  SET status = 'accepted', to_user_id = auth.uid(), updated_at = NOW()
  WHERE id = request_id;

  -- Create the relationship (order users by ID for consistency)
  INSERT INTO relationships (user_a, user_b, relationship_type, hide_reason)
  VALUES (
    LEAST(req.from_user_id, auth.uid()),
    GREATEST(req.from_user_id, auth.uid()),
    req.relationship_type,
    req.hide_reason
  )
  ON CONFLICT (user_a, user_b) DO NOTHING;

  -- Update contribution scores
  UPDATE users SET contribution_score = contribution_score + 1 WHERE id = req.from_user_id;
  UPDATE users SET contribution_score = contribution_score + 1 WHERE id = auth.uid();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's network depth based on contribution
CREATE OR REPLACE FUNCTION get_network_depth(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rel_count
  FROM relationships
  WHERE user_a = user_id OR user_b = user_id;

  IF rel_count >= 5 THEN
    RETURN 3; -- Full global network
  ELSIF rel_count >= 2 THEN
    RETURN 2; -- Friends of friends
  ELSE
    RETURN 1; -- Local network only
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
CREATE INDEX IF NOT EXISTS idx_requests_to_phone ON relationship_requests(to_phone_hash);
CREATE INDEX IF NOT EXISTS idx_requests_status ON relationship_requests(status);
CREATE INDEX IF NOT EXISTS idx_relationships_users ON relationships(user_a, user_b);
