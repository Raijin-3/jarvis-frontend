// Script to create user subject selections table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running user subject selections migration...');
  
  // Read the migration SQL file
  const migrationPath = path.join(__dirname, '..', '..', 'jarvis-backend', 'supabase', '20250129_create_user_subject_selections.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration error:', error);
      return;
    }
    
    console.log('Migration completed successfully');
    
    // Test the schema by checking if the table exists
    const { data: tables, error: fetchError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_subject_selections');
    
    if (fetchError) {
      console.error('Test query error:', fetchError);
    } else if (tables && tables.length > 0) {
      console.log('✓ user_subject_selections table created successfully');
    } else {
      console.log('⚠ Table creation status uncertain');
    }
    
    // Test profiles table for new column
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('subject_selection_completed')
      .limit(1);
    
    if (profileError) {
      console.error('Profiles table test error:', profileError);
    } else {
      console.log('✓ subject_selection_completed column added to profiles table');
    }
    
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

runMigration();