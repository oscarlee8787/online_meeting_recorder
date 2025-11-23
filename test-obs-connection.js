import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();

async function testConnection() {
  console.log('🔍 Testing OBS WebSocket connection...');
  
  try {
    // Test basic connection without password
    console.log('📡 Attempting connection to ws://127.0.0.1:4455...');
    await obs.connect('ws://127.0.0.1:4455');
    console.log('✅ Connected successfully without password!');
    
    // Test a simple request
    const version = await obs.call('GetVersion');
    console.log('🎯 OBS Version:', version);
    
    await obs.disconnect();
    console.log('👋 Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure OBS Studio is running');
    console.log('2. Go to Tools → WebSocket Server Settings');
    console.log('3. Enable "WebSocket server"');
    console.log('4. Check if authentication is required');
    
    if (error.message.includes('authentication')) {
      console.log('\n🔐 Authentication required. Testing with password...');
      const password = process.argv[2];
      if (password) {
        try {
          await obs.connect('ws://127.0.0.1:4455', password);
          console.log('✅ Connected successfully with password!');
          await obs.disconnect();
        } catch (authError) {
          console.error('❌ Authentication failed:', authError.message);
        }
      } else {
        console.log('💡 Run: node test-obs-connection.js YOUR_PASSWORD');
      }
    }
  }
}

testConnection();