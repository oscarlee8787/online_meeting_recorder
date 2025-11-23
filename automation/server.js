const express = require('express');
const cors = require('cors');
const MeetingAgent = require('./meetingAgent');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize meeting agent
const meetingAgent = new MeetingAgent();
let agentReady = false;

// Initialize agent on startup
(async () => {
  try {
    agentReady = await meetingAgent.initialize();
    if (agentReady) {
      logger.info('Meeting agent ready for automation');
    } else {
      logger.error('Failed to initialize meeting agent');
    }
  } catch (error) {
    logger.error('Agent initialization error:', error);
  }
})();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: agentReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString(),
    activeSessions: meetingAgent.getActiveSessionsCount()
  });
});

// Join meeting endpoint
app.post('/api/join-meeting', async (req, res) => {
  if (!agentReady) {
    return res.status(503).json({
      success: false,
      error: 'Meeting agent not ready'
    });
  }

  try {
    const { meetingId, url, platform, credentials, title } = req.body;
    
    // Validate required fields
    if (!meetingId || !url || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: meetingId, url, platform'
      });
    }

    logger.info(`Join request for meeting: ${title || meetingId} (${platform})`);

    const result = await meetingAgent.joinMeeting({
      meetingId,
      url,
      platform,
      credentials: credentials || {}
    });

    if (result.success) {
      logger.info(`Successfully processed join for meeting: ${meetingId}`);
    } else {
      logger.warn(`Join failed for meeting: ${meetingId}`, result.error);
    }

    res.json(result);

  } catch (error) {
    logger.error('Join meeting endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Leave meeting endpoint
app.post('/api/leave-meeting', async (req, res) => {
  try {
    const { meetingId } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing meetingId'
      });
    }

    const result = await meetingAgent.leaveMeeting(meetingId);
    res.json(result);

  } catch (error) {
    logger.error('Leave meeting endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get active sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const count = await meetingAgent.getActiveSessionsCount();
    res.json({
      activeSessions: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for development
app.post('/api/test-automation', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required for test' });
    }

    // Simple test - just navigate to URL and take screenshot
    const result = await meetingAgent.testNavigation(url);
    res.json(result);

  } catch (error) {
    logger.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await meetingAgent.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await meetingAgent.cleanup();
  process.exit(0);
});

// Error handling
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Meeting automation service running on port ${PORT}`);
});

module.exports = app;