import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Eye, EyeOff, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirestoreStatsProps {
  stats: {
    reads: number;
    writes: number;
    operations: Array<{
      type: 'read' | 'write';
      description: string;
      timestamp: Date;
      page: string;
    }>;
    pageStats: Record<string, { reads: number; writes: number }>;
  };
  onReset: () => void;
  currentPage: string;
}

export function FirestoreStats({ stats, onReset, currentPage }: FirestoreStatsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide in production
  if (process.env.NODE_ENV === 'production') return null;

  // Calculate current page stats directly from operations array (more reliable)
  const currentPageReads = stats.operations.filter(op => 
    op.page === currentPage && op.type === 'read'
  ).length;
  const currentPageWrites = stats.operations.filter(op => 
    op.page === currentPage && op.type === 'write'
  ).length;

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur shadow-lg"
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 backdrop-blur shadow-lg border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Firestore Monitor
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </Button>
            <Button
              onClick={onReset}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              title="Reset stats"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Current Page Stats */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {currentPage}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              📖 {currentPageReads}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ✏️ {currentPageWrites}
            </Badge>
          </div>
        </div>

        {/* Total Stats */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Session Total
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={stats.reads > 10 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              📖 {stats.reads} reads
            </Badge>
            <Badge 
              variant={stats.writes > 5 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              ✏️ {stats.writes} writes
            </Badge>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-3">
            {/* Page Breakdown */}
            {Object.keys(stats.pageStats).length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Page Breakdown
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {Object.entries(stats.pageStats).map(([page, pageStats]) => {
                    // Calculate actual counts from operations array for accuracy
                    const actualReads = stats.operations.filter(op => 
                      op.page === page && op.type === 'read'
                    ).length;
                    const actualWrites = stats.operations.filter(op => 
                      op.page === page && op.type === 'write'
                    ).length;
                    
                    return (
                      <div key={page} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{page}</span>
                        <div className="flex gap-1">
                          <span className="text-blue-600">📖{actualReads}</span>
                          <span className="text-red-600">✏️{actualWrites}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Operations */}
            {stats.operations.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Recent Operations
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stats.operations.slice(-10).reverse().map((op, index) => (
                    <div key={index} className="text-xs p-1 rounded bg-muted/50">
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          op.type === 'read' ? 'text-blue-600' : 'text-red-600'
                        )}>
                          {op.type === 'read' ? '📖' : '✏️'}
                        </span>
                        <span className="truncate flex-1">{op.description}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {op.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Warning */}
        {(stats.reads > 20 || stats.writes > 10) && (
          <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            ⚠️ High Firestore usage detected
          </div>
        )}
      </CardContent>
    </Card>
  );
}