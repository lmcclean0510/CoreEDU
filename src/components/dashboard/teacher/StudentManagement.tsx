
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { UserSearchDialog } from '@/components/shared/UserSearchDialog';
import { UserListItem } from '@/components/shared/UserListItem';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useUserSearch } from '@/hooks/shared/use-user-search';
import { useClassManagement } from '@/hooks/teacher/use-class-management';
import { useToast } from '@/hooks/shared/use-toast';
import { useAuth } from '@/providers/UserProvider';
import type { UserProfile } from '@/lib/types';

interface StudentManagementProps {
  classId: string;
  className: string;
  currentStudents: UserProfile[];
  onUpdate: () => void;
  renderMode?: 'button' | 'list';
}

export function StudentManagement({
  classId,
  className,
  currentStudents,
  onUpdate,
  renderMode = 'button',
}: StudentManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addStudent, removeStudent } = useClassManagement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<UserProfile | null>(null);
  const [studentsAddedCount, setStudentsAddedCount] = useState(0);

  // Use the user's schoolId from auth
  const userSearch = useUserSearch({
    schoolId: user?.schoolId || '',
    userRole: 'student',
  });

  // Filter out students already in the class
  const availableStudents = (userSearch.results || []).filter(
    student => !currentStudents.some(current => current.uid === student.uid)
  );

  const handleAddStudent = async (studentUid: string) => {
    try {
      await addStudent(classId, studentUid);
      setStudentsAddedCount(prev => prev + 1);
      userSearch.resetSearch();
      onUpdate();
    } catch (error) {
      console.error('Error adding student:', error);
      toast({ title: 'Error', description: 'Could not add the student.', variant: 'destructive' });
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      await removeStudent(classId, studentToRemove.uid);
      toast({ title: 'Success', description: `Removed ${studentToRemove.firstName || 'the student'} from the class.` });
      onUpdate();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({ title: 'Error', description: 'Could not remove the student.', variant: 'destructive' });
    } finally {
      setStudentToRemove(null);
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    userSearch.fetchUsers(); // Trigger lazy loading of school users
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    userSearch.resetSearch();
    if (studentsAddedCount > 0) {
      toast({
        title: 'Students Added',
        description: `Successfully added ${studentsAddedCount} student(s) to the class.`,
      });
      setStudentsAddedCount(0);
    }
  };

  if (renderMode === 'list') {
    return (
      <>
        {currentStudents.length > 0 ? (
          <ul className="space-y-2 pt-2">
            {currentStudents.map(student => (
              <li key={student.uid}>
                <UserListItem
                  user={student}
                  onAction={() => setStudentToRemove(student)}
                  actionLabel=""
                  actionIcon={<Trash2 className="h-4 w-4" />}
                  actionVariant="ghost"
                  className="bg-muted/50"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No students have been added to this class yet.
          </p>
        )}

        {/* Confirmation dialog for removing students */}
        <ConfirmationDialog
          isOpen={!!studentToRemove}
          onClose={() => setStudentToRemove(null)}
          onConfirm={handleRemoveStudent}
          title="Are you absolutely sure?"
          description={`This will remove ${studentToRemove?.firstName || 'the student'} from the class. This action cannot be undone.`}
          confirmLabel="Remove"
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={(open) => open ? handleDialogOpen() : handleCloseDialog()}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start" onClick={handleDialogOpen}>
            <UserPlus className="mr-2" />
            Add Student
          </Button>
        </DialogTrigger>
        
        <UserSearchDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          title={`Add Student to "${className}"`}
          searchLabel="Student Email"
          searchPlaceholder="student@example.com"
          availableUsers={availableStudents}
          isLoadingUsers={userSearch.isLoading}
          onSearchUser={userSearch.searchUser}
          searchResult={userSearch.searchResult}
          searchError={userSearch.searchError}
          isSearching={userSearch.isSearching}
          onAddUser={handleAddStudent}
          searchEmail={userSearch.searchEmail}
          onSearchEmailChange={userSearch.setSearchEmail}
        />
      </Dialog>
    </>
  );
}
