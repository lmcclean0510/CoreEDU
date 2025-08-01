// src/app/admin/components/PuzzleJsonImportDialog.tsx
import { useState } from 'react';
import { Upload, Copy, CheckCircle, AlertCircle, LoaderCircle, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePuzzleJsonImport } from '../hooks/usePuzzleJsonImport';

interface PuzzleJsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function PuzzleJsonImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: PuzzleJsonImportDialogProps) {
  const {
    jsonInput,
    validationErrors,
    previewData,
    isImporting,
    setJsonInput,
    parseJson,
    importPuzzles,
    reset,
    getTemplate,
    hasValidData,
    hasErrors
  } = usePuzzleJsonImport();

  const [showTemplate, setShowTemplate] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);

  const handleParseJson = () => {
    const result = parseJson(jsonInput);
    setParseResult(result);
  };

  const handleImport = async () => {
    try {
      const result = await importPuzzles();
      
      if (result.success > 0) {
        onImportComplete(); // Refresh the puzzles list
        if (result.failed === 0) {
          // Close dialog on complete success
          handleClose();
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleClose = () => {
    reset();
    setParseResult(null);
    setShowTemplate(false);
    onOpenChange(false);
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(getTemplate());
      // Could add a toast here if you want
    } catch (error) {
      console.error('Failed to copy template:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Puzzles from JSON
          </DialogTitle>
          <DialogDescription>
            Import multiple coding puzzles at once using JSON format. Perfect for bulk puzzle creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Template Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">JSON Template</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyTemplate}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowTemplate(!showTemplate)}
                  >
                    {showTemplate ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showTemplate ? 'Hide' : 'Show'} Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showTemplate && (
              <CardContent>
                <ScrollArea className="h-80 w-full">
                  <pre className="text-xs bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {getTemplate()}
                  </pre>
                </ScrollArea>
              </CardContent>
            )}
          </Card>

          {/* JSON Input */}
          <div className="space-y-2">
            <Label htmlFor="jsonInput">Paste your JSON here</Label>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your puzzles JSON array here..."
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleParseJson}
                disabled={!jsonInput.trim()}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Validate JSON
              </Button>
              {parseResult && (
                <Badge variant={parseResult.isValid ? "default" : "destructive"}>
                  {parseResult.isValid ? 
                    `✓ ${parseResult.validCount} valid puzzles` : 
                    `✗ ${parseResult.errors.length} errors found`
                  }
                </Badge>
              )}
            </div>
          </div>

          {/* Validation Results */}
          {parseResult && (
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {hasErrors && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">Found {validationErrors.length} validation errors:</div>
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-sm">
                            {error.index >= 0 ? `Puzzle ${error.index + 1}` : 'JSON'}: {error.field} - {error.message}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {hasValidData && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Preview ({previewData.length} puzzles ready to import)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {previewData.slice(0, 5).map((puzzle, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                            <div>
                              <span className="font-medium">{puzzle.title}</span>
                              <span className="text-muted-foreground ml-2">(Lesson {puzzle.challengeLevel})</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {puzzle.skillSection || 'No section'}
                            </Badge>
                          </div>
                        ))}
                        {previewData.length > 5 && (
                          <div className="text-center text-sm text-muted-foreground">
                            +{previewData.length - 5} more puzzles...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!hasValidData || hasErrors || isImporting}
          >
            {isImporting ? (
              <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isImporting ? 'Importing...' : `Import ${previewData.length} Puzzles`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}