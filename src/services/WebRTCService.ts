import { IWebRTCService } from '../types';
import { FirebaseService } from './FirebaseService';

export class WebRTCService implements IWebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private isCaller: boolean = false;
  private firebaseService: FirebaseService;
  private peerId: string | null = null;
  private dataChannel: RTCDataChannel | null = null;

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

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
      });

      localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, localStream);
      });

      this.setupDataChannel();
      this.setupPeerConnectionHandlers();

      if (isCaller) {
        await this.createAndSendOffer();
      }
    } catch (error) {
      this.notifyError('Failed to initialize WebRTC connection');
      throw error;
    }
  }

  closeConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.localStream = null;
    this.sessionId = null;
    this.peerId = null;
    this.dataChannel = null;
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    if (this.isCaller) {
      this.dataChannel = this.peerConnection.createDataChannel('notifications', {
        ordered: true,
      });
      this.setupDataChannelHandlers();
    }

    this.peerConnection.ondatachannel = event => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;
    this.dataChannel.onmessage = event => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'end_call') {
          this.connectionStateCallbacks.forEach(callback => callback('disconnected'));
        }
      } catch (error) {
        // Error parsing data channel message
      }
    };
  }

  sendEndCallNotification(): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = { type: 'end_call', timestamp: Date.now() };
      this.dataChannel.send(JSON.stringify(message));
    }
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

    this.peerConnection.ontrack = event => {
      const remoteStream = event.streams[0];
      this.remoteStreamCallbacks.forEach(callback => callback(remoteStream));
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'unknown';
      this.connectionStateCallbacks.forEach(callback => callback(state));

      if (state === 'connected') {
        if (this.peerId) {
          this.firebaseService.cleanupSession(this.peerId);
        }
      }

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.connectionStateCallbacks.forEach(callback => callback('disconnected'));
        this.closeConnection();
      }
    };

    this.peerConnection.onicecandidate = event => {
      if (event.candidate && this.peerId) {
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
    } catch (error) {
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
    } catch (error) {
      this.notifyError('Failed to handle offer');
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      this.notifyError('Failed to handle answer');
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  private setupSignalingHandlers(): void {
    this.firebaseService.onOffer((offer, fromUserId) => {
      if (fromUserId === this.peerId) {
        this.handleOffer(offer);
      }
    });

    this.firebaseService.onAnswer((answer, fromUserId) => {
      if (fromUserId === this.peerId) {
        this.handleAnswer(answer);
      }
    });

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
