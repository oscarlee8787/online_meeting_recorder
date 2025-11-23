import React from 'react';
import { Meeting, OBSStatus } from '../types';
import { Clock, Video, Trash2, MonitorDot, ExternalLink } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  obsStatus: OBSStatus;
  onRemove: (id: string) => void;
  onToggleAutoRecord: (id: string) => void;
}

const MeetingList: React.FC<MeetingListProps> = ({ meetings, obsStatus, onRemove, onToggleAutoRecord }) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 border-green-500 text-green-400';
      case 'completed': return 'bg-gray-700/50 border-gray-600 text-gray-500';
      case 'cancelled': return 'bg-red-500/10 border-red-500 text-red-400';
      default: return 'bg-gray-700/30 border-gray-600 text-gray-300';
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
        <Clock size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-lg">No meetings scheduled</p>
        <p className="text-sm">Add one manually or parse your calendar above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Upcoming Schedule</h2>
      {meetings.map((meeting) => (
        <div 
          key={meeting.id} 
          className={`relative p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${getStatusColor(meeting.status)}`}
        >
          {meeting.status === 'active' && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-400 font-bold tracking-wider">LIVE</span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-white tracking-tight">
                {formatDate(meeting.startTime)}
              </span>
              <span className="text-sm text-gray-400 flex items-center">
                to {formatDate(meeting.endTime)}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-white leading-tight mb-1">{meeting.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400 truncate max-w-md">
              <Video size={14} />
              <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 underline decoration-indigo-500/30">
                {meeting.link}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {meeting.status === 'active' && (
                 <a 
                   href={meeting.link} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-full shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                 >
                   Join Now <ExternalLink size={14} />
                 </a>
             )}

             <div className="flex flex-col items-end gap-2">
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                    meeting.autoRecord && obsStatus === OBSStatus.CONNECTED
                    ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={meeting.autoRecord}
                    onChange={() => onToggleAutoRecord(meeting.id)}
                    className="hidden"
                    disabled={obsStatus !== OBSStatus.CONNECTED}
                  />
                  <MonitorDot size={14} />
                  {meeting.autoRecord ? 'Auto-Record' : 'Auto-Record OFF'}
                </label>
             </div>

            <button 
              onClick={() => onRemove(meeting.id)}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Remove Meeting"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MeetingList;