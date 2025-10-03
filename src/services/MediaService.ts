import { IMediaService, MediaConstraints } from '../types';

export class MediaService implements IMediaService {
  async getUserMedia(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log('📹 MediaService: Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('📹 MediaService: Media stream obtained:', stream);
      console.log('📹 MediaService: Stream tracks:', stream.getTracks().map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled })));
      console.log('📹 MediaService: Audio tracks:', stream.getAudioTracks().map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled })));
      console.log('📹 MediaService: Video tracks:', stream.getVideoTracks().map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled })));
      return stream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw new Error('Failed to access camera and microphone');
    }
  }

  stopStream(stream: MediaStream): void {
    try {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
    }
  }

  toggleAudio(stream: MediaStream, enabled: boolean): void {
    const audioTracks = this.getAudioTracks(stream);
    console.log('🔊 MediaService: Audio tracks found:', audioTracks.length);
    console.log('🔊 MediaService: Stream object:', stream);
    console.log('🔊 MediaService: All tracks in stream:', stream.getTracks().map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled })));
    
    if (audioTracks.length === 0) {
      console.error('🔊 MediaService: No audio tracks found in stream!');
      return;
    }
    
    audioTracks.forEach((track, index) => {
      
      track.enabled = enabled;
      console.log(`🔊 Audio ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  toggleVideo(stream: MediaStream, enabled: boolean): void {
    const videoTracks = this.getVideoTracks(stream);
    videoTracks.forEach(track => {
      track.enabled = enabled;
      console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  getAudioTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getAudioTracks();
  }

  getVideoTracks(stream: MediaStream): MediaStreamTrack[] {
    return stream.getVideoTracks();
  }
}

