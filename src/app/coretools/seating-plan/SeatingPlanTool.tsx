"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Shuffle, RotateCcw, CheckCircle, Download, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp, Plus, Settings, Users, ShieldAlert, LayoutGrid } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Components
import DraggableItem from './components/DraggableItem';
import DraggableTeacherDesk from './components/DraggableTeacherDesk';
import GroupControl from './components/GroupControl';
import StudentsPanel from './components/StudentsPanel';
import RulesPanel from './components/RulesPanel';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Hooks
import { useSeatingPlan } from './hooks/useSeatingPlan';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useStudentAssignment } from './hooks/useStudentAssignment';
import { useExport } from './hooks/useExport';
import { GRID_SIZE } from './utils/constants';

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
  const [furniturePopoverOpen, setFurniturePopoverOpen] = useState(false);
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);

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
  const getCanvasSize = useCallback(() => {
    const el = containerRef.current;
    return {
      width: el?.offsetWidth ?? CANVAS_WIDTH,
      height: el?.offsetHeight ?? CANVAS_HEIGHT,
    };
  }, [containerRef]);

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

  const handleAddFurniture = useCallback((template: any) => {
    addFurniture(template, getCanvasSize());
    setFurniturePopoverOpen(false);
  }, [addFurniture, getCanvasSize]);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-muted/10">
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
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
              <Card className="shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="font-semibold tabular-nums">{stats.assignedDesks}</span>
                      <span>assigned</span>
                    </div>
                    <span className="hidden text-muted-foreground md:inline">•</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{stats.totalDesks}</span>
                      <span>desks</span>
                    </div>
                    <span className="hidden text-muted-foreground md:inline">•</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{stats.totalStudents}</span>
                      <span>students</span>
                    </div>
                    {unassignedStudentCount > 0 && (
                      <>
                        <span className="hidden text-muted-foreground md:inline">•</span>
                        <span className="font-semibold text-orange-600">
                          {unassignedStudentCount} unassigned
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                    <div className="flex items-center gap-1 rounded-full border bg-background p-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.3}
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="px-2 text-xs font-semibold tabular-nums">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleFitToScreen}
                        title="Fit to screen"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleAutoAssign}
                        size="sm"
                        disabled={isAssigning || students.length === 0 || desks.length === 0}
                      >
                        {isAssigning ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Shuffle className="mr-2 h-4 w-4" />
                        )}
                        Auto Assign
                      </Button>
                      <Button
                        onClick={handleClearAssignments}
                        variant="outline"
                        size="sm"
                        disabled={isAssigning}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        disabled={isExporting}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <Switch
                          id="show-indicators-toggle"
                          checked={areIndicatorsVisible}
                          onCheckedChange={setAreIndicatorsVisible}
                        />
                        <Label
                          htmlFor="show-indicators-toggle"
                          className="cursor-pointer text-xs font-medium"
                        >
                          Indicators
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isControlsCollapsed && (
                <Card className="shadow-sm">
                  <CardContent className="flex flex-col gap-4 p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <TabsList className="bg-muted/40">
                          <TabsTrigger value="layout" className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Layout
                          </TabsTrigger>
                          <TabsTrigger value="students" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Students
                          </TabsTrigger>
                          <TabsTrigger value="rules" className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Rules
                          </TabsTrigger>
                        </TabsList>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setIsControlsCollapsed(true)}
                        >
                          <ChevronUp className="mr-1 h-4 w-4" />
                          Hide controls
                        </Button>
                      </div>

                      <TabsContent value="layout" className="mt-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPresetDialogOpen(true)}
                          >
                            <Grid3X3 className="mr-2 h-4 w-4" />
                            Pick a Preset
                          </Button>

                          <Popover open={furniturePopoverOpen} onOpenChange={setFurniturePopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Furniture
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 space-y-2 p-3" align="start">
                              <h4 className="text-sm font-semibold">Add Furniture</h4>
                              {furnitureTemplates.map((template) => (
                                <Button
                                  key={template.id}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => handleAddFurniture(template)}
                                >
                                  <span className="mr-2">{template.icon}</span>
                                  {template.name}
                                </Button>
                              ))}
                            </PopoverContent>
                          </Popover>

                          <Popover open={layoutSettingsOpen} onOpenChange={setLayoutSettingsOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="mr-2 h-4 w-4" />
                                Layout Settings
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-4 p-4" align="start">
                              <h4 className="text-sm font-semibold">Layout Settings</h4>

                              <div className="flex items-center justify-between">
                                <Label htmlFor="grid-toggle" className="cursor-pointer text-sm">
                                  Show Grid
                                </Label>
                                <Switch
                                  id="grid-toggle"
                                  checked={isGridVisible}
                                  onCheckedChange={setIsGridVisible}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label htmlFor="white-bg-toggle" className="cursor-pointer text-sm">
                                  White Background
                                </Label>
                                <Switch
                                  id="white-bg-toggle"
                                  checked={isWhiteBackground}
                                  onCheckedChange={setIsWhiteBackground}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label htmlFor="bw-toggle" className="cursor-pointer text-sm">
                                  Black &amp; White Mode
                                </Label>
                                <Switch
                                  id="bw-toggle"
                                  checked={isBlackAndWhite}
                                  onCheckedChange={setIsBlackAndWhite}
                                />
                              </div>

                              <div className="grid gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start"
                                  onClick={onAutoAlign}
                                >
                                  Auto Align to Grid
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start"
                                  onClick={autoRenumberDesks}
                                >
                                  Renumber Desks
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
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
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {isControlsCollapsed && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsControlsCollapsed(false)}
                  >
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show controls
                  </Button>
                </div>
              )}

              <div
                ref={canvasContainerRef}
                className="flex-1 overflow-auto rounded-3xl border border-muted/40 bg-card p-4 shadow-sm"
              >
                <div className="flex min-h-full items-center justify-center">
                  <div
                    ref={containerRef}
                    className={cn(
                      "relative rounded-2xl border border-dashed border-muted-foreground/30 shadow-sm",
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
                        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
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
                        <div className="space-y-4 text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                            <Grid3X3 className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="text-lg font-medium">Empty Classroom</p>
                          <p className="text-sm">
                            Click &ldquo;Pick a Preset&rdquo; or &ldquo;Add Furniture&rdquo; above to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Dialog */}
          {isPresetDialogOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setIsPresetDialogOpen(false)}>
              <Card className="w-96" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle>Choose a Preset Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4"
                    onClick={() => loadComputerRoomPreset(getCanvasSize())}
                  >
                    <div className="text-left">
                      <div className="font-semibold">Computer Room</div>
                      <div className="text-xs text-muted-foreground mt-1">32 desks in 8 groups (4 rows of 4+4)</div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsPresetDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DndContext>
      )}
    </div>
  );
};

export default SeatingPlanTool;
