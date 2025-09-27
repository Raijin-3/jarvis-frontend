// Script to check if migration is already done
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigration() {
  console.log('Checking migration status...');
  
  // Check if user_subject_selections table exists
  try {
    const { data, error } = await supabase
      .from('user_subject_selections')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ user_subject_selections table does not exist');
      } else {
        console.log('user_subject_selections table error:', error);
      }
    } else {
      console.log('✅ user_subject_selections table exists');
    }
  } catch (e) {
    console.log('Error checking user_subject_selections table:', e.message);
  }
  
  // Check if profiles table has subject_selection_completed column
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subject_selection_completed')
      .limit(1);
    
    if (error) {
      console.log('❌ subject_selection_completed column does not exist in profiles table');
    } else {
      console.log('✅ subject_selection_completed column exists in profiles table');
    }
  } catch (e) {
    console.log('Error checking profiles table:', e.message);
  }
}

checkMigration();