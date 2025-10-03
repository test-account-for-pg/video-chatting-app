import { IMediaService, MediaConstraints } from '../types';

export class MediaService implements IMediaService {
  async getUserMedia(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      throw new Error('Failed to access camera and microphone');
    }
  }

  stopStream(stream: MediaStream): void {
    try {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
    }
  }

  toggleAudio(stream: MediaStream, enabled: boolean): void {
    const audioTracks = this.getAudioTracks(stream);

    if (audioTracks.length === 0) {
      return;
    }

    audioTracks.forEach((track, index) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(stream: MediaStream, enabled: boolean): void {
    const videoTracks = this.getVideoTracks(stream);
    videoTracks.forEach(track => {
      track.enabled = enabled;
    });
  }

  getAudioTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getAudioTracks();
  }

  getVideoTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getVideoTracks();
  }
}
