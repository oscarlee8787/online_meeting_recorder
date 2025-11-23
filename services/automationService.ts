import { Meeting } from '../types';

interface JoinMeetingRequest {
  meetingId: string;
  url: string;
  platform: string;
  title?: string;
  credentials?: {
    email?: string;
    displayName?: string;
    password?: string;
  };
}

interface AutomationResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface AutomationHealth {
  status: 'ready' | 'initializing' | 'error';
  activeSessions: number;
  timestamp: string;
}

class AutomationService {
  private baseUrl: string;
  private defaultCredentials: any;

  constructor() {
    // Default to localhost, can be configured via environment variable
    this.baseUrl = process.env.REACT_APP_AUTOMATION_URL || 'http://localhost:3333';
    this.defaultCredentials = {
      displayName: 'Meeting Recorder',
      email: process.env.REACT_APP_DEFAULT_EMAIL || ''
    };
  }

  async checkHealth(): Promise<AutomationHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Automation service health check failed:', error);
      return {
        status: 'error',
        activeSessions: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async joinMeeting(meeting: Meeting): Promise<AutomationResponse> {
    try {
      const payload: JoinMeetingRequest = {
        meetingId: meeting.id,
        url: meeting.link,
        platform: meeting.platform,
        title: meeting.title,
        credentials: {
          ...this.defaultCredentials,
          // Add any meeting-specific credentials here
        }
      };

      console.log(`Attempting automated join for: ${meeting.title} (${meeting.platform})`);

      const response = await fetch(`${this.baseUrl}/api/join-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Automated meeting join failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async leaveMeeting(meetingId: string): Promise<AutomationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/leave-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Automated meeting leave failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getActiveSessions(): Promise<{ activeSessions: number; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions`);
      if (!response.ok) {
        throw new Error(`Sessions check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return {
        activeSessions: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testAutomation(url: string): Promise<AutomationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test-automation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Automation test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper method to detect platform from URL
  detectPlatform(url: string): string {
    if (url.includes('zoom.us')) return 'zoom';
    if (url.includes('meet.google.com')) return 'google-meet';
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
    if (url.includes('webex.com')) return 'webex';
    return 'other';
  }

  // Configure default credentials
  setDefaultCredentials(credentials: { email?: string; displayName?: string }) {
    this.defaultCredentials = { ...this.defaultCredentials, ...credentials };
  }

  // Update automation service URL
  setAutomationUrl(url: string) {
    this.baseUrl = url;
  }
}

// Export singleton instance
export const automationService = new AutomationService();
export default automationService;