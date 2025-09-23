#!/usr/bin/env node

/**
 * Migration script to create tables for user-specific learning paths
 * Run with: node web/scripts/migrate-user-learning-paths.js
 */

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const headers = {
  'apikey': supabaseServiceKey,
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'Content-Type': 'application/json'
};

const restUrl = `${supabaseUrl}/rest/v1`;

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const url = `${restUrl}/${endpoint}`;
  const options = {
    method,
    headers: { ...headers },
    cache: 'no-store'
  };

  if (method === 'POST') {
    options.headers['Prefer'] = 'return=representation';
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`Making ${method} request to: ${url}`);

  const response = await fetch(url, options);
  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Response: ${errorText}`);
    throw new Error(`API call failed: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  console.log(`Response text length: ${responseText.length}`);

  if (!responseText) {
    return [];
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse JSON response:', responseText);
    throw new Error(`JSON parse error: ${error.message}`);
  }
}

// SQL to create the tables
const createTablesSQL = `
-- Create user_learning_paths table
CREATE TABLE IF NOT EXISTS user_learning_paths (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    base_learning_path_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    career_goal VARCHAR(255),
    difficulty_level VARCHAR(100),
    estimated_duration_weeks INTEGER,
    icon VARCHAR(255),
    color VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_learning_paths
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_user_id ON user_learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_base_path ON user_learning_paths(base_learning_path_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_active ON user_learning_paths(is_active);

-- Create user_learning_path_steps table
CREATE TABLE IF NOT EXISTS user_learning_path_steps (
    id VARCHAR(255) PRIMARY KEY,
    user_learning_path_id VARCHAR(255) NOT NULL,
    base_step_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    step_type VARCHAR(100),
    order_index INTEGER,
    estimated_hours INTEGER,
    skills JSONB,
    prerequisites JSONB,
    resources JSONB,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_learning_path_steps
CREATE INDEX IF NOT EXISTS idx_user_steps_path_id ON user_learning_path_steps(user_learning_path_id);
CREATE INDEX IF NOT EXISTS idx_user_steps_base_step ON user_learning_path_steps(base_step_id);
CREATE INDEX IF NOT EXISTS idx_user_steps_order ON user_learning_path_steps(user_learning_path_id, order_index);

-- Create user_learning_path_progress table (if not exists)
CREATE TABLE IF NOT EXISTS user_learning_path_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    learning_path_id VARCHAR(255) NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    current_step_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_learning_path_progress
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_learning_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_path ON user_learning_path_progress(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_progress_percentage ON user_learning_path_progress(progress_percentage);

-- Create user_step_progress table (if not exists)
CREATE TABLE IF NOT EXISTS user_step_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    step_id VARCHAR(255) NOT NULL,
    learning_path_id VARCHAR(255) NOT NULL,
    time_spent_hours DECIMAL(5,2) DEFAULT 0,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_step_progress
CREATE INDEX IF NOT EXISTS idx_step_progress_user ON user_step_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_step ON user_step_progress(step_id);
CREATE INDEX IF NOT EXISTS idx_step_progress_path ON user_step_progress(learning_path_id);

-- Add unique constraints
ALTER TABLE user_learning_paths
ADD CONSTRAINT IF NOT EXISTS unique_user_base_path UNIQUE (user_id, base_learning_path_id);

ALTER TABLE user_learning_path_progress
ADD CONSTRAINT IF NOT EXISTS unique_user_path_progress UNIQUE (user_id, learning_path_id);

ALTER TABLE user_step_progress
ADD CONSTRAINT IF NOT EXISTS unique_user_step_completion UNIQUE (user_id, step_id);

-- Add foreign key constraints (only if profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE user_learning_paths
        ADD CONSTRAINT IF NOT EXISTS fk_user_learning_paths_user_id
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

        ALTER TABLE user_learning_path_progress
        ADD CONSTRAINT IF NOT EXISTS fk_user_progress_user_id
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

        ALTER TABLE user_step_progress
        ADD CONSTRAINT IF NOT EXISTS fk_user_step_progress_user_id
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for user_learning_path_steps
ALTER TABLE user_learning_path_steps
ADD CONSTRAINT IF NOT EXISTS fk_user_steps_path_id
FOREIGN KEY (user_learning_path_id) REFERENCES user_learning_paths(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE user_learning_paths IS 'Stores unique learning path instances for each user, allowing personalized modifications';
COMMENT ON TABLE user_learning_path_steps IS 'Stores the steps for user-specific learning paths with personalized content';
COMMENT ON TABLE user_learning_path_progress IS 'Tracks overall progress on learning paths (both regular and user-specific)';
COMMENT ON TABLE user_step_progress IS 'Tracks completion of individual steps within learning paths';
`;

async function runMigration() {
  console.log('🚀 Starting user learning paths migration...');

  try {
    // Execute the SQL using Supabase's RPC function
    // Note: This assumes you have the ability to run raw SQL via Supabase
    // If not, you'll need to run this SQL manually in your Supabase dashboard

    console.log('📋 SQL to execute:');
    console.log(createTablesSQL);

    // For Supabase, we might need to use the SQL editor in the dashboard
    // or create a custom RPC function. For now, we'll log the SQL.

    console.log('\n✅ Migration SQL generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Run the SQL to create the tables');

    // Optional: Try to check if tables were created (this won't work without RPC)
    console.log('\n🔍 Checking if tables exist...');

    try {
      // This would only work if we have permission to query information_schema
      const tables = await apiCall('information_schema.tables?table_schema=public&table_name=like.user_learning_paths');
      if (tables && tables.length > 0) {
        console.log('✅ user_learning_paths table exists');
      } else {
        console.log('⚠️  Could not verify table creation via API');
      }
    } catch (error) {
      console.log('⚠️  Could not verify table creation:', error.message);
    }

    return {
      success: true,
      message: 'Migration SQL generated. Please execute manually in Supabase dashboard.',
      sql: createTablesSQL
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute if run directly
if (typeof require !== 'undefined' && require.main === module) {
  runMigration()
    .then(result => {
      console.log('\n🎉 Migration preparation completed!');
      console.log(result);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
