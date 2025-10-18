import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SaveLoadPanelProps {
  onSave: (planName: string) => void;
  onLoad: (planId: string) => void;
  onDelete: (planId: string) => void;
  savedPlans: Array<{
    id: string;
    planName: string;
    updatedAt: any;
    metadata?: { totalDesks: number; totalStudents: number; };
  }>;
  isSaving: boolean;
}

export const SaveLoadPanel = ({
  onSave,
  onLoad,
  onDelete,
  savedPlans,
  isSaving,
}: SaveLoadPanelProps) => {
  const [planName, setPlanName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  const handleSave = () => {
    if (planName.trim()) {
      onSave(planName.trim());
      setPlanName('');
      setIsSaveDialogOpen(false);
    }
  };

  const handleLoad = (planId: string) => {
    onLoad(planId);
    setIsLoadDialogOpen(false);
  };

  return (
    <div className="flex gap-2">
      {/* Save Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Seating Plan</DialogTitle>
            <DialogDescription>
              Give your seating plan a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Term 1 - Math, Group Work Layout..."
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!planName.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Button */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Plan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Seating Plan</DialogTitle>
            <DialogDescription>
              Select a previously saved seating plan to load.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {savedPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No saved seating plans yet.</p>
                <p className="text-sm mt-2">Create your first layout and save it!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedPlans.map((plan) => (
                  <Card key={plan.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{plan.planName}</h3>
                          <div className="flex gap-2 mt-1">
                            {plan.metadata && (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  {plan.metadata.totalDesks} desks
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {plan.metadata.totalStudents} students
                                </Badge>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {plan.updatedAt?.toDate?.().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLoad(plan.id)}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Load
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{plan.planName}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(plan.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
