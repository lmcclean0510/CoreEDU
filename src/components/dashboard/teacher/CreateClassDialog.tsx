"use client";

import { useState } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, Trash2, PlusCircle, ArrowRight, ArrowLeft, CheckCircle, BookOpen, Clock, Calendar, Edit } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClassManagement } from '@/hooks/teacher/use-class-management';
import { useToast } from '@/hooks/shared/use-toast';
import type { ClassInfo, Period } from '@/lib/types';
import { ScrollArea } from '../../ui/scroll-area';

interface CreateClassDialogProps {
  onSuccess: () => void;
}

const daysOfWeek: Period['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CreateClassDialog({ onSuccess }: CreateClassDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createClass } = useClassManagement();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState<ClassInfo['subject'] | ''>('');
  const [periods, setPeriods] = useState<Partial<Period>[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddPeriod = () => {
    setPeriods([...periods, { day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  };

  const handlePeriodChange = (index: number, field: keyof Period, value: string) => {
    const newPeriods = [...periods];
    const currentPeriod = { ...newPeriods[index] };
    
    if (field === 'startTime') {
      currentPeriod.startTime = value;
      // Auto-set end time to 1 hour later
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const newEndHour = (h + 1) % 24;
        currentPeriod.endTime = `${String(newEndHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    } else {
      (currentPeriod as any)[field] = value;
    }
    
    newPeriods[index] = currentPeriod;
    setPeriods(newPeriods);
  };

  const handleRemovePeriod = (index: number) => {
    const newPeriods = periods.filter((_, i) => i !== index);
    setPeriods(newPeriods);
  };

  const handleSubmit = async () => {
    if (!user || !className.trim() || !subject) return;

    const completePeriods = periods.filter(p => p.day && p.startTime && p.endTime) as Period[];
    
    setIsCreating(true);
    try {
      await createClass(className, subject, user.uid, completePeriods);
      toast({ 
        title: 'Success', 
        description: `Class "${className}" created successfully.` 
      });
      setStep(3); // Move to success step
      onSuccess();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({ 
        title: 'Error', 
        description: 'Could not create the class. Please try again.', 
        variant: 'destructive' 
      });
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setClassName('');
    setSubject('');
    setPeriods([]);
    setStep(1);
    setIsCreating(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      setTimeout(resetForm, 300);
    } else {
      setIsOpen(true);
    }
  };

  const isTimeRangeValid = (period: Partial<Period>): boolean => {
    if (!period.startTime || !period.endTime) return true;
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    return (startH * 60 + startM) <= (endH * 60 + endM);
  };

  const areAllPeriodsValid = periods.every(isTimeRangeValid);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold">Class Details</h3>
              <p className="text-sm text-muted-foreground">Start by giving your class a name and subject.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Class Name
                </Label>
                <Input
                  id="class-name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Year 10 Computer Science"
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subject
                </Label>
                <Select value={subject} onValueChange={(value) => setSubject(value as ClassInfo['subject'])}>
                  <SelectTrigger id="subject" className="h-11">
                    <SelectValue placeholder="Select a subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Maths" disabled>Maths (Coming Soon)</SelectItem>
                    <SelectItem value="Geography" disabled>Geography (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="w-full max-w-xl mx-auto space-y-4 h-[400px] flex flex-col">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Class Schedule</h3>
              <p className="text-sm text-muted-foreground">Add the times this class meets (optional)</p>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {periods.length > 0 ? (
                  <div className="space-y-3">
                    {periods.map((period, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <div className="space-y-1">
                            <Label className="text-xs">Day</Label>
                            <Select 
                              value={period.day} 
                              onValueChange={(value: Period['day']) => handlePeriodChange(index, 'day', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {daysOfWeek.map(day => (
                                  <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Start</Label>
                            <Input
                              type="time"
                              value={period.startTime || ''}
                              onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">End</Label>
                            <Input
                              type="time"
                              value={period.endTime || ''}
                              onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePeriod(index)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mb-4" />
                    <p>No periods added yet</p>
                    <p className="text-sm">Click "Add Period" to get started</p>
                  </div>
                )}
              </ScrollArea>
            </div>
            
            <Button variant="outline" onClick={handleAddPeriod} className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Period
            </Button>
          </div>
        );
        
      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">Class Created!</h2>
              <p className="text-muted-foreground mt-2">
                "{className}" has been successfully created.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-left space-y-2">
              <p><strong>Name:</strong> {className}</p>
              <p><strong>Subject:</strong> {subject}</p>
              <p><strong>Periods:</strong> {periods.length > 0 ? `${periods.length} scheduled` : 'None'}</p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 1:
        return (
          <DialogFooter>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!className.trim() || !subject}
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </DialogFooter>
        );
        
      case 2:
        return (
          <DialogFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSubmit} disabled={isCreating}>
                Skip & Create
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!areAllPeriodsValid || isCreating}
              >
                {isCreating && <LoaderCircle className="animate-spin mr-2 w-4 h-4" />}
                Create Class
              </Button>
            </div>
          </DialogFooter>
        );
        
      case 3:
        return (
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogClose>
          </DialogFooter>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>Create Class</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Create New Class'}
            {step === 2 && 'Add Schedule'}
            {step === 3 && 'Success!'}
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </DialogHeader>
        
        <div className="py-6">
          {renderStepContent()}
        </div>
        
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}