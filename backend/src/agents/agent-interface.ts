import type { ChatSession, AgentResult, AppointmentStep } from '../types/index.js';

/**
 * Agent interface for processing user input
 * Both baseline and adaptive agents implement this interface
 */
export interface Agent {
  /**
   * Process user input and return result
   * This is the main logic for handling user messages
   */
  processInput(session: ChatSession, userMessage: string): Promise<AgentResult>;

  /**
   * Get initial greeting message when session starts
   */
  getInitialMessage(): string;

  /**
   * Get prompt message for a specific step
   * Used when transitioning to a new step
   */
  getStepPrompt(step: AppointmentStep): string;
}
