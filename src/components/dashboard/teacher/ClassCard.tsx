"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Trash2 } from 'lucide-react';
import type { ClassInfo } from '@/lib/types';
import { DeleteClassDialog } from './DeleteClassDialog';

interface ClassCardProps {
  classInfo: ClassInfo;
  onClassDeleted: () => void;
}

export function ClassCard({ classInfo, onClassDeleted }: ClassCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col h-full hover:border-primary/50 transition-all duration-300 shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="text-primary w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {classInfo.className}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {classInfo.subject}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete class</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col flex-grow">
          <CardDescription className="flex-grow mb-4">
            Manage students, assign homework, and view progress for this class.
          </CardDescription>
          
          <div className="space-y-3">
            {/* Class Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Students:</span>
              <span className="font-medium">{classInfo.studentUids.length}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Class Code:</span>
              <span className="font-mono font-medium bg-muted px-2 py-1 rounded">
                {classInfo.classCode}
              </span>
            </div>
            
            {/* Schedule Info */}
            {classInfo.periods && classInfo.periods.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Schedule:</span>
                <div className="mt-1 space-y-1">
                  {classInfo.periods.slice(0, 2).map((period, index) => (
                    <div key={index} className="text-xs bg-muted/50 px-2 py-1 rounded">
                      {period.day} {period.startTime}-{period.endTime}
                    </div>
                  ))}
                  {classInfo.periods.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{classInfo.periods.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <div className="p-6 pt-0 mt-auto">
          <Button asChild className="w-full">
            <Link href={`/dashboard/teacher/class/${classInfo.id}`}>
              View Class
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <DeleteClassDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleted={onClassDeleted}
        classInfo={classInfo}
      />
    </>
  );
}