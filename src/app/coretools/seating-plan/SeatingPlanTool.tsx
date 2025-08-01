
"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Shuffle, RotateCcw, CheckCircle, Download, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Components
import DraggableItem from './components/DraggableItem';
import DraggableTeacherDesk from './components/DraggableTeacherDesk';
import GroupControl from './components/GroupControl';
import StatsCard from './components/StatsCard';
import LayoutPanel from './components/LayoutPanel';
import StudentsPanel from './components/StudentsPanel';
import RulesPanel from './components/RulesPanel';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


// Hooks
import { useSeatingPlan } from './hooks/useSeatingPlan';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useStudentAssignment } from './hooks/useStudentAssignment';
import { useExport } from './hooks/useExport';

// New hook for handling resizing
const useResponsiveScaling = (containerRef: React.RefObject<HTMLDivElement>) => {
    const [scale, setScale] = useState(1);

    const updateScale = useCallback(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const contentWidth = 1403; // The fixed width of your content
            if (containerWidth < contentWidth) {
                setScale(containerWidth / contentWidth);
            } else {
                setScale(1);
            }
        }
    }, [containerRef]);

    useEffect(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [updateScale]);

    return scale;
};


const SeatingPlanTool = () => {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const responsiveContainerRef = useRef<HTMLDivElement>(null);
  const scale = useResponsiveScaling(responsiveContainerRef);


  const {
    // State
    desks,
    groups,
    teacherDesk,
    students,
    separationRules,
    doNotUseDeskIds,
    fillFromFront,
    alternateGender,
    newRuleStudents,
    studentInput,
    activeTab,
    isGridVisible,
    isBlackAndWhite,
    isWhiteBackground,
    hoveredGroupId,
    isPresetDialogOpen,
    areIndicatorsVisible,

    // Setters
    setDesks,
    setGroups,
    setTeacherDesk,
    setFillFromFront,
    setAlternateGender,
    setNewRuleStudents,
    setStudentInput,
    setActiveTab,
    setIsGridVisible,
    setIsBlackAndWhite,
    setIsWhiteBackground,
    setHoveredGroupId,
    setIsPresetDialogOpen,
    setAreIndicatorsVisible,

    // Computed values
    desksWithGroups,
    stats,
    unassignedStudentCount,
    unassignedStudents,
    groupLayouts,
    getDeskGroup,

    // Actions
    loadComputerRoomPreset,
    handleRenameGroup,
    handleSetGroupColor,
    handleDeleteGroup,
    addFurniture,
    removeDesk,
    parseStudents,
    removeStudent,
    updateStudentGender,
    updateStudentSEND,
    handleFileUpload,
    addSeparationRule,
    removeSeparationRule,
    handleToggleDoNotUseDesk,
    handleManualAssign,
    autoRenumberDesks,
    furnitureTemplates,
  } = useSeatingPlan();

  const { handleDragEnd, handleDeskOrderDragEnd, handleAutoAlign } = useDragAndDrop(scale);
  const { isLoading: isAssigning, autoAssignStudents, clearAssignments } = useStudentAssignment();
  const { isExporting, handleExport } = useExport(containerRef);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoized sensors for DnD
  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAutoAssign = useCallback(() => {
    autoAssignStudents(
      students,
      desks,
      doNotUseDeskIds,
      separationRules,
      fillFromFront,
      alternateGender,
      getDeskGroup,
      setDesks
    );
  }, [students, desks, doNotUseDeskIds, separationRules, fillFromFront, alternateGender, getDeskGroup, setDesks, autoAssignStudents]);

  const handleClearAssignments = useCallback(() => {
    clearAssignments(setDesks);
  }, [clearAssignments, setDesks]);

  // Memoized drag handlers
  const onDragEnd = useCallback((event: any) => {
    handleDragEnd(
      event,
      desks,
      groups,
      containerRef,
      getDeskGroup,
      setDesks,
      setGroups,
      setTeacherDesk
    );
  }, [desks, groups, getDeskGroup, setDesks, setGroups, setTeacherDesk, handleDragEnd]);

  const onDeskOrderDragEnd = useCallback((event: any) => {
    handleDeskOrderDragEnd(event, setDesks);
  }, [handleDeskOrderDragEnd, setDesks]);

  const onAutoAlign = useCallback(() => {
    handleAutoAlign(containerRef, setDesks, setTeacherDesk);
  }, [handleAutoAlign, setDesks, setTeacherDesk]);

  const onExport = useCallback(() => {
    handleExport(isGridVisible, isWhiteBackground, setIsGridVisible);
  }, [handleExport, isGridVisible, isWhiteBackground, setIsGridVisible]);

  // Memoized mouse handlers
  const handleMouseOver = useCallback((e: React.MouseEvent) => {
      const deskEl = (e.target as HTMLElement).closest('[data-desk-id]');
      if (deskEl) {
          const deskId = Number(deskEl.getAttribute('data-desk-id'));
          const group = getDeskGroup(deskId);
          if (group) setHoveredGroupId(group.id);
      }
  }, [getDeskGroup, setHoveredGroupId]);

  const handleMouseLeave = useCallback(() => {
    setHoveredGroupId(null);
  }, [setHoveredGroupId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <style jsx global>{`
          .export-bw .desk-bw, .export-bw .teacher-desk-bw {
            background-color: white !important;
            border-color: black !important;
            color: black !important;
          }
          .export-bw .teacher-desk-bw {
            color: white !important;
            background-color: black !important;
          }
      `}</style>
      <div className="w-full py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 border border-primary/20">
            <Grid3X3 className="h-4 w-4" />
            Teacher Tools
          </div>
          
          <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-2">
            <span className="text-foreground">Core</span>
            <span className="text-primary">TOOLS</span>
            <span className="text-muted-foreground text-2xl font-normal ml-2">Seating Plan Generator</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create optimized classroom seating arrangements with intelligent conflict resolution and flexible layouts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs defaultValue="layout" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
              </TabsList>
              
              <TabsContent value="layout" className="space-y-4">
                <LayoutPanel
                  groups={groups}
                  desks={desks}
                  furnitureTemplates={furnitureTemplates}
                  isGridVisible={isGridVisible}
                  isWhiteBackground={isWhiteBackground}
                  isBlackAndWhite={isBlackAndWhite}
                  isPresetDialogOpen={isPresetDialogOpen}
                  dndSensors={dndSensors}
                  onAddFurniture={addFurniture}
                  onLoadPreset={loadComputerRoomPreset}
                  onRenameGroup={handleRenameGroup}
                  onAutoRenumber={autoRenumberDesks}
                  onAutoAlign={onAutoAlign}
                  onDeskOrderDragEnd={onDeskOrderDragEnd}
                  setIsGridVisible={setIsGridVisible}
                  setIsWhiteBackground={setIsWhiteBackground}
                  setIsBlackAndWhite={setIsBlackAndWhite}
                  setIsPresetDialogOpen={setIsPresetDialogOpen}
                />
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <StudentsPanel
                  students={students}
                  studentInput={studentInput}
                  isLoading={isAssigning}
                  fileInputRef={fileInputRef}
                  onStudentInputChange={setStudentInput}
                  onParseStudents={parseStudents}
                  onFileUpload={handleFileUpload}
                  onRemoveStudent={removeStudent}
                  onUpdateStudentGender={updateStudentGender}
                  onUpdateStudentSEND={updateStudentSEND}
                />
              </TabsContent>
              
              <TabsContent value="rules" className="space-y-4">
                <RulesPanel
                  desks={desks}
                  separationRules={separationRules}
                  doNotUseDeskIds={doNotUseDeskIds}
                  fillFromFront={fillFromFront}
                  alternateGender={alternateGender}
                  newRuleStudents={newRuleStudents}
                  onFillFromFrontChange={setFillFromFront}
                  onAlternateGenderChange={setAlternateGender}
                  onNewRuleStudentsChange={setNewRuleStudents}
                  onAddSeparationRule={addSeparationRule}
                  onRemoveSeparationRule={removeSeparationRule}
                  onToggleDoNotUseDesk={handleToggleDoNotUseDesk}
                />
              </TabsContent>
            </Tabs>

            {/* Stats Card */}
            <StatsCard stats={stats} unassignedStudentCount={unassignedStudentCount} />
          </div>

          {/* Main Layout Area */}
          <div className="lg:col-span-3">
            {isClient && (
              <DndContext onDragEnd={onDragEnd} sensors={dndSensors}>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CardTitle className="text-xl">Classroom Layout</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          onClick={handleAutoAssign} 
                          size="sm"
                          disabled={isAssigning || students.length === 0 || desks.length === 0}
                        >
                          {isAssigning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          ) : (
                            <Shuffle className="w-4 h-4 mr-2" />
                          )}
                          Auto Assign
                        </Button>
                        <Button 
                          onClick={handleClearAssignments} 
                          variant="outline" 
                          size="sm"
                          disabled={isAssigning}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Clear All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={isExporting}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isExporting ? 'Exporting...' : 'Export as Image'}
                        </Button>
                        <div className="flex items-center space-x-2 border-l pl-2 ml-2">
                          <Switch
                            id="show-indicators-toggle"
                            checked={areIndicatorsVisible}
                            onCheckedChange={setAreIndicatorsVisible}
                          />
                          <Label htmlFor="show-indicators-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                            <EyeOff className="w-4 h-4" />
                            Show Indicators
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>{stats.assignedDesks} assigned</span>
                        </div>
                        <span>•</span>
                        <span>{stats.totalDesks} total desks</span>
                      </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div ref={responsiveContainerRef} className="w-full">
                        <div
                          ref={containerRef}
                          className={cn(
                            "relative border-2 border-dashed border-muted-foreground/30 overflow-hidden rounded-lg mx-auto",
                            isBlackAndWhite && 'export-bw',
                            isWhiteBackground ? 'bg-white' : 'bg-gradient-to-br from-background via-muted/10 to-muted/20'
                          )}
                           style={{
                                width: '1403px',
                                height: '1003px',
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                           }}
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* Grid pattern */}
                          {isGridVisible && (
                            <div
                              className="export-grid-bg absolute inset-0 opacity-60"
                              style={{
                                backgroundImage: `
                                  linear-gradient(to right, hsl(var(--primary) / 0.5) 1px, transparent 1px),
                                  linear-gradient(to bottom, hsl(var(--primary) / 0.5) 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px'
                              }}
                            />
                          )}
                          
                          {/* Teacher's desk */}
                          <DraggableTeacherDesk {...teacherDesk} isLayoutMode={activeTab === 'layout'} />
                          
                          {/* Student desks */}
                          <div onMouseOver={handleMouseOver}>
                              {desksWithGroups.map((desk, index) => (
                                 <div key={desk.id} data-desk-id={desk.id}>
                                    <DraggableItem
                                       desk={desk} 
                                       deskIndex={index}
                                       group={desk.group}
                                       unassignedStudents={unassignedStudents}
                                       onRemove={() => removeDesk(desk.id)}
                                       onToggleExclude={() => handleToggleDoNotUseDesk(desk.id)}
                                       onManualAssign={handleManualAssign}
                                       isLayoutMode={activeTab === 'layout'}
                                       isRulesMode={activeTab === 'rules'}
                                       isExcluded={doNotUseDeskIds.has(desk.id)}
                                       areIndicatorsVisible={areIndicatorsVisible}
                                     />
                                 </div>
                              ))}
                          </div>

                          {/* Group Controls */}
                          {groupLayouts.map((group) => (
                            <GroupControl
                              key={`control-${group!.id}`}
                              group={group!}
                              isVisible={hoveredGroupId === group!.id}
                              onRename={handleRenameGroup}
                              onSetColor={handleSetGroupColor}
                              onDelete={handleDeleteGroup}
                            />
                          ))}
                          
                          {/* Empty state */}
                          {desks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                              <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                                  <Grid3X3 className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-lg font-medium">Empty Classroom</p>
                                <p className="text-sm max-w-xs">
                                  Add furniture from the Layout tab or pick a preset to get started building your classroom.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingPlanTool;
