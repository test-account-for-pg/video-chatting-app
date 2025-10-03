import { IMatchingService, ChatSession } from '../types';
import { FirebaseService } from './FirebaseService';

export class MatchingService implements IMatchingService {
  private currentUserId: string | null = null;
  private isMatchingFlag: boolean = false;
  private matchCallbacks: ((session: ChatSession) => void)[] = [];
  private firebaseService: FirebaseService;

  constructor(firebaseService: FirebaseService) {
    this.firebaseService = firebaseService;
  }

  async startMatching(): Promise<void> {
    if (this.isMatchingFlag) {
      console.log('⚠️ Already matching');
      return;
    }

    this.currentUserId = this.firebaseService.getCurrentUserId();
    this.isMatchingFlag = true;

    try {
      await this.firebaseService.cleanupSession(this.currentUserId);
      // Check if there's someone waiting
      const waitingUserId = await this.firebaseService.pickWaitingUser();

      if (waitingUserId) {
        await this.createMatch(waitingUserId);
      } else {
        await this.firebaseService.addToWaitingPool();
        this.firebaseService.onWaitingPoolUpdate((sessionId, isCaller, peerId) => {
          this.handleWaitingPoolMatch(sessionId, isCaller, peerId);
        });
        console.log('✅ Added to waiting pool');
      }
    } catch (error) {
      console.error('❌ Failed to start matching:', error);
      this.isMatchingFlag = false;
      throw new Error('Failed to start matching');
    }
  }

  stopMatching(): void {
    if (!this.isMatchingFlag) return;

    this.isMatchingFlag = false;

    // Remove from waiting pool
    if (this.currentUserId) {
      this.firebaseService.removeFromWaitingPool(this.currentUserId);
    }

    console.log('🛑 Stopped matching');
  }

  onMatched(callback: (session: ChatSession) => void): void {
    this.matchCallbacks.push(callback);
  }

  async handleWaitingPoolMatch(sessionId: string, isCaller: boolean, peerId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const session: ChatSession = {
        id: sessionId,
        participants: [this.currentUserId, peerId],
        createdAt: Date.now(),
        isActive: true,
        roomId: sessionId,
        isCaller: isCaller,
        strangerId: peerId,
      };

      // Stop matching and remove from waiting pool
      this.stopMatching();

      // Delete waiting pool entry since we're now connected
      await this.firebaseService.removeFromWaitingPool(this.currentUserId);

      // Notify callbacks
      this.matchCallbacks.forEach(callback => callback(session));

      console.log('🎉 Match received from waiting pool!', session);
    } catch (error) {
      console.error('❌ Error handling waiting pool match:', error);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      await this.firebaseService.cleanupSession(sessionId);

      console.log('🧹 Session ended and cleaned up:', sessionId);
    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  }

  async handlePageUnloadCleanup(): Promise<void> {
    try {
      this.stopMatching();

      if (this.currentUserId) {
        await this.firebaseService.cleanupSession(this.currentUserId);
        await this.firebaseService.removeFromWaitingPool(this.currentUserId);
      }
    } catch (error) {
      console.error('❌ Error during page unload cleanup:', error);
    }
  }

  isMatching(): boolean {
    return this.isMatchingFlag;
  }

  private async createMatch(waitingUserId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const sessionId = this.createSessionId(this.currentUserId, waitingUserId);

      await this.firebaseService.updateWaitingPoolWithSession(waitingUserId, sessionId, false, this.currentUserId);

      const session: ChatSession = {
        id: sessionId,
        participants: [this.currentUserId, waitingUserId],
        createdAt: Date.now(),
        isActive: true,
        roomId: sessionId,
        isCaller: true,
        strangerId: waitingUserId,
      };

      this.stopMatching();

      this.matchCallbacks.forEach(callback => callback(session));

      console.log('🎉 Match created!', session);
    } catch (error) {
      console.error('❌ Error creating match:', error);
    }
  }

  private createSessionId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }
}
