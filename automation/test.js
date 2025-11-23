// Simple test script for meeting automation
const MeetingAgent = require('./meetingAgent');

async function testAutomation() {
  console.log('🔄 Testing meeting automation...');
  
  const agent = new MeetingAgent();
  
  try {
    // Initialize agent
    console.log('Initializing browser...');
    const initialized = await agent.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize browser');
      return;
    }
    
    console.log('✅ Browser initialized successfully');
    
    // Test navigation to Google Meet
    const testMeeting = {
      meetingId: 'test-' + Date.now(),
      url: 'https://meet.google.com/new',
      platform: 'google-meet',
      credentials: {
        displayName: 'Test Automation'
      }
    };
    
    console.log('Testing Google Meet navigation...');
    const result = await agent.joinMeeting(testMeeting);
    
    if (result.success) {
      console.log('✅ Successfully navigated to Google Meet');
      
      // Wait a few seconds then clean up
      setTimeout(async () => {
        await agent.leaveMeeting(testMeeting.meetingId);
        await agent.cleanup();
        console.log('✅ Test completed successfully');
        process.exit(0);
      }, 5000);
    } else {
      console.error('❌ Failed to navigate to Google Meet:', result.error);
      await agent.cleanup();
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await agent.cleanup();
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testAutomation();
}

module.exports = testAutomation;