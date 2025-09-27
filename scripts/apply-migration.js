// Script to apply migration by executing SQL commands individually
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSteps = [
  {
    name: 'Create user_subject_selections table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_subject_selections (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        selected_subjects uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT user_subject_selections_pkey PRIMARY KEY (id),
        CONSTRAINT user_subject_selections_user_id_unique UNIQUE (user_id),
        CONSTRAINT user_subject_selections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
      )
    `
  },
  {
    name: 'Create index on user_id',
    sql: 'CREATE INDEX IF NOT EXISTS idx_user_subject_selections_user_id ON public.user_subject_selections (user_id)'
  },
  {
    name: 'Enable RLS',
    sql: 'ALTER TABLE public.user_subject_selections ENABLE ROW LEVEL SECURITY'
  },
  {
    name: 'Create RLS policy',
    sql: `
      CREATE POLICY IF NOT EXISTS "Users can manage their own subject selections" ON public.user_subject_selections
      FOR ALL USING (auth.uid() = user_id)
    `
  },
  {
    name: 'Grant permissions',
    sql: 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subject_selections TO authenticated'
  },
  {
    name: 'Add column to profiles table',
    sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject_selection_completed boolean DEFAULT false'
  }
];

async function applyMigration() {
  console.log('Applying user subject selections migration...');
  
  for (const step of migrationSteps) {
    console.log(`\nExecuting: ${step.name}`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: step.sql });
      
      if (error) {
        console.error(`❌ Failed to execute ${step.name}:`, error);
        
        // For some steps, we can try alternative approaches
        if (step.name === 'Create RLS policy' && error.code === 'PGRST202') {
          console.log('⚠️ Cannot execute RLS policy creation via RPC, this may need to be done manually in Supabase dashboard');
          continue;
        }
        
        if (step.name === 'Grant permissions' && error.code === 'PGRST202') {
          console.log('⚠️ Cannot execute grant permissions via RPC, this may need to be done manually in Supabase dashboard');
          continue;
        }
        
        // For critical failures, stop
        if (step.name.includes('Create table') || step.name.includes('Add column')) {
          console.error('Critical migration step failed. Stopping.');
          return;
        }
      } else {
        console.log(`✅ ${step.name} completed`);
      }
    } catch (e) {
      console.error(`❌ Unexpected error in ${step.name}:`, e.message);
    }
  }
  
  console.log('\n🔍 Verifying migration...');
  
  // Check if table exists
  try {
    const { data, error } = await supabase
      .from('user_subject_selections')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ user_subject_selections table verification failed:', error.message);
    } else {
      console.log('✅ user_subject_selections table verified');
    }
  } catch (e) {
    console.log('❌ Table verification error:', e.message);
  }
  
  // Check profiles table column
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subject_selection_completed')
      .limit(1);
    
    if (error) {
      console.log('❌ profiles table column verification failed:', error.message);
    } else {
      console.log('✅ subject_selection_completed column verified');
    }
  } catch (e) {
    console.log('❌ Column verification error:', e.message);
  }
  
  console.log('\n✅ Migration process completed!');
}

applyMigration();