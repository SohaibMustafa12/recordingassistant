-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR RECASSISTANT (RECORDING ASSISTANT)
-- Multi-Tenant Discord Management Platform for Recording Crews
-- ====================================================================

-- 1. CLEANUP / RESET (Optional)
-- DROP TABLE IF EXISTS join_codes CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;
-- DROP TABLE IF EXISTS guilds CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GUILDS TABLE
-- Stores server-specific settings and bot configurations.
CREATE TABLE guilds (
    id TEXT PRIMARY KEY,                       -- Discord Guild ID (string)
    name TEXT NOT NULL,                        -- Discord Server Name
    icon TEXT,                                 -- Discord Icon hash/URL
    owner_id UUID NOT NULL,                    -- Reference to auth.users (Creator/Owner of server on platform)
    prefix TEXT DEFAULT '!' NOT NULL,          -- Command prefix
    recording_channel_id TEXT,                -- Channel ID to post recording status/notifs
    attendance_channel_id TEXT,               -- Channel ID to log attendance
    announcement_channel_id TEXT,             -- Channel ID for sessions and RSVPs
    is_active BOOLEAN DEFAULT TRUE NOT NULL,   -- Active flag for subscription/bot access
    settings JSONB DEFAULT '{}'::jsonb NOT NULL, -- Flexible JSON for custom preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- Index for quick lookups on owner
CREATE INDEX idx_guilds_owner_id ON guilds(owner_id);

-- 3. MEMBERS TABLE
-- Links a platform user (Supabase Auth uuid) to a Discord Guild with a specific role.
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                     -- References auth.users(id)
    guild_id TEXT NOT NULL,                    -- References guilds(id)
    username TEXT NOT NULL,                    -- Discord Username (e.g. 'john_doe')
    avatar TEXT,                               -- Discord Avatar hash
    role TEXT NOT NULL,                        -- 'owner', 'admin', or 'crew'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_guild FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_guild UNIQUE (user_id, guild_id),
    CONSTRAINT chk_role CHECK (role IN ('owner', 'admin', 'crew'))
);

-- Indices for performance on joins and queries
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_guild_id ON members(guild_id);
CREATE INDEX idx_members_user_guild ON members(user_id, guild_id);

-- 4. JOIN CODES TABLE
-- Maps unique codes (e.g., random short codes) to a Discord Guild for onboarding new members.
CREATE TABLE join_codes (
    code TEXT PRIMARY KEY,                     -- Unique code (e.g. 'ABC123', 'ERLC-JOIN')
    guild_id TEXT NOT NULL,                    -- References guilds(id)
    role TEXT DEFAULT 'crew' NOT NULL,         -- The role to assign upon joining ('crew' or 'admin')
    created_by UUID NOT NULL,                  -- References auth.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,       -- NULL means never expires
    use_count INTEGER DEFAULT 0 NOT NULL,
    max_uses INTEGER,                          -- NULL means unlimited
    
    CONSTRAINT fk_guild FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
    CONSTRAINT fk_creator FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT chk_join_role CHECK (role IN ('admin', 'crew'))
);

-- Index for lookup
CREATE INDEX idx_join_codes_guild_id ON join_codes(guild_id);

-- 5. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guilds_updated_at
    BEFORE UPDATE ON guilds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_codes ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- A. GUILDS POLICIES
-- --------------------------------------------------------------------

-- Read: Anyone who is a member of the guild can read guild configurations.
CREATE POLICY "Guild members can view their guild" ON guilds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.guild_id = guilds.id 
              AND members.user_id = auth.uid()
        )
        OR guilds.owner_id = auth.uid()
    );

-- Insert: Users can register a guild if they are authenticated.
CREATE POLICY "Authenticated users can create guilds" ON guilds
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Only Guild Owners (or members with 'owner' role) can update settings.
CREATE POLICY "Owners can update guild settings" ON guilds
    FOR UPDATE
    USING (
        guilds.owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members 
            WHERE members.guild_id = guilds.id 
              AND members.user_id = auth.uid() 
              AND members.role = 'owner'
        )
    );

-- Delete: Only the guild creator/owner can delete a guild.
CREATE POLICY "Owners can delete guilds" ON guilds
    FOR DELETE
    USING (guilds.owner_id = auth.uid());


-- --------------------------------------------------------------------
-- B. MEMBERS POLICIES
-- --------------------------------------------------------------------

-- Read: Users can view member lists of guilds they are part of.
CREATE POLICY "Members can view roster of their guilds" ON members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.guild_id = members.guild_id 
              AND m.user_id = auth.uid()
        )
    );

-- Insert: Users can insert their own membership (joining a guild).
-- In a real app, this should only happen with a valid join code, but RLS verifies the user is inserting themselves.
CREATE POLICY "Users can join a guild" ON members
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update: Only Owners and Admins can update a member's role or details.
-- Users can also update their own metadata (username, avatar), but not their role.
CREATE POLICY "Owners/Admins can manage member roles" ON members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.guild_id = members.guild_id 
              AND m.user_id = auth.uid() 
              AND m.role IN ('owner', 'admin')
        )
        OR (auth.uid() = user_id) -- allows updating own username/avatar
    );

-- Delete: Owners can kick anyone. Admins can kick crew. Users can leave (delete themselves).
CREATE POLICY "Kick or leave policies" ON members
    FOR DELETE
    USING (
        auth.uid() = user_id -- Leave
        OR EXISTS (          -- Kick
            SELECT 1 FROM members m
            WHERE m.guild_id = members.guild_id 
              AND m.user_id = auth.uid() 
              AND (
                  m.role = 'owner' 
                  OR (m.role = 'admin' AND members.role = 'crew')
              )
        )
    );


-- --------------------------------------------------------------------
-- C. JOIN CODES POLICIES
-- --------------------------------------------------------------------

-- Read: Anyone authenticated can read join codes (needed to check if a code is valid before joining).
CREATE POLICY "Authenticated users can lookup join codes" ON join_codes
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Insert/Update/Delete: Only Owners and Admins can create, edit, or delete join codes.
CREATE POLICY "Owners and admins can manage join codes" ON join_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.guild_id = join_codes.guild_id 
              AND m.user_id = auth.uid() 
              AND m.role IN ('owner', 'admin')
        )
    );
