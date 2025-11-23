const puppeteer = require('puppeteer');
const logger = require('./logger');

class MeetingAgent {
  constructor() {
    this.browser = null;
    this.activeSessions = new Map();
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--allow-running-insecure-content',
          '--autoplay-policy=no-user-gesture-required',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
      });
      
      logger.info('Meeting agent browser initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      return false;
    }
  }

  async joinMeeting(meetingData) {
    const { url, platform, meetingId, credentials } = meetingData;
    
    logger.info(`Attempting to join meeting: ${meetingId} on ${platform}`);
    
    try {
      const page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Grant permissions for microphone and camera
      const context = this.browser.defaultBrowserContext();
      await context.overridePermissions(url, ['microphone', 'camera']);
      
      // Set up audio/video settings
      await page.evaluateOnNewDocument(() => {
        navigator.mediaDevices.getUserMedia = () => Promise.resolve({
          getVideoTracks: () => [{ stop: () => {} }],
          getAudioTracks: () => [{ stop: () => {} }],
          getTracks: () => []
        });
      });

      // Navigate to meeting
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      let joinResult;
      
      // Route to platform-specific handler
      switch (platform) {
        case 'google-meet':
          joinResult = await this.handleGoogleMeet(page, credentials);
          break;
        case 'zoom':
          joinResult = await this.handleZoom(page, credentials);
          break;
        case 'teams':
          joinResult = await this.handleTeams(page, credentials);
          break;
        default:
          joinResult = await this.handleGenericPlatform(page, credentials);
      }
      
      if (joinResult.success) {
        this.activeSessions.set(meetingId, { page, startTime: Date.now() });
        logger.info(`Successfully joined meeting: ${meetingId}`);
      } else {
        await page.close();
        logger.error(`Failed to join meeting: ${meetingId}`, joinResult.error);
      }
      
      return joinResult;
      
    } catch (error) {
      logger.error(`Error joining meeting ${meetingId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async leaveMeeting(meetingId) {
    const session = this.activeSessions.get(meetingId);
    if (!session) {
      return { success: false, error: 'Meeting session not found' };
    }

    try {
      await session.page.close();
      this.activeSessions.delete(meetingId);
      
      logger.info(`Left meeting: ${meetingId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error leaving meeting ${meetingId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async handleGoogleMeet(page, credentials) {
    try {
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Check if authentication is needed
      const emailInput = await page.$('#identifierId');
      if (emailInput && credentials?.email) {
        await this.handleGoogleAuth(page, credentials);
      }
      
      // Wait for meeting page to load
      await page.waitForSelector('[data-is-muted]', { timeout: 15000 });
      
      // Turn off camera and microphone by default
      const cameraButton = await page.$('[data-is-camera-on="true"]');
      if (cameraButton) {
        await cameraButton.click();
        await page.waitForTimeout(1000);
      }
      
      const micButton = await page.$('[data-is-muted="false"]');
      if (micButton) {
        await micButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Click join button
      const joinButton = await page.$('[jsname="Qx7uuf"]') || 
                         await page.$('button[jsname="Qx7uuf"]') ||
                         await page.$('[data-mdc-dialog-action="ok"]');
      
      if (joinButton) {
        await joinButton.click();
        
        // Wait to confirm join
        await page.waitForTimeout(5000);
        
        return { success: true, message: 'Joined Google Meet successfully' };
      } else {
        return { success: false, error: 'Join button not found' };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleZoom(page, credentials) {
    try {
      await page.waitForTimeout(3000);
      
      // Check if we need to launch Zoom app or use browser
      const launchAppButton = await page.$('#launchBtn');
      const browserButton = await page.$('#joinBtn') || await page.$('a[href*="wc/join"]');
      
      if (browserButton) {
        // Use browser version
        await browserButton.click();
        await page.waitForTimeout(3000);
        
        // Handle name input if present
        const nameInput = await page.$('#inputname');
        if (nameInput && credentials?.displayName) {
          await nameInput.type(credentials.displayName);
        }
        
        // Join meeting
        const joinButton = await page.$('#joinBtn') || await page.$('button[type="submit"]');
        if (joinButton) {
          await joinButton.click();
          await page.waitForTimeout(5000);
          return { success: true, message: 'Joined Zoom meeting via browser' };
        }
      }
      
      return { success: false, error: 'Could not find join options' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleTeams(page, credentials) {
    try {
      await page.waitForTimeout(3000);
      
      // Look for browser join option
      const browserJoinButton = await page.$('[data-tid="joinOnWeb"]') || 
                                await page.$('button[title*="browser"]');
      
      if (browserJoinButton) {
        await browserJoinButton.click();
        await page.waitForTimeout(3000);
        
        // Handle name input
        const nameInput = await page.$('#guest-name-input') || await page.$('input[placeholder*="name"]');
        if (nameInput && credentials?.displayName) {
          await nameInput.clear();
          await nameInput.type(credentials.displayName);
        }
        
        // Turn off camera and mic
        const cameraButton = await page.$('[data-tid="toggle-video"]');
        const micButton = await page.$('[data-tid="toggle-mute"]');
        
        if (cameraButton) await cameraButton.click();
        if (micButton) await micButton.click();
        
        // Join now button
        const joinButton = await page.$('[data-tid="prejoin-join-button"]') || 
                           await page.$('button[title*="Join now"]');
        
        if (joinButton) {
          await joinButton.click();
          await page.waitForTimeout(5000);
          return { success: true, message: 'Joined Teams meeting' };
        }
      }
      
      return { success: false, error: 'Could not find Teams join button' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleGenericPlatform(page, credentials) {
    try {
      // Generic approach - look for common join button text
      const joinTexts = ['join', 'join meeting', 'join now', 'enter meeting', 'start'];
      
      for (const text of joinTexts) {
        const buttons = await page.$$eval('button', (buttons, searchText) => {
          return buttons
            .filter(btn => btn.textContent.toLowerCase().includes(searchText))
            .map(btn => btn.outerHTML);
        }, text);
        
        if (buttons.length > 0) {
          const button = await page.$(`button:contains("${text}")`);
          if (button) {
            await button.click();
            await page.waitForTimeout(5000);
            return { success: true, message: `Joined meeting using generic method` };
          }
        }
      }
      
      return { success: false, error: 'No join button found with generic method' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleGoogleAuth(page, credentials) {
    try {
      // Enter email
      await page.type('#identifierId', credentials.email);
      await page.click('#identifierNext');
      await page.waitForTimeout(2000);
      
      // Enter password if required
      const passwordInput = await page.$('#password input[type="password"]');
      if (passwordInput && credentials.password) {
        await passwordInput.type(credentials.password);
        await page.click('#passwordNext');
        await page.waitForTimeout(3000);
      }
      
    } catch (error) {
      logger.warn('Google auth handling failed:', error);
    }
  }

  async getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  async cleanup() {
    // Close all active sessions
    for (const [meetingId, session] of this.activeSessions) {
      try {
        await session.page.close();
        logger.info(`Cleaned up session for meeting: ${meetingId}`);
      } catch (error) {
        logger.error(`Error cleaning up session ${meetingId}:`, error);
      }
    }
    
    this.activeSessions.clear();
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    logger.info('Meeting agent cleanup completed');
  }
}

module.exports = MeetingAgent;