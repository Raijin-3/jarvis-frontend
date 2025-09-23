// Script to create user_module_status table for tracking module completion and status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running user module status migration...');

  try {
    // Check if table already exists
    console.log('Checking if user_module_status table exists...');
    const { data: existingData, error: checkError } = await supabase
      .from('user_module_status')
      .select('id')
      .limit(1);

    const tableExists = !checkError;

    if (tableExists) {
      console.log('user_module_status table already exists');
    } else {
      console.log('Table does not exist. Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Create user_module_status table
CREATE TABLE public.user_module_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('optional', 'mandatory')),
  correctness_percentage INTEGER NOT NULL DEFAULT 0 CHECK (correctness_percentage >= 0 AND correctness_percentage <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user-module combination
  UNIQUE(user_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_module_status_user_id ON public.user_module_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_status_module_id ON public.user_module_status(module_id);
CREATE INDEX IF NOT EXISTS idx_user_module_status_status ON public.user_module_status(status);

-- Enable RLS
ALTER TABLE public.user_module_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own module status" ON public.user_module_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module status" ON public.user_module_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module status" ON public.user_module_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_module_status TO authenticated;
GRANT ALL ON public.user_module_status TO service_role;
      `);
    }

    if (checkError && !checkError.message.includes('does not exist')) {
      console.error('Error checking table:', checkError);
      return;
    }

    console.log('Migration check completed');

  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

runMigration();
