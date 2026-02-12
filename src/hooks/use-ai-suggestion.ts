import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import {
  isAiAvailable,
  generateSectionContent,
  generateStructuredContent,
} from '@/lib/ai/gemini-client';
import { SYSTEM_INSTRUCTION } from '@/lib/ai/system-prompt';
import { buildPrompt } from '@/lib/ai/context-builder';
import { getSectionSchema } from '@/lib/ai/section-prompts';
import type { SectionSlug } from '@/types';

export interface AiSuggestionState<T> {
  status: 'idle' | 'loading' | 'preview' | 'error';
  suggested: T | null;
  error: string | null;
}

export function useAiSuggestion<T>(sectionSlug: SectionSlug) {
  const [state, setState] = useState<AiSuggestionState<T>>({
    status: 'idle',
    suggested: null,
    error: null,
  });

  const evaluated = useAtomValue(evaluatedValuesAtom);

  const generate = useCallback(
    async (
      action: 'generate' | 'improve' | 'expand',
      sectionData: unknown,
      userInstruction?: string,
    ) => {
      if (!isAiAvailable) {
        setState({
          status: 'error',
          suggested: null,
          error: 'Gemini API key not configured',
        });
        return;
      }

      setState({ status: 'loading', suggested: null, error: null });

      try {
        const prompt = buildPrompt(
          { sectionSlug, action, userInstruction },
          sectionData,
          evaluated,
        );
        const schema = getSectionSchema(sectionSlug);

        let result: T;
        if (schema) {
          result = await generateStructuredContent<T>(
            prompt,
            SYSTEM_INSTRUCTION,
            schema,
          );
        } else {
          const text = await generateSectionContent(prompt, SYSTEM_INSTRUCTION);
          result = text as unknown as T;
        }

        setState({ status: 'preview', suggested: result, error: null });
      } catch (err) {
        setState({
          status: 'error',
          suggested: null,
          error: err instanceof Error ? err.message : 'AI generation failed',
        });
      }
    },
    [sectionSlug, evaluated],
  );

  const accept = useCallback((): T | null => {
    const result = state.suggested;
    setState({ status: 'idle', suggested: null, error: null });
    return result;
  }, [state.suggested]);

  const reject = useCallback(() => {
    setState({ status: 'idle', suggested: null, error: null });
  }, []);

  const dismiss = useCallback(() => {
    setState({ status: 'idle', suggested: null, error: null });
  }, []);

  return { state, generate, accept, reject, dismiss };
}
