// Script to add user_id and module_id to assessment_responses table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running assessment responses migration...');

  try {
    // Check if columns already exist
    console.log('Checking existing schema...');
    const { data: existingData, error: checkError } = await supabase
      .from('assessment_responses')
      .select('user_id, module_id')
      .limit(1);

    if (checkError && !checkError.message.includes('column')) {
      console.error('Error checking schema:', checkError);
      return;
    }

    const hasUserId = !checkError || !checkError.message.includes('user_id');
    const hasModuleId = !checkError || !checkError.message.includes('module_id');

    if (hasUserId && hasModuleId) {
      console.log('Columns user_id and module_id already exist');
    } else {
      console.log('Columns missing. Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Add user_id, module_id, and skipped columns to assessment_responses table
ALTER TABLE public.assessment_responses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.assessment_responses
ADD COLUMN IF NOT EXISTS module_id UUID;

ALTER TABLE public.assessment_responses
ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id
ON public.assessment_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_module_id
ON public.assessment_responses(module_id);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_module
ON public.assessment_responses(user_id, module_id);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_skipped
ON public.assessment_responses(skipped);
      `);
    }

    console.log('Migration check completed');

  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

runMigration();
