import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import type { LaunchPlan as LaunchPlanType, LaunchStage, TaskStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Rocket } from 'lucide-react';

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  done: 'Done',
};

const STAGE_ACCENT_COLORS = [
  'border-l-blue-500',
  'border-l-purple-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-indigo-500',
  'border-l-orange-500',
];

const defaultLaunchPlan: LaunchPlanType = {
  stages: [],
};

export function LaunchPlan() {
  const { data, updateData, isLoading, canEdit } = useSection<LaunchPlanType>(
    'launch-plan',
    defaultLaunchPlan
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Launch Plan" description="Loading..." />
      </div>
    );
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

  function removeStage(stageIndex: number) {
    updateData((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, index) => index !== stageIndex),
    }));
  }

  const sectionContent = (
    <div className="page-container">
      {data.stages.length === 0 ? (
        <EmptyState icon={Rocket} title="No launch stages" description="Use AI Generate to create a launch plan, or add stages manually." action={canEdit ? { label: 'Add Stage', onClick: addStage } : undefined} />
      ) : (
        <div className="relative">
          {/* Vertical timeline connector */}
          {data.stages.length > 1 && (
            <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border" />
          )}

          <div className="space-y-4">
            {data.stages.map((stage, stageIndex) => {
              const accentColor = STAGE_ACCENT_COLORS[stageIndex % STAGE_ACCENT_COLORS.length];
              const completedTasks = stage.tasks.filter((t) => t.status === 'done').length;
              const totalTasks = stage.tasks.length;

              return (
                <div key={stageIndex} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className="absolute left-3 top-6 z-10 size-4 rounded-full border-2 border-primary bg-background" />

                  <div className={`card-elevated rounded-lg border-l-4 ${accentColor} overflow-hidden`}>
                    {/* Stage header */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground shrink-0 uppercase tracking-wider">
                            Stage {stageIndex + 1}
                          </span>
                          {totalTasks > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {completedTasks}/{totalTasks} tasks
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive"
                            onClick={() => removeStage(stageIndex)}
                            aria-label={`Delete stage ${stageIndex + 1}`}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={stage.name}
                        onChange={(e) =>
                          updateStage(stageIndex, 'name', e.target.value)
                        }
                        placeholder="Stage name"
                        className="text-sm font-semibold border-0 bg-transparent shadow-none focus-visible:ring-1 px-0 h-8"
                        readOnly={!canEdit}
                      />
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
                            className="h-8 text-sm"
                            readOnly={!canEdit}
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
                            className="h-8 text-sm"
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="border-t px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</label>
                      </div>

                      {stage.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="group flex items-center gap-2">
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                          >
                            {STATUS_LABELS[task.status]}
                          </span>
                          <Input
                            value={task.task}
                            onChange={(e) =>
                              updateTask(stageIndex, taskIndex, e.target.value)
                            }
                            placeholder="Task description"
                            className="text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 px-1 h-8"
                            readOnly={!canEdit}
                          />
                          <Select
                            value={task.status}
                            onValueChange={(value: TaskStatus) =>
                              updateTaskStatus(stageIndex, taskIndex, value)
                            }
                            disabled={!canEdit}
                          >
                            <SelectTrigger size="sm" className="w-[120px] shrink-0 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeTask(stageIndex, taskIndex)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {stage.tasks.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1">
                          No tasks yet.
                        </p>
                      )}

                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-1 h-7 text-xs"
                          onClick={() => addTask(stageIndex)}
                        >
                          <Plus className="size-3" />
                          Add Task
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Stage Button */}
      {canEdit && data.stages.length > 0 && (
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
    <div className="page-container">
      <PageHeader showScenarioBadge title="Launch Plan" description="Staged timeline with tasks and milestones" />
      {sectionContent}
    </div>
  );
}
