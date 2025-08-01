
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/shared/use-toast';
import { getAdjacentDeskIds } from '../utils/calculations';
import { canSitTogether } from '../utils/validation';
import type { Desk, Student, SeparationRule, Group } from '../types';

export const useStudentAssignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const autoAssignStudents = useCallback((
    students: Student[],
    desks: Desk[],
    doNotUseDeskIds: Set<number>,
    separationRules: SeparationRule[],
    fillFromFront: boolean,
    alternateGender: boolean,
    getDeskGroup: (id: number) => Group | undefined,
    setDesks: (updater: (prev: Desk[]) => Desk[]) => void
  ) => {
    setIsLoading(true);

    const studentMap = new Map(students.map(s => [s.name, s]));
    const lockedDesks = desks.filter(d => d.isLocked && d.student);
    const lockedStudents = new Set(lockedDesks.map(d => d.student));

    const availableDesks = desks.filter(desk => !doNotUseDeskIds.has(desk.id) && !desk.isLocked);
    const studentsToPlace = students.filter(student => !lockedStudents.has(student.name));
    
    if (studentsToPlace.length > availableDesks.length) {
      toast({
        title: "Not Enough Desks",
        description: `There are ${studentsToPlace.length} students to place but only ${availableDesks.length} available non-locked desks.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Separate students by gender for alternation logic
    const maleStudents = studentsToPlace.filter(s => s.gender === 'male');
    const femaleStudents = studentsToPlace.filter(s => s.gender === 'female');
    const otherStudents = studentsToPlace.filter(s => s.gender !== 'male' && s.gender !== 'female');

    // Randomize each list
    maleStudents.sort(() => Math.random() - 0.5);
    femaleStudents.sort(() => Math.random() - 0.5);
    otherStudents.sort(() => Math.random() - 0.5);
    
    const deskOrder = fillFromFront 
      ? [...availableDesks]
      : [...availableDesks].sort(() => Math.random() - 0.5);

    const solve = (
      currentAssignment: Record<number, string>, 
      males: Student[], 
      females: Student[], 
      others: Student[],
      deskOrder: Desk[]
    ): Record<number, string> | null => {
      if (males.length === 0 && females.length === 0 && others.length === 0) {
        return currentAssignment;
      }

      const lastPlacedGender = (() => {
          const lastDeskId = Object.keys(currentAssignment).pop();
          if(!lastDeskId) return null;
          const lastStudentName = currentAssignment[parseInt(lastDeskId)];
          if(!lastStudentName) return null;
          return studentMap.get(lastStudentName)?.gender || null;
      })();

      let nextStudentList: Student[];
      let remainingMales = males;
      let remainingFemales = females;

      if (alternateGender && lastPlacedGender === 'male' && females.length > 0) {
          nextStudentList = females;
      } else if (alternateGender && lastPlacedGender === 'female' && males.length > 0) {
          nextStudentList = males;
      } else {
            // Default to balancing the lists or picking the larger one
          if (males.length > females.length) {
              nextStudentList = males;
          } else {
              nextStudentList = females;
          }
      }
      
      if (nextStudentList.length === 0) {
            nextStudentList = others.length > 0 ? others : (males.length > 0 ? males : females);
      }

      const studentToPlace = nextStudentList[0];
      if (!studentToPlace) { // Should not happen if logic is correct
          return solve(currentAssignment, [], [], others, deskOrder);
      }

      const getUpdatedLists = (student: Student) => {
          if (student.gender === 'male') return { m: males.slice(1), f: females, o: others };
          if (student.gender === 'female') return { m: males, f: females.slice(1), o: others };
          return { m: males, f: females, o: others.slice(1) };
      };
      const { m, f, o } = getUpdatedLists(studentToPlace);
      
      const getPlacementScore = (deskId: number): number => {
          if (!alternateGender || !studentToPlace.gender) return 0;

          const adjacentDeskIds = getAdjacentDeskIds(deskId, desks, getDeskGroup);
          let oppositeGenderNeighbors = 0;
          let sameGenderNeighbors = 0;

          for (const adjacentId of adjacentDeskIds) {
              const neighborStudentName = currentAssignment[adjacentId];
              if (neighborStudentName) {
                  const neighborStudent = studentMap.get(neighborStudentName);
                  if (neighborStudent?.gender) {
                      if (studentToPlace.gender !== neighborStudent.gender) {
                          oppositeGenderNeighbors++;
                      } else {
                          sameGenderNeighbors++;
                      }
                  }
              }
          }

          if (oppositeGenderNeighbors > 0) return 2; // Best case: next to opposite gender
          if (sameGenderNeighbors > 0) return 0; // Worst case: next to same gender
          return 1; // Neutral: no neighbors yet
      };

      const sortedDeskOrder = [...deskOrder].sort((a, b) => {
            if (currentAssignment[a.id] || currentAssignment[b.id]) return 0;
            return getPlacementScore(b.id) - getPlacementScore(a.id);
      });

      for (const desk of sortedDeskOrder) {
        if (currentAssignment[desk.id]) continue;

        let isValidPlacement = true;
        const adjacentDeskIds = getAdjacentDeskIds(desk.id, desks, getDeskGroup);

        for (const adjacentId of adjacentDeskIds) {
          const neighborStudentName = currentAssignment[adjacentId];
          if (neighborStudentName && !canSitTogether(studentToPlace.name, neighborStudentName, separationRules)) {
            isValidPlacement = false;
            break;
          }
        }

        if (isValidPlacement) {
          const newAssignment = { ...currentAssignment, [desk.id]: studentToPlace.name };
          const result = solve(newAssignment, m, f, o, deskOrder);
          if (result) return result;
        }
      }
      return null;
    };
    
    let initialAssignment: Record<number, string> = {};
    lockedDesks.forEach(d => {
        if (d.student) initialAssignment[d.id] = d.student;
    });
    
    let finalAssignment = solve(initialAssignment, maleStudents, femaleStudents, otherStudents, deskOrder);

    if (finalAssignment) {
        setDesks(prevDesks => prevDesks.map(desk => ({
            ...desk,
            student: desk.isLocked ? desk.student : (finalAssignment![desk.id] || null)
        })));
        toast({
            title: "Success!",
            description: "Students have been assigned to desks.",
        });
    } else {
        toast({
            title: "Assignment Failed",
            description: "Could not find a valid seating arrangement. Try adjusting your rules or layout.",
            variant: "destructive",
        });
    }

    setIsLoading(false);
  }, [toast]);

  const clearAssignments = useCallback((setDesks: (updater: (prev: Desk[]) => Desk[]) => void) => {
    setDesks(currentDesks => currentDesks.map(desk => (
      desk.isLocked ? desk : { ...desk, student: null }
    )));
  }, []);

  return { isLoading, autoAssignStudents, clearAssignments };
};
