-- ============================================================
-- THOUGHTNEST — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

CREATE TABLE users (
  id         uuid references auth.users primary key,
  name       text not null,
  email      text not null,
  role       text not null default 'viewer',
  avatar_url text,
  created_at timestamp default now()
);

CREATE TABLE posts (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  image_url  text,
  author_id  uuid references users(id) on delete cascade,
  summary    text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

CREATE TABLE comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references posts(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  comment_text text not null,
  created_at   timestamp default now()
);

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. POLICIES — users
-- ------------------------------------------------------------

CREATE POLICY "users: public read"
  ON users FOR SELECT USING (true);

CREATE POLICY "users: insert own row"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON users FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------
-- POLICIES — posts
-- ------------------------------------------------------------

CREATE POLICY "posts: public read"
  ON posts FOR SELECT USING (true);

CREATE POLICY "posts: author insert"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts: author or admin update"
  ON posts FOR UPDATE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "posts: admin delete"
  ON posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- POLICIES — comments
-- ------------------------------------------------------------

CREATE POLICY "comments: public read"
  ON comments FOR SELECT USING (true);

CREATE POLICY "comments: authenticated insert"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments: user delete own"
  ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments: admin delete any"
  ON comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- 4. STORAGE — run AFTER creating the bucket in the Dashboard
-- Dashboard → Storage → New Bucket → name: "post-images" → Public: ON
-- ------------------------------------------------------------

CREATE POLICY "post-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- ------------------------------------------------------------
-- 5. AUTO-INSERT TRIGGER
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
