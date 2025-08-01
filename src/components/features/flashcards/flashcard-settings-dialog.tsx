// src/components/flashcard-system/flashcard-settings-dialog.tsx

"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import type { FlashcardSettings } from '@/lib/types';

interface FlashcardSettingsDialogProps {
  settings: FlashcardSettings;
  onSettingsChange: (newSettings: FlashcardSettings) => void;
}

export function FlashcardSettingsDialog({
  settings,
  onSettingsChange
}: FlashcardSettingsDialogProps) {
  const handleSettingChange = (key: keyof FlashcardSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Adjust your study experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
            <Label htmlFor="simple-def-toggle" className="font-medium pr-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4"/>
              Simple Definition
            </Label>
            <Switch 
              id="simple-def-toggle" 
              checked={settings.showSimpleDefinition} 
              onCheckedChange={(checked) => handleSettingChange('showSimpleDefinition', checked)} 
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
