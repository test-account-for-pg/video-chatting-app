import { IMatchingService, ChatSession } from '../types';

export class MatchingService implements IMatchingService {
  private sessionEndedCallbacks: ((sessionId: string) => void)[] = [];
  private activeSessions: Map<string, ChatSession> = new Map();

  async findMatch(): Promise<ChatSession | null> {
    // This is a simplified matching service
    // In a real implementation, this would integrate with the signaling service
    // to find available users and create sessions
    
    // For now, we'll create a mock session for demo purposes
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      participants: ['user1', 'user2'], // Mock participants
      createdAt: Date.now(),
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      
      // Notify callbacks
      this.sessionEndedCallbacks.forEach(callback => callback(sessionId));
    }
  }

  onSessionEnded(callback: (sessionId: string) => void): void {
    this.sessionEndedCallbacks.push(callback);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // Helper methods for session management
  getActiveSession(sessionId: string): ChatSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getAllActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  isSessionActive(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    return session ? session.isActive : false;
  }
}
