import { api } from './api';
import { SelectAgent } from './pages/SelectAgent';
import { Chat } from './pages/Chat';
import { useSessionStore } from './store/useSessionStore';

function App() {
  const {
    sessionId,
    agentType,
    isLoading,
    setSessionId,
    setAgentType,
    setCurrentStep,
    setMessages,
    setAppointmentData,
    setStepOptions,
    setIsLoading,
    resetSession,
  } = useSessionStore();

  const startSession = async () => {
    setIsLoading(true);
    try {
      const response = await api.startSession(agentType);
      setSessionId(response.sessionId);
      setCurrentStep(response.currentStep);
      setMessages([
        {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        },
      ]);
      setAppointmentData({});
      setStepOptions(response.options || null);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuiSelect = async (_step: string, _value: string, label: string) => {
    await sendMessage(label);
  };

  const sendMessage = async (userMessage: string) => {
    if (!sessionId) return;

    setIsLoading(true);

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const response = await api.sendMessage(sessionId, userMessage);

      // Update with full conversation history from backend
      setMessages(response.conversationHistory);
      setCurrentStep(response.currentStep);
      setAppointmentData(response.appointmentData);
      setStepOptions(response.options || null);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async () => {
    if (sessionId) {
      try {
        await api.deleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
    resetSession();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">TUNING</h1>
            <p className="text-xs text-gray-600">
              Hospital appointment booking prototype (baseline vs adaptive)
            </p>
          </div>
          {sessionId && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Agent: <span className="font-semibold text-gray-900">{agentType.toUpperCase()}</span>
              </div>
              <button
                onClick={handleResetSession}
                className="text-sm text-gray-700 hover:text-gray-900 border border-gray-300 bg-white rounded-lg px-3 py-1.5 shadow-sm"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!sessionId ? (
          <SelectAgent
            agentType={agentType}
            onAgentTypeChange={setAgentType}
            onStartSession={startSession}
            isLoading={isLoading}
          />
        ) : (
          <Chat onSendMessage={sendMessage} onGuiSelect={handleGuiSelect} />
        )}
      </main>
    </div>
  );
}

export default App;
