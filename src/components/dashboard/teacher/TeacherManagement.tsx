
"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserListItem } from '@/components/shared/UserListItem';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useAuth } from '@/providers/UserProvider';
import { useUserSearch } from '@/hooks/shared/use-user-search';
import { useClassManagement } from '@/hooks/teacher/use-class-management';
import { useToast } from '@/hooks/shared/use-toast';
import type { UserProfile } from '@/lib/types';
import { UserSearchDialog } from '@/components/shared/UserSearchDialog';

interface TeacherManagementProps {
  classId: string;
  currentTeachers: UserProfile[];
  onUpdate: () => void;
}

export function TeacherManagement({
  classId,
  currentTeachers,
  onUpdate,
}: TeacherManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addTeacher, removeTeacher } = useClassManagement();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('current');

  // Use the user's schoolId from auth
  const userSearch = useUserSearch({
    schoolId: user?.schoolId || '',
    userRole: 'teacher',
  });

  const availableTeachers = (userSearch.results || []).filter(
    teacher => !currentTeachers.some(current => current.uid === teacher.uid)
  );

  const handleAddTeacher = async (teacherUid: string) => {
    try {
      await addTeacher(classId, teacherUid);
      toast({ title: 'Success!', description: 'Teacher has been added to the class.' });
      userSearch.resetSearch();
      onUpdate(); // Refreshes the list of current teachers
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast({ title: 'Error', description: 'Could not add the teacher.', variant: 'destructive' });
    }
  };

  const handleRemoveTeacher = async () => {
    if (!teacherToRemove || !user) return;

    if (currentTeachers.length <= 1) {
      toast({ title: 'Action Not Allowed', description: 'A class must have at least one teacher.', variant: 'destructive' });
      setTeacherToRemove(null);
      return;
    }
    
    if (teacherToRemove.uid === user.uid) {
      toast({ title: 'Action Not Allowed', description: 'You cannot remove yourself from a class.', variant: 'destructive' });
      setTeacherToRemove(null);
      return;
    }

    try {
      await removeTeacher(classId, teacherToRemove.uid);
      toast({ title: 'Success', description: `Removed ${teacherToRemove.firstName || 'the teacher'} from the class.` });
      onUpdate();
    } catch (error) {
      console.error('Error removing teacher:', error);
      toast({ title: 'Error', description: 'Could not remove the teacher.', variant: 'destructive' });
    } finally {
      setTeacherToRemove(null);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'add' && (userSearch.results || []).length === 0) {
      userSearch.fetchUsers(); // Lazy load school teachers only when needed
    }
  };
  
  const handleCloseDialog = () => {
      setIsDialogOpen(false);
      setActiveTab('current');
      userSearch.resetSearch();
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleCloseDialog()}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Briefcase className="mr-2" />
            Manage Teachers
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Manage Teachers</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="current" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Teachers</TabsTrigger>
                <TabsTrigger value="add">Add Teacher</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="h-96 py-4">
                 <ScrollArea className="h-full pr-4">
                  {currentTeachers.length > 0 ? (
                    <ul className="space-y-2">
                      {currentTeachers.map(teacher => (
                        <li key={teacher.uid}>
                          <UserListItem
                            user={teacher}
                            onAction={() => setTeacherToRemove(teacher)}
                            actionLabel=""
                            actionIcon={<Trash2 className="h-4 w-4" />}
                            actionVariant="ghost"
                            disabled={teacher.uid === user?.uid || currentTeachers.length <= 1}
                            className="bg-muted/50"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No teachers found.</p>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="add" className="h-96 py-4">
                 <UserSearchDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    title=""
                    searchLabel="Teacher Email"
                    searchPlaceholder="teacher@example.com"
                    availableUsers={availableTeachers}
                    isLoadingUsers={userSearch.isLoading}
                    onSearchUser={userSearch.searchUser}
                    searchResult={userSearch.searchResult}
                    searchError={userSearch.searchError}
                    isSearching={userSearch.isSearching}
                    onAddUser={handleAddTeacher}
                    searchEmail={userSearch.searchEmail}
                    onSearchEmailChange={userSearch.setSearchEmail}
                    renderAsTabs={true}
                  />
              </TabsContent>
            </Tabs>
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog
        isOpen={!!teacherToRemove}
        onClose={() => setTeacherToRemove(null)}
        onConfirm={handleRemoveTeacher}
        title="Are you absolutely sure?"
        description={`This will remove ${teacherToRemove?.firstName || 'this teacher'} from the class.`}
        confirmLabel="Remove Teacher"
      />
    </>
  );
}
