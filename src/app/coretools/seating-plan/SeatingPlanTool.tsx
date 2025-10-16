"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  GRID_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_DESK_WIDTH,
  DEFAULT_DESK_HEIGHT,
  DEFAULT_TEACHER_DESK,
  PRESET_LAYOUTS
} from './utils/constants';

interface Desk {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SeatingPlanTool = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [showGrid, setShowGrid] = useState(true);

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

  // Log canvas info on mount
  useEffect(() => {
    console.log('🎯 Canvas dimensions:', { 
      CANVAS_WIDTH, 
      CANVAS_HEIGHT, 
      gridSquares: { w: CANVAS_WIDTH / GRID_SIZE, h: CANVAS_HEIGHT / GRID_SIZE } 
    });
  }, []);

  // Create simple preset - 3 rows of 8 desks
  const loadPreset = () => {
    console.log('🎯 Loading preset...');

    const preset = PRESET_LAYOUTS.COMPUTER_ROOM;
    const newDesks: Desk[] = [];

    // Calculate total width: 4 desks + gap + 4 desks
    const totalWidth = (4 * preset.deskWidth) + preset.gapBetweenGroups + (4 * preset.deskWidth);

    // Center the layout
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    console.log('🎯 Layout:', { totalWidth, startX, CANVAS_WIDTH });

    let id = 1;
    for (let row = 0; row < preset.rows; row++) {
      const y = preset.startY + (row * (preset.deskHeight + preset.rowGap));

      // Left group (4 desks)
      for (let i = 0; i < 4; i++) {
        newDesks.push({
          id: id++,
          x: startX + (i * preset.deskWidth),
          y,
          width: preset.deskWidth,
          height: preset.deskHeight,
        });
      }

      // Right group (4 desks)
      const rightStartX = startX + (4 * preset.deskWidth) + preset.gapBetweenGroups;
      for (let i = 0; i < 4; i++) {
        newDesks.push({
          id: id++,
          x: rightStartX + (i * preset.deskWidth),
          y,
          width: preset.deskWidth,
          height: preset.deskHeight,
        });
      }
    }

    console.log('🎯 Created', newDesks.length, 'desks');
    setDesks(newDesks);
  };

  // Add single desk in center
  const addSingleDesk = () => {
    const newDesk: Desk = {
      id: Date.now(),
      x: (CANVAS_WIDTH - DEFAULT_DESK_WIDTH) / 2,
      y: (CANVAS_HEIGHT - DEFAULT_DESK_HEIGHT) / 2,
      width: DEFAULT_DESK_WIDTH,
      height: DEFAULT_DESK_HEIGHT,
    };
    console.log('🎯 Adding desk at center:', newDesk);
    setDesks([...desks, newDesk]);
  };

  const clearAll = () => {
    setDesks([]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Simple Toolbar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Seating Plan</h1>
        
        <div className="flex items-center gap-2">
          <Button onClick={addSingleDesk} variant="outline" size="sm">
            Add Single Desk
          </Button>
          <Button onClick={loadPreset} variant="outline" size="sm">
            Load Computer Room
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            Clear All
          </Button>
          <Button onClick={() => setShowGrid(!showGrid)} variant="outline" size="sm">
            {showGrid ? 'Hide' : 'Show'} Grid
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-muted/30 overflow-hidden"
      >
        {/* Stats */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur rounded-lg px-4 py-2 shadow-md text-sm z-10 border">
          <span className="font-semibold">{desks.length}</span> desks
        </div>

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
            {showGrid && (
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
            <div
              className="absolute bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-medium shadow-md"
              style={{
                left: `${DEFAULT_TEACHER_DESK.x}px`,
                top: `${DEFAULT_TEACHER_DESK.y}px`,
                width: `${DEFAULT_TEACHER_DESK.width}px`,
                height: `${DEFAULT_TEACHER_DESK.height}px`,
              }}
            >
              Teacher's Desk
            </div>

            {/* Desks */}
            {desks.map((desk) => (
              <div
                key={desk.id}
                className="absolute bg-white border-2 border-primary rounded flex items-center justify-center text-sm font-medium shadow-sm"
                style={{
                  left: `${desk.x}px`,
                  top: `${desk.y}px`,
                  width: `${desk.width}px`,
                  height: `${desk.height}px`,
                }}
              >
                Desk {desk.id}
              </div>
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
  );
};

export default SeatingPlanTool;
