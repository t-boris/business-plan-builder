import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, Loader2, Wand2, ArrowUpCircle, Expand } from 'lucide-react';

interface AiActionBarProps {
  onGenerate: () => void;
  onImprove: () => void;
  onExpand: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function AiActionBar({
  onGenerate,
  onImprove,
  onExpand,
  isLoading,
  disabled,
}: AiActionBarProps) {
  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" size="sm" disabled>
                <Sparkles className="size-4" />
                Ask AI
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure VITE_GEMINI_API_KEY to enable AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="size-4 animate-spin" />
        Generating...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-4" />
          Ask AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onGenerate}>
          <Wand2 className="size-4" />
          Generate
          <span className="ml-auto text-xs text-muted-foreground">
            Fill from scratch
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImprove}>
          <ArrowUpCircle className="size-4" />
          Improve
          <span className="ml-auto text-xs text-muted-foreground">
            Enhance existing
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExpand}>
          <Expand className="size-4" />
          Expand
          <span className="ml-auto text-xs text-muted-foreground">
            Add more detail
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
