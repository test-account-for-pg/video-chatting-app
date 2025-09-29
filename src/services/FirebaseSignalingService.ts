import { 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  remove, 
  get, 
  child,
  query,
  orderByChild,
  equalTo,
  limitToFirst
} from 'firebase/database';
import { database } from './firebase-config';
import { ISignalingService, SignalingMessage, User, ChatSession } from '../types';

export class FirebaseSignalingService implements ISignalingService {
  private currentUserId: string | null = null;
  private messageCallbacks: ((message: SignalingMessage) => void)[] = [];
  private userJoinedCallbacks: ((user: User) => void)[] = [];
  private userLeftCallbacks: ((userId: string) => void)[] = [];
  private matchFoundCallbacks: ((session: ChatSession) => void)[] = [];
  private messageRef: any = null;
  private waitingPoolRef: any = null;
  private sessionsRef: any = null;

  async connect(): Promise<void> {
    // Generate a unique user ID
    this.currentUserId = this.generateUserId();
    
    // Set up database references
    this.messageRef = ref(database, 'messages');
    this.waitingPoolRef = ref(database, 'waitingPool');
    this.sessionsRef = ref(database, 'sessions');

    // Listen for messages directed to this user
    this.setupMessageListener();
    
    // Listen for waiting pool changes
    this.setupWaitingPoolListener();
    
    // Listen for session changes
    this.setupSessionListener();
  }

  disconnect(): void {
    if (this.currentUserId) {
      // Remove user from waiting pool
      this.leaveWaitingPool();
      
      // Clean up listeners
      if (this.messageRef) {
        off(this.messageRef);
      }
      if (this.waitingPoolRef) {
        off(this.waitingPoolRef);
      }
      if (this.sessionsRef) {
        off(this.sessionsRef);
      }
    }
  }

  async joinWaitingPool(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Not connected to signaling service');
    }

    const user: User = {
      id: this.currentUserId,
      isWaiting: true,
      createdAt: Date.now()
    };

    // Add user to waiting pool
    await set(ref(database, `waitingPool/${this.currentUserId}`), user);

    // Try to find a match immediately
    await this.tryFindMatch();
  }

  async leaveWaitingPool(): Promise<void> {
    if (!this.currentUserId) return;

    await remove(ref(database, `waitingPool/${this.currentUserId}`));
  }

  async sendMessage(message: SignalingMessage): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Not connected to signaling service');
    }

    const messageWithId = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };

    await push(this.messageRef, messageWithId);
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onUserJoined(callback: (user: User) => void): void {
    this.userJoinedCallbacks.push(callback);
  }

  onUserLeft(callback: (userId: string) => void): void {
    this.userLeftCallbacks.push(callback);
  }

  onMatchFound(callback: (session: ChatSession) => void): void {
    this.matchFoundCallbacks.push(callback);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9);
  }

  private setupMessageListener(): void {
    if (!this.messageRef || !this.currentUserId) return;

    onValue(this.messageRef, (snapshot) => {
      const messages = snapshot.val();
      if (!messages) return;

      Object.values(messages).forEach((message: any) => {
        // Only process messages directed to this user
        if (message.to === this.currentUserId || 
            (message.type === 'match-found' && message.data?.participants?.includes(this.currentUserId))) {
          this.messageCallbacks.forEach(callback => callback(message));
        }
      });
    });
  }

  private setupWaitingPoolListener(): void {
    if (!this.waitingPoolRef) return;

    onValue(this.waitingPoolRef, (snapshot) => {
      const waitingUsers = snapshot.val();
      if (!waitingUsers) return;

      Object.values(waitingUsers).forEach((user: any) => {
        if (user.id !== this.currentUserId) {
          this.userJoinedCallbacks.forEach(callback => callback(user));
        }
      });
    });
  }

  private setupSessionListener(): void {
    if (!this.sessionsRef || !this.currentUserId) return;

    onValue(this.sessionsRef, (snapshot) => {
      const sessions = snapshot.val();
      if (!sessions) return;

      Object.values(sessions).forEach((session: any) => {
        if (session.participants?.includes(this.currentUserId) && session.isActive) {
          this.matchFoundCallbacks.forEach(callback => callback(session));
        }
      });
    });
  }

  private async tryFindMatch(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Get all waiting users except current user
      const waitingUsersQuery = query(
        this.waitingPoolRef,
        orderByChild('isWaiting'),
        equalTo(true)
      );

      const snapshot = await get(waitingUsersQuery);
      const waitingUsers = snapshot.val();

      if (!waitingUsers) return;

      const userIds = Object.keys(waitingUsers).filter(id => id !== this.currentUserId);
      
      if (userIds.length > 0) {
        // Found a match - create a session
        const matchUserId = userIds[0];
        const sessionId = this.generateSessionId();
        
        const session: ChatSession = {
          id: sessionId,
          participants: [this.currentUserId, matchUserId],
          createdAt: Date.now(),
          isActive: true
        };

        // Create session
        await set(ref(database, `sessions/${sessionId}`), session);

        // Remove both users from waiting pool
        await remove(ref(database, `waitingPool/${this.currentUserId}`));
        await remove(ref(database, `waitingPool/${matchUserId}`));

        // Send match found message to both users
        const matchMessage: SignalingMessage = {
          type: 'match-found',
          from: 'system',
          to: this.currentUserId,
          data: session,
          timestamp: Date.now()
        };

        await this.sendMessage(matchMessage);
      }
    } catch (error) {
      console.error('Error finding match:', error);
    }
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }
}
