import { useState, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import { activeBusinessAtom, activeBusinessIdAtom, businessVariablesAtom, sectionDerivedScopeAtom } from '@/store/business-atoms';
import { SECTION_SLUGS } from '@/lib/constants';
import { useSection } from '@/hooks/use-section';
import { listScenarioData } from '@/lib/business-firestore';
import { evaluateVariables } from '@/lib/formula-engine';
import { translateTexts } from '@/lib/ai/translate-client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { FileText, Download, Loader2 } from 'lucide-react';
import { BusinessPlanView } from './business-plan-view';
import { useChartCapture } from './pdf/useChartCapture';
import type {
  ExecutiveSummary,
  MarketAnalysis,
  ProductService,
  MarketingStrategy,
  Operations,
  FinancialProjections,
  RisksDueDiligence,
  KpisMetrics,
  LaunchPlan,
  GrowthTimeline,
  DynamicScenario,
  VariableDefinition,
  VariableUnit,
  ScenarioAssumption,
} from '@/types';
import { defaultGrowthTimeline } from '@/features/sections/growth-timeline/defaults';

// --- Supported export languages ---
const EXPORT_LANGUAGES = [
  { code: 'en', label: 'English (Original)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'uk', label: 'Ukrainian' },
] as const;

// --- ScenarioPack interface for export ---
export interface ScenarioPack {
  active: { name: string; status: string; horizon: number; assumptions: ScenarioAssumption[] };
  scenarios: Array<{
    name: string;
    status: string;
    metrics: Record<string, { label: string; value: number; unit: string }>;
  }>;
}

// --- Scenario evaluation helper (same pattern as ScenarioComparison) ---
function evaluateScenario(
  scenario: DynamicScenario,
  definitions: Record<string, VariableDefinition>,
  sectionScope?: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, VariableDefinition> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      const scenarioValue = scenario.values[id];
      let effectiveValue = scenarioValue !== undefined
        ? scenarioValue
        : (sectionScope?.[id] ?? def.value);
      // Normalize percent values stored as whole numbers (e.g., 8 → 0.08)
      if (def.unit === 'percent' && effectiveValue > 1) {
        effectiveValue = effectiveValue / 100;
      }
      merged[id] = { ...def, value: effectiveValue };
    } else {
      merged[id] = def;
    }
  }
  try {
    return evaluateVariables(merged, sectionScope);
  } catch {
    const fallback: Record<string, number> = {};
    for (const [id, def] of Object.entries(merged)) {
      fallback[id] = def.value;
    }
    return fallback;
  }
}

// --- Format helpers for scenario appendix ---
function formatExportValue(value: number, unit: VariableUnit, currencyCode: string): string {
  if (unit === 'currency') {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(value);
    } catch {
      return '$' + Math.round(value).toLocaleString('en-US');
    }
  }
  if (unit === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'ratio') return value.toFixed(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

// Default data (same defaults as business-plan-view and individual section pages)
const defaultExecutiveSummary: ExecutiveSummary = {
  summary: '',
  mission: '',
  vision: '',
  keyHighlights: [],
};

const defaultMarketAnalysis: MarketAnalysis = {
  enabledBlocks: { sizing: true, competitors: true, demographics: true, acquisitionFunnel: true, adoptionModel: true, customMetrics: true },
  marketSizing: {
    tam: { approach: 'top-down', steps: [] },
    sam: { steps: [] },
    som: { steps: [] },
  },
  marketNarrative: '',
  competitors: [],
  demographics: { population: 0, income: '', metrics: [] },
  acquisitionFunnel: [],
  adoptionModel: { type: 's-curve', totalMarket: 10000, initialUsers: 50, growthRate: 0.3, projectionMonths: 24 },
  customMetrics: [],
};

const defaultProductService: ProductService = {
  overview: '',
  offerings: [],
  addOns: [],
};

const defaultMarketing: MarketingStrategy = {
  channels: [],
  offers: [],
  landingPage: { url: '', description: '' },
};

const defaultOperations: Operations = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

const defaultFinancials: FinancialProjections = {
  startingCash: 0,
  months: [],
  unitEconomics: { pricePerUnit: 0, variableCostPerUnit: 0, profitPerUnit: 0, breakEvenUnits: 0 },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const defaultRisks: RisksDueDiligence = {
  risks: [],
  complianceChecklist: [],
};

const defaultKpis: KpisMetrics = { targets: { monthlyLeads: 0, conversionRate: 0, pricePerUnit: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 } };

const defaultLaunchPlan: LaunchPlan = { stages: [] };

// --- Section title / subsection labels used in the PDF ---
const SECTION_LABELS_FOR_PDF: Record<string, string> = {
  'label.executive-summary': 'Executive Summary',
  'label.summary': 'Summary',
  'label.mission': 'Mission',
  'label.vision': 'Vision',
  'label.key-highlights': 'Key Highlights',
  'label.market-analysis': 'Market Analysis',
  'label.market-sizing': 'Market Sizing',
  'label.competitors': 'Competitors',
  'label.demographics': 'Demographics',
  'label.acquisition-funnel': 'Acquisition Funnel',
  'label.adoption-model': 'Adoption Model',
  'label.custom-metrics': 'Custom Metrics',
  'label.product-service': 'Product & Service',
  'label.offerings': 'Offerings',
  'label.add-ons': 'Add-Ons',
  'label.marketing-strategy': 'Marketing Strategy',
  'label.channels': 'Channels',
  'label.promotional-offers': 'Promotional Offers',
  'label.landing-page': 'Landing Page',
  'label.operations': 'Operations',
  'label.workforce': 'Workforce',
  'label.capacity-mix': 'Capacity Mix',
  'label.cost-summary': 'Cost Summary',
  'label.variable-components': 'Variable Components (Per Product/Service)',
  'label.fixed-costs': 'Fixed Costs',
  'label.operational-metrics': 'Operational Metrics',
  'label.equipment': 'Equipment',
  'label.safety-protocols': 'Safety Protocols',
  'label.financial-projections': 'Financial Projections',
  'label.unit-economics': 'Unit Economics',
  'label.monthly-pl': 'Monthly P&L',
  'label.growth-timeline': 'Growth Timeline',
  'label.events': 'Events',
  'label.projected-impact': 'Projected Impact',
  'label.monthly-projection': 'Monthly Projection',
  'label.risks-due-diligence': 'Risks & Due Diligence',
  'label.risk-assessment': 'Risk Assessment',
  'label.due-diligence-checklist': 'Due Diligence Checklist',
  'label.compliance-checklist': 'Compliance Checklist',
  'label.kpis-metrics': 'KPIs & Metrics',
  'label.target-metrics': 'Target Metrics',
  'label.launch-plan': 'Launch Plan',
  'label.scenario-analysis': 'Scenario Analysis',
  'label.active-scenario': 'Active Scenario',
  'label.scenario-comparison': 'Scenario Comparison',
  'label.scenario-metrics': 'Scenario Metrics',
};

// --- Translation helper ---

/**
 * Extract all translatable text from sections into a flat Record<string, string>,
 * translate in batches, then merge back into cloned section objects.
 */
async function translateAllSections(
  sections: {
    execSummary: ExecutiveSummary;
    marketAnalysis: MarketAnalysis;
    productService: ProductService;
    marketingStrategy: MarketingStrategy;
    operations: Operations;
    risks: RisksDueDiligence;
    launchPlan: LaunchPlan;
    growthTimeline: GrowthTimeline;
  },
  targetLanguage: string,
): Promise<{
  execSummary: ExecutiveSummary;
  marketAnalysis: MarketAnalysis;
  productService: ProductService;
  marketingStrategy: MarketingStrategy;
  operations: Operations;
  risks: RisksDueDiligence;
  launchPlan: LaunchPlan;
  growthTimeline: GrowthTimeline;
  translatedLabels: Record<string, string>;
}> {
  // 1. Extract translatable texts into a flat map
  const texts: Record<string, string> = {};

  function add(key: string, value: string | undefined | null) {
    if (value && value.trim()) texts[key] = value;
  }

  // Executive Summary
  add('exec.summary', sections.execSummary.summary);
  add('exec.mission', sections.execSummary.mission);
  add('exec.vision', sections.execSummary.vision);
  sections.execSummary.keyHighlights.forEach((h, i) => add(`exec.highlight.${i}`, h));

  // Market Analysis
  add('market.narrative', sections.marketAnalysis.marketNarrative);
  sections.marketAnalysis.competitors.forEach((c, i) => {
    add(`market.comp.${i}.name`, c.name);
    add(`market.comp.${i}.strengths`, c.strengths);
    add(`market.comp.${i}.weaknesses`, c.weaknesses);
  });
  sections.marketAnalysis.acquisitionFunnel.forEach((s, i) => {
    add(`market.funnel.${i}.label`, s.label);
    add(`market.funnel.${i}.desc`, s.description);
  });
  sections.marketAnalysis.customMetrics?.forEach((m, i) => {
    add(`market.cm.${i}.label`, m.label);
  });

  // Product & Service
  add('ps.overview', sections.productService.overview);
  sections.productService.offerings.forEach((o, i) => {
    add(`ps.off.${i}.name`, o.name);
    add(`ps.off.${i}.desc`, o.description);
  });
  sections.productService.addOns.forEach((a, i) => {
    add(`ps.addon.${i}.name`, a.name);
    add(`ps.addon.${i}.desc`, a.description);
  });

  // Marketing Strategy
  sections.marketingStrategy.channels.forEach((ch, i) => {
    add(`mkt.ch.${i}.name`, ch.name);
    add(`mkt.ch.${i}.desc`, ch.description);
  });
  add('mkt.lp.desc', sections.marketingStrategy.landingPage.description);

  // Operations
  sections.operations.workforce.forEach((w, i) => add(`ops.wf.${i}.role`, w.role));
  sections.operations.costItems.forEach((c, i) => add(`ops.ci.${i}.cat`, c.category));
  sections.operations.equipment.forEach((e, i) => add(`ops.eq.${i}`, e));
  sections.operations.safetyProtocols.forEach((p, i) => add(`ops.sp.${i}`, p));
  sections.operations.operationalMetrics.forEach((m, i) => add(`ops.om.${i}.name`, m.name));

  // Risks
  sections.risks.risks.forEach((r, i) => {
    add(`risk.r.${i}.title`, r.title);
    add(`risk.r.${i}.desc`, r.description);
    add(`risk.r.${i}.mitigation`, r.mitigation);
  });
  sections.risks.complianceChecklist.forEach((c, i) => add(`risk.cc.${i}.item`, c.item));
  if (sections.risks.investmentVerdict) {
    sections.risks.investmentVerdict.conditions.forEach((c, i) => add(`risk.iv.cond.${i}`, c));
  }
  sections.risks.dueDiligenceChecklist?.forEach((d, i) => {
    add(`risk.dd.${i}.item`, d.item);
    add(`risk.dd.${i}.detail`, d.detail);
  });

  // Launch Plan
  sections.launchPlan.stages.forEach((s, i) => {
    add(`lp.stage.${i}.name`, s.name);
    s.tasks.forEach((t, j) => add(`lp.stage.${i}.task.${j}`, t.task));
  });

  // Growth Timeline
  sections.growthTimeline.events.forEach((e, i) => {
    add(`gt.ev.${i}.label`, e.label);
  });

  // Section/subsection labels for PDF
  for (const [key, val] of Object.entries(SECTION_LABELS_FOR_PDF)) {
    texts[key] = val;
  }

  // 2. Split into small chunks and translate in parallel
  const entries = Object.entries(texts);
  const translated: Record<string, string> = {};
  const CHUNK_SIZE = 8;

  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push(Object.fromEntries(entries.slice(i, i + CHUNK_SIZE)));
  }

  const results = await Promise.all(
    chunks.map((chunk) => translateTexts(chunk, targetLanguage)),
  );
  for (const result of results) {
    Object.assign(translated, result);
  }

  // Helper to get translated value or fall back to original
  function t(key: string, original: string): string {
    return translated[key] ?? original;
  }

  // 3. Clone and merge translated values back into section objects
  const tExecSummary: ExecutiveSummary = {
    summary: t('exec.summary', sections.execSummary.summary),
    mission: t('exec.mission', sections.execSummary.mission),
    vision: t('exec.vision', sections.execSummary.vision),
    keyHighlights: sections.execSummary.keyHighlights.map((h, i) => t(`exec.highlight.${i}`, h)),
  };

  const tMarketAnalysis: MarketAnalysis = {
    ...sections.marketAnalysis,
    marketNarrative: t('market.narrative', sections.marketAnalysis.marketNarrative),
    competitors: sections.marketAnalysis.competitors.map((c, i) => ({
      ...c,
      name: t(`market.comp.${i}.name`, c.name),
      strengths: t(`market.comp.${i}.strengths`, c.strengths),
      weaknesses: t(`market.comp.${i}.weaknesses`, c.weaknesses),
    })),
    acquisitionFunnel: sections.marketAnalysis.acquisitionFunnel.map((s, i) => ({
      ...s,
      label: t(`market.funnel.${i}.label`, s.label),
      description: t(`market.funnel.${i}.desc`, s.description),
    })),
    customMetrics: (sections.marketAnalysis.customMetrics ?? []).map((m, i) => ({
      ...m,
      label: t(`market.cm.${i}.label`, m.label),
    })),
  };

  const tProductService: ProductService = {
    overview: t('ps.overview', sections.productService.overview ?? ''),
    offerings: sections.productService.offerings.map((o, i) => ({
      ...o,
      name: t(`ps.off.${i}.name`, o.name),
      description: t(`ps.off.${i}.desc`, o.description),
    })),
    addOns: sections.productService.addOns.map((a, i) => ({
      ...a,
      name: t(`ps.addon.${i}.name`, a.name),
      description: t(`ps.addon.${i}.desc`, a.description ?? ''),
    })),
  };

  const tMarketingStrategy: MarketingStrategy = {
    ...sections.marketingStrategy,
    channels: sections.marketingStrategy.channels.map((ch, i) => ({
      ...ch,
      name: t(`mkt.ch.${i}.name`, ch.name),
      description: t(`mkt.ch.${i}.desc`, ch.description),
    })),
    landingPage: {
      ...sections.marketingStrategy.landingPage,
      description: t('mkt.lp.desc', sections.marketingStrategy.landingPage.description),
    },
  };

  const tOperations: Operations = {
    ...sections.operations,
    workforce: sections.operations.workforce.map((w, i) => ({
      ...w,
      role: t(`ops.wf.${i}.role`, w.role),
    })),
    costItems: sections.operations.costItems.map((c, i) => ({
      ...c,
      category: t(`ops.ci.${i}.cat`, c.category),
    })),
    equipment: sections.operations.equipment.map((e, i) => t(`ops.eq.${i}`, e)),
    safetyProtocols: sections.operations.safetyProtocols.map((p, i) => t(`ops.sp.${i}`, p)),
    operationalMetrics: sections.operations.operationalMetrics.map((m, i) => ({
      ...m,
      name: t(`ops.om.${i}.name`, m.name),
    })),
  };

  const tRisks: RisksDueDiligence = {
    ...sections.risks,
    risks: sections.risks.risks.map((r, i) => ({
      ...r,
      title: t(`risk.r.${i}.title`, r.title),
      description: t(`risk.r.${i}.desc`, r.description),
      mitigation: t(`risk.r.${i}.mitigation`, r.mitigation),
    })),
    complianceChecklist: sections.risks.complianceChecklist.map((c, i) => ({
      ...c,
      item: t(`risk.cc.${i}.item`, c.item),
    })),
    investmentVerdict: sections.risks.investmentVerdict
      ? {
          ...sections.risks.investmentVerdict,
          conditions: sections.risks.investmentVerdict.conditions.map((c, i) => t(`risk.iv.cond.${i}`, c)),
        }
      : undefined,
    dueDiligenceChecklist: sections.risks.dueDiligenceChecklist?.map((d, i) => ({
      ...d,
      item: t(`risk.dd.${i}.item`, d.item),
      detail: t(`risk.dd.${i}.detail`, d.detail),
    })),
  };

  const tLaunchPlan: LaunchPlan = {
    stages: sections.launchPlan.stages.map((s, i) => ({
      ...s,
      name: t(`lp.stage.${i}.name`, s.name),
      tasks: s.tasks.map((task, j) => ({
        ...task,
        task: t(`lp.stage.${i}.task.${j}`, task.task),
      })),
    })),
  };

  const tGrowthTimeline: GrowthTimeline = {
    ...sections.growthTimeline,
    events: sections.growthTimeline.events.map((e, i) => ({
      ...e,
      label: t(`gt.ev.${i}.label`, e.label),
    })),
  };

  // Extract translated labels
  const translatedLabels: Record<string, string> = {};
  for (const key of Object.keys(SECTION_LABELS_FOR_PDF)) {
    translatedLabels[key] = translated[key] ?? SECTION_LABELS_FOR_PDF[key];
  }

  return {
    execSummary: tExecSummary,
    marketAnalysis: tMarketAnalysis,
    productService: tProductService,
    marketingStrategy: tMarketingStrategy,
    operations: tOperations,
    risks: tRisks,
    launchPlan: tLaunchPlan,
    growthTimeline: tGrowthTimeline,
    translatedLabels,
  };
}

export function Export() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);
  const business = useAtomValue(activeBusinessAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);
  const definitions = useAtomValue(businessVariablesAtom);
  const sectionScope = useAtomValue(sectionDerivedScopeAtom);

  // Derive business identity
  const businessName = business?.profile.name ?? 'Business Plan';
  const currencyCode = business?.profile.currency ?? 'USD';
  const enabledSections = business?.enabledSections ?? SECTION_SLUGS;

  // Build dynamic scenarioMetrics from computed evaluated variables
  const scenarioMetrics = useMemo(() => {
    if (!definitions) return {};
    const metrics: Record<string, { label: string; value: number; unit: string }> = {};
    for (const [id, def] of Object.entries(definitions)) {
      if (def.type === 'computed') {
        metrics[id] = { label: def.label, value: evaluated[id] ?? 0, unit: def.unit };
      }
    }
    return metrics;
  }, [definitions, evaluated]);

  // --- Load all scenarios for export appendix ---
  const [allScenarios, setAllScenarios] = useState<DynamicScenario[]>([]);
  useEffect(() => {
    if (!businessId) return;
    let mounted = true;
    listScenarioData(businessId)
      .then((list) => { if (mounted) setAllScenarios(list); })
      .catch(() => { /* silently ignore - appendix will be empty */ });
    return () => { mounted = false; };
  }, [businessId]);

  // Filter to non-archived scenarios and evaluate each
  const scenarioPack = useMemo<ScenarioPack | null>(() => {
    if (!definitions || allScenarios.length === 0) return null;

    const nonArchived = allScenarios.filter((s) => s.status !== 'archived');
    if (nonArchived.length === 0) return null;

    // Find active scenario (status === 'active'), fallback to first
    const activeScenario = nonArchived.find((s) => s.status === 'active') ?? nonArchived[0];

    // Key metric variable IDs: only currency, percent, count units
    const keyVarIds = Object.entries(definitions)
      .filter(([, def]) => def.type === 'computed' && ['currency', 'percent', 'count'].includes(def.unit))
      .map(([id]) => id);

    const scenarioEntries = nonArchived.map((s) => {
      const evaluated = evaluateScenario(s, definitions, sectionScope);
      const metrics: Record<string, { label: string; value: number; unit: string }> = {};
      for (const varId of keyVarIds) {
        const def = definitions[varId];
        metrics[varId] = { label: def.label, value: evaluated[varId] ?? 0, unit: def.unit };
      }
      return {
        name: s.metadata.name,
        status: s.status ?? 'draft',
        metrics,
      };
    });

    return {
      active: {
        name: activeScenario.metadata.name,
        status: activeScenario.status ?? 'draft',
        horizon: activeScenario.horizonMonths ?? 12,
        assumptions: activeScenario.assumptions ?? [],
      },
      scenarios: scenarioEntries,
    };
  }, [definitions, allScenarios, sectionScope]);

  // Determine recommendation (highest profit-related metric)
  const recommendation = useMemo<string | null>(() => {
    if (!scenarioPack || scenarioPack.scenarios.length < 2 || !definitions) return null;

    // Find a profit-related variable
    const profitVarId = Object.entries(definitions).find(([, def]) => {
      if (def.type !== 'computed') return false;
      const lower = def.label.toLowerCase();
      return lower.includes('profit') || lower.includes('net income') || lower.includes('margin');
    })?.[0];

    if (!profitVarId) return null;

    let bestName = '';
    let bestValue = -Infinity;
    for (const s of scenarioPack.scenarios) {
      const val = s.metrics[profitVarId]?.value ?? 0;
      if (val > bestValue) {
        bestValue = val;
        bestName = s.name;
      }
    }

    if (!bestName) return null;
    return `Based on financial metrics, "${bestName}" appears strongest.`;
  }, [scenarioPack, definitions]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLanguage, setExportLanguage] = useState('en');

  // Chart capture for PDF
  const { ref: chartRef, captureChart } = useChartCapture();

  // Load all section data for PDF export
  const { data: execSummary } = useSection<ExecutiveSummary>('executive-summary', defaultExecutiveSummary);
  const { data: marketAnalysis } = useSection<MarketAnalysis>('market-analysis', defaultMarketAnalysis);
  const { data: productService } = useSection<ProductService>('product-service', defaultProductService);
  const { data: marketingStrategy } = useSection<MarketingStrategy>('marketing-strategy', defaultMarketing);
  const { data: operations } = useSection<Operations>('operations', defaultOperations);
  const { data: financials } = useSection<FinancialProjections>('financial-projections', defaultFinancials);
  const { data: risks } = useSection<RisksDueDiligence>('risks-due-diligence', defaultRisks);
  const { data: kpis } = useSection<KpisMetrics>('kpis-metrics', defaultKpis);
  const { data: launchPlan } = useSection<LaunchPlan>('launch-plan', defaultLaunchPlan);
  const { data: growthTimeline } = useSection<GrowthTimeline>('growth-timeline', defaultGrowthTimeline);

  async function handleDownloadPdf() {
    setIsGenerating(true);
    setIsTranslating(false);
    setError(null);

    try {
      // 1. Capture chart image
      const chartImage = await captureChart();

      // 2. Translate sections if non-English language selected
      let finalSections = {
        execSummary,
        marketAnalysis,
        productService,
        marketingStrategy,
        operations,
        financials,
        growthTimeline,
        risks,
        kpis,
        launchPlan,
      };
      let translatedLabels: Record<string, string> | undefined;

      if (exportLanguage !== 'en') {
        setIsTranslating(true);
        const result = await translateAllSections(
          {
            execSummary,
            marketAnalysis,
            productService,
            marketingStrategy,
            operations,
            risks,
            launchPlan,
            growthTimeline,
          },
          EXPORT_LANGUAGES.find((l) => l.code === exportLanguage)?.label.replace(/ \(.*\)$/, '') ?? exportLanguage,
        );
        finalSections = {
          ...finalSections,
          execSummary: result.execSummary,
          marketAnalysis: result.marketAnalysis,
          productService: result.productService,
          marketingStrategy: result.marketingStrategy,
          operations: result.operations,
          risks: result.risks,
          launchPlan: result.launchPlan,
          growthTimeline: result.growthTimeline,
        };
        translatedLabels = result.translatedLabels;
        setIsTranslating(false);
      }

      // 3. Dynamically import PDF generator and file-saver
      const [{ generateBusinessPlanPdf }, { saveAs }] = await Promise.all([
        import('./pdf/generatePdf'),
        import('file-saver'),
      ]);

      // 4. Generate PDF blob
      const blob = await generateBusinessPlanPdf({
        sections: finalSections,
        enabledSections,
        scenarioMetrics,
        scenarioName,
        chartImage,
        businessName,
        currencyCode,
        scenarioPack,
        language: exportLanguage !== 'en' ? exportLanguage : undefined,
        translatedLabels,
      });

      // 5. Trigger download with business name in filename
      const sanitizedName = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const langSuffix = exportLanguage !== 'en' ? `-${exportLanguage}` : '';
      saveAs(blob, `${sanitizedName}-business-plan${langSuffix}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsTranslating(false);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Export"
        description="Preview and download your business plan"
      />

      <Tabs defaultValue="business-plan">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 px-0 h-auto pb-0">
          <TabsTrigger
            value="business-plan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            <FileText className="size-3.5 mr-1.5" />
            Business Plan
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            <Download className="size-3.5 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-plan" className="mt-6">
          <BusinessPlanView chartAnimationDisabled={false} chartContainerRef={chartRef} />

          {/* Scenario Analysis Appendix */}
          {scenarioPack && (
            <div className="max-w-4xl mx-auto px-6 py-8 border-t mt-4">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 pt-4 mb-6">
                <span className="text-muted-foreground mr-2">Appendix.</span>
                Scenario Analysis
              </h2>

              {/* Active Scenario Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Scenario</h3>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-sm">{scenarioPack.active.name}</span>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      scenarioPack.active.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-300'
                        : 'bg-gray-100 text-gray-700 ring-gray-300'
                    }`}>
                      {scenarioPack.active.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Horizon: {scenarioPack.active.horizon} months</p>
                  {scenarioPack.active.assumptions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assumptions</p>
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {scenarioPack.active.assumptions.map((a) => (
                          <li key={a.id}>
                            <span className="font-medium">{a.label}:</span> {a.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              {scenarioPack.scenarios.length > 1 && (() => {
                // Get all metric keys from the first scenario
                const metricKeys = Object.keys(scenarioPack.scenarios[0].metrics);
                return (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Scenario Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-3 font-medium border-b">Metric</th>
                            {scenarioPack.scenarios.map((s) => (
                              <th key={s.name} className="text-right py-2 px-3 font-medium border-b">{s.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metricKeys.map((varId, i) => {
                            const firstMetric = scenarioPack.scenarios[0].metrics[varId];
                            // Find best value (highest for most, could be refined)
                            const values = scenarioPack.scenarios.map((s) => s.metrics[varId]?.value ?? 0);
                            const bestValue = Math.max(...values);
                            return (
                              <tr key={varId} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                <td className="py-2 px-3 border-b font-medium">{firstMetric.label}</td>
                                {scenarioPack.scenarios.map((s) => {
                                  const m = s.metrics[varId];
                                  const isBest = scenarioPack.scenarios.length > 1 && m.value === bestValue && values.filter((v) => v === bestValue).length === 1;
                                  return (
                                    <td key={s.name} className={`py-2 px-3 border-b text-right tabular-nums ${isBest ? 'font-bold text-emerald-700' : ''}`}>
                                      {formatExportValue(m.value, m.unit as VariableUnit, currencyCode)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Recommendation */}
              {recommendation && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">{recommendation}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <div className="card-elevated rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold">Export Options</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download your business plan as a professionally formatted PDF document.
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active Scenario</p>
                  <p className="text-xs text-muted-foreground">
                    Metrics from this scenario will be included in the export.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {scenarioName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Generated on</p>
                  <p className="text-xs text-muted-foreground">{currentDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Export language</p>
                  <p className="text-xs text-muted-foreground">Translate content before generating PDF</p>
                </div>
                <Select value={exportLanguage} onValueChange={setExportLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {isTranslating ? 'Translating & generating PDF...' : 'Generating PDF...'}
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                The PDF includes all enabled sections, financial charts, and scenario metrics.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
