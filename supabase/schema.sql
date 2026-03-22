-- ============================================
-- Domain Marketplace Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles table (auto-created on first SSO login)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  name        text,
  avatar_url  text,
  created_at  timestamp WITH TIME ZONE DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain_name       text NOT NULL UNIQUE,
  asking_price      integer,  -- in cents, NULL = price on request
  description       text,
  category          text NOT NULL DEFAULT 'other',
  contact_email     text NOT NULL,
  verify_token      text NOT NULL,
  status            text NOT NULL DEFAULT 'pending_verification'
                    CHECK (status IN ('pending_verification', 'verified', 'sold', 'removed')),
  created_at        timestamp WITH TIME ZONE DEFAULT now(),
  updated_at        timestamp WITH TIME ZONE DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on first SSO sign-in
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Listings: public can see verified listings
CREATE POLICY "Anyone can view verified listings"
  ON listings FOR SELECT
  USING (status = 'verified' OR seller_id = auth.uid());

-- Listings: authenticated users can insert their own
CREATE POLICY "Sellers can create listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Listings: sellers can update their own
CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = seller_id);

-- Listings: sellers can delete their own
CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = seller_id);
