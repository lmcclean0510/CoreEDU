import { useState, useCallback, useMemo } from 'react';
import { GROUP_COLORS, DEFAULT_TEACHER_DESK, FURNITURE_TEMPLATES } from '../utils/constants';
import { parseStudentInput, validateSeparationRule } from '../utils/validation';
import { sortDesksByPosition } from '../utils/calculations';
import type { Desk, Group, Student, SeparationRule, TeacherDesk, FurnitureTemplate, DeskWithGroup, Stats } from '../types';

const CANVAS_WIDTH = 1403;
const CANVAS_HEIGHT = 1003;
const SAFE_MARGIN = 60;

type CanvasSize = { width: number; height: number };

export const useSeatingPlan = () => {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teacherDesk, setTeacherDesk] = useState<TeacherDesk>(DEFAULT_TEACHER_DESK);
  const [students, setStudents] = useState<Student[]>([]);
  const [separationRules, setSeparationRules] = useState<SeparationRule[]>([]);
  const [doNotUseDeskIds, setDoNotUseDeskIds] = useState<Set<number>>(new Set());
  const [fillFromFront, setFillFromFront] = useState(false);
  const [alternateGender, setAlternateGender] = useState(false);
  const [newRuleStudents, setNewRuleStudents] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [activeTab, setActiveTab] = useState('layout');
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const [isWhiteBackground, setIsWhiteBackground] = useState(false);
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [areIndicatorsVisible, setAreIndicatorsVisible] = useState(true);

  // Memoized group lookup map for better performance
  const groupLookup = useMemo(() => {
    const lookup = new Map<number, Group>();
    groups.forEach(group => {
      group.deskIds.forEach(deskId => {
        lookup.set(deskId, group);
      });
    });
    return lookup;
  }, [groups]);

  const getDeskGroup = useCallback((deskId: number) => {
    return groupLookup.get(deskId);
  }, [groupLookup]);

  // Memoized desk data with groups
  const desksWithGroups = useMemo((): DeskWithGroup[] => {
    const studentMap = new Map(students.map(s => [s.name, s]));
    return desks.map(desk => ({
      ...desk,
      group: getDeskGroup(desk.id),
      studentInfo: desk.student ? studentMap.get(desk.student) : undefined,
    }));
  }, [desks, students, getDeskGroup]);


  // Memoized stats calculations
  const stats = useMemo((): Stats => {
    const maleCount = students.filter(s => s.gender === 'male').length;
    const femaleCount = students.filter(s => s.gender === 'female').length;
    const otherGenderCount = students.length - maleCount - femaleCount;

    return {
      totalDesks: desks.length,
      availableDesks: desks.length - doNotUseDeskIds.size,
      assignedDesks: desks.filter(desk => desk.student).length,
      totalStudents: students.length,
      maleCount,
      femaleCount,
      otherGenderCount,
    };
  }, [desks, students, doNotUseDeskIds]);
  
  const assignedStudentNames = useMemo(() => new Set(desks.map(d => d.student).filter(Boolean)), [desks]);

  const unassignedStudents = useMemo(() => {
    return students.filter(s => !assignedStudentNames.has(s.name));
  }, [students, assignedStudentNames]);

  const unassignedStudentCount = useMemo(() => {
    return unassignedStudents.length;
  }, [unassignedStudents]);

  // Memoized group layouts
  const groupLayouts = useMemo(() => {
    return groups.map(group => {
      const groupDesks = desks.filter(d => group.deskIds.includes(d.id));
      if (groupDesks.length === 0) return null;

      const minX = Math.min(...groupDesks.map(d => d.x));
      const minY = Math.min(...groupDesks.map(d => d.y));

      return {
        id: group.id,
        name: group.name,
        color: group.color,
        x: minX,
        y: minY,
      };
    }).filter(Boolean);
  }, [groups, desks]);

  // Preset loading with proper bounds - FIT WITHIN ACTUAL USABLE SPACE
  const loadComputerRoomPreset = useCallback((canvasSize?: CanvasSize) => {
    const width = canvasSize?.width ?? CANVAS_WIDTH;
    const height = canvasSize?.height ?? CANVAS_HEIGHT;
    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();
    
    const usableWidth = width - (SAFE_MARGIN * 2);
    const usableHeight = height - (SAFE_MARGIN * 2);
    
    const deskWidth = 120;
    const deskHeight = 80;
    const horizontalGap = 80;
    const verticalGap = 70;
    
    const desksPerGroup = 4;
    const groupsPerRow = 2;
    const rows = 4;
    
    const singleGroupWidth = desksPerGroup * deskWidth;
    const totalContentWidth = (singleGroupWidth * groupsPerRow) + horizontalGap;
    
    const startX = Math.max(SAFE_MARGIN, (width - totalContentWidth) / 2);

    const totalContentHeight = (rows * deskHeight) + ((rows - 1) * verticalGap);
    const centeredStartY = (height - totalContentHeight) / 2;
    const startY = Math.max(SAFE_MARGIN + 120, centeredStartY);

    for (let row = 0; row < rows; row++) {
      const yPos = startY + (row * (deskHeight + verticalGap));
      
      if (yPos + deskHeight > height - SAFE_MARGIN) {
        console.warn(`Row ${row} would exceed canvas bounds, stopping`);
        break;
      }
      
      const leftGroupDeskIds: number[] = [];
      for (let i = 0; i < desksPerGroup; i++) {
        const deskId = baseId + (row * desksPerGroup * groupsPerRow) + i;
        const xPos = startX + (i * deskWidth);
        
        if (xPos + deskWidth > width - SAFE_MARGIN) {
          console.warn(`Desk would exceed right bound at x=${xPos}, skipping`);
          break;
        }
        
        leftGroupDeskIds.push(deskId);
        newDesks.push({
          id: deskId,
          x: xPos,
          y: yPos,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
      }
      
      if (leftGroupDeskIds.length > 0) {
        newGroups.push({
          id: baseId + (row * groupsPerRow),
          deskIds: leftGroupDeskIds,
          name: `Row ${row + 1} - Left`,
          color: GROUP_COLORS[0]
        });
      }

      const rightGroupDeskIds: number[] = [];
      const rightGroupStartX = startX + singleGroupWidth + horizontalGap;
      
      for (let i = 0; i < desksPerGroup; i++) {
        const deskId = baseId + (row * desksPerGroup * groupsPerRow) + desksPerGroup + i;
        const xPos = rightGroupStartX + (i * deskWidth);
        
        if (xPos + deskWidth > width - SAFE_MARGIN) {
          console.warn(`Right group desk would exceed bound at x=${xPos}, skipping`);
          break;
        }
        
        rightGroupDeskIds.push(deskId);
        newDesks.push({
          id: deskId,
          x: xPos,
          y: yPos,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
      }
      
      if (rightGroupDeskIds.length > 0) {
        newGroups.push({
          id: baseId + (row * groupsPerRow) + 1,
          deskIds: rightGroupDeskIds,
          name: `Row ${row + 1} - Right`,
          color: GROUP_COLORS[0]
        });
      }
    }

    console.log(`Created ${newDesks.length} desks in ${newGroups.length} groups`);
    console.log(`Layout spans from x=${Math.min(...newDesks.map(d => d.x))} to x=${Math.max(...newDesks.map(d => d.x + d.width))}`);

    setDesks(newDesks);
    setGroups(newGroups);
    
    const teacherDeskWidth = 160;
    const teacherDeskHeight = 80;
    const teacherDeskY = Math.max(SAFE_MARGIN, startY - teacherDeskHeight - verticalGap);

    setTeacherDesk({ 
      x: (width - teacherDeskWidth) / 2, 
      y: teacherDeskY, 
      width: teacherDeskWidth, 
      height: teacherDeskHeight 
    });
    
    setIsPresetDialogOpen(false);
  }, []);

  // Group management
  const handleRenameGroup = useCallback((groupId: number, newName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  }, []);

  const handleSetGroupColor = useCallback((groupId: number, color: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, color } : g));
  }, []);

  const handleDeleteGroup = useCallback((groupId: number) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;
    
    setDesks(prev => prev.filter(desk => !groupToDelete.deskIds.includes(desk.id)));
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, [groups]);

  // Furniture management with PROPER centering
  const addFurniture = useCallback((template: FurnitureTemplate, canvasSize?: CanvasSize) => {
    const baseId = Date.now();
    const width = canvasSize?.width ?? CANVAS_WIDTH;
    const height = canvasSize?.height ?? CANVAS_HEIGHT;
    
    // Calculate the bounding box of the template
    const templateDesks = template.desks;
    if (templateDesks.length === 0) return;
    
    // Find the bounds of the template
    const minTemplateX = Math.min(...templateDesks.map(d => d.x));
    const maxTemplateX = Math.max(...templateDesks.map(d => d.x + d.width));
    const minTemplateY = Math.min(...templateDesks.map(d => d.y));
    const maxTemplateY = Math.max(...templateDesks.map(d => d.y + d.height));
    
    const templateWidth = maxTemplateX - minTemplateX;
    const templateHeight = maxTemplateY - minTemplateY;
    
    // Calculate where to place the template so it's centered on canvas
    const canvasCenterX = width / 2;
    const canvasCenterY = height / 2;
    
    // This is the top-left corner of the template's bounding box, positioned to center it
    const templateOriginX = canvasCenterX - (templateWidth / 2);
    const templateOriginY = canvasCenterY - (templateHeight / 2);
    
    // Offset to align the template's local origin with the canvas position
    const offsetX = templateOriginX - minTemplateX;
    const offsetY = templateOriginY - minTemplateY;
    
    const newDesks = templateDesks.map((desk, index) => {
      // Position the desk by applying the offset
      let x = desk.x + offsetX;
      let y = desk.y + offsetY;
      
      // Constrain to canvas bounds with margin
      x = Math.max(SAFE_MARGIN, Math.min(x, width - desk.width - SAFE_MARGIN));
      y = Math.max(SAFE_MARGIN, Math.min(y, height - desk.height - SAFE_MARGIN));
      
      return {
        id: baseId + index,
        x,
        y,
        width: desk.width,
        height: desk.height,
        student: null,
        isLocked: false,
      };
    });
    
    if (template.desks.length > 1) {
      const newGroup = {
        id: baseId,
        deskIds: newDesks.map(desk => desk.id),
        name: template.name,
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      };
      setGroups(prev => [...prev, newGroup]);
    }
    
    setDesks(prev => [...prev, ...newDesks]);
  }, [groups.length]);

  const removeDesk = useCallback((deskIdToRemove: number) => {
    setDesks(currentDesks => currentDesks.filter(desk => desk.id !== deskIdToRemove));
    
    setGroups(currentGroups => {
      const updatedGroups = currentGroups.map(group => {
        if (!group.deskIds.includes(deskIdToRemove)) {
          return group;
        }
        return {
          ...group,
          deskIds: group.deskIds.filter(id => id !== deskIdToRemove)
        };
      });
      
      return updatedGroups.filter(group => group.deskIds.length > 1);
    });
  }, []);

  // Student management
  const parseStudents = useCallback(() => {
    const parsed = parseStudentInput(studentInput);
    setStudents(parsed);
  }, [studentInput]);

  const removeStudent = useCallback((studentId: number) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  }, []);
  
  const updateStudentGender = useCallback((studentId: number, gender: 'male' | 'female') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, gender } : s));
  }, []);

  const updateStudentSEND = useCallback((studentId: number, isSEND: boolean) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isSEND } : s));
  }, []);


  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setStudentInput(text);
    };
    reader.readAsText(file);
  }, []);

  // Rules and manual assignment
  const addSeparationRule = useCallback(() => {
    const studentNames = validateSeparationRule(newRuleStudents);
    if (studentNames.length === 0) return;
    
    const newRule = {
      id: Date.now(),
      students: studentNames,
      description: studentNames.join(', ') + ' cannot sit together'
    };
    
    setSeparationRules(currentRules => [...currentRules, newRule]);
    setNewRuleStudents('');
  }, [newRuleStudents]);

  const removeSeparationRule = useCallback((ruleId: number) => {
    setSeparationRules(currentRules => currentRules.filter(rule => rule.id !== ruleId));
  }, []);

  const handleToggleDoNotUseDesk = useCallback((deskId: number, checked?: boolean) => {
    setDoNotUseDeskIds(prev => {
        const newSet = new Set(prev);
        const isCurrentlyExcluded = newSet.has(deskId);
        const shouldExclude = checked !== undefined ? checked : !isCurrentlyExcluded;

        if (shouldExclude) {
            newSet.add(deskId);
        } else {
            newSet.delete(deskId);
        }
        return newSet;
    });

    setDesks(prevDesks => 
        prevDesks.map(d => 
            d.id === deskId ? { ...d, student: null, isLocked: false } : d
        )
    );
  }, []);

  const handleManualAssign = useCallback((deskId: number, studentName: string | null) => {
    setDesks(prev => prev.map(desk => {
      if (desk.id === deskId) {
        return { ...desk, student: studentName, isLocked: !!studentName };
      }
      // If this student was previously locked somewhere else, unlock that desk
      if (desk.isLocked && desk.student === studentName) {
        return { ...desk, student: null, isLocked: false };
      }
      return desk;
    }));
  }, []);

  // Desk ordering
  const autoRenumberDesks = useCallback(() => {
    const sorted = sortDesksByPosition(desks);
    setDesks(sorted);
  }, [desks]);

  return {
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

    // Constants
    furnitureTemplates: FURNITURE_TEMPLATES,
  };
};
