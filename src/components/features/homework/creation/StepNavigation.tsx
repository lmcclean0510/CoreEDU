import { Button } from '@/components/ui/button';
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
    <div>
      <h3 className="font-semibold text-lg mb-4">Create Homework</h3>
      
      <nav className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isAccessible = isStepAccessible(step.id);
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          
          return (
            <Button
              key={step.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3 text-left",
                !isAccessible && "opacity-50 cursor-not-allowed",
                isActive && "bg-primary text-primary-foreground"
              )}
              onClick={() => isAccessible && onStepChange(step.id)}
              disabled={!isAccessible}
            >
              <div className="flex items-center gap-3 w-full">
                {/* Step icon/number */}
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full border-2 flex-shrink-0",
                  isActive && "border-primary-foreground bg-primary-foreground text-primary",
                  !isActive && isCompleted && "border-green-500 bg-green-500 text-white",
                  !isActive && !isCompleted && isAccessible && "border-muted-foreground",
                  !isAccessible && "border-muted"
                )}>
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      isActive && "text-primary-foreground",
                      !isActive && "text-foreground"
                    )}>
                      {step.title}
                    </p>
                    {step.id === 'add-tasks' && selectedTasksCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedTasksCount}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-1",
                    isActive && "text-primary-foreground/80",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}