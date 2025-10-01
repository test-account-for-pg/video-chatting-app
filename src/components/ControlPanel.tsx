import React from 'react';

interface ControlPanelProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isConnected: boolean;
  isWaiting: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onJoinWaitingPool: () => void;
  onLeaveWaitingPool: () => void;
  onEndSession: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isMuted,
  isVideoEnabled,
  isConnected,
  isWaiting,
  onToggleAudio,
  onToggleVideo,
  onJoinWaitingPool,
  onLeaveWaitingPool,
  onEndSession
}) => {
  console.log('🔊 ControlPanel: Rendered with props:', { isMuted, isVideoEnabled, isConnected, isWaiting });
  
  return (
    <div className="control-panel bg-gray-900 p-4 rounded-lg">
      <div className="flex items-center justify-center space-x-4">
        {/* Audio Toggle */}
        <button
          onClick={() => {
            console.log('🔊 ControlPanel: Mute button clicked, current isMuted:', isMuted);
            console.log('🔊 ControlPanel: onToggleAudio function:', typeof onToggleAudio);
            onToggleAudio();
            console.log('🔊 ControlPanel: onToggleAudio called');
          }}
          className={`p-3 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            // Muted microphone with clean diagonal line
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 3l14 14" />
            </svg>
          ) : (
            // Regular microphone
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            !isVideoEnabled 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            // Regular video camera
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            // Video camera with clean diagonal line
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 3l14 14" />
            </svg>
          )}
        </button>

        {/* Join/Leave Waiting Pool */}
        {!isConnected && (
          <button
            onClick={isWaiting ? onLeaveWaitingPool : onJoinWaitingPool}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              isWaiting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isWaiting ? 'Leave Queue' : 'Find Stranger'}
          </button>
        )}

        {/* End Session */}
        {isConnected && (
          <button
            onClick={onEndSession}
            className="px-6 py-3 rounded-full font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};
