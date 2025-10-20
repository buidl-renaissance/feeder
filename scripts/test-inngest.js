#!/usr/bin/env node

/**
 * Test script to verify Inngest setup
 * This script tests the Inngest API endpoint and functions
 */

const http = require('http');

const INNGEST_URL = 'http://localhost:3003/api/inngest';
const INNGEST_DEV_URL = 'http://localhost:8288';

async function testInngestEndpoint() {
  console.log('🧪 Testing Inngest Setup...\n');

  // Test 1: Check if Inngest API endpoint is accessible
  console.log('1️⃣ Testing Inngest API endpoint...');
  try {
    const response = await fetch(INNGEST_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Inngest API endpoint is accessible');
    } else {
      console.log(`❌ Inngest API endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Failed to connect to Inngest API: ${error.message}`);
    console.log('💡 Make sure Next.js is running on port 3003');
    return false;
  }

  // Test 2: Check if Inngest Dev Server is running
  console.log('\n2️⃣ Testing Inngest Dev Server...');
  try {
    const response = await fetch(INNGEST_DEV_URL, {
      method: 'GET',
    });

    if (response.ok) {
      console.log('✅ Inngest Dev Server is running');
    } else {
      console.log(`❌ Inngest Dev Server returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Failed to connect to Inngest Dev Server: ${error.message}`);
    console.log('💡 Make sure to run: yarn inngest:dev');
    return false;
  }

  // Test 3: Test event sending
  console.log('\n3️⃣ Testing event sending...');
  try {
    const testEvent = {
      name: 'test/event',
      data: {
        message: 'Hello from test script!',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(INNGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    if (response.ok) {
      console.log('✅ Event sent successfully');
    } else {
      console.log(`❌ Event sending failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Failed to send event: ${error.message}`);
  }

  console.log('\n🎉 Inngest setup test completed!');
  console.log('\n📋 Next steps:');
  console.log('   • Open http://localhost:8288 to view Inngest Dev Server');
  console.log('   • Check the Functions tab to see your registered functions');
  console.log('   • Use the Events tab to monitor event processing');
  console.log('   • Test your functions by triggering events from the UI');

  return true;
}

// Run the test
testInngestEndpoint().catch(console.error);
