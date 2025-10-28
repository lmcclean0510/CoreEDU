import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Plus, Eye, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeworkCreationStep } from '@/lib/types';

interface StickyHomeworkNavProps {
  currentStep: HomeworkCreationStep;
  canProceedFromOverview: boolean;
  canProceedFromAddTasks: boolean;
  canSubmit: boolean;
  isCreating: boolean;
  selectedTasksCount: number;
  onStepChange: (step: HomeworkCreationStep) => void;
  onExit: () => void;
  onPublish: () => void;
}

const steps = [
  {
    id: 'overview' as HomeworkCreationStep,
    title: 'Overview',
    icon: FileText,
  },
  {
    id: 'add-tasks' as HomeworkCreationStep,
    title: 'Add Tasks',
    icon: Plus,
  },
  {
    id: 'preview' as HomeworkCreationStep,
    title: 'Preview',
    icon: Eye,
  },
];

export function StickyHomeworkNav({
  currentStep,
  canProceedFromOverview,
  canProceedFromAddTasks,
  canSubmit,
  isCreating,
  selectedTasksCount,
  onStepChange,
  onExit,
  onPublish,
}: StickyHomeworkNavProps) {

  const getStepStatus = (stepId: HomeworkCreationStep) => {
    if (stepId === 'overview') {
      return canProceedFromOverview ? 'completed' : 'current';
    }
    if (stepId === 'add-tasks') {
      if (!canProceedFromOverview) return 'disabled';
      return canProceedFromAddTasks ? 'completed' : 'current';
    }
    if (stepId === 'preview') {
      if (!canProceedFromOverview || !canProceedFromAddTasks) return 'disabled';
      return 'current';
    }
    return 'current';
  };

  const isStepAccessible = (stepId: HomeworkCreationStep) => {
    if (stepId === 'overview') return true;
    if (stepId === 'add-tasks') return canProceedFromOverview;
    if (stepId === 'preview') return canProceedFromOverview && canProceedFromAddTasks;
    return false;
  };

  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Main Nav Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Exit Button */}
          <Button variant="outline" size="sm" onClick={onExit} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Exit
          </Button>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isAccessible = isStepAccessible(step.id);
              const status = getStepStatus(step.id);
              const isCompleted = status === 'completed';

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && onStepChange(step.id)}
                    disabled={!isAccessible}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                      isActive && "bg-primary/10 border-2 border-primary",
                      !isActive && isAccessible && "hover:bg-muted",
                      !isAccessible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && isCompleted && "bg-green-500 text-white",
                      !isActive && !isCompleted && isAccessible && "bg-muted text-muted-foreground",
                      !isAccessible && "bg-muted/50 text-muted-foreground/50"
                    )}>
                      {isCompleted && !isActive ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Title and Badge */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        isActive && "text-primary",
                        !isActive && isAccessible && "text-foreground",
                        !isAccessible && "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                      {step.id === 'add-tasks' && selectedTasksCount > 0 && (
                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                          {selectedTasksCount}
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="mx-1 text-muted-foreground">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Publish Button */}
          <Button
            onClick={onPublish}
            disabled={!canSubmit || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Homework'
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1 mb-3">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{
              width: `${canProceedFromOverview ? (canProceedFromAddTasks ? 100 : 66) : 33}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
