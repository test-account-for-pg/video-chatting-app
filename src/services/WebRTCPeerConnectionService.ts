import { IPeerConnectionService } from '../types';

export class WebRTCPeerConnectionService implements IPeerConnectionService {
  private stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  // Optional TURN servers for production use
  private turnServers: RTCIceServer[] = [
    // Add your TURN server configuration here if needed
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
  ];

  async createPeerConnection(): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [...this.stunServers, ...this.turnServers],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', peerConnection.iceConnectionState);
    };

    return peerConnection;
  }

  async createOffer(peerConnection: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw new Error('Failed to create offer');
    }
  }

  async createAnswer(
    peerConnection: RTCPeerConnection, 
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw new Error('Failed to create answer');
    }
  }

  async setLocalDescription(
    peerConnection: RTCPeerConnection, 
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      await peerConnection.setLocalDescription(description);
    } catch (error) {
      console.error('Error setting local description:', error);
      throw new Error('Failed to set local description');
    }
  }

  async setRemoteDescription(
    peerConnection: RTCPeerConnection, 
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      await peerConnection.setRemoteDescription(description);
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw new Error('Failed to set remote description');
    }
  }

  async addIceCandidate(
    peerConnection: RTCPeerConnection, 
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Don't throw here as this is often not critical
      console.warn('ICE candidate addition failed, continuing...');
    }
  }

  onIceCandidate(
    peerConnection: RTCPeerConnection, 
    callback: (candidate: RTCIceCandidate) => void
  ): void {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  onRemoteStream(
    peerConnection: RTCPeerConnection, 
    callback: (stream: MediaStream) => void
  ): void {
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        callback(event.streams[0]);
      }
    };
  }

  closeConnection(peerConnection: RTCPeerConnection): void {
    try {
      // Close all transceivers
      peerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the connection
      peerConnection.close();
    } catch (error) {
      console.error('Error closing peer connection:', error);
    }
  }

  // Helper method to add local stream to peer connection
  addLocalStream(peerConnection: RTCPeerConnection, stream: MediaStream): void {
    try {
      // Remove existing tracks first
      peerConnection.getSenders().forEach(sender => {
        if (sender.track) {
          peerConnection.removeTrack(sender);
        }
      });

      // Add new tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      console.error('Error adding local stream:', error);
      throw new Error('Failed to add local stream');
    }
  }

  // Helper method to get connection statistics
  async getConnectionStats(peerConnection: RTCPeerConnection): Promise<RTCStatsReport | null> {
    try {
      return await peerConnection.getStats();
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return null;
    }
  }

  // Helper method to check if connection is stable
  isConnectionStable(peerConnection: RTCPeerConnection): boolean {
    return peerConnection.iceConnectionState === 'connected' || 
           peerConnection.iceConnectionState === 'completed';
  }

  // Helper method to get connection state
  getConnectionState(peerConnection: RTCPeerConnection): string {
    return peerConnection.connectionState;
  }

  // Helper method to get ICE connection state
  getIceConnectionState(peerConnection: RTCPeerConnection): string {
    return peerConnection.iceConnectionState;
  }
}
