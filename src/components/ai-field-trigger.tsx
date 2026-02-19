import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFieldAi } from '@/hooks/use-field-ai';
import type { SectionSlug } from '@/types';

interface AiFieldTriggerProps {
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
  sectionSlug: SectionSlug;
  sectionData: Record<string, unknown>;
  onResult: (value: string) => void;
  disabled?: boolean;
}

export function AiFieldTrigger({
  fieldName,
  fieldLabel,
  currentValue,
  sectionSlug,
  sectionData,
  onResult,
  disabled,
}: AiFieldTriggerProps) {
  const { state, generate } = useFieldAi(sectionSlug);
  const isLoading = state.status === 'loading';
  const action = currentValue ? 'improve' : 'generate';
  const tooltipLabel = currentValue ? 'AI: Improve' : 'AI: Generate';

  if (disabled) return null;

  async function handleClick() {
    const result = await generate({
      fieldName,
      fieldLabel,
      currentValue,
      action,
      sectionData,
    });
    if (result) {
      onResult(result);
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClick}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin text-violet-400" />
            ) : (
              <Sparkles className="size-3.5 text-violet-400 hover:text-violet-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {state.status === 'error' ? state.error : tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
