"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Shuffle, RotateCcw, CheckCircle, Download, EyeOff, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
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

const CANVAS_WIDTH = 1403;
const CANVAS_HEIGHT = 1003;

const SeatingPlanTool = () => {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

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

  const { handleDragEnd, handleDeskOrderDragEnd, handleAutoAlign } = useDragAndDrop(zoom);
  const { isLoading: isAssigning, autoAssignStudents, clearAssignments } = useStudentAssignment();
  const { isExporting, handleExport } = useExport(containerRef);

  // Auto-fit zoom on mount and when controls collapse
  useEffect(() => {
    if (canvasContainerRef.current) {
      const containerWidth = canvasContainerRef.current.offsetWidth;
      const containerHeight = canvasContainerRef.current.offsetHeight;
      
      const scaleX = (containerWidth - 32) / CANVAS_WIDTH;
      const scaleY = (containerHeight - 32) / CANVAS_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      setZoom(fitScale);
    }
  }, [isControlsCollapsed]);

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

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.3));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (canvasContainerRef.current) {
      const containerWidth = canvasContainerRef.current.offsetWidth;
      const containerHeight = canvasContainerRef.current.offsetHeight;
      
      const scaleX = (containerWidth - 32) / CANVAS_WIDTH;
      const scaleY = (containerHeight - 32) / CANVAS_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      setZoom(fitScale);
    }
  }, []);

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
    <div className="h-[calc(100vh-57px)] flex flex-col">
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

      {isClient && (
        <DndContext onDragEnd={onDragEnd} sensors={dndSensors}>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Controls Bar */}
            <div className="border-b bg-card px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-medium">{stats.assignedDesks} assigned</span>
                    <span>•</span>
                    <span>{stats.totalDesks} total desks</span>
                  </div>
                  
                  {unassignedStudentCount > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {unassignedStudentCount} unassigned students
                      </span>
                    </>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 border-r pr-2 mr-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.3}
                      title="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-medium px-2 min-w-[3rem] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoom >= 2}
                      title="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFitToScreen}
                      title="Fit to screen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Action Buttons */}
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
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>

                  <div className="flex items-center space-x-2 border-l pl-2">
                    <Switch
                      id="show-indicators-toggle"
                      checked={areIndicatorsVisible}
                      onCheckedChange={setAreIndicatorsVisible}
                    />
                    <Label htmlFor="show-indicators-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4" />
                      Indicators
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Controls Panel */}
            {!isControlsCollapsed && (
              <div className="border-b bg-card flex-shrink-0">
                <div className="px-4 pt-3">
                  <Tabs defaultValue="layout" className="w-full" onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-3">
                      <TabsList>
                        <TabsTrigger value="layout">Layout</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                      </TabsList>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsControlsCollapsed(true)}
                      >
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Controls
                      </Button>
                    </div>
                    
                    <div className="pb-4 max-h-[300px] overflow-y-auto">
                      <TabsContent value="layout" className="mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
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
                          </div>
                          <div>
                            <StatsCard stats={stats} unassignedStudentCount={unassignedStudentCount} />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="students" className="mt-0">
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
                      
                      <TabsContent value="rules" className="mt-0">
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
                    </div>
                  </Tabs>
                </div>
              </div>
            )}

            {/* Show Controls Button (when collapsed) */}
            {isControlsCollapsed && (
              <div className="border-b bg-card px-4 py-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsControlsCollapsed(false)}
                  className="w-full"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Controls
                </Button>
              </div>
            )}

            {/* Canvas */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 overflow-auto p-4 bg-muted/30"
            >
              <div className="flex items-center justify-center min-h-full">
                <div
                  ref={containerRef}
                  className={cn(
                    "relative border-2 border-dashed border-muted-foreground/30 rounded-lg",
                    isBlackAndWhite && 'export-bw',
                    isWhiteBackground ? 'bg-white' : 'bg-gradient-to-br from-background via-muted/10 to-muted/20'
                  )}
                  style={{
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-out',
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
                          Add furniture from the Layout tab or pick a preset to get started.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default SeatingPlanTool;
