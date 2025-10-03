import React from 'react';
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
    isDisconnected,
    error,
    startMatching,
    stopMatching,
    endSession,
    toggleAudio,
    toggleVideo,
    clearError
  } = useVideoChat();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">Stranger Video Chat</h1>
            <p className="text-gray-400 text-sm">Connect with random strangers for video conversations</p>
          </div>
        </div>

        {/* Status Indicator - Compact */}
        <div className="flex-shrink-0 px-4 mb-4">
          <StatusIndicator
            isConnected={isConnected}
            isWaiting={isWaiting}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            error={error}
          />
        </div>

        {/* Error Message - Compact */}
        {error && (
          <div className="flex-shrink-0 mx-4 mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300 ml-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Video Container - Flexible height */}
        <div className="flex-1 px-4 mb-4 min-h-0">
          <div className="grid grid-cols-1 gap-4 h-full">
            {/* Local Video */}
            <div className="relative">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  className="w-full h-full"
                  muted={isMuted}
                />
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
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
                  status={isConnected ? 'connected' : isWaiting ? 'waiting' : isDisconnected ? 'disconnected' : 'no-one'}
                />
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                {isConnected ? 'Stranger' : isWaiting ? 'Waiting...' : isDisconnected ? 'Disconnected' : 'No one here'}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel - Fixed at bottom */}
        <div className="flex-shrink-0">
          <ControlPanel
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            isConnected={isConnected}
            isWaiting={isWaiting}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onJoinWaitingPool={startMatching}
            onLeaveWaitingPool={stopMatching}
            onEndSession={endSession}
          />
        </div>

        {/* Instructions - Compact for mobile */}
        <div className="flex-shrink-0 px-4 py-2 text-center text-gray-400 text-xs">
          <p>Tap "Find Stranger" to start • Use buttons below to control audio/video</p>
        </div>
      </div>

      {/* Desktop Layout - Original */}
      <div className="hidden md:block">
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
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Local Video */}
              <div className="relative">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <VideoPlayer
                    stream={localStream}
                    isLocal={true}
                    className="w-full h-full"
                    muted={isMuted}
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
                    status={isConnected ? 'connected' : isWaiting ? 'waiting' : isDisconnected ? 'disconnected' : 'no-one'}
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                  {isConnected ? 'Stranger' : isWaiting ? 'Waiting...' : isDisconnected ? 'Disconnected' : 'No one here'}
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
            onJoinWaitingPool={startMatching}
            onLeaveWaitingPool={stopMatching}
            onEndSession={endSession}
          />

          {/* Instructions */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Click "Find Stranger" to start looking for someone to chat with.</p>
            <p>Use the microphone and camera buttons to control your audio and video.</p>
          </div>
        </div>
      </div>
    </div>
  );
};