"use client";

import { LoaderCircle, Plus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/UserProvider';
import { useTeacherClasses } from '@/hooks/teacher/use-teacher-classes';
import { useJoinRequests } from '@/hooks/teacher/use-join-requests';
import { ClassCard } from '@/components/dashboard/teacher/ClassCard';
import { CreateClassDialog } from '@/components/dashboard/teacher/CreateClassDialog';
import { WeeklyTimetable } from '@/components/dashboard/teacher/WeeklyTimetable';
import { JoinRequestPanel } from '@/components/dashboard/teacher/JoinRequestPanel';
import { JoinRequestsButton } from '@/components/dashboard/teacher/JoinRequestsButton';
import { useState, useEffect } from 'react';

export default function TeacherDashboardPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { 
    isTeacher, 
    classes, 
    isLoading: isClassesLoading,
    refreshClasses,
  } = useTeacherClasses();

  const classIds = classes.map(cls => cls.id);
  
  const { 
    joinRequests,
    requestCount,
    isLoading: isRequestsLoading,
    lastChecked,
    hasCachedData,
    checkJoinRequests,
    handleJoinRequest,
    isInCooldown,
    getCooldownRemaining,
  } = useJoinRequests(classIds);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Update cooldown display for the button
  useEffect(() => {
    if (!isInCooldown) {
      setCooldownSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInCooldown, getCooldownRemaining]);

  // Handle join requests button click
  const handleJoinRequestsClick = async () => {
    const result = await checkJoinRequests();
    setIsPanelOpen(true);
  };

  // Handle approve/deny actions
  const handleApprove = (requestId: string) => {
    handleJoinRequest(requestId, 'approve');
  };

  const handleDeny = (requestId: string) => {
    handleJoinRequest(requestId, 'deny');
  };

  // Protected by server-side layout - if we reach here, user is a teacher
  // Show loading state while classes data loads
  if (isAuthLoading || isTeacher === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      {/* Weekly Timetable */}
      <WeeklyTimetable classes={classes} />

      {/* Classes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Your Classes
              </h2>
              <p className="text-sm text-muted-foreground">
                {classes.length === 0 
                  ? "Create your first class to get started" 
                  : `Managing ${classes.length} ${classes.length === 1 ? 'class' : 'classes'}`
                }
              </p>
            </div>
          </div>
          
          {/* Join Requests Button */}
          <JoinRequestsButton
            onClick={handleJoinRequestsClick}
            isLoading={isRequestsLoading}
            isInCooldown={isInCooldown}
            cooldownSeconds={cooldownSeconds}
          />
        </div>
        
        {isClassesLoading ? (
          <div className="text-center p-12">
            <LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your classes...</p>
          </div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Class Card */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 group">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
                <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="mb-2 text-foreground">Create New Class</CardTitle>
                <CardDescription className="mb-4">
                  Add another class to your dashboard
                </CardDescription>
                <CreateClassDialog onSuccess={refreshClasses} />
              </CardContent>
            </Card>
            
            {/* Existing Classes */}
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                classInfo={cls}
                onClassDeleted={refreshClasses}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center p-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-6">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <CardTitle className="mb-3">No Classes Yet</CardTitle>
              <CardDescription className="mb-6">
                Create your first class to start managing students and assignments.
              </CardDescription>
              <CreateClassDialog onSuccess={refreshClasses} />
            </div>
          </Card>
        )}
      </div>

      {/* Join Request Panel */}
      <JoinRequestPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        requests={joinRequests}
        isLoading={isRequestsLoading}
        lastChecked={lastChecked}
        hasCachedData={hasCachedData}
        onApprove={handleApprove}
        onDeny={handleDeny}
        onRefresh={checkJoinRequests}
        isInCooldown={isInCooldown}
        getCooldownRemaining={getCooldownRemaining}
      />
    </div>
  );
}
