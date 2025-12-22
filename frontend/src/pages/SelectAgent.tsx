import type { AgentType } from '../types';

interface SelectAgentProps {
  agentType: AgentType;
  onAgentTypeChange: (agentType: AgentType) => void;
  onStartSession: () => void;
  isLoading: boolean;
}

export function SelectAgent({
  agentType,
  onAgentTypeChange,
  onStartSession,
  isLoading,
}: SelectAgentProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Select Agent Type</h2>

        <div className="space-y-3 mb-8">
          <label
            className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
              agentType === 'baseline'
                ? 'border-blue-500 bg-blue-50/50 hover:bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              value="baseline"
              checked={agentType === 'baseline'}
              onChange={(e) => onAgentTypeChange(e.target.value as AgentType)}
              className="mt-1 accent-blue-600"
            />
            <div className="flex-1">
              <strong className="text-lg block text-gray-900">Baseline Agent</strong>
              <p className="text-gray-600 text-sm mt-1">
                Rigid, step-by-step progression. Rejects out-of-step information.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start space-x-3 p-4 border-2 rounded-xl transition-colors ${
              agentType === 'adaptive'
                ? 'border-blue-500 bg-blue-50/50 cursor-pointer hover:bg-blue-50'
                : 'border-gray-200 opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="radio"
              value="adaptive"
              checked={agentType === 'adaptive'}
              onChange={(e) => onAgentTypeChange(e.target.value as AgentType)}
              disabled={true}
              className="mt-1 accent-blue-600"
            />
            <div className="flex-1">
              <strong className="text-lg block text-gray-900">Adaptive Agent</strong>
              <p className="text-gray-600 text-sm mt-1">
                Flexible, accepts multi-step input. (Not yet implemented)
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={onStartSession}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? 'Starting...' : 'Start Session'}
        </button>
      </div>
    </div>
  );
}
