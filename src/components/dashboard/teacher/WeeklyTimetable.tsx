import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassInfo, Period } from '@/lib/types';

interface WeeklyTimetableProps {
  classes: ClassInfo[];
}

interface TimetableClass {
  id: string;
  name: string;
  subject: string;
  day: Period['day'];
  startTime: string;
  endTime: string;
  status: 'past' | 'current' | 'upcoming';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function WeeklyTimetable({ classes }: WeeklyTimetableProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for real-time status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Transform classes into timetable format with real-time status
  const timetableClasses = useMemo(() => {
    const now = currentTime;
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }) as Period['day'];
    const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM format

    const allClasses: TimetableClass[] = [];

    classes.forEach(classInfo => {
      if (classInfo.periods) {
        classInfo.periods.forEach(period => {
          // Determine status based on current time
          let status: 'past' | 'current' | 'upcoming' = 'upcoming';
          
          if (period.day === currentDay) {
            if (currentTimeStr >= period.endTime) {
              status = 'past';
            } else if (currentTimeStr >= period.startTime && currentTimeStr < period.endTime) {
              status = 'current';
            }
          } else {
            // Check if day has passed this week
            const dayIndex = DAYS.indexOf(period.day);
            const currentDayIndex = DAYS.indexOf(currentDay);
            if (dayIndex < currentDayIndex) {
              status = 'past';
            }
          }

          allClasses.push({
            id: classInfo.id,
            name: classInfo.className,
            subject: classInfo.subject,
            day: period.day,
            startTime: period.startTime,
            endTime: period.endTime,
            status
          });
        });
      }
    });

    return allClasses;
  }, [classes, currentTime]);

  // Group classes by day
  const classesByDay = useMemo(() => {
    const grouped: Record<string, TimetableClass[]> = {};
    DAYS.forEach(day => {
      grouped[day] = timetableClasses.filter(cls => cls.day === day);
    });
    return grouped;
  }, [timetableClasses]);

  // Calculate week progress
  const weekProgress = useMemo(() => {
    const totalClasses = timetableClasses.length;
    const completedClasses = timetableClasses.filter(cls => cls.status === 'past').length;
    return totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
  }, [timetableClasses]);

  if (timetableClasses.length === 0) {
    return null; // Don't show if no scheduled classes
  }

  return (
    <Card className="border-2 border-primary/10 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Weekly Timetable</CardTitle>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{weekProgress}% of this week's classes completed</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updates in real-time</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-primary">{weekProgress}%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-2 min-h-[120px]">
          {DAYS.map(day => {
            const dayClasses = classesByDay[day];
            const isToday = day === currentTime.toLocaleDateString('en-US', { weekday: 'long' });
            
            return (
              <div 
                key={day}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200",
                  isToday 
                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                    : "bg-muted/30 border-border"
                )}
              >
                {/* Day header */}
                <div className="text-center mb-3">
                  <div className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                  {isToday && (
                    <Badge variant="outline" className="text-xs mt-1 border-primary text-primary">
                      Today
                    </Badge>
                  )}
                </div>
                
                {/* Classes for this day */}
                <div className="space-y-2">
                  {dayClasses.length > 0 ? (
                    dayClasses.map((cls, index) => (
                      <div
                        key={`${cls.id}-${index}`}
                        className={cn(
                          "p-2 rounded-md text-xs transition-all duration-300 border",
                          cls.status === 'past' && "opacity-50 bg-muted text-muted-foreground border-muted",
                          cls.status === 'current' && "bg-green-50 text-green-800 border-green-200 shadow-sm ring-1 ring-green-200",
                          cls.status === 'upcoming' && "bg-background text-foreground border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="font-medium truncate" title={cls.name}>
                          {cls.name}
                        </div>
                        <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cls.startTime}-{cls.endTime}
                        </div>
                        {cls.status === 'current' && (
                          <Badge variant="outline" className="text-xs mt-1 bg-green-100 text-green-800 border-green-300">
                            Live Now
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No classes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted border"></div>
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-200"></div>
            <span className="text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-background border"></div>
            <span className="text-muted-foreground">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}