-- Create diagrams table
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Diagram',
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    app_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    share_token TEXT UNIQUE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can see their own diagrams
CREATE POLICY "Users can view their own diagrams"
    ON public.diagrams
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can insert their own diagrams
CREATE POLICY "Users can insert their own diagrams"
    ON public.diagrams
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own diagrams
CREATE POLICY "Users can update their own diagrams"
    ON public.diagrams
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own diagrams
CREATE POLICY "Users can delete their own diagrams"
    ON public.diagrams
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create shared diagrams access
CREATE POLICY "Anyone can view shared diagrams"
    ON public.diagrams
    FOR SELECT
    USING (share_token IS NOT NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagrams_updated_at
    BEFORE UPDATE ON public.diagrams
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON public.diagrams(user_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_share_token ON public.diagrams(share_token);
