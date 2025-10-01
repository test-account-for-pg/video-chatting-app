import { IWebRTCService } from '../types';
import { FirebaseService } from './FirebaseService';

export class WebRTCService implements IWebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private isCaller: boolean = false;
  private firebaseService: FirebaseService;
  private peerId: string | null = null;

  // Event callbacks
  private remoteStreamCallbacks: ((stream: MediaStream) => void)[] = [];
  private connectionStateCallbacks: ((state: string) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
    this.setupSignalingHandlers();
  }

  async initConnection(localStream: MediaStream, sessionId: string, isCaller: boolean, peerId: string): Promise<void> {
    try {
      this.localStream = localStream;
      this.sessionId = sessionId;
      this.isCaller = isCaller;
      this.peerId = peerId;

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, localStream);
      });

      // Setup event handlers
      this.setupPeerConnectionHandlers();

      // If caller, create and send offer
      if (isCaller) {
        await this.createAndSendOffer();
      }

      console.log('🔗 WebRTC connection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC connection:', error);
      this.notifyError('Failed to initialize WebRTC connection');
      throw error;
    }
  }

  closeConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('🔌 WebRTCService: Peer connection closed');
    }

    // Clear all references
    this.localStream = null;
    this.sessionId = null;
    this.peerId = null;
    
    // Clear all callbacks
    this.remoteStreamCallbacks = [];
    this.connectionStateCallbacks = [];
    this.errorCallbacks = [];
    
    console.log('🔌 WebRTCService: Connection cleanup completed');
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.remoteStreamCallbacks.push(callback);
  }

  onConnectionStateChange(callback: (state: string) => void): void {
    this.connectionStateCallbacks.push(callback);
  }

  onError(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  isConnectionEstablished(): boolean {
    return this.peerConnection?.connectionState === 'connected';
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log('📹 Remote stream received');
      this.remoteStreamCallbacks.forEach(callback => callback(remoteStream));
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'unknown';
      console.log('🔄 Connection state changed:', state);
      this.connectionStateCallbacks.forEach(callback => callback(state));
      
      // Cleanup session when connection is established (both users connected)
      if (state === 'connected') {
        console.log('🎉 Connection established, cleaning up session for both users');
        // Also cleanup the peer's session (they should do the same)
        if (this.peerId) {
          this.firebaseService.cleanupSession(this.peerId);
        }
      }
      
      // Handle disconnection
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log('🔌 Connection lost, notifying UI');
        this.connectionStateCallbacks.forEach(callback => callback('disconnected'));
        this.closeConnection();
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.peerId) {
        console.log('🧊 WebRTCService: Sending ICE candidate', event.candidate?.candidate);
        this.firebaseService.sendIceCandidate(this.peerId, event.candidate);
      }
    };
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection || !this.peerId) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      await this.firebaseService.sendOffer(this.peerId, offer);
      console.log('📤 Offer sent');
    } catch (error) {
      console.error('❌ Failed to create/send offer:', error);
      this.notifyError('Failed to create/send offer');
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection || !this.peerId) return;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this.firebaseService.sendAnswer(this.peerId, answer);
      console.log('📤 Answer sent');
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      this.notifyError('Failed to handle offer');
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ Answer received and set');
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
      this.notifyError('Failed to handle answer');
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      console.log('🧊 WebRTCService: Handling ICE candidate', candidate);
      await this.peerConnection.addIceCandidate(candidate);
      console.log('🧊 ICE candidate added');
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  private setupSignalingHandlers(): void {
    // Listen for offers
    this.firebaseService.onOffer((offer, fromUserId) => {
      if (fromUserId === this.peerId) {
        this.handleOffer(offer);
      }
    });

    // Listen for answers
    this.firebaseService.onAnswer((answer, fromUserId) => {
      if (fromUserId === this.peerId) {
        this.handleAnswer(answer);
      }
    });

    // Listen for ICE candidates
    this.firebaseService.onIceCandidates((candidate, fromUserId) => {
      if (fromUserId === this.peerId) {
        this.handleIceCandidate(candidate);
      }
    });
  }


  private notifyError(error: string): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }
}
