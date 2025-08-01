
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, Trash2, PlusCircle, Calendar, Clock, AlertTriangle, Edit } from 'lucide-react';
import {
  Dialog,
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
import { cn } from '@/lib/utils';
import { ScrollArea } from '../../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClassSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  onSuccess: () => void;
}

const daysOfWeek: Period['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClassSettingsDialog({ isOpen, onClose, classInfo, onSuccess }: ClassSettingsDialogProps) {
  const { toast } = useToast();
  const { updateClass } = useClassManagement();

  const [className, setClassName] = useState('');
  const [periods, setPeriods] = useState<Partial<Period>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (classInfo) {
      setClassName(classInfo.className);
      setPeriods(classInfo.periods || []);
    }
  }, [classInfo, isOpen]);

  const handleAddPeriod = () => {
    setPeriods([...periods, { day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  };

  const handlePeriodChange = (index: number, field: keyof Period, value: string) => {
    const newPeriods = [...periods];
    const currentPeriod = { ...newPeriods[index] };
    
    const formatTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    if (field === 'startTime') {
        currentPeriod.startTime = value;
        const [h, m] = value.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
            const newEndHour = (h + 1) % 24;
            currentPeriod.endTime = formatTime(newEndHour, m);
        }
    } else {
        (currentPeriod as any)[field] = value;
    }
    
    newPeriods[index] = currentPeriod;
    setPeriods(newPeriods);
  };
  
  const handleTimePartChange = (index: number, type: 'start' | 'end', part: 'hour' | 'minute', value: string) => {
    const numericValue = parseInt(value, 10);
    const newPeriods = [...periods];
    const period = newPeriods[index] as Period;
    
    let [h, m] = (type === 'start' ? period.startTime : period.endTime).split(':').map(Number);

    if (part === 'hour') {
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 23) h = numericValue;
      else if (value === '') h = 0;
    } else { // minute
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 59) m = numericValue;
      else if (value === '') m = 0;
    }

    const newTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    handlePeriodChange(index, type === 'start' ? 'startTime' : 'endTime', newTime);
  };

  const handleRemovePeriod = (index: number) => {
    const newPeriods = periods.filter((_, i) => i !== index);
    setPeriods(newPeriods);
  };

  const isTimeRangeValid = (period: Partial<Period>): boolean => {
    if (!period.startTime || !period.endTime) return true; // Can't validate if incomplete
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    return (startH * 60 + startM) <= (endH * 60 + endM);
  };
  
  const areAllPeriodsValid = periods.every(isTimeRangeValid);

  const handleSubmit = async () => {
    if (!className.trim() || !areAllPeriodsValid) {
        toast({ title: 'Invalid Input', description: 'Please check the class name and ensure all period times are valid.', variant: 'destructive' });
        return;
    }

    const completePeriods = periods.filter(p => p.day && p.startTime && p.endTime) as Period[];
    
    setIsSaving(true);
    try {
      await updateClass(classInfo.id, {
        className,
        periods: completePeriods
      });
      toast({ title: 'Success', description: 'Class details have been updated.' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({ title: 'Error', description: 'Could not update the class.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Class: {classInfo.className}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-grow overflow-y-hidden">
          <div className="space-y-2 px-1">
            <Label htmlFor="class-name-edit" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Class Name
            </Label>
            <Input
              id="class-name-edit"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Year 10 Computer Science"
              className="h-10 text-base"
            />
          </div>
          <div className="space-y-2 flex flex-col flex-grow px-1">
            <Label>Class Periods</Label>
            <div className="flex-grow overflow-hidden -mr-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {periods.map((period, index) => {
                    const [startHour, startMinute] = (period.startTime || "09:00").split(':');
                    const [endHour, endMinute] = (period.endTime || "10:00").split(':');
                    const isInvalid = !isTimeRangeValid(period);

                    return (
                      <div key={index} className={cn("relative flex items-end gap-2 p-3 border rounded-lg bg-background shadow-sm", isInvalid && "border-destructive")}>
                        {isInvalid && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="absolute top-1 right-1">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>End time cannot be before start time.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                           <div className="space-y-1">
                            <Label htmlFor={`day-edit-${index}`} className="text-xs flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Day</Label>
                            <Select value={period.day} onValueChange={(value: Period['day']) => handlePeriodChange(index, 'day', value)}>
                                <SelectTrigger id={`day-edit-${index}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`start-hour-edit-${index}`} className="text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" /> Start Time</Label>
                            <div className="flex items-center gap-1">
                                <Input id={`start-hour-edit-${index}`} type="number" value={startHour} onChange={(e) => handleTimePartChange(index, 'start', 'hour', e.target.value)} className="w-full" placeholder="HH" min="0" max="23" />
                                <span>:</span>
                                <Input type="number" value={startMinute} onChange={(e) => handleTimePartChange(index, 'start', 'minute', e.target.value)} className="w-full" placeholder="MM" min="0" max="59"/>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`end-hour-edit-${index}`} className="text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" /> End Time</Label>
                             <div className="flex items-center gap-1">
                                <Input id={`end-hour-edit-${index}`} type="number" value={endHour} onChange={(e) => handleTimePartChange(index, 'end', 'hour', e.target.value)} className="w-full" placeholder="HH" min="0" max="23" />
                                <span>:</span>
                                <Input type="number" value={endMinute} onChange={(e) => handleTimePartChange(index, 'end', 'minute', e.target.value)} className="w-full" placeholder="MM" min="0" max="59"/>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePeriod(index)} className="shrink-0 self-end mb-1">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            <div className="mt-auto pt-2 px-1">
              <Button variant="outline" onClick={handleAddPeriod} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Period
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving || !areAllPeriodsValid}>
            {isSaving && <LoaderCircle className="animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
