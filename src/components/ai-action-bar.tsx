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
              <Button variant="outline" size="sm" disabled className="h-8">
                <Sparkles className="size-3.5" />
                AI
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI is not available right now</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="h-8">
        <Loader2 className="size-3.5 animate-spin" />
        Generating...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Sparkles className="size-3.5" />
          AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onGenerate}>
          <Wand2 className="size-4" />
          <div className="flex flex-col">
            <span>Generate</span>
            <span className="text-xs text-muted-foreground">Fill from scratch</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImprove}>
          <ArrowUpCircle className="size-4" />
          <div className="flex flex-col">
            <span>Improve</span>
            <span className="text-xs text-muted-foreground">Enhance existing</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExpand}>
          <Expand className="size-4" />
          <div className="flex flex-col">
            <span>Expand</span>
            <span className="text-xs text-muted-foreground">Add more detail</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
