
"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpDown } from 'lucide-react';

type CorebinStats = {
  binaryFall?: { highScore: number };
  binaryBuilder?: { highScore: number };
}

type UserProfile = {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher' | null;
  corebinStats?: CorebinStats;
};

type SortConfig = {
    key: 'name' | 'binaryFall' | 'binaryBuilder' | 'total';
    direction: 'ascending' | 'descending';
};

export const LeaderboardTable = ({ students }: { students: UserProfile[] }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'total', direction: 'descending' });

    const sortedStudents = useMemo(() => {
        let sortableStudents = [...students];
        if (sortConfig !== null) {
            sortableStudents.sort((a, b) => {
                let aValue: string | number = 0;
                let bValue: string | number = 0;

                if (sortConfig.key === 'name') {
                    aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                    bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
                } else {
                    const getScore = (student: UserProfile, key: 'binaryFall' | 'binaryBuilder' | 'total') => {
                        const fallScore = student.corebinStats?.binaryFall?.highScore || 0;
                        const builderScore = student.corebinStats?.binaryBuilder?.highScore || 0;
                        if (key === 'binaryFall') return fallScore;
                        if (key === 'binaryBuilder') return builderScore;
                        return fallScore + builderScore;
                    };
                    aValue = getScore(a, sortConfig.key);
                    bValue = getScore(b, sortConfig.key);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableStudents;
    }, [students, sortConfig]);

    const requestSort = (key: SortConfig['key']) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIndicator = (key: SortConfig['key']) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    if (students.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No students have been added to this class yet.</p>;
    }
    
    return (
        <div className="w-full">
            <div className="rounded-md border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="p-3 text-left">
                                <Button variant="ghost" onClick={() => requestSort('name')} className="px-1">
                                    Student {getSortIndicator('name')}
                                </Button>
                            </th>
                            <th className="p-3 text-right">
                                <Button variant="ghost" onClick={() => requestSort('binaryFall')} className="px-1">
                                    Binary Fall {getSortIndicator('binaryFall')}
                                </Button>
                            </th>
                            <th className="p-3 text-right">
                                <Button variant="ghost" onClick={() => requestSort('binaryBuilder')} className="px-1">
                                    Binary Builder {getSortIndicator('binaryBuilder')}
                                </Button>
                            </th>
                            <th className="p-3 text-right">
                                <Button variant="ghost" onClick={() => requestSort('total')} className="px-1">
                                    Total {getSortIndicator('total')}
                                </Button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student) => {
                            const fallScore = student.corebinStats?.binaryFall?.highScore || 0;
                            const builderScore = student.corebinStats?.binaryBuilder?.highScore || 0;
                            const totalScore = fallScore + builderScore;
                            return (
                                <tr key={student.uid} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="p-3 font-medium flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.photoURL || undefined} />
                                            <AvatarFallback>{student.firstName?.[0] || 'S'}</AvatarFallback>
                                        </Avatar>
                                        {student.firstName || 'Student'} {student.lastName || ''}
                                    </td>
                                    <td className="p-3 text-right font-mono">{fallScore}</td>
                                    <td className="p-3 text-right font-mono">{builderScore}</td>
                                    <td className="p-3 text-right font-mono font-bold">{totalScore}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
