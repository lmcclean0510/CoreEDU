"use client";

import React, { useRef, useEffect, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlignVerticalJustifyCenter, Menu, Grid3x3, Save, FolderOpen, FilePlus, Eye, EyeOff } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GRID_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './utils/constants';
import { useSeatingPlan } from './hooks/useSeatingPlan';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useStudentAssignment } from './hooks/useStudentAssignment';
import DraggableItem from './components/DraggableItem';
import DraggableTeacherDesk from './components/DraggableTeacherDesk';
import StudentsPanel from './components/StudentsPanel';
import RulesPanel from './components/RulesPanel';
import GroupControl from './components/GroupControl';
import { useSeatingPlanPersistence } from '@/hooks/teacher/use-seating-plan-persistence';
import { useToast } from '@/hooks/shared/use-toast';

const SeatingPlanTool = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [isRulesMode, setIsRulesMode] = useState(false);
  const [isStudentPanelOpen, setIsStudentPanelOpen] = useState(false);
  const [isRulesPanelOpen, setIsRulesPanelOpen] = useState(false);
  const [isFurniturePopoverOpen, setIsFurniturePopoverOpen] = useState(false);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const { toast } = useToast();

  // Save/Load persistence hook
  const { savedPlans, isSaving, savePlan, updatePlan, deletePlan } = useSeatingPlanPersistence();

  // Use the seating plan hook for state management
  const {
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
    desksWithGroups,
    stats,
    unassignedStudents,
    groupLayouts,
    hoveredGroupId,
    getDeskGroup,
    setDesks,
    setGroups,
    setTeacherDesk,
    setFillFromFront,
    setAlternateGender,
    setNewRuleStudents,
    setStudentInput,
    setIsGridVisible,
    setHoveredGroupId,
    loadComputerRoomPreset,
    loadPreset1,
    loadPreset2,
    loadPreset3,
    loadPreset4,
    loadPreset5,
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
    handleRenameGroup,
    handleSetGroupColor,
    handleDeleteGroup,
    autoAlignToGrid,
    furnitureTemplates,
  } = useSeatingPlan();

  // Drag and drop hook
  const { handleDragEnd } = useDragAndDrop(zoom);

  // Student assignment hook
  const { isLoading: isAssigning, autoAssignStudents, clearAssignments } = useStudentAssignment();

  // Auto-fit zoom
  useEffect(() => {
    const calculateZoom = () => {
      if (containerRef.current && canvasRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const actualCanvasWidth = canvasRef.current.offsetWidth;
        
        const padding = 64; // p-8: 32px each side = 64px total
        const scaleX = (containerWidth - padding) / actualCanvasWidth;
        const scaleY = (containerHeight - padding) / CANVAS_HEIGHT;
        const newZoom = Math.min(scaleX, scaleY, 1);

        setZoom(newZoom);
      }
    };

    const timer = setTimeout(calculateZoom, 100);
    window.addEventListener('resize', calculateZoom);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateZoom);
    };
  }, [canvasRef.current]);

  // Handle drag end event
  const onDragEnd = (event: any) => {
    handleDragEnd(
      event,
      desks,
      groups,
      canvasRef,
      getDeskGroup,
      setDesks,
      setGroups,
      setTeacherDesk
    );
  };

  // Handle auto-assign
  const handleAutoAssign = () => {
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
  };

  // Clear all desks, groups, and teacher desk
  const handleClearLayout = () => {
    setDesks([]);
    setGroups([]);
    setTeacherDesk(null);
  };

  // Start a new plan (clear current plan tracking)
  const handleNewPlan = () => {
    setCurrentPlanId(null);
    setCurrentPlanName(null);
  };

  // Handle canvas click to deselect group
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only close group controls if clicking directly on canvas background
    if (e.target === e.currentTarget) {
      setHoveredGroupId(null);
    }
  };

  // Save seating plan (as new)
  const handleSavePlan = async () => {
    if (!newPlanName.trim()) return;

    const planData = {
      desks,
      groups,
      teacherDesk,
      students,
      separationRules,
      doNotUseDeskIds: Array.from(doNotUseDeskIds),
      fillFromFront,
      alternateGender,
      metadata: {
        totalDesks: desks.length,
        totalStudents: students.length,
      },
    };

    // Always save as new plan
    const newPlanId = await savePlan(newPlanName.trim(), planData);
    if (newPlanId) {
      setCurrentPlanId(newPlanId);
      setCurrentPlanName(newPlanName.trim());
      setNewPlanName('');
      setIsSaveDialogOpen(false);
    }
  };

  // Update existing seating plan
  const handleUpdatePlan = async (planName: string) => {
    if (!currentPlanId) return;

    const planData = {
      desks,
      groups,
      teacherDesk,
      students,
      separationRules,
      doNotUseDeskIds: Array.from(doNotUseDeskIds),
      fillFromFront,
      alternateGender,
      metadata: {
        totalDesks: desks.length,
        totalStudents: students.length,
      },
    };

    // Use provided name or keep current name
    const updatedName = planName || currentPlanName || 'Untitled Plan';
    await updatePlan(currentPlanId, { ...planData, planName: updatedName });
    setCurrentPlanName(updatedName);
  };

  // Load seating plan
  const handleLoadPlan = (planId: string) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (!plan) return;

    setDesks(plan.desks);
    setGroups(plan.groups);
    setTeacherDesk(plan.teacherDesk);

    // Recreate students from the saved data
    const studentNames = plan.students.map(s => s.name).join('\n');
    setStudentInput(studentNames);
    setTimeout(() => {
      parseStudents();
    }, 100);

    setFillFromFront(plan.fillFromFront);
    setAlternateGender(plan.alternateGender);
    setCurrentPlanId(planId);
    setCurrentPlanName(plan.planName);
    setIsLoadDialogOpen(false);

    toast({
      title: 'Plan Loaded',
      description: `Loaded "${plan.planName}"`,
    });
  };

  // Delete seating plan
  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
    if (currentPlanId === planId) {
      setCurrentPlanId(null);
      setCurrentPlanName(null);
    }
  };

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex h-full bg-background relative">
        {/* Student Management Panel - Sliding from Left */}
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-card border-r border-border overflow-y-auto p-4 space-y-4 transition-transform duration-300 ease-in-out z-20 shadow-lg ${
            isStudentPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Student Management</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsStudentPanelOpen(false)}
            >
              ✕
            </Button>
          </div>

          {/* Students Panel */}
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
        </div>

        {/* Rules Panel - Sliding from Left */}
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-card border-r border-border overflow-y-auto p-4 space-y-4 transition-transform duration-300 ease-in-out z-20 shadow-lg ${
            isRulesPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Rules & Assignment</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRulesPanelOpen(false)}
            >
              ✕
            </Button>
          </div>

          {/* Rules Panel */}
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

          {/* Auto-Assign Button */}
          {students.length > 0 && (
            <Button
              onClick={handleAutoAssign}
              className="w-full"
              disabled={isAssigning || stats.availableDesks === 0}
            >
              {isAssigning ? 'Assigning...' : 'Auto-Assign Students'}
            </Button>
          )}

          {/* Clear Assignments */}
          {students.length > 0 && stats.assignedDesks > 0 && (
            <Button
              onClick={() => clearAssignments(setDesks)}
              variant="outline"
              className="w-full"
            >
              Clear All Assignments
            </Button>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* File Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="w-4 h-4 mr-2" />
                      File
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Seating Plans</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currentPlanId ? (
                      <>
                        <DropdownMenuItem onClick={() => handleUpdatePlan('')} disabled={isSaving}>
                          <Save className="w-4 h-4 mr-2" />
                          Update Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleNewPlan}>
                          <FilePlus className="w-4 h-4 mr-2" />
                          New Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
                          <Save className="w-4 h-4 mr-2" />
                          Save as New...
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Plan...
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setIsLoadDialogOpen(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Load Plan...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mode Toggle Buttons */}
                <Button
                  onClick={() => setIsLayoutMode(!isLayoutMode)}
                  variant={isLayoutMode ? "default" : "outline"}
                  size="sm"
                >
                  Layout Mode
                </Button>
                <Button
                  onClick={() => {
                    setIsRulesPanelOpen(!isRulesPanelOpen);
                    setIsStudentPanelOpen(false);
                    setIsRulesMode(!isRulesMode);
                  }}
                  variant={isRulesMode ? "default" : "outline"}
                  size="sm"
                >
                  Rules Mode
                </Button>

                {/* View Tools Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem onClick={() => setIsGridVisible(!isGridVisible)}>
                      {isGridVisible ? (
                        <><EyeOff className="w-4 h-4 mr-2" /> Hide Grid</>
                      ) : (
                        <><Eye className="w-4 h-4 mr-2" /> Show Grid</>
                      )}
                    </DropdownMenuItem>
                    {isLayoutMode && desks.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={autoAlignToGrid}>
                          <AlignVerticalJustifyCenter className="w-4 h-4 mr-2" />
                          Align to Grid
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                {/* Manage Students Button */}
                <Button
                  onClick={() => {
                    setIsStudentPanelOpen(!isStudentPanelOpen);
                    setIsRulesPanelOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Manage Students
                </Button>
                {students.length > 0 && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {stats.assignedDesks}/{stats.availableDesks} assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-muted/30 overflow-hidden"
          >
            {/* Current Plan Watermark - Subtle indicator */}
            {currentPlanId && currentPlanName && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="px-3 py-1 bg-primary/5 backdrop-blur-sm rounded-b-md border-x border-b border-primary/10">
                  <span className="text-xs font-medium text-primary/40">
                    {currentPlanName}
                  </span>
                </div>
              </div>
            )}

            {/* Canvas */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div
                ref={canvasRef}
                className="relative bg-white rounded-xl border-2 border-dashed border-muted-foreground/30 shadow-lg"
                style={{
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  minWidth: `${CANVAS_WIDTH}px`,
                  maxWidth: `${CANVAS_WIDTH}px`,
                }}
                onClick={handleCanvasClick}
              >
                {/* Grid */}
                {isGridVisible && (
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #14b8a6 1px, transparent 1px),
                        linear-gradient(to bottom, #14b8a6 1px, transparent 1px)
                      `,
                      backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                    }}
                  />
                )}

                {/* Teacher Desk - Only render if it exists */}
                {teacherDesk && (
                  <DraggableTeacherDesk
                    {...teacherDesk}
                    isLayoutMode={isLayoutMode}
                  />
                )}

                {/* Desks */}
                {desksWithGroups.map((desk, index) => (
                  <DraggableItem
                    key={desk.id}
                    desk={desk}
                    deskIndex={index}
                    group={desk.group}
                    unassignedStudents={unassignedStudents}
                    onRemove={() => removeDesk(desk.id)}
                    onToggleExclude={() => handleToggleDoNotUseDesk(desk.id)}
                    onManualAssign={handleManualAssign}
                    onGroupHover={setHoveredGroupId}
                    isGroupSelected={desk.group?.id === hoveredGroupId}
                    isLayoutMode={isLayoutMode}
                    isRulesMode={isRulesMode}
                    isExcluded={doNotUseDeskIds.has(desk.id)}
                    areIndicatorsVisible={true}
                  />
                ))}

                {/* Group Controls - Only show in Layout Mode */}
                {isLayoutMode && groupLayouts.map((group) => (
                  <GroupControl
                    key={group.id}
                    group={group}
                    isVisible={hoveredGroupId === group.id}
                    onRename={handleRenameGroup}
                    onSetColor={handleSetGroupColor}
                    onDelete={handleDeleteGroup}
                  />
                ))}

                {/* Empty state */}
                {desks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <div className="text-6xl">📐</div>
                      <p className="text-lg font-medium">Empty Classroom</p>
                      <p className="text-sm">Click the green + button or "Load Computer Room"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Furniture Button - Only visible in Layout Mode */}
            {isLayoutMode && (
              <Popover open={isFurniturePopoverOpen} onOpenChange={setIsFurniturePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="lg"
                    className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all z-30 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    title="Layout Options"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
              <PopoverContent
                side="left"
                align="end"
                className="w-72 p-3 max-h-[600px] overflow-y-auto"
                sideOffset={10}
              >
                <div className="space-y-4">
                  {/* Presets Section */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Load Preset Layout</h3>
                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => {
                          setIsPresetDialogOpen(true);
                          setIsFurniturePopoverOpen(false);
                        }}
                      >
                        <span className="text-sm font-medium">Choose Preset...</span>
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Furniture Section */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Add Individual Furniture</h3>
                    <div className="grid gap-2">
                      {furnitureTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="justify-start h-auto py-3"
                          onClick={() => {
                            addFurniture(template);
                            setIsFurniturePopoverOpen(false);
                          }}
                        >
                          <span className="text-2xl mr-3">{template.icon}</span>
                          <span className="text-sm font-medium">{template.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Layout Section - Only show when desks exist */}
                  {desks.length > 0 && (
                    <>
                      <div className="h-px bg-border" />
                      <div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full justify-start h-auto py-3"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Clear All Desks</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear Room Layout?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove all desks and groups from the canvas. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleClearLayout}>Clear Layout</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
        </div>

        {/* Save Plan Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Seating Plan</DialogTitle>
              <DialogDescription>
                Give your seating plan a name to save it for later use.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="plan-name" className="text-sm font-medium">Plan Name</label>
                <input
                  id="plan-name"
                  type="text"
                  placeholder="e.g., Term 1 - Math, Group Work Layout..."
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePlan()}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan} disabled={!newPlanName.trim() || isSaving}>
                {isSaving ? 'Saving...' : 'Save Plan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Load Plan Dialog */}
        <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Load Saved Seating Plan</DialogTitle>
              <DialogDescription>
                Select a previously saved seating plan to load.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-4">
              {savedPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No saved seating plans yet.</p>
                  <p className="text-sm mt-2">Create your first layout and save it!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{plan.planName}</h3>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {plan.metadata && (
                              <>
                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                                  {plan.metadata.totalDesks} desks
                                </span>
                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                                  {plan.metadata.totalStudents} students
                                </span>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground self-center">
                              {plan.updatedAt?.toDate?.().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLoadPlan(plan.id)}
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
                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Preset Selection Dialog */}
        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Choose a Classroom Layout Preset</DialogTitle>
              <DialogDescription>
                Select a preset layout to quickly set up your classroom. This will replace any existing layout.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4 text-left hover:bg-accent"
                onClick={() => {
                  loadPreset1();
                  setIsPresetDialogOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Preset 1 - Rows</span>
                  <span className="text-sm text-muted-foreground">32 desks in 4 traditional rows (4+4 per row)</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4 text-left hover:bg-accent"
                onClick={() => {
                  loadPreset2();
                  setIsPresetDialogOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Preset 2 - Groups</span>
                  <span className="text-sm text-muted-foreground">24 desks in 4 groups of 6 (ideal for collaboration)</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4 text-left hover:bg-accent"
                onClick={() => {
                  loadPreset3();
                  setIsPresetDialogOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Preset 3 - U-Shape</span>
                  <span className="text-sm text-muted-foreground">20 desks in U-formation (great for discussions)</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4 text-left hover:bg-accent"
                onClick={() => {
                  loadPreset4();
                  setIsPresetDialogOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Preset 4 - Tables</span>
                  <span className="text-sm text-muted-foreground">24 desks in 6 tables of 4 (paired/small group work)</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4 text-left hover:bg-accent"
                onClick={() => {
                  loadPreset5();
                  setIsPresetDialogOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Preset 5 - Horseshoe</span>
                  <span className="text-sm text-muted-foreground">18 desks in semicircle (presentations & whole-class)</span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
};

export default SeatingPlanTool;
