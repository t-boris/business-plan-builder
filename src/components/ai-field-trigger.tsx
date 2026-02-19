import { useState } from 'react';
import { Sparkles, Loader2, Wand2, ArrowUpCircle, Expand, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  if (disabled) return null;

  async function handleAction(action: 'generate' | 'improve' | 'expand' | 'custom', prompt?: string) {
    const result = await generate({
      fieldName,
      fieldLabel,
      currentValue,
      action,
      sectionData,
      customPrompt: prompt,
    });
    if (result) {
      onResult(result);
    }
  }

  function openCustomDialog() {
    setCustomPrompt(
      currentValue
        ? `Improve the following '${fieldLabel}' text. Make it more specific, professional, and aligned with the business context.`
        : `Write the '${fieldLabel}' field. Be specific to this business.`,
    );
    setCustomDialogOpen(true);
  }

  async function handleCustomSubmit() {
    setCustomDialogOpen(false);
    await handleAction('custom', customPrompt);
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={isLoading}
                  type="button"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin text-violet-400" />
                  ) : (
                    <Sparkles className="size-3.5 text-violet-400 hover:text-violet-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {state.status === 'error' ? state.error : 'AI Actions'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => handleAction('generate')}>
            <Wand2 className="size-4 mr-2" />
            Generate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('improve')}>
            <ArrowUpCircle className="size-4 mr-2" />
            Improve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('expand')}>
            <Expand className="size-4 mr-2" />
            Expand
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openCustomDialog}>
            <Pencil className="size-4 mr-2" />
            Customized
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom AI Prompt</DialogTitle>
            <DialogDescription>
              Edit the prompt below, then send to AI.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={5}
            placeholder="Describe what you want AI to do with this field..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomSubmit} disabled={!customPrompt.trim()}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
