// Test script for Chatbot Analytics API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

let token = '';

async function login() {
  try {
    console.log('🔐 Authenticating test user...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'user@finvision.com',
      password: 'userpassword'
    });
    token = response.data.token;
    console.log('✅ Authenticated successfully!');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

async function testExpenditureEndpoint() {
  try {
    console.log('\n🧪 Testing /api/chatbot-analytics/expenditure...');
    const response = await axios.get(`${BASE_URL}/api/chatbot-analytics/expenditure`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Expenditure endpoint working:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Expenditure endpoint error:', error.message);
    return null;
  }
}

async function testAnalyzeEndpoint(expenditureData) {
  try {
    console.log('\n🧪 Testing /api/chatbot-analytics/analyze...');
    const response = await axios.post(
      `${BASE_URL}/api/chatbot-analytics/analyze`,
      {
        query: 'What are my top spending categories?',
        hasFileData: false,
        expenditureData: expenditureData
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('✅ Analyze endpoint working');
    console.log('Response preview:', response.data.analysis.substring(0, 200) + '...');
    return response.data;
  } catch (error) {
    console.error('❌ Analyze endpoint error:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Chatbot Analytics API Tests...');
  
  await login();
  
  const expenditureData = await testExpenditureEndpoint();
  
  if (expenditureData) {
    await testAnalyzeEndpoint(expenditureData);
  }
  
  console.log('\n✨ Test complete!');
}

runTests();
