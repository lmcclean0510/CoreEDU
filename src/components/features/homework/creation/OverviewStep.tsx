import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Users, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ClassInfo, UserProfile } from '@/lib/types';

interface OverviewStepProps {
  // Form data
  title: string;
  instructions: string;
  dueDate: string;
  
  // Class info
  classInfo: ClassInfo;
  students: UserProfile[];
  
  // Actions
  onTitleChange: (title: string) => void;
  onInstructionsChange: (instructions: string) => void;
  onDueDateChange: (dueDate: string) => void;
  onNext: () => void;
  
  // Validation
  canProceed: boolean;
  isDueDateValid?: boolean;
}

export function OverviewStep({
  title,
  instructions,
  dueDate,
  classInfo,
  students,
  onTitleChange,
  onInstructionsChange,
  onDueDateChange,
  onNext,
  canProceed,
  isDueDateValid = true,
}: OverviewStepProps) {
  
  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if due date is in the past
  const isDueDateInPast = dueDate && new Date(dueDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Homework Overview</h2>
        <p className="text-muted-foreground mt-1">
          Set up the basic details for your homework assignment
        </p>
      </div>

      {/* Two Column Layout - Assignment Target (smaller) & Homework Details (larger) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Assignment Target (4 columns) */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Assignment Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{classInfo.className}</h3>
                      <p className="text-xs text-muted-foreground">{classInfo.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{students.length} students</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Homework Details (8 columns) */}
        <div className="col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Homework Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="homework-title" className="text-sm font-medium">
                  Homework Title *
                </Label>
                <Input
                  id="homework-title"
                  placeholder="e.g., CPU & Memory Systems Revision"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="homework-instructions" className="text-sm font-medium">
                  Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="homework-instructions"
                  placeholder="Add any specific instructions or context for this homework..."
                  value={instructions}
                  onChange={(e) => onInstructionsChange(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Due Date - Improved Styling */}
              <div className="space-y-2">
                <Label htmlFor="homework-due-date" className="text-sm font-medium">
                  Due Date <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
                    <Calendar className="text-muted-foreground w-4 h-4" />
                  </div>
                  <Input
                    id="homework-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => onDueDateChange(e.target.value)}
                    min={getTodayDate()}
                    className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                </div>
                {isDueDateInPast && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Due date cannot be in the past. Please select today or a future date.
                    </AlertDescription>
                  </Alert>
                )}
                {dueDate && isDueDateValid && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/20">
                    <Calendar className="w-3 h-3 text-primary" />
                    <p className="text-xs text-primary font-medium">
                      Due: {new Date(dueDate).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to add tasks?</h3>
              <p className="text-sm text-muted-foreground">
                {canProceed 
                  ? "Your homework details look good. Let's add some tasks!"
                  : "Please enter a homework title to continue"
                }
              </p>
              {dueDate && isDueDateValid && (
                <p className="text-xs text-primary mt-1">
                  Due: {new Date(dueDate).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
            <Button 
              onClick={onNext}
              disabled={!canProceed || !isDueDateValid}
              className="flex items-center gap-2"
            >
              Next: Add Tasks
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}