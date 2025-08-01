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

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Target</CardTitle>
          <CardDescription>
            This homework will be assigned to the following class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{classInfo.className}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{classInfo.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">{students.length} students</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Homework Details</CardTitle>
          <CardDescription>
            Provide the essential information for this assignment
          </CardDescription>
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
            <p className="text-xs text-muted-foreground">
              Give your homework a clear, descriptive title that students will see
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="homework-instructions" className="text-sm font-medium">
              Instructions <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="homework-instructions"
              placeholder="Add any specific instructions or context for this homework..."
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide additional context or specific instructions for students
            </p>
          </div>

          {/* Due Date - Now Enabled */}
          <div className="space-y-2">
            <Label htmlFor="homework-due-date" className="text-sm font-medium">
              Due Date <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="homework-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                min={getTodayDate()}
                className="pl-10"
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
            <p className="text-xs text-muted-foreground">
              Set when students should complete this homework (optional)
            </p>
          </div>
        </CardContent>
      </Card>

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