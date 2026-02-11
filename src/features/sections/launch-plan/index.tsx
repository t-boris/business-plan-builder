import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { LaunchPlan as LaunchPlanType, LaunchStage, TaskStatus } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  done: 'Done',
};

const defaultLaunchPlan: LaunchPlanType = {
  stages: [
    {
      name: 'Preparation',
      startDate: '2026-01-15',
      endDate: '2026-02-28',
      tasks: [
        { task: 'Package 3 service tiers', status: 'pending' },
        { task: 'Shoot video and photo content', status: 'pending' },
        { task: 'Build landing page', status: 'pending' },
        { task: 'Set up CRM or tracking spreadsheet', status: 'pending' },
      ],
    },
    {
      name: 'Soft Launch',
      startDate: '2026-03-01',
      endDate: '2026-03-14',
      tasks: [
        { task: 'Launch ads with small budget', status: 'pending' },
        { task: 'Test ad creatives', status: 'pending' },
        { task: 'Test promotional offers', status: 'pending' },
        { task: 'Collect initial feedback', status: 'pending' },
      ],
    },
    {
      name: 'Scale',
      startDate: '2026-03-15',
      endDate: '2026-06-30',
      tasks: [
        { task: 'Increase ad budget', status: 'pending' },
        { task: 'Launch Google Ads', status: 'pending' },
        { task: 'Activate partnerships', status: 'pending' },
        { task: 'Build review collection system', status: 'pending' },
      ],
    },
  ],
};

export function LaunchPlan() {
  const { data, updateData, isLoading } = useSection<LaunchPlanType>(
    'launch-plan',
    defaultLaunchPlan
  );
  const aiSuggestion = useAiSuggestion<LaunchPlanType>('launch-plan');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Launch Plan</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  function updateStage(
    index: number,
    field: keyof LaunchStage,
    value: string
  ) {
    updateData((prev) => {
      const stages = [...prev.stages];
      stages[index] = { ...stages[index], [field]: value };
      return { ...prev, stages };
    });
  }

  function updateTask(stageIndex: number, taskIndex: number, value: string) {
    updateData((prev) => {
      const stages = [...prev.stages];
      const tasks = [...stages[stageIndex].tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], task: value };
      stages[stageIndex] = { ...stages[stageIndex], tasks };
      return { ...prev, stages };
    });
  }

  function updateTaskStatus(stageIndex: number, taskIndex: number, status: TaskStatus) {
    updateData((prev) => {
      const stages = [...prev.stages];
      const tasks = [...stages[stageIndex].tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], status };
      stages[stageIndex] = { ...stages[stageIndex], tasks };
      return { ...prev, stages };
    });
  }

  function addTask(stageIndex: number) {
    updateData((prev) => {
      const stages = [...prev.stages];
      const tasks = [...stages[stageIndex].tasks, { task: '', status: 'pending' as TaskStatus }];
      stages[stageIndex] = { ...stages[stageIndex], tasks };
      return { ...prev, stages };
    });
  }

  function removeTask(stageIndex: number, taskIndex: number) {
    updateData((prev) => {
      const stages = [...prev.stages];
      const tasks = stages[stageIndex].tasks.filter((_, i) => i !== taskIndex);
      stages[stageIndex] = { ...stages[stageIndex], tasks };
      return { ...prev, stages };
    });
  }

  function addStage() {
    updateData((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        { name: '', startDate: '', endDate: '', tasks: [] },
      ],
    }));
  }

  const sectionContent = (
    <div className="space-y-6">
      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline connecting line */}
        {displayData.stages.length > 1 && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        )}

        <div className="space-y-6">
          {displayData.stages.map((stage, stageIndex) => (
            <div key={stageIndex} className="relative pl-14">
              {/* Timeline dot */}
              <div className="absolute left-4 top-6 z-10 size-5 rounded-full border-2 border-primary bg-background" />

              <Card>
                <CardHeader>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Stage {stageIndex + 1}
                      </span>
                      <CardTitle className="flex-1">
                        <Input
                          value={stage.name}
                          onChange={(e) =>
                            updateStage(stageIndex, 'name', e.target.value)
                          }
                          placeholder="Stage name"
                          className="font-semibold"
                          readOnly={isPreview}
                        />
                      </CardTitle>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={stage.startDate}
                          onChange={(e) =>
                            updateStage(stageIndex, 'startDate', e.target.value)
                          }
                          readOnly={isPreview}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={stage.endDate}
                          onChange={(e) =>
                            updateStage(stageIndex, 'endDate', e.target.value)
                          }
                          readOnly={isPreview}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Tasks</label>
                    {!isPreview && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => addTask(stageIndex)}
                      >
                        <Plus className="size-3" />
                        Add Task
                      </Button>
                    )}
                  </div>

                  {stage.tasks.map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center gap-2">
                      <span
                        className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                      <Input
                        value={task.task}
                        onChange={(e) =>
                          updateTask(stageIndex, taskIndex, e.target.value)
                        }
                        placeholder="Task description"
                        className="text-sm"
                        readOnly={isPreview}
                      />
                      <Select
                        value={task.status}
                        onValueChange={(value: TaskStatus) =>
                          updateTaskStatus(stageIndex, taskIndex, value)
                        }
                        disabled={isPreview}
                      >
                        <SelectTrigger size="sm" className="w-[130px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      {!isPreview && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTask(stageIndex, taskIndex)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {stage.tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No tasks yet. Click "Add Task" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stage Button */}
      {!isPreview && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={addStage}>
            <Plus className="size-4" />
            Add Stage
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Launch Plan</h1>
        <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
      </div>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" /><span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading><div /></AiSuggestionPreview>}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>{sectionContent}</AiSuggestionPreview>
      ) : aiSuggestion.state.status !== 'loading' && sectionContent}
    </div>
  );
}
