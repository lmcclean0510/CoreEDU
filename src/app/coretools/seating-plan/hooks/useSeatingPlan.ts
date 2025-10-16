import { useState, useCallback, useMemo } from 'react';
import { GROUP_COLORS, DEFAULT_TEACHER_DESK, FURNITURE_TEMPLATES, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_DESK_WIDTH, DEFAULT_DESK_HEIGHT, PRESET_LAYOUTS } from '../utils/constants';
import { parseStudentInput, validateSeparationRule } from '../utils/validation';
import { sortDesksByPosition } from '../utils/calculations';
import type { Desk, Group, Student, SeparationRule, TeacherDesk, FurnitureTemplate, DeskWithGroup, Stats } from '../types';

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
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const [isWhiteBackground, setIsWhiteBackground] = useState(true);
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

  // Load Preset 1 (Rows layout) - 4 rows of 8 desks = 32 total
  const loadPreset1 = useCallback(() => {
    console.log('🎯 Loading Preset 1 - Rows');

    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();

    const preset = PRESET_LAYOUTS.PRESET_1;
    const deskWidth = preset.deskWidth;
    const deskHeight = preset.deskHeight;
    const desksPerRow = preset.desksPerRow;
    const rows = preset.rows;
    const gapBetweenGroups = preset.gapBetweenGroups;
    const gapBetweenRows = preset.rowGap;

    const totalWidth = (desksPerRow * deskWidth) + gapBetweenGroups;
    const totalHeight = (rows * deskHeight) + ((rows - 1) * gapBetweenRows);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = DEFAULT_TEACHER_DESK.y + DEFAULT_TEACHER_DESK.height + GRID_SIZE;

    for (let row = 0; row < rows; row++) {
      const y = startY + (row * (deskHeight + gapBetweenRows));

      // Left group (4 desks)
      const leftGroupDeskIds: number[] = [];
      for (let i = 0; i < 4; i++) {
        const deskId = baseId + (row * desksPerRow) + i;
        const x = startX + (i * deskWidth);

        newDesks.push({
          id: deskId,
          x,
          y,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
        leftGroupDeskIds.push(deskId);
      }

      newGroups.push({
        id: baseId + (row * 2),
        deskIds: leftGroupDeskIds,
        name: `Row ${row + 1} - Left`,
        color: GROUP_COLORS[0]
      });

      // Right group (4 desks)
      const rightGroupDeskIds: number[] = [];
      const rightStartX = startX + (4 * deskWidth) + gapBetweenGroups;

      for (let i = 0; i < 4; i++) {
        const deskId = baseId + (row * desksPerRow) + 4 + i;
        const x = rightStartX + (i * deskWidth);

        newDesks.push({
          id: deskId,
          x,
          y,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
        rightGroupDeskIds.push(deskId);
      }

      newGroups.push({
        id: baseId + (row * 2) + 1,
        deskIds: rightGroupDeskIds,
        name: `Row ${row + 1} - Right`,
        color: GROUP_COLORS[0]
      });
    }

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk(DEFAULT_TEACHER_DESK);
    setIsPresetDialogOpen(false);
  }, []);

  // Alias for backwards compatibility
  const loadComputerRoomPreset = loadPreset1;

  // Load Preset 2 (Groups layout) - 4 groups of 6 desks = 24 total
  const loadPreset2 = useCallback(() => {
    console.log('🎯 Loading Preset 2 - Groups');

    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();

    const preset = PRESET_LAYOUTS.PRESET_2;
    const deskWidth = preset.deskWidth;
    const deskHeight = preset.deskHeight;
    const desksPerRow = preset.desksPerRow;
    const rows = preset.rows;
    const gapBetweenGroups = preset.gapBetweenGroups;
    const gapBetweenRows = preset.rowGap;

    // Each group is 3 desks wide
    const groupWidth = 3 * deskWidth;
    const totalWidth = (2 * groupWidth) + gapBetweenGroups;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = DEFAULT_TEACHER_DESK.y + DEFAULT_TEACHER_DESK.height + GRID_SIZE;

    let deskCounter = 0;
    for (let row = 0; row < 2; row++) { // 2 rows of groups
      const y = startY + (row * (2 * deskHeight + gapBetweenRows));

      for (let groupCol = 0; groupCol < 2; groupCol++) { // 2 groups per row
        const groupDeskIds: number[] = [];
        const groupX = startX + (groupCol * (groupWidth + gapBetweenGroups));

        // Create 2 rows of 3 desks for this group
        for (let deskRow = 0; deskRow < 2; deskRow++) {
          for (let deskCol = 0; deskCol < 3; deskCol++) {
            const deskId = baseId + deskCounter++;
            const x = groupX + (deskCol * deskWidth);
            const deskY = y + (deskRow * deskHeight);

            newDesks.push({
              id: deskId,
              x,
              y: deskY,
              width: deskWidth,
              height: deskHeight,
              student: null,
              isLocked: false,
            });
            groupDeskIds.push(deskId);
          }
        }

        newGroups.push({
          id: baseId + (row * 2 + groupCol),
          deskIds: groupDeskIds,
          name: `Group ${row * 2 + groupCol + 1}`,
          color: GROUP_COLORS[(row * 2 + groupCol) % GROUP_COLORS.length]
        });
      }
    }

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk(DEFAULT_TEACHER_DESK);
    setIsPresetDialogOpen(false);
  }, []);

  // Load Preset 3 (U-Shape layout) - 20 desks in U formation
  const loadPreset3 = useCallback(() => {
    console.log('🎯 Loading Preset 3 - U-Shape');

    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();

    const preset = PRESET_LAYOUTS.PRESET_3;
    const deskWidth = preset.deskWidth;
    const deskHeight = preset.deskHeight;

    const padding = 96;
    const startY = DEFAULT_TEACHER_DESK.y + DEFAULT_TEACHER_DESK.height + padding;

    // Top row - 7 desks
    const topGroupIds: number[] = [];
    const topRowWidth = 7 * deskWidth;
    const topRowX = (CANVAS_WIDTH - topRowWidth) / 2;

    for (let i = 0; i < 7; i++) {
      const deskId = baseId + i;
      newDesks.push({
        id: deskId,
        x: topRowX + (i * deskWidth),
        y: startY,
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      topGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId,
      deskIds: topGroupIds,
      name: 'U-Shape Top',
      color: GROUP_COLORS[0]
    });

    // Left column - 5 desks
    const leftGroupIds: number[] = [];
    const leftColX = topRowX;

    for (let i = 0; i < 5; i++) {
      const deskId = baseId + 7 + i;
      newDesks.push({
        id: deskId,
        x: leftColX,
        y: startY + ((i + 1) * (deskHeight + 24)),
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      leftGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId + 1,
      deskIds: leftGroupIds,
      name: 'U-Shape Left',
      color: GROUP_COLORS[0]
    });

    // Right column - 5 desks
    const rightGroupIds: number[] = [];
    const rightColX = topRowX + (6 * deskWidth);

    for (let i = 0; i < 5; i++) {
      const deskId = baseId + 12 + i;
      newDesks.push({
        id: deskId,
        x: rightColX,
        y: startY + ((i + 1) * (deskHeight + 24)),
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      rightGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId + 2,
      deskIds: rightGroupIds,
      name: 'U-Shape Right',
      color: GROUP_COLORS[0]
    });

    // Bottom row - 3 desks (closing the U slightly)
    const bottomGroupIds: number[] = [];
    const bottomRowWidth = 3 * deskWidth;
    const bottomRowX = (CANVAS_WIDTH - bottomRowWidth) / 2;
    const bottomY = startY + (6 * (deskHeight + 24));

    for (let i = 0; i < 3; i++) {
      const deskId = baseId + 17 + i;
      newDesks.push({
        id: deskId,
        x: bottomRowX + (i * deskWidth),
        y: bottomY,
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      bottomGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId + 3,
      deskIds: bottomGroupIds,
      name: 'U-Shape Bottom',
      color: GROUP_COLORS[0]
    });

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk(DEFAULT_TEACHER_DESK);
    setIsPresetDialogOpen(false);
  }, []);

  // Load Preset 4 (Tables layout) - 6 tables of 4 desks = 24 total
  const loadPreset4 = useCallback(() => {
    console.log('🎯 Loading Preset 4 - Tables');

    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();

    const preset = PRESET_LAYOUTS.PRESET_4;
    const deskWidth = preset.deskWidth;
    const deskHeight = preset.deskHeight;
    const rows = preset.rows;
    const columns = preset.columns;
    const gapBetweenTables = preset.gapBetweenTables;
    const rowGap = preset.rowGap;

    // Each table is 2x2 desks
    const tableWidth = 2 * deskWidth;
    const tableHeight = 2 * deskHeight;

    const totalWidth = (columns * tableWidth) + ((columns - 1) * gapBetweenTables);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = DEFAULT_TEACHER_DESK.y + DEFAULT_TEACHER_DESK.height + GRID_SIZE;

    let tableCounter = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 2; col++) { // 2 tables per row
        const tableDeskIds: number[] = [];
        const tableX = startX + (col * (tableWidth + gapBetweenTables));
        const tableY = startY + (row * (tableHeight + rowGap));

        // Create 2x2 desks for this table
        for (let deskRow = 0; deskRow < 2; deskRow++) {
          for (let deskCol = 0; deskCol < 2; deskCol++) {
            const deskId = baseId + (tableCounter * 4) + (deskRow * 2) + deskCol;
            const x = tableX + (deskCol * deskWidth);
            const y = tableY + (deskRow * deskHeight);

            newDesks.push({
              id: deskId,
              x,
              y,
              width: deskWidth,
              height: deskHeight,
              student: null,
              isLocked: false,
            });
            tableDeskIds.push(deskId);
          }
        }

        newGroups.push({
          id: baseId + tableCounter,
          deskIds: tableDeskIds,
          name: `Table ${tableCounter + 1}`,
          color: GROUP_COLORS[tableCounter % GROUP_COLORS.length]
        });

        tableCounter++;
      }
    }

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk(DEFAULT_TEACHER_DESK);
    setIsPresetDialogOpen(false);
  }, []);

  // Load Preset 5 (Horseshoe layout) - 18 desks in semicircle
  const loadPreset5 = useCallback(() => {
    console.log('🎯 Loading Preset 5 - Horseshoe');

    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();

    const preset = PRESET_LAYOUTS.PRESET_5;
    const deskWidth = preset.deskWidth;
    const deskHeight = preset.deskHeight;

    const startY = DEFAULT_TEACHER_DESK.y + DEFAULT_TEACHER_DESK.height + 96;

    // Top row - 6 desks
    const topGroupIds: number[] = [];
    const topRowWidth = 6 * deskWidth;
    const topRowX = (CANVAS_WIDTH - topRowWidth) / 2;

    for (let i = 0; i < 6; i++) {
      const deskId = baseId + i;
      newDesks.push({
        id: deskId,
        x: topRowX + (i * deskWidth),
        y: startY,
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      topGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId,
      deskIds: topGroupIds,
      name: 'Horseshoe Top',
      color: GROUP_COLORS[0]
    });

    // Left arc - 6 desks
    const leftGroupIds: number[] = [];
    const leftX = topRowX - deskWidth;

    for (let i = 0; i < 6; i++) {
      const deskId = baseId + 6 + i;
      newDesks.push({
        id: deskId,
        x: leftX - (i * 24), // Slight curve
        y: startY + ((i + 1) * (deskHeight + 12)),
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      leftGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId + 1,
      deskIds: leftGroupIds,
      name: 'Horseshoe Left',
      color: GROUP_COLORS[0]
    });

    // Right arc - 6 desks
    const rightGroupIds: number[] = [];
    const rightX = topRowX + topRowWidth;

    for (let i = 0; i < 6; i++) {
      const deskId = baseId + 12 + i;
      newDesks.push({
        id: deskId,
        x: rightX + (i * 24), // Slight curve
        y: startY + ((i + 1) * (deskHeight + 12)),
        width: deskWidth,
        height: deskHeight,
        student: null,
        isLocked: false,
      });
      rightGroupIds.push(deskId);
    }

    newGroups.push({
      id: baseId + 2,
      deskIds: rightGroupIds,
      name: 'Horseshoe Right',
      color: GROUP_COLORS[0]
    });

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk(DEFAULT_TEACHER_DESK);
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

  // Add furniture - simplified to always use canvas constants
  const addFurniture = useCallback((template: FurnitureTemplate) => {
    const baseId = Date.now();
    const templateDesks = template.desks;
    if (templateDesks.length === 0) return;
    
    // Find template bounds
    const minX = Math.min(...templateDesks.map(d => d.x));
    const maxX = Math.max(...templateDesks.map(d => d.x + d.width));
    const minY = Math.min(...templateDesks.map(d => d.y));
    const maxY = Math.max(...templateDesks.map(d => d.y + d.height));
    
    const templateWidth = maxX - minX;
    const templateHeight = maxY - minY;
    
    // Center on canvas
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    
    const offsetX = centerX - (templateWidth / 2) - minX;
    const offsetY = centerY - (templateHeight / 2) - minY;
    
    const newDesks = templateDesks.map((desk, index) => ({
      id: baseId + index,
      x: desk.x + offsetX,
      y: desk.y + offsetY,
      width: desk.width,
      height: desk.height,
      student: null,
      isLocked: false,
    }));
    
    // Create group if multiple desks
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
    loadPreset1,
    loadPreset2,
    loadPreset3,
    loadPreset4,
    loadPreset5,
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
