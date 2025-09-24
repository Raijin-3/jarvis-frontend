// Script to run database migrations
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
  console.log('Running database migration...');
  
  const migrationSQL = `
    -- Add additional fields to courses table for the UI
    alter table public.courses 
    add column if not exists status text default 'draft' check (status in ('draft', 'published', 'archived'));

    alter table public.courses 
    add column if not exists difficulty text default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced'));

    alter table public.courses 
    add column if not exists category text default 'General';

    alter table public.courses 
    add column if not exists enrolled_count integer default 0;

    alter table public.courses 
    add column if not exists thumbnail text;

    alter table public.courses 
    add column if not exists duration integer default 0; -- in minutes
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration error:', error);
      return;
    }
    
    console.log('Migration completed successfully');
    
    // Test the schema by fetching courses
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('Test query error:', fetchError);
    } else {
      console.log('Schema test successful');
    }
    
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

runMigration();