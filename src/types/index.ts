export interface User {
  id: string;
  name?: string;
  isWaiting: boolean;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  participants: string[];
  createdAt: number;
  isActive: boolean;
  roomId: string;
  isCaller: boolean;
  strangerId: string;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

// Service interfaces
export interface IMediaService {
  getUserMedia(constraints?: MediaConstraints): Promise<MediaStream>;
  stopStream(stream: MediaStream): void;
  toggleAudio(stream: MediaStream, enabled: boolean): void;
  toggleVideo(stream: MediaStream, enabled: boolean): void;
  getAudioTracks(stream: MediaStream): MediaStreamTrack[];
  getVideoTracks(stream: MediaStream): MediaStreamTrack[];
}

export interface IMatchingService {
  startMatching(): Promise<void>;
  stopMatching(): void;
  onMatched(callback: (session: ChatSession) => void): void;
  endSession(sessionId: string): Promise<void>;
  handlePageUnloadCleanup(): Promise<void>;
  isMatching(): boolean;
}

export interface IWebRTCService {
  initConnection(localStream: MediaStream, sessionId: string, isCaller: boolean, peerId: string): Promise<void>;
  closeConnection(): void;
  sendEndCallNotification(): void;
  onRemoteStream(callback: (stream: MediaStream) => void): void;
  onConnectionStateChange(callback: (state: string) => void): void;
  onError(callback: (error: string) => void): void;
  getPeerConnection(): RTCPeerConnection | null;
  isConnectionEstablished(): boolean;
}


// Application state
export interface AppState {
  currentUser: User | null;
  currentSession: ChatSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  isDisconnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isWaiting: boolean;
  error: string | null;
}

// Event types for state management
export type AppEvent = 
  | { type: 'USER_JOINED'; payload: User }
  | { type: 'USER_LEFT'; payload: string }
  | { type: 'SESSION_STARTED'; payload: ChatSession }
  | { type: 'SESSION_ENDED'; payload: string }
  | { type: 'STREAM_RECEIVED'; payload: MediaStream }
  | { type: 'CONNECTION_ESTABLISHED' }
  | { type: 'CONNECTION_LOST' }
  | { type: 'ERROR'; payload: string }
  | { type: 'TOGGLE_AUDIO' }
  | { type: 'TOGGLE_VIDEO' }
  | { type: 'CLEAR_ERROR' };