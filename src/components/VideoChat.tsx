import React, { useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ControlPanel } from './ControlPanel';
import { StatusIndicator } from './StatusIndicator';
import { useVideoChat } from '../hooks/useVideoChat';

export const VideoChat: React.FC = () => {
  const {
    localStream,
    remoteStream,
    isConnected,
    isWaiting,
    isMuted,
    isVideoEnabled,
    error,
    initialize,
    joinWaitingPool,
    leaveWaitingPool,
    endSession,
    toggleAudio,
    toggleVideo,
    clearError
  } = useVideoChat();

  // Initialize the video chat when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Stranger Video Chat</h1>
          <p className="text-gray-400">Connect with random strangers for video conversations</p>
        </div>

        {/* Status Indicator */}
        <StatusIndicator
          isConnected={isConnected}
          isWaiting={isWaiting}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          error={error}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-200">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Local Video */}
            <div className="relative">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  className="w-full h-full"
                />
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                You
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <VideoPlayer
                  stream={remoteStream}
                  isLocal={false}
                  className="w-full h-full"
                />
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                {isConnected ? 'Stranger' : 'Waiting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <ControlPanel
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          isConnected={isConnected}
          isWaiting={isWaiting}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onJoinWaitingPool={joinWaitingPool}
          onLeaveWaitingPool={leaveWaitingPool}
          onEndSession={endSession}
        />

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Click "Find Stranger" to start looking for someone to chat with.</p>
          <p>Use the microphone and camera buttons to control your audio and video.</p>
        </div>
      </div>
    </div>
  );
};
