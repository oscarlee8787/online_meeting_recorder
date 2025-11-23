import React, { useState } from 'react';
import { OBSStatus } from '../types';
import { connectOBS, disconnectOBS } from '../services/obsService';
import { Wifi, WifiOff, Loader2, HelpCircle, X } from 'lucide-react';

interface OBSConnectionProps {
  status: OBSStatus;
  onStatusChange: (status: OBSStatus) => void;
}

const OBSConnection: React.FC<OBSConnectionProps> = ({ status, onStatusChange }) => {
  const [address, setAddress] = useState('ws://127.0.0.1:4455');
  const [password, setPassword] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    onStatusChange(OBSStatus.CONNECTING);
    try {
      await connectOBS(address, password);
      onStatusChange(OBSStatus.CONNECTED);
      setIsExpanded(false);
      setShowHelp(false);
    } catch (err) {
      onStatusChange(OBSStatus.ERROR);
    }
  };

  const handleDisconnect = async () => {
    await disconnectOBS();
    onStatusChange(OBSStatus.DISCONNECTED);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${status === OBSStatus.CONNECTED ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {status === OBSStatus.CONNECTED ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">OBS Studio</h3>
            <p className="text-xs text-gray-400">
              {status === OBSStatus.CONNECTED 
                ? 'Ready to record' 
                : status === OBSStatus.CONNECTING 
                  ? 'Connecting...' 
                  : 'Disconnected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status !== OBSStatus.CONNECTED && (
             <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded transition-colors"
              title="How to setup OBS?"
            >
              <HelpCircle size={18} />
            </button>
          )}

          {status === OBSStatus.CONNECTED ? (
            <button 
              onClick={handleDisconnect}
              className="text-sm px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              {isExpanded ? 'Cancel' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Help Section */}
      {showHelp && status !== OBSStatus.CONNECTED && (
        <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-sm text-indigo-200 relative">
          <button 
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-indigo-400 hover:text-white"
          >
            <X size={14} />
          </button>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <HelpCircle size={14} /> 
            How to enable OBS WebSocket
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-xs text-indigo-100/80">
            <li>Open OBS Studio application.</li>
            <li>Go to <strong>Tools</strong> &gt; <strong>WebSocket Server Settings</strong>.</li>
            <li>Check <strong>Enable WebSocket server</strong>.</li>
            <li>Copy the <strong>Server Port</strong> (default 4455) and <strong>Server Password</strong>.</li>
            <li>Click <strong>Apply/OK</strong> and enter details below.</li>
          </ol>
        </div>
      )}

      {isExpanded && status !== OBSStatus.CONNECTED && (
        <form onSubmit={handleConnect} className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">WebSocket URL</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              placeholder="ws://127.0.0.1:4455"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password (Optional)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              placeholder="••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={status === OBSStatus.CONNECTING}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium text-sm transition-colors"
          >
            {status === OBSStatus.CONNECTING && <Loader2 className="animate-spin" size={16} />}
            Connect to OBS
          </button>
          {status === OBSStatus.ERROR && (
            <p className="text-xs text-red-400 text-center">Connection failed. Check OBS Tools &gt; WebSocket Server Settings.</p>
          )}
        </form>
      )}
    </div>
  );
};

export default OBSConnection;