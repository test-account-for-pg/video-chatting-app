import {
  IMediaService,
  IMatchingService,
  IWebRTCService,
  ChatSession,
  AppState,
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
    error: null,
  };

  private isDisconnected = false;

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
      const localStream = await this.mediaService.getUserMedia();
      this.updateState({ localStream });
    } catch (error) {
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
    } catch (error) {
      this.handleError('Failed to start matching');
    }
  }

  stopMatching(): void {
    this.matchingService.stopMatching();
    this.updateState({ isWaiting: false });
  }

  async endSession(): Promise<void> {
    try {
      const sessionId = this.currentState.currentSession?.id;

      this.webRTCService.sendEndCallNotification();

      if (sessionId) {
        await this.matchingService.endSession(sessionId);
      }

      this.webRTCService.closeConnection();
      this.updateState({
        currentSession: null,
        remoteStream: null,
        isConnected: false,
        isWaiting: false,
      });
    } catch (error) {
      this.handleError('Failed to end session');
    }
  }

  toggleAudio(): void {
    if (this.currentState.localStream) {
      const enabled = this.currentState.isMuted;
      this.mediaService.toggleAudio(this.currentState.localStream, enabled);
      this.updateState({ isMuted: !enabled });
    }
  }

  toggleVideo(): void {
    if (this.currentState.localStream) {
      const enabled = !this.currentState.isVideoEnabled;
      this.mediaService.toggleVideo(this.currentState.localStream, enabled);
      this.updateState({ isVideoEnabled: enabled });
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
    this.matchingService.onMatched((session: ChatSession) => {
      this.handleMatchFound(session);
    });

    this.webRTCService.onRemoteStream(stream => {
      this.updateState({ remoteStream: stream });
    });

    this.webRTCService.onConnectionStateChange(state => {
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

    this.webRTCService.onError(error => {
      this.handleError(error);
    });
  }

  private async handleMatchFound(session: ChatSession): Promise<void> {
    try {
      await this.webRTCService.initConnection(
        this.currentState.localStream!,
        session.roomId,
        session.isCaller,
        session.strangerId
      );
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
  }

  destroy(): void {
    this.endSession();
    if (this.currentState.localStream) {
      this.mediaService.stopStream(this.currentState.localStream);
    }
  }

  setupPageUnloadCleanup(): void {
    const cleanup = async () => {
      try {
        await this.matchingService.handlePageUnloadCleanup();
        this.webRTCService.closeConnection();
      } catch (error) {
        console.error('❌ Error during page unload cleanup:', error);
      }
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
  }
}
