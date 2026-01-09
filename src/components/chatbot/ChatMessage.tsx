import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/types';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2 break-words',
            isUser
              ? 'bg-primary text-primary-foreground'
              : message.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Data Display (if available) */}
          {message.data && !message.error && (
            <div className="mt-2 pt-2 border-t border-border/50">
              {message.data.count !== undefined && (
                <p className="text-xs opacity-80">Count: {message.data.count}</p>
              )}
              {message.data.currentBalance !== undefined && (
                <p className="text-xs opacity-80">
                  Balance: ₹{message.data.currentBalance.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
