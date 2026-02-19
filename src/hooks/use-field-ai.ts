import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import {
  isAiAvailable,
  generateSectionContent,
} from '@/lib/ai/gemini-client';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { buildFieldPrompt, buildScenarioV2Context } from '@/lib/ai/context-builder';
import { activeBusinessAtom } from '@/store/business-atoms';
import {
  scenarioNameAtom,
  scenarioStatusAtom,
  scenarioHorizonAtom,
  scenarioAssumptionsAtom,
  scenarioVariantRefsAtom,
} from '@/store/scenario-atoms';
import type { SectionSlug } from '@/types';

export interface FieldAiState {
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

export function useFieldAi(sectionSlug: SectionSlug) {
  const [state, setState] = useState<FieldAiState>({
    status: 'idle',
    error: null,
  });

  const business = useAtomValue(activeBusinessAtom);
  const scenarioName = useAtomValue(scenarioNameAtom);
  const scenarioStatus = useAtomValue(scenarioStatusAtom);
  const horizonMonths = useAtomValue(scenarioHorizonAtom);
  const assumptions = useAtomValue(scenarioAssumptionsAtom);
  const variantRefs = useAtomValue(scenarioVariantRefsAtom);

  const generate = useCallback(
    async (config: {
      fieldName: string;
      fieldLabel: string;
      currentValue: string;
      action: 'generate' | 'improve';
      sectionData: Record<string, unknown>;
    }): Promise<string | null> => {
      if (!isAiAvailable) {
        setState({ status: 'error', error: 'AI is not available' });
        return null;
      }

      setState({ status: 'loading', error: null });

      try {
        const profile = business?.profile ?? null;
        const systemInstruction = buildSystemPrompt(
          profile ?? {
            name: '',
            type: 'custom',
            industry: '',
            location: '',
            description: '',
            currency: 'USD',
          },
        );

        const scenarioV2Context = buildScenarioV2Context({
          scenarioName,
          status: scenarioStatus,
          horizonMonths,
          assumptions,
          variantRefs,
        });

        const prompt = buildFieldPrompt({
          fieldName: config.fieldName,
          fieldLabel: config.fieldLabel,
          currentValue: config.currentValue,
          action: config.action,
          sectionSlug,
          sectionData: config.sectionData,
          businessProfile: profile ?? {
            name: '',
            type: 'custom',
            industry: '',
            location: '',
            description: '',
          },
          scenarioV2Context,
        });

        const text = await generateSectionContent(prompt, systemInstruction);
        setState({ status: 'idle', error: null });
        return text.trim();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Field AI generation failed',
        });
        return null;
      }
    },
    [sectionSlug, business, scenarioName, scenarioStatus, horizonMonths, assumptions, variantRefs],
  );

  return { state, generate };
}
