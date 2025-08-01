import type { SeparationRule } from '../types';

export const canSitTogether = (
  student1Name: string | null, 
  student2Name: string | null, 
  separationRules: SeparationRule[]
): boolean => {
  if (!student1Name || !student2Name) return true;
  
  for (const rule of separationRules) {
    if (rule.students.includes(student1Name) && rule.students.includes(student2Name)) {
      return false;
    }
  }
  return true;
};

export const parseStudentInput = (input: string) => {
  const lines = input.split('\n').filter(line => line.trim());
  return lines.map((line, index) => ({
    id: Date.now() + index,
    name: line.trim(),
    gender: null,
    isSEND: false,
  }));
};

export const validateSeparationRule = (input: string): string[] => {
  const studentNames = input.split(',').map(name => name.trim()).filter(name => name);
  return studentNames.length >= 2 ? studentNames : [];
};
