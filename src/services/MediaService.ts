import { IMediaService, MediaConstraints } from '../types';

export class MediaService implements IMediaService {
  private defaultConstraints: MediaConstraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };

  async getUserMedia(constraints: MediaConstraints = this.defaultConstraints): Promise<MediaStream> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request media access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Log available tracks
      console.log('Media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackSettings: stream.getVideoTracks()[0]?.getSettings(),
        audioTrackSettings: stream.getAudioTracks()[0]?.getSettings()
      });

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Provide more specific error messages
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Camera and microphone access denied. Please allow access and try again.');
          case 'NotFoundError':
            throw new Error('No camera or microphone found. Please connect a camera and microphone.');
          case 'NotReadableError':
            throw new Error('Camera or microphone is already in use by another application.');
          case 'OverconstrainedError':
            throw new Error('Camera or microphone constraints cannot be satisfied.');
          case 'SecurityError':
            throw new Error('Camera and microphone access blocked due to security restrictions.');
          default:
            throw new Error(`Media access error: ${error.message}`);
        }
      }
      
      throw new Error('Failed to access camera and microphone');
    }
  }

  stopStream(stream: MediaStream): void {
    try {
      // Stop all tracks in the stream
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }

  toggleAudio(stream: MediaStream, enabled: boolean): void {
    try {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = enabled;
      });
      console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling audio:', error);
      throw new Error('Failed to toggle audio');
    }
  }

  toggleVideo(stream: MediaStream, enabled: boolean): void {
    try {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = enabled;
      });
      console.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling video:', error);
      throw new Error('Failed to toggle video');
    }
  }

  getAudioTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getAudioTracks();
  }

  getVideoTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getVideoTracks();
  }

  // Helper method to check if audio is enabled
  isAudioEnabled(stream: MediaStream): boolean {
    const audioTracks = stream.getAudioTracks();
    return audioTracks.length > 0 && audioTracks[0].enabled;
  }

  // Helper method to check if video is enabled
  isVideoEnabled(stream: MediaStream): boolean {
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].enabled;
  }

  // Helper method to get available devices
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('enumerateDevices is not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Error getting available devices:', error);
      throw new Error('Failed to get available devices');
    }
  }

  // Helper method to get camera devices
  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getAvailableDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  // Helper method to get microphone devices
  async getMicrophoneDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.getAvailableDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  // Helper method to switch camera
  async switchCamera(stream: MediaStream, deviceId: string): Promise<MediaStream> {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track found');
      }

      // Stop current video track
      videoTrack.stop();

      // Get new video track with specified device
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace video track in original stream
      stream.removeTrack(videoTrack);
      stream.addTrack(newVideoTrack);

      return stream;
    } catch (error) {
      console.error('Error switching camera:', error);
      throw new Error('Failed to switch camera');
    }
  }

  // Helper method to get stream constraints for specific devices
  getConstraintsForDevices(
    videoDeviceId?: string, 
    audioDeviceId?: string
  ): MediaConstraints {
    const constraints: MediaConstraints = {
      video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
    };

    return constraints;
  }

  // Helper method to check media permissions
  async checkPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const cameraPermission = result.state === 'granted';

      const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const microphonePermission = micResult.state === 'granted';

      return {
        camera: cameraPermission,
        microphone: microphonePermission
      };
    } catch (error) {
      console.warn('Could not check permissions:', error);
      return { camera: false, microphone: false };
    }
  }
}
