-- Supabase Schema for NeuraTranslate

-- Force cleanup of existing table to apply new column names
DROP TABLE IF EXISTS sessions CASCADE;

-- Idempotent type creation
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN 
        CREATE TYPE session_status AS ENUM ('waiting', 'active', 'ended'); 
    END IF; 
END $$;

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code TEXT UNIQUE NOT NULL,
    usera_language TEXT NOT NULL,
    userb_language TEXT,
    status session_status DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (for MVP)
CREATE POLICY "Allow anonymous read" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON sessions FOR UPDATE USING (true);
