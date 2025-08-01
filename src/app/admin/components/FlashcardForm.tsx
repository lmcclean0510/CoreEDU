// src/app/admin/components/FlashcardForm.tsx
import { Plus, Save, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Flashcard } from '@/lib/types';
import type { FlashcardFormData } from '../hooks/useAdminFlashcards';
import { useFlashcardForm } from '../hooks/useFlashcardForm';

interface FlashcardFormProps {
  flashcard?: Flashcard;
  onSave: (flashcard: FlashcardFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function FlashcardForm({ 
  flashcard, 
  onSave, 
  onCancel, 
  isLoading 
}: FlashcardFormProps) {
  const {
    formData,
    alternativeDefinition,
    setAlternativeDefinition,
    example,
    setExample,
    relatedTerm,
    setRelatedTerm,
    hint,
    setHint,
    addToArray,
    removeFromArray,
    updateField
  } = useFlashcardForm(flashcard);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select 
            value={formData.subject}
            onValueChange={(value) => updateField('subject', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Geography">Geography</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="examBoard">Exam Board *</Label>
          <Select 
            value={formData.examBoard}
            onValueChange={(value) => updateField('examBoard', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exam board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AQA">AQA</SelectItem>
              <SelectItem value="Edexcel">Edexcel</SelectItem>
              <SelectItem value="OCR">OCR</SelectItem>
              <SelectItem value="WJEC">WJEC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specification">Specification *</Label>
          <Input
            id="specification"
            value={formData.specification}
            onChange={(e) => updateField('specification', e.target.value)}
            placeholder="e.g., GCSE Computer Science"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specificationCode">Specification Code</Label>
          <Input
            id="specificationCode"
            value={formData.specificationCode}
            onChange={(e) => updateField('specificationCode', e.target.value)}
            placeholder="e.g., 8525"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specificationPoint">Specification Point</Label>
          <Input
            id="specificationPoint"
            value={formData.specificationPoint}
            onChange={(e) => updateField('specificationPoint', e.target.value)}
            placeholder="e.g., 3.1.1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            value={formData.topic}
            onChange={(e) => updateField('topic', e.target.value)}
            placeholder="e.g., 3 Programming"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="subTopic">Sub Topic *</Label>
          <Input
            id="subTopic"
            value={formData.subTopic}
            onChange={(e) => updateField('subTopic', e.target.value)}
            placeholder="e.g., 3.1 Fundamentals of Programming"
            required
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="term">Term *</Label>
          <Input
            id="term"
            value={formData.term}
            onChange={(e) => updateField('term', e.target.value)}
            placeholder="The key term or concept"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="definition">Definition *</Label>
          <Textarea
            id="definition"
            value={formData.definition}
            onChange={(e) => updateField('definition', e.target.value)}
            placeholder="Detailed definition of the term"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="simpleDefinition">Simple Definition</Label>
          <Textarea
            id="simpleDefinition"
            value={formData.simpleDefinition}
            onChange={(e) => updateField('simpleDefinition', e.target.value)}
            placeholder="A simplified version for easier understanding"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Dynamic Arrays */}
      <div className="space-y-6">
        {/* Alternative Definitions */}
        <div className="space-y-2">
          <Label>Alternative Definitions</Label>
          <div className="flex gap-2">
            <Input
              value={alternativeDefinition}
              onChange={(e) => setAlternativeDefinition(e.target.value)}
              placeholder="Add alternative definition"
            />
            <Button
              type="button"
              onClick={() => addToArray('alternativeDefinitions', alternativeDefinition, setAlternativeDefinition)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.alternativeDefinitions.map((def, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {def}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 hover:bg-transparent"
                  onClick={() => removeFromArray('alternativeDefinitions', index)}
                  disabled={isLoading}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-2">
          <Label>Examples</Label>
          <div className="flex gap-2">
            <Input
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Add example"
            />
            <Button
              type="button"
              onClick={() => addToArray('examples', example, setExample)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.examples.map((ex, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {ex}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 hover:bg-transparent"
                  onClick={() => removeFromArray('examples', index)}
                  disabled={isLoading}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Related Terms */}
        <div className="space-y-2">
          <Label>Related Terms</Label>
          <div className="flex gap-2">
            <Input
              value={relatedTerm}
              onChange={(e) => setRelatedTerm(e.target.value)}
              placeholder="Add related term"
            />
            <Button
              type="button"
              onClick={() => addToArray('relatedTerms', relatedTerm, setRelatedTerm)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.relatedTerms.map((term, index) => (
              <Badge key={index} variant="default" className="text-xs">
                {term}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 hover:bg-transparent"
                  onClick={() => removeFromArray('relatedTerms', index)}
                  disabled={isLoading}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div className="space-y-2">
          <Label>Hints</Label>
          <div className="flex gap-2">
            <Input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Add hint"
            />
            <Button
              type="button"
              onClick={() => addToArray('hints', hint, setHint)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.hints.map((h, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {h}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 hover:bg-transparent"
                  onClick={() => removeFromArray('hints', index)}
                  disabled={isLoading}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Flashcard'}
        </Button>
      </div>
    </form>
  );
}