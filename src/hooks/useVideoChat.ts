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
  isDisconnected: false,
  isMuted: false,
  isVideoEnabled: true,
  isWaiting: false,
  error: null,
};

export const useVideoChat = () => {
  const [state, setState] = useState<AppState>(initialState);
  const videoChatService = serviceContainer.getVideoChatService();

  const initialize = useCallback(async () => {
    try {
      await videoChatService.initialize();
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
    }
  }, [videoChatService]);

  const startMatching = useCallback(async () => {
    try {
      await videoChatService.startMatching();
    } catch (error) {
      console.error('Failed to start matching:', error);
    }
  }, [videoChatService]);

  const stopMatching = useCallback(() => {
    videoChatService.stopMatching();
  }, [videoChatService]);

  const endSession = useCallback(async () => {
    try {
      await videoChatService.endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [videoChatService]);

  const toggleAudio = useCallback(() => {
    console.log('🔊 useVideoChat: toggleAudio called');
    videoChatService.toggleAudio();
  }, [videoChatService]);

  const toggleVideo = useCallback(() => {
    videoChatService.toggleVideo();
  }, [videoChatService]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    const handleStateChange = (newState: AppState) => {
      setState(newState);
    };

    const handleError = (error: string) => {
      setState(prev => ({ ...prev, error }));
    };

    videoChatService.onStateChange(handleStateChange);
    videoChatService.onError(handleError);

    initialize();

    videoChatService.setupPageUnloadCleanup();

    // Cleanup on unmount
    return () => {
      videoChatService.destroy();
    };
  }, [videoChatService, initialize]);

  return {
    ...state,

    initialize,
    startMatching,
    stopMatching,
    endSession,
    toggleAudio,
    toggleVideo,
    clearError,
  };
};
