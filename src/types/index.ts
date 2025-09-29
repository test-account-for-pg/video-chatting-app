// Core types and interfaces for the video chat application

export interface User {
  id: string;
  name?: string;
  isWaiting: boolean;
  createdAt: number;
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  remoteStream?: MediaStream;
  localStream?: MediaStream;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left' | 'match-found';
  from: string;
  to?: string;
  data?: any;
  timestamp: number;
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  timestamp: number;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface ChatSession {
  id: string;
  participants: string[];
  createdAt: number;
  isActive: boolean;
}

// Service interfaces for dependency injection
export interface ISignalingService {
  connect(): Promise<void>;
  disconnect(): void;
  joinWaitingPool(): Promise<void>;
  leaveWaitingPool(): Promise<void>;
  sendMessage(message: SignalingMessage): Promise<void>;
  onMessage(callback: (message: SignalingMessage) => void): void;
  onUserJoined(callback: (user: User) => void): void;
  onUserLeft(callback: (userId: string) => void): void;
  onMatchFound(callback: (session: ChatSession) => void): void;
}

export interface IPeerConnectionService {
  createPeerConnection(): Promise<RTCPeerConnection>;
  createOffer(peerConnection: RTCPeerConnection): Promise<RTCSessionDescriptionInit>;
  createAnswer(peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(peerConnection: RTCPeerConnection, description: RTCSessionDescriptionInit): Promise<void>;
  setRemoteDescription(peerConnection: RTCPeerConnection, description: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void>;
  onIceCandidate(peerConnection: RTCPeerConnection, callback: (candidate: RTCIceCandidate) => void): void;
  onRemoteStream(peerConnection: RTCPeerConnection, callback: (stream: MediaStream) => void): void;
  closeConnection(peerConnection: RTCPeerConnection): void;
  addLocalStream(peerConnection: RTCPeerConnection, stream: MediaStream): void;
}

export interface IMediaService {
  getUserMedia(constraints?: MediaConstraints): Promise<MediaStream>;
  stopStream(stream: MediaStream): void;
  toggleAudio(stream: MediaStream, enabled: boolean): void;
  toggleVideo(stream: MediaStream, enabled: boolean): void;
  getAudioTracks(stream: MediaStream): MediaStreamTrack[];
  getVideoTracks(stream: MediaStream): MediaStreamTrack[];
}

export interface IMatchingService {
  findMatch(): Promise<ChatSession | null>;
  endSession(sessionId: string): Promise<void>;
  onSessionEnded(callback: (sessionId: string) => void): void;
}

// Application state
export interface AppState {
  currentUser: User | null;
  currentSession: ChatSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
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
