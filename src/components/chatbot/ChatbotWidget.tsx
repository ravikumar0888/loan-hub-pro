import { useEffect, useRef, useState } from 'react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatbotApi } from '@/lib/api';

export function ChatbotWidget() {
  const {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    clearMessages,
    toggleChat,
    closeChat,
  } = useChatbot();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await chatbotApi.getSuggestions();
        setSuggestions(response.data);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    const checkHealth = async () => {
      try {
        const response = await chatbotApi.checkHealth();
        setIsEnabled(response.data.enabled);
      } catch (error) {
        console.error('Failed to check chatbot health:', error);
        setIsEnabled(false);
      }
    };

    loadSuggestions();
    checkHealth();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message is shown via the empty state UI below

  if (!isEnabled) {
    return null; // Don't show widget if chatbot is disabled
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Dialog */}
      {isOpen && (
        <Card
          className={cn(
            'fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggestions (show when no messages) */}
          {messages.length === 0 && (
            <ChatSuggestions
              suggestions={suggestions}
              onSelect={sendMessage}
              disabled={isLoading}
            />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">
                  Ask me anything about your customers, loans, and payouts!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isLoading}
            placeholder="Ask me anything..."
          />
        </Card>
      )}
    </>
  );
}
