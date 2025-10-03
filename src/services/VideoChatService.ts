import { 
  IMediaService, 
  IMatchingService, 
  IWebRTCService,
  ChatSession,
  AppState 
} from '../types';

export class VideoChatService {
  private mediaService: IMediaService;
  private matchingService: IMatchingService;
  private webRTCService: IWebRTCService;

  private currentState: AppState = {
    currentUser: null,
    currentSession: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isDisconnected: false,
    isConnected: false,
    isMuted: false,
    isVideoEnabled: true,
    isWaiting: false,
    error: null
  };

  private isDisconnected = false;

  // Event callbacks
  private stateChangeCallbacks: ((state: AppState) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];

  constructor(
    mediaService: IMediaService,
    matchingService: IMatchingService,
    webRTCService: IWebRTCService
  ) {
    this.mediaService = mediaService;
    this.matchingService = matchingService;
    this.webRTCService = webRTCService;

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    try {
      // Get local media stream
      const localStream = await this.mediaService.getUserMedia();
      console.log('🎥 VideoChatService: Local stream obtained', localStream);
      console.log('🎥 VideoChatService: Local stream tracks', localStream.getTracks());
      this.updateState({ localStream });
      
      console.log('✅ VideoChatService initialized');
    } catch (error) {
      console.error('❌ VideoChatService initialization error:', error);
      this.handleError('Failed to initialize VideoChatService');
      throw error;
    }
  }

  async startMatching(): Promise<void> {
    try {
      if (!this.currentState.localStream) {
        throw new Error('No local stream available');
      }

      this.updateState({ isWaiting: true, error: null });
      await this.matchingService.startMatching();
      
      console.log('🔍 Started matching for stranger');
    } catch (error) {
      this.handleError('Failed to start matching');
    }
  }

  stopMatching(): void {
    this.matchingService.stopMatching();
    this.updateState({ isWaiting: false });
    console.log('🛑 Stopped matching');
  }

  async endSession(): Promise<void> {
    try {
      const sessionId = this.currentState.currentSession?.id;
      
      // Send instant notification via data channel before closing
      this.webRTCService.sendEndCallNotification();
      
      if (sessionId) {
        await this.matchingService.endSession(sessionId);
      }

      this.webRTCService.closeConnection();
      this.updateState({
        currentSession: null,
        remoteStream: null,
        isConnected: false,
        isWaiting: false
      });

      console.log('🔚 Session ended');
    } catch (error) {
      this.handleError('Failed to end session');
    }
  }

  toggleAudio(): void {
    console.log('🔊 VideoChatService: toggleAudio called, current state:', {
      hasLocalStream: !!this.currentState.localStream,
      isMuted: this.currentState.isMuted,
      streamTracks: this.currentState.localStream?.getTracks().length || 0
    });
    
    if (this.currentState.localStream) {
      const enabled = this.currentState.isMuted;
      // // Use MediaService to toggle audio
      this.mediaService.toggleAudio(this.currentState.localStream, enabled);

      this.updateState({ isMuted: !enabled });
      console.log('🔊 VideoChatService: Audio toggled, new muted state:', !enabled);
    } else {
      console.log('🔊 VideoChatService: No local stream available for audio toggle');
    }
  }

  toggleVideo(): void {
    if (this.currentState.localStream) {
      const enabled = !this.currentState.isVideoEnabled;
      console.log('📹 VideoChatService: Toggling video', { enabled, currentVideoEnabled: this.currentState.isVideoEnabled });
      
      this.mediaService.toggleVideo(this.currentState.localStream, enabled);
      this.updateState({ isVideoEnabled: enabled });
      console.log('📹 VideoChatService: Video toggled, new video enabled state:', enabled);
    }
  }

  getCurrentState(): AppState {
    return { ...this.currentState };
  }

  isStrangerDisconnected(): boolean {
    return this.isDisconnected;
  }

  onStateChange(callback: (state: AppState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  onError(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  private setupEventHandlers(): void {
    // Handle match found
    this.matchingService.onMatched((session: ChatSession) => {
      this.handleMatchFound(session);
    });

    // Handle remote stream
    this.webRTCService.onRemoteStream((stream) => {
      console.log('🎥 VideoChatService: Remote stream received', stream);
      console.log('🎥 VideoChatService: Stream tracks', stream.getTracks());
      this.updateState({ remoteStream: stream });
    });

    // Handle connection state changes
    this.webRTCService.onConnectionStateChange((state) => {
      const tempState: Partial<AppState> = {};
      if (state === 'connected') {
        tempState.isConnected = true;
        tempState.isWaiting = false;
      } else if (state === 'disconnected') {
        tempState.isConnected = false;
        tempState.isWaiting = false;
        tempState.remoteStream = null;
        tempState.isDisconnected = true;
      }
      this.updateState(tempState);
    });

    // Handle WebRTC errors
    this.webRTCService.onError((error) => {
      this.handleError(error);
    });
  }

  private async handleMatchFound(session: ChatSession): Promise<void> {
    try {
      // this.updateState({ 
      //   currentSession: session,
      //   isWaiting: false 
      // });

      // Initialize WebRTC connection with peer ID
      await this.webRTCService.initConnection(
        this.currentState.localStream!,
        session.roomId,
        session.isCaller,
        session.strangerId
      );

      console.log('🎉 Match found and connection established');
    } catch (error) {
      this.handleError('Failed to establish connection with stranger');
    }
  }

  private updateState(updates: Partial<AppState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.stateChangeCallbacks.forEach((callback, index) => {
      callback(this.currentState);
    });
  }

  private handleError(error: string): void {
    this.updateState({ error });
    this.errorCallbacks.forEach(callback => callback(error));
    console.error('❌ VideoChatService error:', error);
  }

  // Cleanup
  destroy(): void {
    this.endSession();
    if (this.currentState.localStream) {
      this.mediaService.stopStream(this.currentState.localStream);
    }
  }

  // Setup page unload cleanup
  setupPageUnloadCleanup(): void {
    const cleanup = async () => {
      try {
        // Use MatchingService to handle cleanup
        await this.matchingService.handlePageUnloadCleanup();
        // Close WebRTC connection
        this.webRTCService.closeConnection();
        console.log('🧹 Cleaned up on page unload');
      } catch (error) {
        console.error('❌ Error during page unload cleanup:', error);
      }
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
  }
}

