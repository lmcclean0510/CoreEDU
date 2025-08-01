import { useState, useCallback, useMemo } from 'react';
import { GROUP_COLORS, DEFAULT_TEACHER_DESK, FURNITURE_TEMPLATES } from '../utils/constants';
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

  // Preset loading
  const loadComputerRoomPreset = useCallback(() => {
    const newDesks: Desk[] = [];
    const newGroups: Group[] = [];
    const baseId = Date.now();
    const deskWidth = 120;
    const deskHeight = 80;
    const horizontalGap = 80;
    const verticalGap = 80;

    const desksInFirstGroup = 4;
    const totalGroupWidth = desksInFirstGroup * deskWidth;
    const totalRowWidth = totalGroupWidth * 2 + horizontalGap;
    const startX = (1403 - totalRowWidth) / 2;
    const startY = 160;

    for (let row = 0; row < 4; row++) {
      const yPos = startY + row * (deskHeight + verticalGap);
      
      // Left group
      const leftGroupDeskIds: number[] = [];
      for (let i = 0; i < 4; i++) {
        const deskId = baseId + row * 8 + i;
        leftGroupDeskIds.push(deskId);
        newDesks.push({
          id: deskId,
          x: startX + i * deskWidth,
          y: yPos,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
      }
      newGroups.push({
        id: baseId + row * 2,
        deskIds: leftGroupDeskIds,
        name: `Row ${row + 1} - Left`,
        color: GROUP_COLORS[0]
      });

      // Right group
      const rightGroupDeskIds: number[] = [];
      const rightGroupStartX = startX + totalGroupWidth + horizontalGap;
      for (let i = 0; i < 4; i++) {
        const deskId = baseId + row * 8 + 4 + i;
        rightGroupDeskIds.push(deskId);
        newDesks.push({
          id: deskId,
          x: rightGroupStartX + i * deskWidth,
          y: yPos,
          width: deskWidth,
          height: deskHeight,
          student: null,
          isLocked: false,
        });
      }
       newGroups.push({
        id: baseId + row * 2 + 1,
        deskIds: rightGroupDeskIds,
        name: `Row ${row + 1} - Right`,
        color: GROUP_COLORS[0]
      });
    }

    setDesks(newDesks);
    setGroups(newGroups);
    setTeacherDesk({ x: (1403 - 160) / 2, y: 20, width: 160, height: 80 });
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

  // Furniture management
  const addFurniture = useCallback((template: FurnitureTemplate) => {
    const baseId = Date.now();
    const centerX = 1403 / 2;
    const centerY = 1003 / 2;
    
    const newDesks = template.desks.map((desk, index) => ({
      id: baseId + index,
      x: centerX + desk.x,
      y: centerY + desk.y,
      width: desk.width,
      height: desk.height,
      student: null,
      isLocked: false,
    }));
    
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
