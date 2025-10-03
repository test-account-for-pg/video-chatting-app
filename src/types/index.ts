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

// Firebase-specific data types
export interface WaitingPoolEntry {
  userId: string;
  createdAt: number;
  isWaiting: boolean;
  sessionId?: string;
  isCaller?: boolean;
  peerId?: string;
}

export interface SessionData {
  callerId: string;
  calleeId: string;
  createdAt: number;
  isActive: boolean;
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  fromUserId: string;
  toUserId: string;
  data: RTCSessionDescriptionInit | string;
  timestamp: number;
}

// Environment variables interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
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
  initConnection(
    localStream: MediaStream,
    sessionId: string,
    isCaller: boolean,
    peerId: string
  ): Promise<void>;
  closeConnection(): void;
  sendEndCallNotification(): void;
  onRemoteStream(callback: (stream: MediaStream) => void): void;
  onConnectionStateChange(callback: (state: string) => void): void;
  onError(callback: (error: string) => void): void;
  getPeerConnection(): RTCPeerConnection | null;
  isConnectionEstablished(): boolean;
}

export interface IFirebaseService {
  getCurrentUserId(): string;
  addToWaitingPool(): Promise<void>;
  pickWaitingUser(): Promise<string | null>;
  removeFromWaitingPool(userId: string): Promise<void>;
  createSession(sessionId: string, callerId: string, calleeId: string): Promise<void>;
  updateWaitingPoolWithSession(
    userId: string,
    sessionId: string,
    isCaller: boolean,
    peerId: string
  ): Promise<void>;
  onWaitingPoolUpdate(
    callback: (sessionId: string, isCaller: boolean, peerId: string) => void
  ): void;
  sendOffer(toUserId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  sendAnswer(toUserId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  sendIceCandidate(toUserId: string, candidate: RTCIceCandidateInit): Promise<void>;
  onOffer(callback: (offer: RTCSessionDescriptionInit, fromUserId: string) => void): void;
  onAnswer(callback: (answer: RTCSessionDescriptionInit, fromUserId: string) => void): void;
  onIceCandidates(callback: (candidate: RTCIceCandidateInit, fromUserId: string) => void): void;
  cleanupSession(sessionId: string): Promise<void>;
  cleanup(): void;
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

