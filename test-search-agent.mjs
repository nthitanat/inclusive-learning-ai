/**
 * Test script for DuckDuckGo Search Agent
 * Run this to verify the search functionality is working
 */

import { searchAgent } from '../src/lib/searchAgent';

async function testSearchAgent() {
  console.log('🧪 Testing DuckDuckGo Search Agent...\n');

  try {
    // Test basic search functionality
    console.log('1️⃣ Testing teaching process examples search...');
    const teachingExamples = await searchAgent.searchTeachingProcessExamples(
      'วิทยาศาสตร์',
      'ระบบหายใจ',
      'มัธยมศึกษาปีที่ 2'
    );
    console.log(`✅ Found ${teachingExamples.length} teaching process examples:`);
    teachingExamples.forEach((example, idx) => {
      console.log(`   ${idx + 1}. ${example.substring(0, 100)}...`);
    });

    console.log('\n2️⃣ Testing UDL strategies search...');
    const strategies = await searchAgent.searchUDLStrategies(
      'วิทยาศาสตร์',
      'ระบบหายใจ',
      [
        { type: 'นักเรียนปกติ', percentage: '70' },
        { type: 'นักเรียนที่มีความต้องการพิเศษ', percentage: '30' }
      ]
    );
    console.log(`✅ Found ${strategies.udlStrategies.length} UDL strategies and ${strategies.inclusiveStrategies.length} inclusive strategies`);

    console.log('\n3️⃣ Testing lesson details search...');
    const lessonDetails = await searchAgent.getLessonDetails(
      'วิทยาศาสตร์',
      'ระบบหายใจ',
      'มัธยมศึกษาปีที่ 2'
    );
    console.log(`✅ Lesson details: ${lessonDetails.substring(0, 200)}...`);

    console.log('\n4️⃣ Testing complete enhanced search...');
    const enhancedData = await searchAgent.performEnhancedSearch(
      'คณิตศาสตร์',
      'สมการกำลังสอง',
      'มัธยมศึกษาปีที่ 3',
      [{ type: 'นักเรียนปกติ', percentage: '80' }, { type: 'นักเรียนเก่ง', percentage: '20' }]
    );

    console.log('\n🎉 Complete Enhanced Search Results:');
    console.log(`📚 Teaching Processes: ${enhancedData.teachingProcessExamples.length}`);
    console.log(`🎯 UDL Strategies: ${enhancedData.udlStrategies.length}`);
    console.log(`🤝 Inclusive Strategies: ${enhancedData.inclusiveStrategies.length}`);
    console.log(`📝 Lesson Details Length: ${enhancedData.lessonDetails.length} chars`);

    console.log('\n✅ All tests completed successfully!');
    console.log('🔍 DuckDuckGo Search Agent is working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSearchAgent();
