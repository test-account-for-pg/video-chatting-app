import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppEvent, SignalingMessage, ChatSession } from '../types';
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
  const signalingService = serviceContainer.getSignalingService();
  const peerConnectionService = serviceContainer.getPeerConnectionService();
  const mediaService = serviceContainer.getMediaService();
  const matchingService = serviceContainer.getMatchingService();

  // Refs to store callbacks and prevent stale closures
  const stateRef = useRef(state);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Update state ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // State reducer
  const dispatch = useCallback((event: AppEvent) => {
    setState((prevState: AppState) => {
      switch (event.type) {
        case 'USER_JOINED':
          return { ...prevState, currentUser: event.payload };
        
        case 'USER_LEFT':
          return { ...prevState, currentUser: null };
        
        case 'SESSION_STARTED':
          return { 
            ...prevState, 
            currentSession: event.payload,
            isWaiting: false,
            isConnected: true
          };
        
        case 'SESSION_ENDED':
          return {
            ...prevState,
            currentSession: null,
            isConnected: false,
            remoteStream: null,
            peerConnection: null
          };
        
        case 'STREAM_RECEIVED':
          return { ...prevState, remoteStream: event.payload };
        
        case 'CONNECTION_ESTABLISHED':
          return { ...prevState, isConnected: true };
        
        case 'CONNECTION_LOST':
          return { ...prevState, isConnected: false };
        
        case 'ERROR':
          return { ...prevState, error: event.payload };
        
        case 'TOGGLE_AUDIO':
          return { ...prevState, isMuted: !prevState.isMuted };
        
        case 'TOGGLE_VIDEO':
          return { ...prevState, isVideoEnabled: !prevState.isVideoEnabled };
        
        case 'CLEAR_ERROR':
          return { ...prevState, error: null };
        
        default:
          return prevState;
      }
    });
  }, []);

  // Initialize media and signaling
  const initialize = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Connect to signaling service
      await signalingService.connect();
      
      // Get user media
      const stream = await mediaService.getUserMedia();
      setState((prev: AppState) => ({ ...prev, localStream: stream }));
      
      // Set up signaling event handlers
      setupSignalingHandlers();
      
      console.log('Video chat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
      dispatch({ type: 'ERROR', payload: error instanceof Error ? error.message : 'Failed to initialize' });
    }
  }, [signalingService, mediaService, dispatch]);

  // Set up signaling event handlers
  const setupSignalingHandlers = useCallback(() => {
    signalingService.onMessage(handleSignalingMessage);
    signalingService.onMatchFound(handleMatchFound);
    signalingService.onUserJoined(handleUserJoined);
    signalingService.onUserLeft(handleUserLeft);
  }, [signalingService]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    try {
      switch (message.type) {
        case 'offer':
          await handleOffer(message.data, message.from);
          break;
        case 'answer':
          await handleAnswer(message.data);
          break;
        case 'ice-candidate':
          await handleIceCandidate(message.data);
          break;
        case 'match-found':
          handleMatchFound(message.data);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to handle signaling message' });
    }
  }, [dispatch]);

  // Handle WebRTC offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromUserId?: string) => {
    if (!stateRef.current.localStream) return;

    try {
      const peerConnection = await peerConnectionService.createPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add local stream
      peerConnectionService.addLocalStream(peerConnection, stateRef.current.localStream);

      // Set up event handlers
      setupPeerConnectionHandlers(peerConnection);

      // Create answer
      const answer = await peerConnectionService.createAnswer(peerConnection, offer);
      
      // Send answer
      await signalingService.sendMessage({
        type: 'answer',
        from: stateRef.current.currentUser?.id || '',
        to: fromUserId || '',
        data: answer,
        timestamp: Date.now()
      });

      setState((prev: AppState) => ({ ...prev, peerConnection }));
    } catch (error) {
      console.error('Error handling offer:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to handle offer' });
    }
  }, [peerConnectionService, signalingService, dispatch]);

  // Handle WebRTC answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionService.setRemoteDescription(peerConnectionRef.current, answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to handle answer' });
    }
  }, [peerConnectionService, dispatch]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionService.addIceCandidate(peerConnectionRef.current, candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [peerConnectionService]);

  // Handle match found
  const handleMatchFound = useCallback((session: ChatSession) => {
    dispatch({ type: 'SESSION_STARTED', payload: session });
  }, [dispatch]);

  // Handle user joined
  const handleUserJoined = useCallback((user: any) => {
    dispatch({ type: 'USER_JOINED', payload: user });
  }, [dispatch]);

  // Handle user left
  const handleUserLeft = useCallback((userId: string) => {
    dispatch({ type: 'USER_LEFT', payload: userId });
  }, [dispatch]);

  // Set up peer connection event handlers
  const setupPeerConnectionHandlers = useCallback((peerConnection: RTCPeerConnection) => {
    // Handle ICE candidates
    peerConnectionService.onIceCandidate(peerConnection, async (candidate) => {
      try {
        await signalingService.sendMessage({
          type: 'ice-candidate',
          from: stateRef.current.currentUser?.id || '',
          to: stateRef.current.currentSession?.participants.find(id => id !== stateRef.current.currentUser?.id) || '',
          data: candidate,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error sending ICE candidate:', error);
      }
    });

    // Handle remote stream
    peerConnectionService.onRemoteStream(peerConnection, (stream) => {
      dispatch({ type: 'STREAM_RECEIVED', payload: stream });
    });

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState;
      if (connectionState === 'connected') {
        dispatch({ type: 'CONNECTION_ESTABLISHED' });
      } else if (connectionState === 'disconnected' || connectionState === 'failed') {
        dispatch({ type: 'CONNECTION_LOST' });
      }
    };
  }, [peerConnectionService, signalingService, dispatch]);

  // Join waiting pool
  const joinWaitingPool = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await signalingService.joinWaitingPool();
      setState((prev: AppState) => ({ ...prev, isWaiting: true }));
    } catch (error) {
      console.error('Error joining waiting pool:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to join waiting pool' });
    }
  }, [signalingService, dispatch]);

  // Leave waiting pool
  const leaveWaitingPool = useCallback(async () => {
    try {
      await signalingService.leaveWaitingPool();
      setState((prev: AppState) => ({ ...prev, isWaiting: false }));
    } catch (error) {
      console.error('Error leaving waiting pool:', error);
    }
  }, [signalingService]);

  // End current session
  const endSession = useCallback(async () => {
    try {
      if (stateRef.current.currentSession) {
        await matchingService.endSession(stateRef.current.currentSession.id);
      }
      
      if (peerConnectionRef.current) {
        peerConnectionService.closeConnection(peerConnectionRef.current);
        peerConnectionRef.current = null;
      }
      
      dispatch({ type: 'SESSION_ENDED', payload: stateRef.current.currentSession?.id || '' });
    } catch (error) {
      console.error('Error ending session:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to end session' });
    }
  }, [matchingService, peerConnectionService, dispatch]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (stateRef.current.localStream) {
      mediaService.toggleAudio(stateRef.current.localStream, stateRef.current.isMuted);
      dispatch({ type: 'TOGGLE_AUDIO' });
    }
  }, [mediaService, dispatch]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (stateRef.current.localStream) {
      mediaService.toggleVideo(stateRef.current.localStream, !stateRef.current.isVideoEnabled);
      dispatch({ type: 'TOGGLE_VIDEO' });
    }
  }, [mediaService, dispatch]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionService.closeConnection(peerConnectionRef.current);
      }
      if (stateRef.current.localStream) {
        mediaService.stopStream(stateRef.current.localStream);
      }
      signalingService.disconnect();
    };
  }, [peerConnectionService, mediaService, signalingService]);

  return {
    ...state,
    initialize,
    joinWaitingPool,
    leaveWaitingPool,
    endSession,
    toggleAudio,
    toggleVideo,
    clearError
  };
};
