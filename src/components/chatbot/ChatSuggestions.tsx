import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function ChatSuggestions({ suggestions, onSelect, disabled = false }: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Try asking:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="text-xs h-7"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
