// src/app/admin/components/PuzzleForm.tsx
import { Plus, Save, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { Puzzle } from '@/lib/types';
import type { PuzzleFormData } from '../hooks/useAdminPuzzles';
import { usePuzzleForm } from '../hooks/usePuzzleForm';

interface PuzzleFormProps {
  puzzle?: Puzzle;
  onSave: (puzzle: PuzzleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function PuzzleForm({ 
  puzzle, 
  onSave, 
  onCancel, 
  isLoading 
}: PuzzleFormProps) {
  const {
    formData,
    initialBlock,
    setInitialBlock,
    solutionLine,
    setSolutionLine,
    addToArray,
    removeFromArray,
    updateField
  } = usePuzzleForm(puzzle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Puzzle title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challengeLevel">Lesson Number *</Label>
          <Input
            id="challengeLevel"
            type="number"
            min="1"
            max="999"
            value={formData.challengeLevel}
            onChange={(e) => updateField('challengeLevel', parseInt(e.target.value) || 1)}
            placeholder="e.g., 15"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="What should the student accomplish?"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skillSection">Skill Section</Label>
          <Input
            id="skillSection"
            value={formData.skillSection}
            onChange={(e) => updateField('skillSection', e.target.value)}
            placeholder="e.g., Basic Output"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionId">Section ID</Label>
          <Input
            id="sectionId"
            value={formData.sectionId}
            onChange={(e) => updateField('sectionId', e.target.value)}
            placeholder="e.g., basic-output"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codeSnippet">Complete Code Snippet</Label>
          <Textarea
            id="codeSnippet"
            value={formData.codeSnippet}
            onChange={(e) => updateField('codeSnippet', e.target.value)}
            placeholder="The complete working code"
            rows={4}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedOutput">Expected Output *</Label>
          <Textarea
            id="expectedOutput"
            value={formData.expectedOutput}
            onChange={(e) => updateField('expectedOutput', e.target.value)}
            placeholder="What the code should output"
            rows={2}
            className="font-mono"
            required
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* Initial Blocks */}
        <div className="space-y-2">
          <Label>Initial Code Blocks</Label>
          <div className="flex gap-2">
            <Input
              value={initialBlock}
              onChange={(e) => setInitialBlock(e.target.value)}
              placeholder="Add code block"
              className="font-mono"
            />
            <Button
              type="button"
              onClick={() => addToArray('initialBlocks', initialBlock, setInitialBlock)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {formData.initialBlocks.map((block, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                <code className="text-sm">{block}</code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromArray('initialBlocks', index)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div className="space-y-2">
          <Label>Solution (Correct Order)</Label>
          <div className="flex gap-2">
            <Input
              value={solutionLine}
              onChange={(e) => setSolutionLine(e.target.value)}
              placeholder="Add solution line"
              className="font-mono"
            />
            <Button
              type="button"
              onClick={() => addToArray('solution', solutionLine, setSolutionLine)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {formData.solution.map((line, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border-l-4 border-green-500">
                <code className="text-sm">{line}</code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromArray('solution', index)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isDynamic"
            checked={formData.isDynamic}
            onCheckedChange={(checked) => updateField('isDynamic', checked)}
            disabled={isLoading}
          />
          <Label htmlFor="isDynamic">Dynamic Input</Label>
        </div>

        {formData.isDynamic && (
          <div className="space-y-2">
            <Label htmlFor="inputPrompt">Input Prompt</Label>
            <Input
              id="inputPrompt"
              value={formData.inputPrompt || ''}
              onChange={(e) => updateField('inputPrompt', e.target.value)}
              placeholder="Prompt for user input"
            />
          </div>
        )}
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
          {isLoading ? 'Saving...' : 'Save Puzzle'}
        </Button>
      </div>
    </form>
  );
}