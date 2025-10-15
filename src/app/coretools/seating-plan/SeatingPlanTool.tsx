"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Grid3X3, 
  Shuffle, 
  RotateCcw, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Plus, 
  Settings, 
  Users, 
  ShieldAlert, 
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Components
import DraggableItem from './components/DraggableItem';
import DraggableTeacherDesk from './components/DraggableTeacherDesk';
import GroupControl from './components/GroupControl';
import StudentsPanel from './components/StudentsPanel';
import RulesPanel from './components/RulesPanel';

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
  
  // UI state
  const [zoom, setZoom] = useState(1);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'students' | 'rules'>('layout');

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

  const { handleDragEnd, handleAutoAlign } = useDragAndDrop(zoom);
  const { isLoading: isAssigning, autoAssignStudents, clearAssignments } = useStudentAssignment();
  const { isExporting, handleExport } = useExport(containerRef);

  // Auto-fit zoom on mount
  useEffect(() => {
    if (canvasContainerRef.current) {
      const containerWidth = canvasContainerRef.current.offsetWidth;
      const containerHeight = canvasContainerRef.current.offsetHeight;
      
      const scaleX = (containerWidth - 64) / CANVAS_WIDTH;
      const scaleY = (containerHeight - 64) / CANVAS_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      setZoom(fitScale);
    }
  }, []);

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
      
      const scaleX = (containerWidth - 64) / CANVAS_WIDTH;
      const scaleY = (containerHeight - 64) / CANVAS_HEIGHT;
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
    setFabOpen(false);
  }, [addFurniture, getCanvasSize]);

  return (
    <div className="flex flex-col h-full bg-background">
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
          {/* Compact Top Toolbar */}
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shadow-sm z-30 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">Seating Plan</h1>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'layout' as const, icon: LayoutGrid, label: 'Layout' },
                  { id: 'students' as const, icon: Users, label: 'Students' },
                  { id: 'rules' as const, icon: ShieldAlert, label: 'Rules' }
                ].map(tab => (
                  <Button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'layout') {
                        setLeftPanelOpen(true);
                        setRightPanelOpen(false);
                      } else if (tab.id === 'students') {
                        setRightPanelOpen(true);
                        setLeftPanelOpen(false);
                      } else if (tab.id === 'rules') {
                        setRightPanelOpen(true);
                        setLeftPanelOpen(false);
                      }
                    }}
                    variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1.5",
                      activeTab === tab.id && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                <Button 
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.3}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <ZoomOut size={14} />
                </Button>
                <span className="text-xs font-medium text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button 
                  onClick={handleZoomIn}
                  disabled={zoom >= 2}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <ZoomIn size={14} />
                </Button>
                <Button 
                  onClick={handleFitToScreen}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  title="Fit to screen"
                >
                  <Maximize2 size={14} />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleClearAssignments}
                variant="outline"
                size="sm"
                disabled={isAssigning}
                className="hidden sm:flex"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isExporting}
                className="hidden sm:flex"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={handleAutoAssign}
                size="sm"
                disabled={isAssigning || students.length === 0 || desks.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isAssigning ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                ) : (
                  <Shuffle className="mr-1.5 h-4 w-4" />
                )}
                Auto Assign
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* Left Sliding Panel - Furniture Library */}
            <div
              className={cn(
                "absolute left-0 top-0 h-full bg-card border-r border-border shadow-lg transition-transform duration-300 z-20",
                leftPanelOpen ? "translate-x-0" : "-translate-x-full"
              )}
              style={{ width: '320px' }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Layout Tools</h3>
                <Button
                  onClick={() => setLeftPanelOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100%-4rem)]">
                <div className="p-4 space-y-4">
                  {/* Presets */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Presets</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadComputerRoomPreset(getCanvasSize());
                        setIsPresetDialogOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Grid3X3 className="mr-2 h-4 w-4" />
                      Computer Room
                    </Button>
                  </div>

                  {/* Add Furniture */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Add Furniture</Label>
                    <div className="space-y-1">
                      {furnitureTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start hover:bg-muted"
                          onClick={() => handleAddFurniture(template)}
                        >
                          <span className="mr-2">{template.icon}</span>
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Settings */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Settings</Label>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grid-toggle" className="cursor-pointer text-sm">Show Grid</Label>
                      <Switch
                        id="grid-toggle"
                        checked={isGridVisible}
                        onCheckedChange={setIsGridVisible}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="white-bg-toggle" className="cursor-pointer text-sm">White Background</Label>
                      <Switch
                        id="white-bg-toggle"
                        checked={isWhiteBackground}
                        onCheckedChange={setIsWhiteBackground}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="bw-toggle" className="cursor-pointer text-sm">Black & White Mode</Label>
                      <Switch
                        id="bw-toggle"
                        checked={isBlackAndWhite}
                        onCheckedChange={setIsBlackAndWhite}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="indicators-toggle" className="cursor-pointer text-sm">Show Indicators</Label>
                      <Switch
                        id="indicators-toggle"
                        checked={areIndicatorsVisible}
                        onCheckedChange={setAreIndicatorsVisible}
                      />
                    </div>

                    <div className="grid gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start w-full"
                        onClick={onAutoAlign}
                      >
                        Auto Align to Grid
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start w-full"
                        onClick={autoRenumberDesks}
                      >
                        Renumber Desks
                      </Button>
                    </div>
                  </div>

                  {/* Groups */}
                  {groups.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Groups ({groups.length})</Label>
                      <div className="space-y-2">
                        {groups.map(group => (
                          <div key={group.id} className="flex items-center p-2 bg-muted/50 rounded-lg" style={{ borderLeft: `4px solid ${group.color}` }}>
                            <Input 
                              type="text"
                              value={group.name}
                              onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                              className="text-xs font-medium h-7 border-none bg-transparent focus-visible:ring-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Toggle Button for Left Panel */}
            {!leftPanelOpen && (
              <Button
                onClick={() => {
                  setLeftPanelOpen(true);
                  setRightPanelOpen(false);
                  setActiveTab('layout');
                }}
                variant="outline"
                size="sm"
                className="absolute left-4 top-4 z-10 h-9 px-3 shadow-md"
                title="Open Layout Tools"
              >
                <ChevronRight size={16} className="mr-1" />
                Layout
              </Button>
            )}

            {/* Canvas Area */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 relative bg-muted/30 overflow-auto"
            >
              {/* Stats overlay */}
              <div className="absolute top-4 right-4 bg-card/90 backdrop-blur rounded-lg px-4 py-2 shadow-md text-sm z-10 border border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.assignedDesks}</span>
                  <span>assigned</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">{stats.totalDesks}</span>
                  <span>desks</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">{stats.totalStudents}</span>
                  <span>students</span>
                  {unassignedStudentCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-orange-600">{unassignedStudentCount} unassigned</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Canvas content */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div
                  ref={containerRef}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed border-muted-foreground/30 shadow-lg",
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
                      className="export-grid-bg absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
                          linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
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
                          Click the Layout tab to add furniture or choose a preset.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sliding Panel - Students & Rules */}
            <div
              className={cn(
                "absolute right-0 top-0 h-full bg-card border-l border-border shadow-lg transition-transform duration-300 z-20",
                rightPanelOpen ? "translate-x-0" : "translate-x-full"
              )}
              style={{ width: '380px' }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {activeTab === 'students' ? 'Students' : 'Rules'}
                </h3>
                <Button
                  onClick={() => setRightPanelOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100%-4rem)]">
                <div className="p-4">
                  {activeTab === 'students' && (
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
                  )}
                  {activeTab === 'rules' && (
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
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Toggle Button for Right Panel */}
            {!rightPanelOpen && activeTab !== 'layout' && (
              <Button
                onClick={() => setRightPanelOpen(true)}
                variant="outline"
                size="sm"
                className="absolute right-4 top-4 z-10 h-9 px-3 shadow-md"
                title={activeTab === 'students' ? 'Open Students' : 'Open Rules'}
              >
                {activeTab === 'students' ? 'Students' : 'Rules'}
                <ChevronLeft size={16} className="ml-1" />
              </Button>
            )}

            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-6 right-6 z-30">
              {/* Quick Actions Menu */}
              {fabOpen && (
                <div className="absolute bottom-16 right-0 bg-card rounded-lg shadow-xl border border-border py-2 mb-2 w-48">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto hover:bg-muted"
                    onClick={() => {
                      setActiveTab('layout');
                      setLeftPanelOpen(true);
                      setRightPanelOpen(false);
                      setFabOpen(false);
                    }}
                  >
                    <LayoutGrid size={16} className="mr-2 text-muted-foreground" />
                    <span className="text-sm">Add Furniture</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto hover:bg-muted"
                    onClick={() => {
                      setActiveTab('students');
                      setRightPanelOpen(true);
                      setLeftPanelOpen(false);
                      setFabOpen(false);
                    }}
                  >
                    <Users size={16} className="mr-2 text-muted-foreground" />
                    <span className="text-sm">Add Students</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 h-auto hover:bg-muted"
                    onClick={() => {
                      loadComputerRoomPreset(getCanvasSize());
                      setFabOpen(false);
                    }}
                  >
                    <Grid3X3 size={16} className="mr-2 text-muted-foreground" />
                    <span className="text-sm">Pick Preset</span>
                  </Button>
                </div>
              )}
              
              <Button
                onClick={() => setFabOpen(!fabOpen)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {fabOpen ? <X size={24} /> : <Plus size={24} />}
              </Button>
            </div>
          </div>

          {/* Help Overlay Hint */}
          <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-muted-foreground shadow-md border border-border">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono mx-1">?</kbd> for keyboard shortcuts
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default SeatingPlanTool;
