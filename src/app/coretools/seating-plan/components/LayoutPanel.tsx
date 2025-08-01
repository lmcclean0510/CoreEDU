import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, HelpCircle, SortAsc, AlignHorizontalJustifyCenter, LayoutTemplate, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableDeskItem from './SortableDeskItem';
import type { Desk, Group, FurnitureTemplate } from '../types';

interface LayoutPanelProps {
  groups: Group[];
  desks: Desk[];
  furnitureTemplates: FurnitureTemplate[];
  isGridVisible: boolean;
  isWhiteBackground: boolean;
  isBlackAndWhite: boolean;
  isPresetDialogOpen: boolean;
  dndSensors: any[];
  onAddFurniture: (template: FurnitureTemplate) => void;
  onLoadPreset: () => void;
  onRenameGroup: (groupId: number, name: string) => void;
  onAutoRenumber: () => void;
  onAutoAlign: () => void;
  onDeskOrderDragEnd: (event: any) => void;
  setIsGridVisible: (visible: boolean) => void;
  setIsWhiteBackground: (enabled: boolean) => void;
  setIsBlackAndWhite: (enabled: boolean) => void;
  setIsPresetDialogOpen: (open: boolean) => void;
}

const LayoutPanel = memo(({
  groups,
  desks,
  furnitureTemplates,
  isGridVisible,
  isWhiteBackground,
  isBlackAndWhite,
  isPresetDialogOpen,
  dndSensors,
  onAddFurniture,
  onLoadPreset,
  onRenameGroup,
  onAutoRenumber,
  onAutoAlign,
  onDeskOrderDragEnd,
  setIsGridVisible,
  setIsWhiteBackground,
  setIsBlackAndWhite,
  setIsPresetDialogOpen,
}: LayoutPanelProps) => {
  return (
    <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Classroom Builder
          </div>
           <Dialog>
            <DialogTrigger asChild>
               <Button variant="ghost" size="icon" className="h-7 w-7">
                  <HelpCircle className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How to use the Classroom Builder</DialogTitle>
                <DialogDescription>
                  Here are some tips for creating your layout.
                </DialogDescription>
              </DialogHeader>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-4">
                  <li><strong>Drag & Drop:</strong> Use the grip handle to move desks. This handle only appears in Layout mode.</li>
                  <li><strong>Grouping:</strong> Drag one desk on top of another to form a group. They will then move together.</li>
                  <li><strong>Snap to Grid:</strong> Use the 'Auto Align' button to snap all desks to the nearest grid line for a tidy layout.</li>
                  <li><strong>Re-numbering:</strong> Drag desks in the 'Desk Order' list to change their number, or use 'Auto-Renumber' to sort them top-to-bottom.</li>
              </ul>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Pick a Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Classroom Presets</DialogTitle>
              <DialogDescription>
                Select a preset layout to get started quickly. This will replace your current layout.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="secondary" onClick={onLoadPreset} className="justify-start h-auto py-3">
                <div>
                  <p className="font-semibold">Computer Room</p>
                  <p className="text-xs text-muted-foreground font-normal">4 rows with a central aisle (32 desks)</p>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add Furniture</Label>
          <div className="grid grid-cols-1 gap-2">
            {furnitureTemplates.map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => onAddFurniture(template)}
                className="flex items-center justify-between h-auto p-3 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{template.icon}</span>
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
                <Plus className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Layout Tools</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="show-grid-toggle" className="text-sm font-medium cursor-pointer">Show Grid</Label>
                <Switch id="show-grid-toggle" checked={isGridVisible} onCheckedChange={setIsGridVisible} />
              </div>
               <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="white-bg-toggle" className="text-sm font-medium cursor-pointer">White Background</Label>
                <Switch id="white-bg-toggle" checked={isWhiteBackground} onCheckedChange={setIsWhiteBackground} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="bw-toggle" className="text-sm font-medium cursor-pointer">Black &amp; White Mode</Label>
                <Switch id="bw-toggle" checked={isBlackAndWhite} onCheckedChange={setIsBlackAndWhite} />
              </div>
              <Button size="sm" variant="outline" onClick={onAutoAlign} className="w-full"><AlignHorizontalJustifyCenter className="w-4 h-4 mr-2" /> Auto Align to Grid</Button>
            </div>
        </div>
        
        {groups.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Groups</Label>
              <Badge variant="secondary" className="text-xs">
                {groups.length}
              </Badge>
            </div>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {groups.map(group => (
                <div key={group.id} className="flex items-center p-1.5 bg-muted/50 rounded-lg" style={{ borderLeft: `4px solid ${group.color}`}}>
                    <Input 
                        type="text"
                        value={group.name}
                        onChange={(e) => onRenameGroup(group.id, e.target.value)}
                        className="text-xs font-medium truncate h-7 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
              ))}
            </div>
          </div>
        )}

         {desks.length > 0 && (
            <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Desk Order</Label>
                    <Button size="sm" variant="outline" onClick={onAutoRenumber}><SortAsc className="w-4 h-4 mr-2" /> Auto-Renumber</Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={onDeskOrderDragEnd}>
                    <SortableContext items={desks.map(d => d.id)} strategy={verticalListSortingStrategy}>
                      {desks.map((desk, index) => (
                        <div key={desk.id} className="flex items-center gap-2">
                          <span className="font-mono text-xs w-6 text-center">{index + 1}.</span>
                          <SortableDeskItem desk={desk} />
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
});

LayoutPanel.displayName = 'LayoutPanel';

export default LayoutPanel;