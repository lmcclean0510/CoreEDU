
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useAuth } from '@/providers/UserProvider';
import { useClassManagement } from '@/hooks/teacher/use-class-management';

interface JoinClassDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  triggerButton: React.ReactNode;
}

export function JoinClassDialog({ isOpen, onOpenChange, triggerButton }: JoinClassDialogProps) {
  const { user } = useAuth();
  const { requestToJoinClass } = useClassManagement();
  const [classCode, setClassCode] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !classCode.trim()) return;

    setIsRequesting(true);
    try {
      await requestToJoinClass(classCode.toUpperCase(), user.uid);
      // Success toast is handled in the hook, so we just close the dialog
      onOpenChange(false);
      setClassCode('');
    } catch (error) {
      // Error toast is handled in the hook
      console.error("Error requesting to join class:", error);
    } finally {
      setIsRequesting(false);
    }
  };
  
  const handleClose = (open: boolean) => {
      if(!open) {
          setClassCode('');
      }
      onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Join a Class
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Label htmlFor="class-code">Enter the Class Code</Label>
            <Input
              id="class-code"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="e.g., ABC-1234"
              className="font-mono text-lg tracking-widest text-center"
              maxLength={12}
            />
            <p className="text-xs text-muted-foreground text-center">
                Your teacher will need to approve your request before you can access the class.
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isRequesting || !classCode.trim()}>
            {isRequesting && <LoaderCircle className="animate-spin mr-2" />}
            Send Join Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
