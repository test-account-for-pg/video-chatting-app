import { useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { serviceContainer } from '../services/ServiceContainer';

const initialState: AppState = {
  currentUser: null,
  currentSession: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isConnected: false,
  isMuted: false,
  isVideoEnabled: true,
  isWaiting: false,
  error: null
};

export const useVideoChat = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const videoChatService = serviceContainer.getVideoChatService();

  // Initialize the service
  const initialize = useCallback(async () => {
    try {
      await videoChatService.initialize();
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
    }
  }, [videoChatService]);

  // Start matching
  const startMatching = useCallback(async () => {
    try {
      await videoChatService.startMatching();
    } catch (error) {
      console.error('Failed to start matching:', error);
    }
  }, [videoChatService]);

  // Stop matching
  const stopMatching = useCallback(() => {
    videoChatService.stopMatching();
  }, [videoChatService]);

  // End session
  const endSession = useCallback(async () => {
    try {
      await videoChatService.endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [videoChatService]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    console.log('🔊 useVideoChat: toggleAudio called');
    videoChatService.toggleAudio();
  }, [videoChatService]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    videoChatService.toggleVideo();
  }, [videoChatService]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Setup state change listener
  useEffect(() => {
  const handleStateChange = (newState: AppState) => {
    console.log('🎥 useVideoChat: State changed', newState);
    console.log('🎥 useVideoChat: Local stream', newState.localStream);
    console.log('🎥 useVideoChat: Remote stream', newState.remoteStream);
    console.log('🎥 useVideoChat: isMuted', newState.isMuted);
    console.log('🎥 useVideoChat: Previous state:', state);
    setState(newState);
    console.log('🎥 useVideoChat: State set, new state should be:', newState);
    
    // Update disconnection status
    const disconnected = videoChatService.isStrangerDisconnected();
    setIsDisconnected(disconnected);
  };

    const handleError = (error: string) => {
      setState(prev => ({ ...prev, error }));
    };

    videoChatService.onStateChange(handleStateChange);
    videoChatService.onError(handleError);

    // Initialize on mount
    initialize();

    // Setup page unload cleanup
    videoChatService.setupPageUnloadCleanup();

    // Cleanup on unmount
    return () => {
      videoChatService.destroy();
    };
  }, [videoChatService, initialize]);

  return {
    // State
    ...state,
    isDisconnected,
    
    // Actions
    initialize,
    startMatching,
    stopMatching,
    endSession,
    toggleAudio,
    toggleVideo,
    clearError
  };
};

