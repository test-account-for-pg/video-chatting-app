import { ref, push, onValue, remove, get, set } from 'firebase/database';
import { database } from './firebase-config';
import { IFirebaseService } from '../types';

export class FirebaseService implements IFirebaseService {
  private currentUserId: string;
  private cleanupListeners: Map<string, () => void> = new Map();

  constructor() {
    this.currentUserId = this.generateUserId();
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  async addToWaitingPool(): Promise<void> {
    const waitingRef = ref(database, `waiting_pool/${this.currentUserId}`);
    await set(waitingRef, {
      userId: this.currentUserId,
      createdAt: Date.now(),
      isWaiting: true,
    });
  }

  async pickWaitingUser(): Promise<string | null> {
    const waitingRef = ref(database, 'waiting_pool');
    const snapshot = await get(waitingRef);

    if (snapshot.exists()) {
      const pool = snapshot.val();
      let oldestUser: string | null = null;
      let oldestTime = Date.now();

      for (const id in pool) {
        if (id !== this.currentUserId && pool[id].createdAt < oldestTime) {
          oldestUser = id;
          oldestTime = pool[id].createdAt;
        }
      }
      return oldestUser;
    }
    return null;
  }

  async removeFromWaitingPool(userId: string): Promise<void> {
    const waitingRef = ref(database, `waiting_pool/${userId}`);
    await remove(waitingRef);
  }

  async createSession(
    sessionId: string,
    callerId: string,
    calleeId: string
  ): Promise<void> {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    await set(sessionRef, {
      callerId,
      calleeId,
      createdAt: Date.now(),
      isActive: true,
    });
  }

  async updateWaitingPoolWithSession(
    userId: string,
    sessionId: string,
    isCaller: boolean,
    peerId: string
  ): Promise<void> {
    const waitingRef = ref(database, `waiting_pool/${userId}`);
    await set(waitingRef, {
      userId,
      createdAt: Date.now(),
      isWaiting: false,
      sessionId,
      isCaller,
      peerId,
    });
  }

  onWaitingPoolUpdate(
    callback: (sessionId: string, isCaller: boolean, peerId: string) => void
  ): void {
    const waitingRef = ref(database, `waiting_pool/${this.currentUserId}`);

    const unsubscribe = onValue(waitingRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.sessionId && !data.isWaiting) {
          callback(data.sessionId, data.isCaller, data.peerId);
        }
      }
    });

    this.cleanupListeners.set('waiting_pool', unsubscribe);
  }

  async sendOffer(
    toUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const offerRef = ref(database, `sessions/${toUserId}/offer`);
    await set(offerRef, {
      type: 'offer',
      fromUserId: this.currentUserId,
      toUserId: toUserId,
      data: offer,
      timestamp: Date.now(),
    });
  }

  async sendAnswer(
    toUserId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const answerRef = ref(database, `sessions/${toUserId}/answer`);
    await set(answerRef, {
      type: 'answer',
      fromUserId: this.currentUserId,
      toUserId: toUserId,
      data: answer,
      timestamp: Date.now(),
    });
  }

  async sendIceCandidate(
    toUserId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const candidateRef = ref(database, `sessions/${toUserId}/ice_candidates`);
    await push(candidateRef, {
      type: 'ice-candidate',
      fromUserId: this.currentUserId,
      toUserId: toUserId,
      data: JSON.stringify(candidate),
      timestamp: Date.now(),
    });
  }

  onOffer(
    callback: (offer: RTCSessionDescriptionInit, fromUserId: string) => void
  ): void {
    const offerRef = ref(database, `sessions/${this.currentUserId}/offer`);

    const unsubscribe = onValue(offerRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.fromUserId !== this.currentUserId) {
          callback(data.data, data.fromUserId);
        }
      }
    });

    this.cleanupListeners.set('offer', unsubscribe);
  }

  onAnswer(
    callback: (answer: RTCSessionDescriptionInit, fromUserId: string) => void
  ): void {
    const answerRef = ref(database, `sessions/${this.currentUserId}/answer`);

    const unsubscribe = onValue(answerRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.fromUserId !== this.currentUserId) {
          callback(data.data, data.fromUserId);
        }
      }
    });

    this.cleanupListeners.set('answer', unsubscribe);
  }

  onIceCandidates(
    callback: (candidate: RTCIceCandidateInit, fromUserId: string) => void
  ): void {
    const candidatesRef = ref(
      database,
      `sessions/${this.currentUserId}/ice_candidates`
    );

    const unsubscribe = onValue(candidatesRef, snapshot => {
      if (snapshot.exists()) {
        const candidates = snapshot.val();
        Object.values(candidates).forEach((candidate: any) => {
          if (candidate.fromUserId !== this.currentUserId) {
            if (candidate.data) {
              callback(JSON.parse(candidate.data), candidate.fromUserId);
            }
          }
        });
      }
    });

    this.cleanupListeners.set('ice_candidates', unsubscribe);
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    await remove(sessionRef);
  }

  cleanup(): void {
    this.cleanupListeners.forEach(unsubscribe => {
      unsubscribe();
    });
    this.cleanupListeners.clear();
  }
}
