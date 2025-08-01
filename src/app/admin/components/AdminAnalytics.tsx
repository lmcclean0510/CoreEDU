// src/app/admin/components/AdminAnalytics.tsx
import { BookOpen, Code, Filter, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Flashcard, Puzzle } from '@/lib/types';

interface AdminAnalyticsProps {
  flashcards: Flashcard[];
  puzzles: Puzzle[];
  onRefreshFlashcards: () => void;
  onRefreshPuzzles: () => void;
}

export function AdminAnalytics({ 
  flashcards, 
  puzzles, 
  onRefreshFlashcards, 
  onRefreshPuzzles 
}: AdminAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              flashcards.reduce((acc, card) => {
                acc[card.subject] = (acc[card.subject] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([subject, count]) => (
              <div key={subject} className="flex justify-between items-center">
                <span className="text-sm font-medium">{subject}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / flashcards.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Puzzle Difficulty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(level => {
              const count = puzzles.filter(p => p.challengeLevel === level).length;
              return (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-sm font-medium">Level {level}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: puzzles.length > 0 ? `${(count / puzzles.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={onRefreshFlashcards}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Refresh Flashcards
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={onRefreshPuzzles}
            >
              <Code className="w-4 h-4 mr-2" />
              Refresh Puzzles
            </Button>
            <Button className="w-full justify-start" variant="outline" disabled>
              <Filter className="w-4 h-4 mr-2" />
              Export Data (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Flashcards Collection</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Puzzles Collection</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}