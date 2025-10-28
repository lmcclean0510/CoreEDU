"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/providers/UserProvider';
import { useClassData } from '@/hooks/teacher/use-class-data';
import { useHomeworkManagement } from '@/hooks/teacher/use-homework-management';
import { useHomeworkCreation } from '@/hooks/homework/use-homework-creation';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HomeworkCreationLayout } from '@/components/features/homework/creation/HomeworkCreationLayout';

export default function CreateHomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const {
    isTeacher,
    classInfo,
    students,
    flashcards,
    puzzles,
    isLoading,
    fetchAssignmentData,
  } = useClassData(classId);

  const { createHomework } = useHomeworkManagement();
  const [isCreating, setIsCreating] = useState(false);

  // Initialize homework creation state
  const homeworkCreation = useHomeworkCreation();

  // Load assignment data when component mounts
  useEffect(() => {
    if (classInfo) {
      fetchAssignmentData();
    }
  }, [classInfo, fetchAssignmentData]);

  // Compute filtered data based on current state
  const filteredFlashcards = useMemo(() => {
    return homeworkCreation.filterFlashcards(flashcards);
  }, [homeworkCreation.filterFlashcards, flashcards]);

  const filteredPuzzles = useMemo(() => {
    return homeworkCreation.filterPuzzles(puzzles);
  }, [homeworkCreation.filterPuzzles, puzzles]);

  const availableTopics = useMemo(() => {
    return homeworkCreation.getUniqueTopics(flashcards);
  }, [homeworkCreation.getUniqueTopics, flashcards]);

  const availableDifficulties = useMemo(() => {
    return homeworkCreation.getUniqueDifficulties(puzzles);
  }, [homeworkCreation.getUniqueDifficulties, puzzles]);

  // Handle homework creation
  const handleCreateHomework = async () => {
    if (!user || !classInfo || !homeworkCreation.canSubmit) return;

    setIsCreating(true);
    try {
      await createHomework(
        classInfo.id,
        user.uid,
        homeworkCreation.title,
        homeworkCreation.selectedTasks,
        students,
        homeworkCreation.instructions,
        homeworkCreation.dueDate
      );
      
      // Navigate back to class page on success
      router.push(`/dashboard/teacher/class/${classInfo.id}`);
    } catch (error) {
      console.error('Error creating homework:', error);
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!classInfo) {
      router.push('/dashboard/teacher');
      return;
    }
    router.push(`/dashboard/teacher/class/${classInfo.id}`);
  };

  // Loading state
  if (isLoading || isTeacher === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Not found or access denied
  if (!classInfo || isTeacher === false) {
    return notFound();
  }

  // Check if user has access to this class
  const teacherHasAccess = classInfo.teacherIds.includes(user?.uid || '');
  if (!teacherHasAccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <CardHeader>
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are not a teacher in this class.</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/teacher">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <HomeworkCreationLayout
      // Data
      classInfo={classInfo}
      students={students}
      flashcards={flashcards}
      puzzles={puzzles}
      
      // State from hook
      currentStep={homeworkCreation.currentStep}
      title={homeworkCreation.title}
      instructions={homeworkCreation.instructions}
      dueDate={homeworkCreation.dueDate}
      selectedTasks={homeworkCreation.selectedTasks}
      searchQuery={homeworkCreation.searchQuery}
      activeTab={homeworkCreation.activeTab}
      selectedTopics={homeworkCreation.selectedTopics}
      selectedDifficulties={homeworkCreation.selectedDifficulties}
      canSubmit={homeworkCreation.canSubmit && homeworkCreation.isDueDateValid}
      isDueDateValid={homeworkCreation.isDueDateValid}
      isCreating={isCreating}
      
      // Computed data
      filteredFlashcards={filteredFlashcards}
      filteredPuzzles={filteredPuzzles}
      availableTopics={availableTopics}
      availableDifficulties={availableDifficulties}
      canProceedFromOverview={homeworkCreation.canProceedFromOverview}
      canProceedFromAddTasks={homeworkCreation.canProceedFromAddTasks}
      
      // Actions
      onStepChange={homeworkCreation.setCurrentStep}
      onNext={homeworkCreation.goToNextStep}
      onPrevious={homeworkCreation.goToPreviousStep}
      onTitleChange={homeworkCreation.updateTitle}
      onInstructionsChange={homeworkCreation.updateInstructions}
      onDueDateChange={homeworkCreation.updateDueDate}
      onSearchChange={homeworkCreation.updateSearchQuery}
      onTabChange={homeworkCreation.setActiveTab}
      onTopicToggle={homeworkCreation.toggleTopic}
      onDifficultyToggle={homeworkCreation.toggleDifficulty}
      onTaskToggle={homeworkCreation.addTask}
      onRemoveTask={homeworkCreation.removeTask}
      onReorderTasks={homeworkCreation.reorderTasks}
      onClearAllTasks={homeworkCreation.clearAllTasks}
      onClearFilters={homeworkCreation.clearFilters}
      onCreateHomework={handleCreateHomework}
      onCancel={handleCancel}
      
      // Helper functions
      isTaskSelected={homeworkCreation.isTaskSelected}
    />
  );
}
