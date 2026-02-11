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
      <div className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 p-6 dark:border-purple-700 dark:bg-purple-950/20">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-purple-600" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Generating AI suggestion...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-purple-300 bg-purple-50/30 dark:border-purple-700 dark:bg-purple-950/10">
      {/* Banner */}
      <div className="flex items-center justify-between border-b border-purple-200 px-4 py-2 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            AI Suggestion
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="h-7 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <X className="size-3" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="h-7 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
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
