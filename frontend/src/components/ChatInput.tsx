import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const { isLoading } = useSessionStore();
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-2 flex items-end gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter: send, Shift+Enter: new line)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-[15px] leading-6 text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50 max-h-48"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputMessage.trim()}
            className="h-10 px-4 rounded-xl font-semibold text-sm bg-gray-900 text-white hover:bg-black disabled:bg-gray-300 disabled:text-white disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-[11px] text-gray-500">
          Do not enter sensitive personal information (SSN, card numbers, etc.)
        </div>
      </div>
    </div>
  );
}
