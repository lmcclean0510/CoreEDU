"use client";

import { Grid3X3, Calculator, FileText, ClipboardList } from 'lucide-react';
import { ActivityCard, ContentSection } from '@/components/shared/content';

export default function CoreToolsPage() {
  // Protected by server-side layout (layout.tsx)
  // Only teachers can reach this page

  return (
    <div className="space-y-8">
      {/* Classroom Tools */}
      <ContentSection
        title="Classroom Management"
        description="Tools to help organize and manage your classroom"
      >
        <ActivityCard
          title="Seating Plan Generator"
          description="Create optimized classroom seating arrangements with intelligent conflict resolution and flexible layouts"
          href="/coretools/seating-plan"
          icon={Grid3X3}
          badge="Available"
          badgeVariant="default"
        />
        <ActivityCard
          title="Grade Calculator"
          description="Quickly calculate final grades with weighted assignments and customizable grading scales"
          href="/coretools/grade-calculator"
          icon={Calculator}
          badge="Coming Soon"
          badgeVariant="secondary"
          disabled={true}
        />
        <ActivityCard
          title="Attendance Tracker"
          description="Track student attendance with easy visualization and reporting features"
          href="/coretools/attendance"
          icon={ClipboardList}
          badge="Coming Soon"
          badgeVariant="secondary"
          disabled={true}
        />
      </ContentSection>

      {/* Productivity Tools */}
      <ContentSection
        title="Productivity"
        description="Save time with these helpful utilities"
      >
        <ActivityCard
          title="Report Generator"
          description="Generate student reports with templates and customizable comments"
          href="/coretools/reports"
          icon={FileText}
          badge="Coming Soon"
          badgeVariant="secondary"
          disabled={true}
        />
      </ContentSection>
    </div>
  );
}
