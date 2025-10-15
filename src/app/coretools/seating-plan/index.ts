export { default as SeatingPlanTool } from './SeatingPlanTool';
export { default as DraggableItem } from './components/DraggableItem';
export { default as DraggableTeacherDesk } from './components/DraggableTeacherDesk';
export { default as GroupControl } from './components/GroupControl';
export { default as StudentsPanel } from './components/StudentsPanel';
export { default as RulesPanel } from './components/RulesPanel';

export { useSeatingPlan } from './hooks/useSeatingPlan';
export { useDragAndDrop } from './hooks/useDragAndDrop';
export { useStudentAssignment } from './hooks/useStudentAssignment';
export { useExport } from './hooks/useExport';

export * from './types';
export * from './utils/constants';
export * from './utils/calculations';
export * from './utils/validation';
