import type { FastifyPluginAsync } from 'fastify';
import { sessionManager } from '../session/session-manager.js';
import { BaselineAgent } from '../agents/baseline-agent.js';
import { getStepOptions } from '../utils/step-options.js';
import type { AgentType } from '../types/index.js';

const sessionRoutes: FastifyPluginAsync = async (app) => {

  // Start a new chat session
  app.post<{
    Body: { agentType?: AgentType };
  }>('/api/session/start', async (request, reply) => {
    const { agentType = 'baseline' } = request.body;

    const session = sessionManager.create(agentType);

    // Get GUI options for the initial step
    const options = await getStepOptions(session.currentStep, session.appointmentData);

    return {
      sessionId: session.sessionId,
      agentType: session.agentType,
      currentStep: session.currentStep,
      message: session.conversationHistory[0].content,
      options,
    };
  });

  // Get session state
  app.get<{
    Params: { sessionId: string };
  }>('/api/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const session = sessionManager.get(sessionId);

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return session;
  });

  // Process user message
  app.post<{
    Params: { sessionId: string };
    Body: { message: string };
  }>('/api/session/:sessionId/message', async (request, reply) => {
    const { sessionId } = request.params;
    const { message } = request.body;

    const session = sessionManager.get(sessionId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    // Select agent based on session type
    const agent = session.agentType === 'baseline'
      ? new BaselineAgent()
      : new BaselineAgent(); // TODO: AdaptiveAgent

    // Process input
    const result = await agent.processInput(session, message);

    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      accepted: result.accepted,
      rejectionReason: result.rejectionReason,
      metadata: {
        currentStep: session.currentStep,
      },
    });

    // Add assistant response
    session.conversationHistory.push({
      role: 'assistant',
      content: result.message,
      timestamp: new Date(),
      metadata: {
        currentStep: result.nextStep || session.currentStep,
      },
    });

    // Update session if accepted
    if (result.accepted && result.nextStep) {
      session.currentStep = result.nextStep;
      if (result.data) {
        session.appointmentData = { ...session.appointmentData, ...result.data };
      }
    }

    // Update session
    sessionManager.update(sessionId, session);

    // Get GUI options for the current step (after session update)
    // If there's no next step (e.g., CONFIRMATION completed), don't show options
    const options = result.nextStep !== undefined
      ? await getStepOptions(session.currentStep, session.appointmentData)
      : null;

    return {
      accepted: result.accepted,
      message: result.message,
      rejectionReason: result.rejectionReason,
      currentStep: session.currentStep,
      appointmentData: session.appointmentData,
      conversationHistory: session.conversationHistory,
      options,
    };
  });

  // Delete session
  app.delete<{
    Params: { sessionId: string };
  }>('/api/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const deleted = sessionManager.delete(sessionId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return { message: 'Session deleted successfully' };
  });
};

export default sessionRoutes;
