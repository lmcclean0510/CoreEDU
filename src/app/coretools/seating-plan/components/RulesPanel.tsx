import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Target, Armchair, X } from 'lucide-react';
import type { Desk, SeparationRule } from '../types';

interface RulesPanelProps {
  desks: Desk[];
  separationRules: SeparationRule[];
  doNotUseDeskIds: Set<number>;
  fillFromFront: boolean;
  alternateGender: boolean;
  newRuleStudents: string;
  onFillFromFrontChange: (checked: boolean) => void;
  onAlternateGenderChange: (checked: boolean) => void;
  onNewRuleStudentsChange: (value: string) => void;
  onAddSeparationRule: () => void;
  onRemoveSeparationRule: (ruleId: number) => void;
  onToggleDoNotUseDesk: (deskId: number, checked?: boolean) => void;
}

const RulesPanel = memo(({
  desks,
  separationRules,
  doNotUseDeskIds,
  fillFromFront,
  alternateGender,
  newRuleStudents,
  onFillFromFrontChange,
  onAlternateGenderChange,
  onNewRuleStudentsChange,
  onAddSeparationRule,
  onRemoveSeparationRule,
  onToggleDoNotUseDesk,
}: RulesPanelProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Assignment Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="fill-from-front-toggle" className="text-sm font-medium cursor-pointer">
                  Fill from Front
              </Label>
              <Switch id="fill-from-front-toggle" checked={fillFromFront} onCheckedChange={onFillFromFrontChange} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="alternate-gender-toggle" className="text-sm font-medium cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
                  Alternate Male/Female
              </Label>
              <Switch id="alternate-gender-toggle" checked={alternateGender} onCheckedChange={onAlternateGenderChange} disabled={!fillFromFront} />
          </div>
          <div className="space-y-3">
            <Label htmlFor="rule-input" className="text-sm font-medium">
              Students who cannot sit together
            </Label>
            <Input
              id="rule-input"
              placeholder="John Smith, Jane Doe"
              value={newRuleStudents}
              onChange={(e) => onNewRuleStudentsChange(e.target.value)}
              className="text-sm"
            />
            <Button 
              onClick={onAddSeparationRule} 
              size="sm" 
              className="w-full"
              disabled={!newRuleStudents.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          {separationRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Active Rules</Label>
                <Badge variant="secondary" className="text-xs">
                  {separationRules.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {separationRules.map(rule => (
                  <div key={rule.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg text-sm border">
                    <span className="flex-1 text-xs leading-relaxed">{rule.description}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSeparationRule(rule.id)}
                      className="h-auto p-1 ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Armchair className="w-5 h-5 text-primary" />
            Unavailable Desks
          </CardTitle>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-64 overflow-y-auto p-2 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                {desks.length > 0 ? desks.map((desk, index) => (
                    <div key={desk.id} className="flex items-center gap-2 p-1.5 bg-background rounded">
                        <Checkbox
                            id={`desk-exclude-${desk.id}`}
                            checked={doNotUseDeskIds.has(desk.id)}
                            onCheckedChange={(checked) => onToggleDoNotUseDesk(desk.id, Boolean(checked))}
                        />
                        <Label htmlFor={`desk-exclude-${desk.id}`} className="text-xs font-medium cursor-pointer">
                            Desk {index + 1}
                        </Label>
                    </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Add desks to the layout to manage them here.</p>
                )}
              </div>
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

RulesPanel.displayName = 'RulesPanel';

export default RulesPanel;
