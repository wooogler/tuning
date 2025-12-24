/**
 * API client for backend communication
 */

import type {
  AgentType,
  SessionStartResponse,
  MessageResponse,
} from './types';

// Use relative URL in production (same origin), localhost in development
const API_BASE_URL = import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000';

export const api = {
  /**
   * Start a new chat session
   */
  async startSession(agentType: AgentType): Promise<SessionStartResponse> {
    const response = await fetch(`${API_BASE_URL}/api/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Send a message in the current session
   */
  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<MessageResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/session/${sessionId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/session/${sessionId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  },
};
