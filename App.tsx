import React, { useState, useEffect, useCallback } from 'react';
import { Meeting, OBSStatus, ParsedMeetingData } from './types';
import OBSConnection from './components/OBSConnection';
import SmartScheduleInput from './components/SmartScheduleInput';
import MeetingList from './components/MeetingList';
import { startRecording, stopRecording } from './services/obsService';
import { Plus, Layout } from 'lucide-react';

function App() {
  const [obsStatus, setObsStatus] = useState<OBSStatus>(OBSStatus.DISCONNECTED);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  
  // Manual add form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  // Add parsed meetings to state
  const handleMeetingsFound = (parsed: ParsedMeetingData[]) => {
    const newMeetings: Meeting[] = parsed.map(p => ({
      id: crypto.randomUUID(),
      title: p.title,
      startTime: p.startTime,
      endTime: p.endTime,
      link: p.link,
      platform: p.link.includes('zoom') ? 'zoom' : p.link.includes('teams') ? 'teams' : 'google-meet',
      status: 'pending',
      autoRecord: true // Default to true if user is parsing schedule
    }));
    
    // Merge and sort
    setMeetings(prev => [...prev, ...newMeetings].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ));
  };

  const removeMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const toggleAutoRecord = (id: string) => {
    setMeetings(prev => prev.map(m => 
      m.id === id ? { ...m, autoRecord: !m.autoRecord } : m
    ));
  };

  const addManualMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualStart || !manualLink) return;

    // Default duration 1 hour if end time missing
    let end = manualEnd;
    if (!end) {
        const d = new Date(manualStart);
        d.setHours(d.getHours() + 1);
        end = d.toISOString().slice(0, 16); // format for input datetime-local
    }

    const newMeeting: Meeting = {
      id: crypto.randomUUID(),
      title: manualTitle,
      startTime: new Date(manualStart).toISOString(),
      endTime: new Date(end).toISOString(),
      link: manualLink,
      platform: 'other',
      status: 'pending',
      autoRecord: true
    };

    setMeetings(prev => [...prev, newMeeting].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ));
    
    // Reset
    setManualTitle('');
    setManualLink('');
    setManualStart('');
    setManualEnd('');
    setShowManualAdd(false);
  };

  // The Master Scheduler Loop
  useEffect(() => {
    const checkSchedule = async () => {
      const now = new Date();
      
      setMeetings(currentMeetings => {
        let hasChanges = false;
        
        const updatedMeetings = currentMeetings.map(meeting => {
          const start = new Date(meeting.startTime);
          const end = new Date(meeting.endTime);
          
          // Check for Start
          // Logic: If within 1 minute of start time (or just passed it) and status is pending
          if (meeting.status === 'pending' && now >= start && now < end) {
            // Action: Open Link
            window.open(meeting.link, '_blank');
            
            // Action: Record if enabled and OBS connected
            if (meeting.autoRecord && obsStatus === OBSStatus.CONNECTED) {
              startRecording().catch(err => console.error("Auto-record start failed", err));
            }

            hasChanges = true;
            return { ...meeting, status: 'active' as const };
          }

          // Check for End
          if (meeting.status === 'active' && now >= end) {
             // Action: Stop Record if enabled and OBS connected
             if (meeting.autoRecord && obsStatus === OBSStatus.CONNECTED) {
               stopRecording().catch(err => console.error("Auto-record stop failed", err));
             }

             hasChanges = true;
             return { ...meeting, status: 'completed' as const };
          }

          return meeting;
        });

        return hasChanges ? updatedMeetings : currentMeetings;
      });
    };

    const intervalId = setInterval(checkSchedule, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, [obsStatus]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-800">
          <div className="bg-indigo-600 p-2.5 rounded-lg">
             <Layout className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AutoMeeting Recorder</h1>
            <p className="text-gray-400 text-sm">Automated joining and OBS recording assistant</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-6">
            <OBSConnection status={obsStatus} onStatusChange={setObsStatus} />
            <SmartScheduleInput onMeetingsFound={handleMeetingsFound} />
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <button 
                onClick={() => setShowManualAdd(!showManualAdd)}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
              >
                <Plus size={18} />
                Add Meeting Manually
              </button>

              {showManualAdd && (
                <form onSubmit={addManualMeeting} className="mt-4 space-y-3 animate-fade-in">
                  <input
                    required
                    type="text"
                    placeholder="Meeting Title"
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                   <input
                    required
                    type="url"
                    placeholder="Meeting Link (https://...)"
                    value={manualLink}
                    onChange={e => setManualLink(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                  <div>
                    <label className="text-xs text-gray-500">Start Time</label>
                    <input
                      required
                      type="datetime-local"
                      value={manualStart}
                      onChange={e => setManualStart(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={manualEnd}
                      onChange={e => setManualEnd(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300"
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-sm font-medium">
                    Save Meeting
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            <MeetingList 
              meetings={meetings} 
              obsStatus={obsStatus}
              onRemove={removeMeeting}
              onToggleAutoRecord={toggleAutoRecord}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;