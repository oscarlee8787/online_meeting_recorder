# AutoMeeting Recorder - Development Roadmap

## Project Overview

**Current State**: React/TypeScript application that manages meeting schedules and OBS recording automation. The app currently opens meeting links in new browser tabs but requires manual user interaction to actually join meetings.

**Goal**: Achieve fully automated meeting joining without real-time user input, running 24/7 on a dedicated Mac with VM-based UI automation.

## Current Architecture

### Existing Components
- **App.tsx**: Core scheduler with 5-second interval loop, meeting lifecycle management
- **OBSConnection.tsx**: WebSocket integration with OBS Studio for recording control
- **SmartScheduleInput.tsx**: Google Gemini AI integration for schedule parsing
- **MeetingList.tsx**: Meeting display and manual controls
- **Services**:
  - `obsService.ts`: OBS WebSocket communication
  - `geminiService.ts`: AI-powered schedule parsing

### Current Limitations
- Only opens meeting URLs in new tabs (`window.open()`)
- Requires manual clicking of "Join Meeting" buttons
- Cannot handle authentication or platform-specific flows
- Limited by browser security policies

## Development Phases

### Phase 1: Proof of Concept - Docker + Puppeteer
**Timeline**: 2-3 weeks  
**Goal**: Validate automated meeting joining feasibility

#### Implementation Steps
1. **Docker Environment Setup**
   ```dockerfile
   FROM ubuntu:22.04
   RUN apt-get update && apt-get install -y \
       chromium-browser \
       xvfb \
       pulseaudio \
       vnc4server
   ```

2. **Puppeteer Meeting Agent Service**
   ```javascript
   // services/meetingAgent.js
   class MeetingAgent {
     async joinMeeting(meetingUrl, platform) {
       const browser = await puppeteer.launch({
         args: ['--no-sandbox', '--use-fake-ui-for-media-stream']
       });
       // Platform-specific automation logic
     }
   }
   ```

3. **API Integration with React App**
   ```typescript
   // Modify App.tsx scheduler loop
   // Replace: window.open(meeting.link, '_blank');
   // With: await fetch('/api/join-meeting', { method: 'POST', body: JSON.stringify(meeting) });
   ```

4. **Platform-Specific Automation Scripts**
   - Google Meet: Handle OAuth, join button clicks, audio/video setup
   - Zoom: Browser vs desktop app detection, waiting rooms
   - Teams: Authentication flows, meeting lobby

#### Expected Outcomes
- **Success Rate**: 70-80% meeting joins
- **Platforms Covered**: Google Meet, Zoom (browser), Teams
- **Limitations**: Fake audio/video streams, anti-bot detection issues

---

### Phase 2: Production VM Solution - macOS VM + UI Automation
**Timeline**: 3-4 weeks  
**Goal**: Robust 24/7 automation with real hardware access

#### VM Setup Requirements
- **Host**: Dedicated Mac running 24/7
- **VM Software**: Parallels Desktop or VMware Fusion
- **Guest OS**: macOS (properly licensed)
- **Resources**: 8GB RAM, 4 CPU cores allocated to VM

#### Implementation Components

1. **VM Infrastructure**
   ```yaml
   # vm-config.yml
   vm_specs:
     memory: 8192MB
     cores: 4
     storage: 100GB
     network: bridged
   
   services:
     - browser_automation
     - audio_passthrough
     - vnc_server
     - api_endpoint
   ```

2. **UI Automation Engine**
   ```python
   # automation/meeting_agent.py
   import pyautogui
   import pytesseract
   from PIL import Image
   
   class VisualMeetingAgent:
       def __init__(self):
           self.screen_regions = {
               'join_button_area': (100, 400, 300, 500),
               'auth_area': (200, 200, 600, 400)
           }
       
       def find_and_click_join_button(self):
           # OCR-based button detection
           screenshot = pyautogui.screenshot()
           text_locations = pytesseract.image_to_data(screenshot)
           # Find "Join" or "Join meeting" text
           # Click on detected coordinates
       
       def handle_platform_flow(self, platform, meeting_url):
           if platform == 'zoom':
               return self.handle_zoom_workflow()
           elif platform == 'google_meet':
               return self.handle_gmeet_workflow()
   ```

3. **Browser Profile Management**
   ```python
   # automation/browser_manager.py
   class BrowserManager:
       def __init__(self):
           self.profiles = {
               'google': '/path/to/google/profile',
               'zoom': '/path/to/zoom/profile',
               'teams': '/path/to/teams/profile'
           }
       
       def launch_browser_with_profile(self, platform):
           profile_path = self.profiles.get(platform)
           # Launch Chrome with specific profile for saved auth
   ```

4. **API Service for React App Integration**
   ```python
   # api/meeting_service.py
   from flask import Flask, request, jsonify
   from automation.meeting_agent import VisualMeetingAgent
   
   app = Flask(__name__)
   agent = VisualMeetingAgent()
   
   @app.route('/api/join-meeting', methods=['POST'])
   def join_meeting():
       meeting_data = request.json
       result = agent.join_meeting(
           meeting_data['link'], 
           meeting_data['platform']
       )
       return jsonify(result)
   ```

5. **Hardware Passthrough Configuration**
   ```bash
   # VM audio/video setup
   # Configure VM to access host microphone/camera
   # Set up audio routing for meeting audio
   # Configure video device passthrough
   ```

#### Expected Outcomes
- **Success Rate**: 85-90% meeting joins
- **Real Hardware**: Actual microphone/camera access
- **Platform Coverage**: All major platforms with UI automation
- **Self-Healing**: OCR adapts to UI changes automatically

---

### Phase 3: Hybrid Optimization - SDK Integration
**Timeline**: 2-3 weeks  
**Goal**: Maximum reliability for supported platforms

#### SDK Integration Strategy

1. **Zoom SDK Integration**
   ```javascript
   // services/zoomSDKService.js
   import { ZoomMtg } from '@zoomus/websdk';
   
   class ZoomSDKService {
     async joinMeeting(meetingNumber, password, userName) {
       ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
       
       return new Promise((resolve, reject) => {
         ZoomMtg.join({
           meetingNumber: meetingNumber,
           password: password,
           userName: userName,
           success: resolve,
           error: reject
         });
       });
     }
   }
   ```

2. **Google Meet Enterprise API** (if Workspace Enterprise available)
   ```javascript
   // services/googleMeetAPI.js
   class GoogleMeetAPI {
     async createAndJoinMeeting(conferenceData) {
       // Use Google Calendar API to create meeting
       // Use Meet API to join programmatically
     }
   }
   ```

3. **Intelligent Platform Router**
   ```javascript
   // services/platformRouter.js
   class PlatformRouter {
     async joinMeeting(meeting) {
       const platform = this.detectPlatform(meeting.link);
       
       switch(platform) {
         case 'zoom':
           if (this.zoomSDKAvailable()) {
             return await this.zoomSDK.join(meeting);
           }
           break;
         case 'google_meet':
           if (this.googleAPIAvailable()) {
             return await this.googleAPI.join(meeting);
           }
           break;
       }
       
       // Fallback to VM automation
       return await this.vmAgent.join(meeting);
     }
   }
   ```

#### Expected Outcomes
- **Zoom SDK**: 95%+ success rate for Zoom meetings
- **Google Meet API**: 90%+ success rate (Enterprise only)
- **Fallback Coverage**: VM automation handles unsupported platforms
- **Optimal Resource Usage**: SDKs more efficient than full browser automation

---

## Integration Points with Existing Codebase

### App.tsx Modifications
```typescript
// Current meeting join logic (line 100)
if (meeting.status === 'pending' && now >= start && now < end) {
  window.open(meeting.link, '_blank'); // REMOVE THIS
  
  // NEW: Call automation service
  try {
    const joinResult = await fetch('/api/join-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: meeting.id,
        url: meeting.link,
        platform: meeting.platform,
        credentials: this.getUserCredentials()
      })
    });
    
    if (joinResult.ok) {
      console.log(`Auto-joined meeting: ${meeting.title}`);
    } else {
      // Fallback to manual join
      window.open(meeting.link, '_blank');
    }
  } catch (error) {
    console.error('Auto-join failed:', error);
    // Fallback to manual join
    window.open(meeting.link, '_blank');
  }
}
```

### New Configuration Components
```typescript
// components/AutomationConfig.tsx
// Settings for VM endpoint, credentials, automation preferences
// Toggle between manual and automated joining per platform
```

### Enhanced OBS Integration
```typescript
// services/obsService.ts enhancements
// Add meeting metadata to recordings
// Automatic scene switching based on meeting platform
// Recording quality optimization for different meeting types
```

## Technical Architecture

### System Components
```
┌─────────────────────────────────────────┐
│  Mac Host (24/7)                       │
│  ┌─────────────────────────────────┐    │
│  │  macOS VM (Meeting Agent)       │    │
│  │  ├─ Python UI Automation        │    │
│  │  ├─ Browser Profiles            │    │
│  │  ├─ API Service                 │    │
│  │  └─ Hardware Passthrough        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  React App (Control Interface)         │
│  ├─ Meeting Scheduler               │    │
│  ├─ OBS Recording Control           │    │
│  ├─ Platform SDK Integration        │    │
│  └─ Automation Configuration        │    │
└─────────────────────────────────────────┘
```

### Data Flow
1. **Schedule Input**: User pastes schedule → Gemini AI parsing → Meeting objects
2. **Automation Trigger**: Scheduler detects start time → API call to VM agent
3. **Meeting Join**: VM agent uses OCR/SDK to join → Reports success/failure
4. **Recording Control**: Successful join triggers OBS recording start
5. **Session Management**: Agent monitors meeting status → Auto-leave at end time

## Success Metrics by Phase

### Phase 1 (Docker + Puppeteer)
- **Google Meet**: 75% success rate
- **Zoom (browser)**: 65% success rate
- **Teams**: 70% success rate
- **Average Setup Time**: 15 seconds per meeting

### Phase 2 (VM + UI Automation)
- **Google Meet**: 90% success rate
- **Zoom (any method)**: 85% success rate
- **Teams**: 88% success rate
- **Average Setup Time**: 10 seconds per meeting
- **Audio/Video Quality**: Full hardware quality

### Phase 3 (Hybrid + SDKs)
- **Zoom (SDK)**: 95% success rate
- **Google Meet (API)**: 92% success rate
- **Other platforms**: 85% success rate via automation
- **Resource Efficiency**: 40% improvement over pure automation

## Risk Mitigation

### Platform Changes
- **Regular testing**: Automated tests for each platform's join flow
- **Version pinning**: Lock specific browser versions in automation
- **Fallback strategies**: Manual join option always available

### Security & Compliance
- **Credential encryption**: Secure storage of authentication tokens
- **Audit logging**: Complete logs of all automation actions
- **Privacy controls**: User control over recording and data retention

### Operational Concerns
- **Monitoring**: Health checks and alerting for automation failures
- **Backup systems**: Secondary automation methods for critical meetings
- **Recovery procedures**: Automatic restart and error recovery protocols

## Future Enhancements

### Advanced Features
- **Meeting transcription**: Real-time transcription integration
- **AI meeting notes**: Automated summary generation
- **Calendar integration**: Direct calendar API integration
- **Mobile notifications**: Status updates via mobile app

### Scaling Considerations
- **Multi-VM deployment**: Scale to handle concurrent meetings
- **Cloud deployment**: Move to cloud VMs for better reliability
- **Enterprise features**: Multi-user support, admin dashboards

## Development Environment Setup

### Prerequisites
- macOS development machine
- Docker Desktop
- Node.js 18+ and npm
- Python 3.9+ with pip
- VM software (Parallels or VMware)

### Quick Start Commands
```bash
# Phase 1 Development
npm install
docker-compose up -d meeting-agent
npm run dev

# Phase 2 VM Setup
python -m venv automation-env
pip install -r automation/requirements.txt
python automation/setup_vm.py

# Phase 3 SDK Integration
npm install @zoomus/websdk
npm run build:production
```

This roadmap provides a clear path from the current manual meeting management to fully automated 24/7 meeting joining and recording system, with specific implementation details and success criteria for each phase.