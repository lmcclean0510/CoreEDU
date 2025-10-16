import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Upload, X, UserCog } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Student } from '../types';

interface StudentsPanelProps {
  students: Student[];
  studentInput: string;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onStudentInputChange: (value: string) => void;
  onParseStudents: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveStudent: (studentId: number) => void;
  onUpdateStudentGender: (studentId: number, gender: 'male' | 'female') => void;
  onUpdateStudentSEND: (studentId: number, isSEND: boolean) => void;
}

const StudentsPanel = memo(({
  students,
  studentInput,
  isLoading,
  fileInputRef,
  onStudentInputChange,
  onParseStudents,
  onFileUpload,
  onRemoveStudent,
  onUpdateStudentGender,
  onUpdateStudentSEND,
}: StudentsPanelProps) => {
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  
  return (
    <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Student Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="student-input" className="text-sm font-medium">
            Enter student names (one per line)
          </Label>
          <Textarea
            id="student-input"
            placeholder="John Smith\nJane Doe\nMike Johnson\n..."
            value={studentInput}
            onChange={(e) => onStudentInputChange(e.target.value)}
            className="h-32 text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onParseStudents}
              size="sm"
              disabled={isLoading || !studentInput.trim()}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="whitespace-nowrap"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileUpload}
              className="hidden"
              accept=".txt,.md"
            />
          </div>
        </div>
        
        {students.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Loaded Students</Label>
              <Badge variant="secondary" className="text-xs">
                {students.length}
              </Badge>
            </div>
             <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <UserCog className="mr-2 h-4 w-4" />
                        Manage Student Data
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Student Data</DialogTitle>
                        <DialogDescription>
                            Set gender and other attributes for your students here.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96 pr-4">
                        <div className="space-y-3 py-4">
                            {students.map(student => (
                                <div key={student.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{student.name}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onRemoveStudent(student.id)}
                                            className="h-6 w-6 hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={student.gender === 'male' ? 'secondary' : 'ghost'}
                                                onClick={() => onUpdateStudentGender(student.id, 'male')}
                                            >
                                                M
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={student.gender === 'female' ? 'secondary' : 'ghost'}
                                                onClick={() => onUpdateStudentGender(student.id, 'female')}
                                            >
                                                F
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`send-${student.id}`} className="text-xs font-medium cursor-pointer">SEND</Label>
                                            <Switch
                                                id={`send-${student.id}`}
                                                checked={student.isSEND}
                                                onCheckedChange={(checked) => onUpdateStudentSEND(student.id, checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                     <DialogFooter>
                        <DialogClose asChild>
                            <Button>Done</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StudentsPanel.displayName = 'StudentsPanel';

export default StudentsPanel;
