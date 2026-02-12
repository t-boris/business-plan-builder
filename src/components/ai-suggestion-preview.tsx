import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface AiSuggestionPreviewProps {
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
  children: ReactNode;
}

export function AiSuggestionPreview({
  onAccept,
  onReject,
  isLoading,
  children,
}: AiSuggestionPreviewProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">
            Generating...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
      {/* Banner */}
      <div className="flex items-center justify-between border-b border-primary/20 px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            AI Suggestion
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            className="h-7 text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="size-3" />
            Accept
          </Button>
        </div>
      </div>
      {/* Preview content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
