
"use client";

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import type { Period } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NextLessonWidgetProps {
  periods?: Period[];
  className?: string;
}

const dayIndex: { [key: string]: number } = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

export function NextLessonWidget({ periods, className }: NextLessonWidgetProps) {
  const nextLessonInfo = useMemo(() => {
    if (!periods || periods.length === 0) {
      return { daysUntil: -1, text: 'No scheduled lessons' };
    }

    const now = new Date();
    const todayIndex = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let closestLesson: { date: Date; text: string } | null = null;

    for (const period of periods) {
      const lessonDayIndex = dayIndex[period.day];
      if (lessonDayIndex === undefined) continue;

      const [startHour, startMinute] = period.startTime.split(':').map(Number);
      const lessonTime = startHour * 60 + startMinute;

      let dayDifference = lessonDayIndex - todayIndex;
      if (dayDifference < 0 || (dayDifference === 0 && currentTime >= lessonTime)) {
        dayDifference += 7; // It's in the next week
      }
      
      const nextLessonDate = new Date(now);
      nextLessonDate.setDate(now.getDate() + dayDifference);
      nextLessonDate.setHours(startHour, startMinute, 0, 0);

      if (!closestLesson || nextLessonDate < closestLesson.date) {
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        closestLesson = { 
          date: nextLessonDate, 
          text: `${nextLessonDate.toLocaleDateString(undefined, dateOptions)} at ${period.startTime}` 
        };
      }
    }
    
    if (!closestLesson) {
      return { daysUntil: -1, text: 'No upcoming lessons' };
    }

    const timeDiff = closestLesson.date.getTime() - now.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    const timeString = closestLesson.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (daysUntil === 0) {
        return { daysUntil, text: `Today at ${timeString}` };
    } else if (daysUntil === 1) {
        return { daysUntil, text: `Tomorrow at ${timeString}` };
    } else {
        return { daysUntil, text: `In ${daysUntil} days (${closestLesson.text})` };
    }

  }, [periods]);

  return (
    <div className={cn("flex items-center gap-2 p-3 bg-muted/50 border rounded-lg", className)}>
      <Calendar className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-semibold">Next Lesson</p>
        <p className="text-xs text-muted-foreground">{nextLessonInfo.text}</p>
      </div>
    </div>
  );
}
