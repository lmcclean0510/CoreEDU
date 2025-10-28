import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeworkCreationStep } from '@/hooks/homework/use-homework-creation';

interface StepNavigationProps {
  currentStep: HomeworkCreationStep;
  onStepChange: (step: HomeworkCreationStep) => void;
  canProceedFromOverview: boolean;
  canProceedFromAddTasks: boolean;
  selectedTasksCount: number;
}

const steps = [
  {
    id: 'overview' as HomeworkCreationStep,
    title: 'Homework Overview',
    description: 'Set title and details',
    icon: FileText,
  },
  {
    id: 'add-tasks' as HomeworkCreationStep,
    title: 'Add Tasks',
    description: 'Select flashcards & puzzles',
    icon: Plus,
  },
  {
    id: 'preview' as HomeworkCreationStep,
    title: 'Preview & Publish',
    description: 'Review and assign',
    icon: Eye,
  },
];

export function StepNavigation({
  currentStep,
  onStepChange,
  canProceedFromOverview,
  canProceedFromAddTasks,
  selectedTasksCount,
}: StepNavigationProps) {

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
    <div className="space-y-4">
      {/* Horizontal Step Tabs */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isAccessible = isStepAccessible(step.id);
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Card */}
              <button
                onClick={() => isAccessible && onStepChange(step.id)}
                disabled={!isAccessible}
                className={cn(
                  "flex items-center gap-3 w-full p-4 rounded-lg border-2 transition-all duration-200",
                  isActive && "bg-primary/10 border-primary shadow-sm",
                  !isActive && isAccessible && "bg-background border-border hover:border-primary/50 hover:bg-muted/50",
                  !isAccessible && "bg-muted/30 border-muted opacity-60 cursor-not-allowed"
                )}
              >
                {/* Step Icon/Number */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  !isActive && isCompleted && "bg-green-500 text-white",
                  !isActive && !isCompleted && isAccessible && "bg-muted text-muted-foreground",
                  !isAccessible && "bg-muted/50 text-muted-foreground/50"
                )}>
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-semibold text-sm",
                      isActive && "text-primary",
                      !isActive && isAccessible && "text-foreground",
                      !isAccessible && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    {step.id === 'add-tasks' && selectedTasksCount > 0 && (
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {selectedTasksCount}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isActive && "text-primary/70",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                </div>

                {/* Step Number Badge */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                  isActive && "bg-primary/20 text-primary",
                  !isActive && isCompleted && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
              </button>

              {/* Connector Arrow (not on last step) */}
              {index < steps.length - 1 && (
                <div className="mx-2 text-muted-foreground">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-50">
                    <path d="M7 5L12 10L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${canProceedFromOverview ? (canProceedFromAddTasks ? 100 : 66) : 33}%`
          }}
        />
      </div>
    </div>
  );
}
