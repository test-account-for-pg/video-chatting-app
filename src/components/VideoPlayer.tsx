import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
  muted?: boolean;
  status?: 'waiting' | 'disconnected' | 'no-one' | 'connected';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isLocal = false,
  className = '',
  muted = false,
  status = 'no-one',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('🎥 VideoPlayer: Setting stream', stream);
      console.log('🎥 VideoPlayer: Stream tracks', stream.getTracks());
      console.log('🎥 VideoPlayer: isLocal', isLocal);
      videoRef.current.srcObject = stream;
      // Ensure the video plays
      videoRef.current
        .play()
        .then(() => {
          console.log('🎥 VideoPlayer: Video started playing');
        })
        .catch(error => {
          console.error('🎥 VideoPlayer: Error playing video:', error);
        });
    } else {
      console.log('🎥 VideoPlayer: No stream or video element', {
        stream: !!stream,
        videoElement: !!videoRef.current,
      });
    }
  }, [stream, isLocal]);

  return (
    <div className={`video-player ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="w-full h-full object-cover rounded-lg"
        style={{ width: '100%', height: '100%' }}
        controls={false}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="text-white text-center">
            {status === 'waiting' && (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Waiting for stranger...</p>
              </>
            )}
            {status === 'disconnected' && (
              <>
                <div className="text-red-400 text-4xl mb-2">📞</div>
                <p className="text-sm">Stranger disconnected</p>
              </>
            )}
            {status === 'no-one' && (
              <>
                <div className="text-gray-400 text-4xl mb-2">👤</div>
                <p className="text-sm">No one here</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
