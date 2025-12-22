import { randomUUID } from 'crypto';
import type { ChatSession, AgentType } from '../types/index.js';

class SessionManager {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Create a new chat session
   */
  create(agentType: AgentType): ChatSession {
    const sessionId = randomUUID();

    const session: ChatSession = {
      sessionId,
      agentType,
      currentStep: 'PATIENT_ID',
      conversationHistory: [
        {
          role: 'assistant',
          content: 'Hello! I will help you book an appointment. Please provide your patient number.',
          timestamp: new Date(),
          metadata: {
            currentStep: 'PATIENT_ID',
          },
        },
      ],
      appointmentData: {},
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   * Updates lastActivity timestamp
   */
  get(sessionId: string): ChatSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  /**
   * Update session data
   */
  update(sessionId: string, updates: Partial<ChatSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
    }
  }

  /**
   * Delete session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up old sessions (TTL management)
   * Default: 30 minutes of inactivity
   */
  cleanup(maxAgeMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAgeMs) {
        this.sessions.delete(sessionId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} inactive session(s)`);
    }
  }

  /**
   * Get all session IDs (for debugging)
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Auto cleanup every 30 minutes
setInterval(() => {
  sessionManager.cleanup();
}, 30 * 60 * 1000);
