"use client";

import React, { useRef, useEffect, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
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

const SeatingPlanTool = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [isRulesMode, setIsRulesMode] = useState(false);
  const [isLayoutPanelOpen, setIsLayoutPanelOpen] = useState(false);
  const [isRulesPanelOpen, setIsRulesPanelOpen] = useState(false);

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
    getDeskGroup,
    setDesks,
    setGroups,
    setTeacherDesk,
    setFillFromFront,
    setAlternateGender,
    setNewRuleStudents,
    setStudentInput,
    setIsGridVisible,
    loadComputerRoomPreset,
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
        console.log('🎯 Zoom calculated:', { 
          containerWidth, 
          actualCanvasWidth,
          newZoom,
          zoomPercent: Math.round(newZoom * 100) + '%'
        });
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

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex h-full bg-background relative">
        {/* Layout Panel - Sliding from Left */}
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-card border-r border-border overflow-y-auto p-4 space-y-4 transition-transform duration-300 ease-in-out z-20 shadow-lg ${
            isLayoutPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Layout & Students</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLayoutPanelOpen(false)}
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
          <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Panel Toggle Buttons */}
              <Button
                onClick={() => {
                  setIsLayoutPanelOpen(!isLayoutPanelOpen);
                  setIsRulesPanelOpen(false);
                  setIsLayoutMode(!isLayoutMode);
                  setIsRulesMode(false);
                }}
                variant={isLayoutMode ? "default" : "outline"}
                size="sm"
              >
                {isLayoutMode ? 'Exit Layout Mode' : 'Layout Mode'}
              </Button>
              <Button
                onClick={() => {
                  setIsRulesPanelOpen(!isRulesPanelOpen);
                  setIsLayoutPanelOpen(false);
                  setIsRulesMode(!isRulesMode);
                  setIsLayoutMode(false);
                }}
                variant={isRulesMode ? "default" : "outline"}
                size="sm"
              >
                {isRulesMode ? 'Exit Rules Mode' : 'Rules Mode'}
              </Button>

              {/* Quick Actions */}
              <div className="h-6 w-px bg-border mx-1" />
              <Button onClick={() => addFurniture(furnitureTemplates[0])} variant="outline" size="sm">
                Add Single Desk
              </Button>
              <Button onClick={loadComputerRoomPreset} variant="outline" size="sm">
                Load Computer Room
              </Button>
              <Button onClick={() => setIsGridVisible(!isGridVisible)} variant="outline" size="sm">
                {isGridVisible ? 'Hide' : 'Show'} Grid
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Zoom: {Math.round(zoom * 100)}%
              </span>
              {students.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {stats.assignedDesks}/{stats.availableDesks} assigned
                </span>
              )}
            </div>
          </div>

          {/* Canvas Container */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-muted/30 overflow-hidden"
          >
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

                {/* Teacher Desk */}
                <DraggableTeacherDesk
                  {...teacherDesk}
                  isLayoutMode={isLayoutMode}
                />

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
                    isLayoutMode={isLayoutMode}
                    isRulesMode={isRulesMode}
                    isExcluded={doNotUseDeskIds.has(desk.id)}
                    areIndicatorsVisible={true}
                  />
                ))}

                {/* Empty state */}
                {desks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <div className="text-6xl">📐</div>
                      <p className="text-lg font-medium">Empty Classroom</p>
                      <p className="text-sm">Click "Add Single Desk" or "Load Computer Room"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default SeatingPlanTool;
