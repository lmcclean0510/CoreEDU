export interface Desk {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    student: string | null;
    isLocked: boolean;
  }
  
  export interface Group {
    id: number;
    deskIds: number[];
    name: string;
    color: string;
  }
  
  export interface Student {
    id: number;
    name: string;
    gender: 'male' | 'female' | null;
    isSEND: boolean;
  }
  
  export interface SeparationRule {
    id: number;
    students: string[];
    description: string;
  }
  
  export interface TeacherDesk {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface FurnitureTemplate {
    id: string;
    name: string;
    icon: string;
    isTeacherDesk?: boolean;
    desks: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }
  
  export interface DeskWithGroup extends Desk {
    group?: Group;
    studentInfo?: Student;
  }
  
  export interface Stats {
    totalDesks: number;
    availableDesks: number;
    assignedDesks: number;
    totalStudents: number;
    maleCount: number;
    femaleCount: number;
    otherGenderCount: number;
  }
