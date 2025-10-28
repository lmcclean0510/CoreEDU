"use client";

import { useMemo, useState } from 'react';
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DueDateBadge } from '@/components/shared/DueDateBadge';
import { EditHomeworkDialog } from '@/components/dashboard/teacher/EditHomeworkDialog';
import { useTeacherHomeworks, type TeacherHomeworkSummary } from '@/hooks/teacher/use-teacher-homeworks';
import { useHomeworkManagement } from '@/hooks/teacher/use-homework-management';
import { getDueDateStatus } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

export default function TeacherHomeworksPage() {
  const { homeworks, isLoading, refresh, classFilters, isEmpty } = useTeacherHomeworks();
  const { updateHomework } = useHomeworkManagement();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherHomeworkSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredHomeworks = useMemo(() => {
    if (selectedClass === 'all') return homeworks;
    return homeworks.filter((item) => item.classInfo?.id === selectedClass);
  }, [homeworks, selectedClass]);

  const metrics = useMemo(() => {
    if (!homeworks.length) {
      return {
        totalAssignments: 0,
        averageCompletion: 0,
        dueSoon: 0,
        overdue: 0,
      };
    }

    let completionAccumulator = 0;
    let dueSoon = 0;
    let overdue = 0;

    homeworks.forEach((item) => {
      const totalStudents = item.classInfo?.studentUids?.length ?? item.stats.assignedCount;
      const completionRate =
        totalStudents > 0 ? (item.stats.completedCount / totalStudents) * 100 : 0;

      completionAccumulator += completionRate;

      const isComplete = totalStudents > 0 && item.stats.completedCount >= totalStudents;
      const dueStatus = getDueDateStatus(item.homework.dueDate, isComplete);

      if (dueStatus === 'due-soon' || dueStatus === 'due-today') {
        dueSoon += 1;
      } else if (dueStatus === 'overdue') {
        overdue += 1;
      }
    });

    return {
      totalAssignments: homeworks.length,
      averageCompletion: completionAccumulator / homeworks.length,
      dueSoon,
      overdue,
    };
  }, [homeworks]);

  const handleOpenEdit = (summary: TeacherHomeworkSummary) => {
    setEditTarget(summary);
    setIsDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditTarget(null);
    setIsDialogOpen(false);
  };

  const handleSaveHomework = async (params: {
    title: string;
    instructions?: string | null;
    dueDate?: string | null;
  }) => {
    if (!editTarget) return;
    await updateHomework(
      editTarget.homework.id,
      {
        title: params.title,
        instructions: params.instructions,
        dueDate: params.dueDate,
      },
      {
        classId: editTarget.homework.classId,
        teacherId: editTarget.homework.teacherId,
      }
    );
    await refresh();
  };

  const handleRemoveDueDate = async () => {
    if (!editTarget) return;
    await updateHomework(
      editTarget.homework.id,
      { dueDate: null },
      {
        classId: editTarget.homework.classId,
        teacherId: editTarget.homework.teacherId,
      }
    );
    await refresh();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStatusBadge = (summary: TeacherHomeworkSummary) => {
    const totalStudents = summary.classInfo?.studentUids?.length ?? summary.stats.assignedCount;
    const completionRate =
      totalStudents > 0 ? (summary.stats.completedCount / totalStudents) * 100 : 0;
    const isComplete = totalStudents > 0 && summary.stats.completedCount >= totalStudents;
    const dueStatus = getDueDateStatus(summary.homework.dueDate, isComplete);

    if (totalStudents === 0) {
      return (
        <Badge
          variant="outline"
          className="border-dashed border-muted-foreground/30 bg-muted text-muted-foreground"
        >
          Awaiting students
        </Badge>
      );
    }

    if (isComplete) {
      return (
        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
          Complete
        </Badge>
      );
    }

    if (dueStatus === 'overdue') {
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          Overdue
        </Badge>
      );
    }

    if (dueStatus === 'due-today') {
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          Due today
        </Badge>
      );
    }

    if (dueStatus === 'due-soon') {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          Due soon
        </Badge>
      );
    }

    if (completionRate >= 50) {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          In progress
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground">
        Assigned
      </Badge>
    );
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
              <TableCell colSpan={6}>
                <Skeleton className="h-12 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    if (isEmpty || filteredHomeworks.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="font-medium text-foreground">No homework found</p>
                <p className="text-sm">
                  {selectedClass === 'all'
                    ? 'Create a homework assignment to see it listed here.'
                    : 'No homework found for the chosen class.'}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredHomeworks.map((summary) => {
      const totalStudents =
        summary.classInfo?.studentUids?.length ?? summary.stats.assignedCount;
      const completionRate =
        totalStudents > 0 ? (summary.stats.completedCount / totalStudents) * 100 : 0;

      return (
        <TableRow key={summary.homework.id}>
          <TableCell>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {summary.homework.title}
                </span>
                {summary.homework.instructions && (
                  <Badge variant="outline" className="text-xs">
                    Notes
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Assigned on{' '}
                {summary.homework.createdAt && 'toDate' in summary.homework.createdAt
                  ? summary.homework.createdAt.toDate().toLocaleDateString()
                  : '—'}
              </p>
              {summary.homework.instructions && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {summary.homework.instructions}
                </p>
              )}
            </div>
          </TableCell>
          <TableCell>
            {summary.classInfo ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  {summary.classInfo.className}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.classInfo.subject} · {summary.classInfo.studentUids.length} students
                </p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Class not available</span>
            )}
          </TableCell>
          <TableCell>
            {summary.homework.dueDate ? (
              <DueDateBadge dueDate={summary.homework.dueDate} variant="compact" />
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                No due date
              </Badge>
            )}
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {summary.stats.completedCount}/{totalStudents}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatPercentage(completionRate)}
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </TableCell>
          <TableCell>{renderStatusBadge(summary)}</TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(summary)}
              aria-label={`Edit ${summary.homework.title}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Homeworks
        </h1>
        <p className="text-muted-foreground">
          Track homework assignments across your classes and keep deadlines up to date.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Active homework across your classes</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.averageCompletion || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Mean completion across all homework</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due soon</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dueSoon}</div>
            <p className="text-xs text-muted-foreground">Next 3 days (including today)</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', metrics.overdue > 0 && 'text-destructive')}>
              {metrics.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Homework overview</CardTitle>
            <CardDescription>Adjust titles and due dates without leaving the dashboard.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classFilters.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                    {option.subject ? ` · ${option.subject}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Homework</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
            <TableCaption>
              Students instantly see updated due dates and titles.
            </TableCaption>
          </Table>
        </CardContent>
      </Card>

      <EditHomeworkDialog
        open={isDialogOpen}
        onClose={handleCloseEdit}
        summary={editTarget}
        onSave={handleSaveHomework}
        onRemoveDueDate={handleRemoveDueDate}
      />
    </div>
  );
}
