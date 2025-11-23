import OBSWebSocket from 'obs-websocket-js';

// Singleton instance management
let obsInstance: OBSWebSocket | null = null;

export const getOBS = (): OBSWebSocket => {
  if (!obsInstance) {
    obsInstance = new OBSWebSocket();
  }
  return obsInstance;
};

export const connectOBS = async (address: string, password?: string): Promise<void> => {
  const obs = getOBS();
  try {
    // Standard default port is 4455 for OBS 28+
    await obs.connect(address, password);
    console.log('Connected to OBS');
  } catch (error) {
    console.error('Failed to connect to OBS', error);
    throw error;
  }
};

export const disconnectOBS = async (): Promise<void> => {
  const obs = getOBS();
  await obs.disconnect();
};

export const startRecording = async (): Promise<void> => {
  const obs = getOBS();
  try {
    await obs.call('StartRecord');
    console.log('Recording started');
  } catch (error) {
    console.error('Failed to start recording', error);
    // Ignore error if already recording
  }
};

export const stopRecording = async (): Promise<void> => {
  const obs = getOBS();
  try {
    await obs.call('StopRecord');
    console.log('Recording stopped');
  } catch (error) {
    console.error('Failed to stop recording', error);
  }
};

export const getRecordingStatus = async (): Promise<boolean> => {
  const obs = getOBS();
  try {
    const { outputActive } = await obs.call('GetRecordStatus');
    return outputActive;
  } catch (error) {
    return false;
  }
};