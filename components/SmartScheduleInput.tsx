import React, { useState } from 'react';
import { parseScheduleText } from '../services/geminiService';
import { ParsedMeetingData } from '../types';
import { Sparkles, ArrowRight, Loader2, Calendar } from 'lucide-react';

interface SmartScheduleInputProps {
  onMeetingsFound: (meetings: ParsedMeetingData[]) => void;
}

const SmartScheduleInput: React.FC<SmartScheduleInputProps> = ({ onMeetingsFound }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const parsedMeetings = await parseScheduleText(input);
      if (parsedMeetings.length === 0) {
        setError("No meetings with links found in the text.");
      } else {
        onMeetingsFound(parsedMeetings);
        setInput(''); // Clear input on success
      }
    } catch (err) {
      setError("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-yellow-400" size={20} />
        <h3 className="font-semibold text-gray-100">Smart Scheduler</h3>
      </div>
      
      <p className="text-sm text-gray-400 mb-3">
        Paste your daily schedule (e.g. from Google Calendar email or text selection) below. 
        AI will extract meeting times and links.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., 'Team Sync at 2pm on Zoom: https://zoom.us/j/123...'"
        className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md p-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 resize-none mb-3"
      />

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !input.trim()}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors
          ${isAnalyzing || !input.trim() 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'}`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Analyzing Schedule...
          </>
        ) : (
          <>
            <Calendar size={16} />
            Parse & Add Meetings
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
};

export default SmartScheduleInput;