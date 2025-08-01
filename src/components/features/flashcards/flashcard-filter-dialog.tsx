// src/components/flashcard-system/flashcard-filter-dialog.tsx

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { confidenceMapping } from '@/lib/flashcard-system/utils';
import type { GroupedTopics, ConfidenceLevel } from '@/lib/types';

interface FlashcardFilterDialogProps {
  totalCards: number;
  filteredCards: number;
  groupedTopics: GroupedTopics;
  enabledSubTopics: Set<string>;
  enabledConfidences: Set<ConfidenceLevel>;
  onSubTopicToggle: (subTopic: string, isEnabled: boolean) => void;
  onTopicToggle: (topic: string, isEnabled: boolean) => void;
  onSelectAllTopics: () => void;
  onDeselectAllTopics: () => void;
  onConfidenceFilterChange: (confidence: ConfidenceLevel, isEnabled: boolean) => void;
  onSelectAllConfidences: () => void;
  onDeselectAllConfidences: () => void;
}

export function FlashcardFilterDialog({
  totalCards,
  filteredCards,
  groupedTopics,
  enabledSubTopics,
  enabledConfidences,
  onSubTopicToggle,
  onTopicToggle,
  onSelectAllTopics,
  onDeselectAllTopics,
  onConfidenceFilterChange,
  onSelectAllConfidences,
  onDeselectAllConfidences
}: FlashcardFilterDialogProps) {
  const [activeFilterTab, setActiveFilterTab] = useState('topic');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Filter className="mr-2 h-4 w-4" />
          Filter ({filteredCards} / {totalCards})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Cards</DialogTitle>
          <DialogDescription>
            Select topics and confidence levels to study.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="topic" value={activeFilterTab} onValueChange={setActiveFilterTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topic">By Topic</TabsTrigger>
            <TabsTrigger value="confidence">By Confidence</TabsTrigger>
          </TabsList>
          
          <div className="h-80 py-4">
            {/* Topic Filter Tab */}
            <TabsContent 
              value="topic" 
              forceMount={true} 
              className={cn("h-full", activeFilterTab !== 'topic' && 'hidden')}
            >
              <ScrollArea className="h-full pr-6">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedTopics).map(([topic, { subTopics, subTopicDetails }]) => {
                    const isAllSelected = subTopics.every(subTopic => enabledSubTopics.has(subTopic));
                    const isIndeterminate = !isAllSelected && subTopics.some(subTopic => enabledSubTopics.has(subTopic));

                    return (
                      <AccordionItem value={topic} key={topic}>
                        <div className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                              onCheckedChange={(checked) => onTopicToggle(topic, Boolean(checked))}
                              id={`topic-${topic}`}
                            />
                            <Label className="font-medium cursor-pointer" htmlFor={`topic-${topic}`}>
                              {topic}
                            </Label>
                          </div>
                          <AccordionTrigger className="py-0 px-2 flex-1 justify-end"></AccordionTrigger>
                        </div>
                        <AccordionContent className="pl-6 space-y-2">
                          {subTopics.map((subTopic) => (
                            <div key={subTopic} className="flex items-center gap-3">
                              <Checkbox
                                id={subTopic}
                                checked={enabledSubTopics.has(subTopic)}
                                onCheckedChange={(checked) => onSubTopicToggle(subTopic, Boolean(checked))}
                              />
                              <label 
                                htmlFor={subTopic} 
                                className="text-sm font-normal text-muted-foreground flex-1 cursor-pointer"
                              >
                                {subTopicDetails[subTopic]} {subTopic}
                              </label>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>
            </TabsContent>

            {/* Confidence Filter Tab */}
            <TabsContent 
              value="confidence" 
              forceMount={true} 
              className={cn("h-full", activeFilterTab !== 'confidence' && 'hidden')}
            >
              <div className="space-y-3">
                {confidenceMapping.map(({ name, value, icon }) => (
                  <div key={name} className="flex items-center gap-3">
                    <Checkbox
                      id={`confidence-${value}`}
                      checked={enabledConfidences.has(value)}
                      onCheckedChange={(checked) => onConfidenceFilterChange(value, Boolean(checked))}
                    />
                    <Label htmlFor={`confidence-${value}`} className="flex-1 flex items-center gap-2 cursor-pointer">
                      {icon}
                      {name}
                    </Label>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 sm:justify-between">
          {activeFilterTab === 'topic' && (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onSelectAllTopics}>
                Select All
              </Button>
              <Button type="button" variant="secondary" onClick={onDeselectAllTopics}>
                Deselect All
              </Button>
            </div>
          )}
          {activeFilterTab === 'confidence' && (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onSelectAllConfidences}>
                Select All
              </Button>
              <Button type="button" variant="secondary" onClick={onDeselectAllConfidences}>
                Deselect All
              </Button>
            </div>
          )}
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
