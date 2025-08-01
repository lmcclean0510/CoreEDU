import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';
import type { Stats } from '../types';

interface StatsCardProps {
  stats: Stats;
  unassignedStudentCount: number;
}

const StatsCard = memo(({ stats, unassignedStudentCount }: StatsCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-foreground">{stats.availableDesks}</div>
            <div className="text-xs text-muted-foreground">Available Desks</div>
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{stats.totalStudents}</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
        </div>
        
        {stats.totalStudents > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-bold text-foreground">{stats.maleCount}</div>
                <div className="text-xs text-muted-foreground">Male</div>
              </div>
              <div>
                <div className="font-bold text-foreground">{stats.femaleCount}</div>
                <div className="text-xs text-muted-foreground">Female</div>
              </div>
              <div>
                <div className="font-bold text-foreground">{stats.otherGenderCount}</div>
                <div className="text-xs text-muted-foreground">Other</div>
              </div>
            </div>
          </div>
        )}

        {unassignedStudentCount > 0 && (
          <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Users className="w-3 h-3" />
              <span>{unassignedStudentCount} students unassigned</span>
            </div>
          </div>
        )}
         {stats.totalStudents > stats.availableDesks && (
          <div className="mt-3 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" />
              <span>Not enough desks for all students!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;
