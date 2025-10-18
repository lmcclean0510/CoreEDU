// src/app/admin/hooks/usePuzzleJsonImport.ts
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import type { PuzzleFormData } from './useAdminPuzzles';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

export function usePuzzleJsonImport() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<PuzzleFormData[]>([]);

  // Validate required fields for puzzles
  const validatePuzzle = (puzzle: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = ['title', 'description', 'challengeLevel', 'expectedOutput'];
    
    requiredFields.forEach(field => {
      if (!puzzle[field] || (typeof puzzle[field] === 'string' && puzzle[field].trim() === '')) {
        errors.push({
          index,
          field,
          message: `${field} is required`
        });
      }
    });

    // Validate challengeLevel is a number
    if (puzzle.challengeLevel && (isNaN(puzzle.challengeLevel) || puzzle.challengeLevel < 1)) {
      errors.push({
        index,
        field: 'challengeLevel',
        message: 'challengeLevel must be a positive number'
      });
    }

    // Validate array fields exist and are arrays
    const arrayFields = ['initialBlocks', 'solution'];
    arrayFields.forEach(field => {
      if (puzzle[field] && !Array.isArray(puzzle[field])) {
        errors.push({
          index,
          field,
          message: `${field} must be an array`
        });
      }
    });

    return errors;
  };

  // Parse and validate JSON input
  const parseJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of puzzles');
      }

      const errors: ValidationError[] = [];
      const validPuzzles: PuzzleFormData[] = [];

      parsed.forEach((item, index) => {
        const itemErrors = validatePuzzle(item, index);
        errors.push(...itemErrors);

        // If no errors for this item, add it to valid puzzles
        if (itemErrors.length === 0) {
          validPuzzles.push({
            title: item.title,
            description: item.description,
            skillSection: item.skillSection || '',
            sectionId: item.sectionId || '',
            challengeLevel: parseInt(item.challengeLevel),
            codeSnippet: item.codeSnippet || '',
            initialBlocks: item.initialBlocks || [],
            solution: item.solution || [],
            expectedOutput: item.expectedOutput,
            isDynamic: Boolean(item.isDynamic),
            inputPrompt: item.inputPrompt || ''
          });
        }
      });

      setValidationErrors(errors);
      setPreviewData(validPuzzles);
      
      return {
        isValid: errors.length === 0,
        validCount: validPuzzles.length,
        totalCount: parsed.length,
        errors
      };
    } catch (error) {
      const parseError: ValidationError = {
        index: -1,
        field: 'json',
        message: error instanceof Error ? error.message : 'Invalid JSON format'
      };
      setValidationErrors([parseError]);
      setPreviewData([]);
      return {
        isValid: false,
        validCount: 0,
        totalCount: 0,
        errors: [parseError]
      };
    }
  };

  // Import puzzles to Firestore
  const importPuzzles = async (): Promise<ImportResult> => {
    if (previewData.length === 0) {
      throw new Error('No valid puzzles to import');
    }

    setIsImporting(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const puzzle of previewData) {
        try {
          
          await addDoc(collection(db, 'puzzles'), {
            ...puzzle,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          success++;
        } catch (error) {
          failed++;
          const errorMessage = `Failed to import "${puzzle.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      const result = { success, failed, errors };

      // Show toast notification
      if (failed === 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${success} puzzles.`
        });
      } else {
        toast({
          title: 'Import Partially Successful',
          description: `Imported ${success} puzzles, ${failed} failed.`,
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsImporting(false);
    }
  };

  // Clear all data
  const reset = () => {
    setJsonInput('');
    setValidationErrors([]);
    setPreviewData([]);
  };

  // Get template JSON
  const getTemplate = () => {
    return JSON.stringify([
      {
        "title": "Basic Print Statement",
        "description": "Create a simple program that prints 'Hello, World!' to the console",
        "skillSection": "Basic Output",
        "sectionId": "basic-output",
        "challengeLevel": 1,
        "codeSnippet": "print('Hello, World!')",
        "initialBlocks": [
          "print('Hello, World!')"
        ],
        "solution": [
          "print('Hello, World!')"
        ],
        "expectedOutput": "Hello, World!",
        "isDynamic": false,
        "inputPrompt": ""
      },
      {
        "title": "Variables and Output",
        "description": "Create variables and print their values",
        "skillSection": "Variables",
        "sectionId": "variables",
        "challengeLevel": 5,
        "codeSnippet": "name = 'Alice'\nage = 25\nprint(f'My name is {name} and I am {age} years old')",
        "initialBlocks": [
          "name = 'Alice'",
          "age = 25",
          "print(f'My name is {name} and I am {age} years old')"
        ],
        "solution": [
          "name = 'Alice'",
          "age = 25",
          "print(f'My name is {name} and I am {age} years old')"
        ],
        "expectedOutput": "My name is Alice and I am 25 years old",
        "isDynamic": true,
        "inputPrompt": "Enter your name"
      }
    ], null, 2);
  };

  return {
    // State
    jsonInput,
    validationErrors,
    previewData,
    isImporting,
    
    // Actions
    setJsonInput,
    parseJson,
    importPuzzles,
    reset,
    getTemplate,
    
    // Computed
    hasValidData: previewData.length > 0,
    hasErrors: validationErrors.length > 0
  };
}