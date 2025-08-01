// src/app/admin/hooks/useJsonImport.ts
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import type { FlashcardFormData } from './useAdminFlashcards';

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

export function useJsonImport() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<FlashcardFormData[]>([]);

  // Validate required fields for flashcards
  const validateFlashcard = (flashcard: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = ['subject', 'examBoard', 'specification', 'topic', 'subTopic', 'term', 'definition'];
    
    requiredFields.forEach(field => {
      if (!flashcard[field] || flashcard[field].trim() === '') {
        errors.push({
          index,
          field,
          message: `${field} is required`
        });
      }
    });

    // Validate array fields exist and are arrays
    const arrayFields = ['alternativeDefinitions', 'examples', 'relatedTerms', 'hints'];
    arrayFields.forEach(field => {
      if (flashcard[field] && !Array.isArray(flashcard[field])) {
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
        throw new Error('JSON must be an array of flashcards');
      }

      const errors: ValidationError[] = [];
      const validFlashcards: FlashcardFormData[] = [];

      parsed.forEach((item, index) => {
        const itemErrors = validateFlashcard(item, index);
        errors.push(...itemErrors);

        // If no errors for this item, add it to valid flashcards
        if (itemErrors.length === 0) {
          validFlashcards.push({
            subject: item.subject,
            examBoard: item.examBoard,
            specification: item.specification,
            specificationCode: item.specificationCode || '',
            specificationPoint: item.specificationPoint || '',
            topic: item.topic,
            subTopic: item.subTopic,
            term: item.term,
            definition: item.definition,
            alternativeDefinitions: item.alternativeDefinitions || [],
            simpleDefinition: item.simpleDefinition || '',
            examples: item.examples || [],
            relatedTerms: item.relatedTerms || [],
            hints: item.hints || []
          });
        }
      });

      setValidationErrors(errors);
      setPreviewData(validFlashcards);
      
      return {
        isValid: errors.length === 0,
        validCount: validFlashcards.length,
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

  // Import flashcards to Firestore
  const importFlashcards = async (): Promise<ImportResult> => {
    if (previewData.length === 0) {
      throw new Error('No valid flashcards to import');
    }

    setIsImporting(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const flashcard of previewData) {
        try {
          console.log(`%c[Firestore Write] %cImporting flashcard: ${flashcard.term}`, 'color: #8b5cf6', 'color: default');
          
          await addDoc(collection(db, 'flashcards'), {
            ...flashcard,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          success++;
        } catch (error) {
          failed++;
          const errorMessage = `Failed to import "${flashcard.term}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }

      const result = { success, failed, errors };

      // Show toast notification
      if (failed === 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${success} flashcards.`
        });
      } else {
        toast({
          title: 'Import Partially Successful',
          description: `Imported ${success} flashcards, ${failed} failed.`,
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

  // Get template JSON using real flashcard data
  const getTemplate = () => {
    return JSON.stringify([
      {
        "subject": "Computer Science",
        "examBoard": "AQA",
        "specification": "GCSE Computer Science",
        "specificationCode": "8525",
        "specificationPoint": "3.1.1",
        "topic": "3 Programming",
        "subTopic": "3.1 Fundamentals of Programming",
        "term": "Variable",
        "definition": "A named storage location that can hold different values during program execution",
        "alternativeDefinitions": [
          "A container for data",
          "Memory location with a name"
        ],
        "simpleDefinition": "A box that stores information",
        "examples": [
          "score = 10",
          "name = 'John'",
          "isComplete = true"
        ],
        "relatedTerms": [
          "constant",
          "identifier",
          "data type"
        ],
        "hints": [
          "Think of it like a labeled box",
          "The value can change"
        ]
      },
      {
        "subject": "Computer Science",
        "examBoard": "AQA",
        "specification": "GCSE Computer Science",
        "specificationCode": "8525",
        "specificationPoint": "3.1.2",
        "topic": "3 Programming",
        "subTopic": "3.1 Fundamentals of Programming",
        "term": "Constant",
        "definition": "A named value that cannot be changed during program execution",
        "alternativeDefinitions": [
          "Immutable variable",
          "Fixed value"
        ],
        "simpleDefinition": "A value that never changes",
        "examples": [
          "PI = 3.14159",
          "MAX_SIZE = 100"
        ],
        "relatedTerms": [
          "variable",
          "literal",
          "final"
        ],
        "hints": [
          "Think of mathematical constants",
          "Set once, never changes"
        ]
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
    importFlashcards,
    reset,
    getTemplate,
    
    // Computed
    hasValidData: previewData.length > 0,
    hasErrors: validationErrors.length > 0
  };
}