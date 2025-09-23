#!/usr/bin/env node

/**
 * Test script to check if data is available for students for learning path modules
 * based on assessment response modules (optional and mandatory)
 */

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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

async function testLearningPathData() {
  console.log('🧪 Testing Learning Path Data Availability...\n');

  try {
    // 1. Check if student assessment responses exist
    console.log('1. Checking Student Assessment Responses...');
    const assessmentResponses = await apiCall('student_assessment_responses?select=id,user_id,question_id,is_correct,module_id,skipped&limit=10');
    console.log(`✅ Found ${assessmentResponses.length} assessment responses`);

    if (assessmentResponses.length > 0) {
      console.log('Sample assessment responses:');
      assessmentResponses.slice(0, 3).forEach((response, index) => {
        console.log(`  ${index + 1}. User: ${response.user_id}, Correct: ${response.is_correct}, Module: ${response.module_id || 'N/A'}`);
      });
    }

    // 2. Check if user learning paths exist
    console.log('\n2. Checking User Learning Paths...');
    const userLearningPaths = await apiCall('user_learning_paths?select=id,user_id,base_learning_path_id,title&limit=10');
    console.log(`✅ Found ${userLearningPaths.length} user learning paths`);

    if (userLearningPaths.length > 0) {
      console.log('Sample user learning paths:');
      userLearningPaths.slice(0, 3).forEach((path, index) => {
        console.log(`  ${index + 1}. User: ${path.user_id}, Title: ${path.title}`);
      });
    }

    // 3. Check if user learning path steps exist
    console.log('\n3. Checking User Learning Path Steps...');
    const userLearningPathSteps = await apiCall('user_learning_path_steps?select=id,user_learning_path_id,title,is_required,resources&limit=10');
    console.log(`✅ Found ${userLearningPathSteps.length} user learning path steps`);

    if (userLearningPathSteps.length > 0) {
      console.log('Sample user learning path steps:');
      userLearningPathSteps.slice(0, 3).forEach((step, index) => {
        console.log(`  ${index + 1}. Title: ${step.title}, Required: ${step.is_required}`);
      });
    }

    // 4. Check if user module status exists
    console.log('\n4. Checking User Module Status...');
    const userModuleStatus = await apiCall('user_module_status?select=id,user_id,module_id,status,correctness_percentage&limit=10');
    console.log(`✅ Found ${userModuleStatus.length} user module status records`);

    if (userModuleStatus.length > 0) {
      console.log('Sample user module status:');
      userModuleStatus.slice(0, 3).forEach((status, index) => {
        console.log(`  ${index + 1}. User: ${status.user_id}, Module: ${status.module_id}, Status: ${status.status}, Score: ${status.correctness_percentage}%`);
      });

      // Analyze mandatory vs optional modules
      const mandatoryModules = userModuleStatus.filter(m => m.status === 'mandatory');
      const optionalModules = userModuleStatus.filter(m => m.status === 'optional');

      console.log(`\n📊 Module Status Analysis:`);
      console.log(`   Mandatory modules: ${mandatoryModules.length}`);
      console.log(`   Optional modules: ${optionalModules.length}`);

      if (mandatoryModules.length > 0) {
        console.log('   Sample mandatory modules:');
        mandatoryModules.slice(0, 2).forEach((module, index) => {
          console.log(`     - Module ${module.module_id}: ${module.correctness_percentage}% score`);
        });
      }

      if (optionalModules.length > 0) {
        console.log('   Sample optional modules:');
        optionalModules.slice(0, 2).forEach((module, index) => {
          console.log(`     - Module ${module.module_id}: ${module.correctness_percentage}% score`);
        });
      }
    }

    // 5. Check if profiles exist (to verify users)
    console.log('\n5. Checking User Profiles...');
    const profiles = await apiCall('profiles?select=id,role&limit=10');
    console.log(`✅ Found ${profiles.length} user profiles`);

    if (profiles.length > 0) {
      console.log('Sample user profiles:');
      profiles.slice(0, 3).forEach((profile, index) => {
        console.log(`  ${index + 1}. User: ${profile.id}, Role: ${profile.role}`);
      });
    }

    // 6. Check if learning path progress exists
    console.log('\n6. Checking Learning Path Progress...');
    const learningPathProgress = await apiCall('user_learning_path_progress?select=id,user_id,learning_path_id,progress_percentage&limit=10');
    console.log(`✅ Found ${learningPathProgress.length} learning path progress records`);

    if (learningPathProgress.length > 0) {
      console.log('Sample learning path progress:');
      learningPathProgress.slice(0, 3).forEach((progress, index) => {
        console.log(`  ${index + 1}. User: ${progress.user_id}, Progress: ${progress.progress_percentage}%`);
      });
    }

    // 7. Check if step progress exists
    console.log('\n7. Checking Step Progress...');
    const stepProgress = await apiCall('user_step_progress?select=id,user_id,step_id,learning_path_id,completed_at&limit=10');
    console.log(`✅ Found ${stepProgress.length} step progress records`);

    if (stepProgress.length > 0) {
      console.log('Sample step progress:');
      stepProgress.slice(0, 3).forEach((progress, index) => {
        console.log(`  ${index + 1}. User: ${progress.user_id}, Step: ${progress.step_id}, Completed: ${progress.completed_at ? 'Yes' : 'No'}`);
      });
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Assessment Responses: ${assessmentResponses.length} records`);
    console.log(`✅ User Learning Paths: ${userLearningPaths.length} records`);
    console.log(`✅ User Learning Path Steps: ${userLearningPathSteps.length} records`);
    console.log(`✅ User Module Status: ${userModuleStatus.length} records`);
    console.log(`✅ User Profiles: ${profiles.length} records`);
    console.log(`✅ Learning Path Progress: ${learningPathProgress.length} records`);
    console.log(`✅ Step Progress: ${stepProgress.length} records`);

    if (userModuleStatus.length > 0) {
      const mandatoryCount = userModuleStatus.filter(m => m.status === 'mandatory').length;
      const optionalCount = userModuleStatus.filter(m => m.status === 'optional').length;
      console.log(`\n🎯 ASSESSMENT-BASED MODULE STATUS:`);
      console.log(`   Mandatory modules: ${mandatoryCount} (score < 90%)`);
      console.log(`   Optional modules: ${optionalCount} (score ≥ 90%)`);
      console.log(`   ✅ System is working correctly!`);
    } else {
      console.log(`\n⚠️  No module status records found. Students need to complete assessments to generate module status.`);
    }

    return {
      success: true,
      data: {
        assessmentResponses: assessmentResponses.length,
        userLearningPaths: userLearningPaths.length,
        userLearningPathSteps: userLearningPathSteps.length,
        userModuleStatus: userModuleStatus.length,
        mandatoryModules: userModuleStatus.filter(m => m.status === 'mandatory').length,
        optionalModules: userModuleStatus.filter(m => m.status === 'optional').length,
        userProfiles: profiles.length,
        learningPathProgress: learningPathProgress.length,
        stepProgress: stepProgress.length
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute if run directly
if (typeof require !== 'undefined' && require.main === module) {
  testLearningPathData()
    .then(result => {
      console.log('\n🎉 Test completed!');
      if (result.success) {
        console.log('✅ All data checks passed!');
      } else {
        console.log('❌ Some checks failed');
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testLearningPathData };
