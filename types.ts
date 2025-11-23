export interface Meeting {
  id: string;
  title: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  link: string;
  platform: 'google-meet' | 'zoom' | 'teams' | 'other';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  autoRecord: boolean;
}

export interface OBSConnectionDetails {
  address: string;
  password?: string;
}

export enum OBSStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface ParsedMeetingData {
  title: string;
  startTime: string;
  endTime: string;
  link: string;
}