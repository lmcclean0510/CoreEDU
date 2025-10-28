"use client";

import { Code, Binary, Braces, Layers, Brain, BookOpen } from 'lucide-react';
import { ActivityCard, ContentSection } from '@/components/shared/content';

export default function CoreCSPage() {
  return (
    <div className="space-y-8">
      {/* Core Topics */}
      <ContentSection 
        title="Core Topics"
        description="Master computer science fundamentals with interactive challenges"
      >
        <ActivityCard
          title="Python"
          description="Interactive puzzles and challenges to build programming foundations for KS3 and GCSE"
          href="/corecs/python"
          icon={Code}
        />
        <ActivityCard
          title="Binary Conversion"
          description="Master binary and denary conversions with interactive exercises and timed challenges"
          href="/corecs/binary"
          icon={Binary}
        />
        <ActivityCard
          title="Hexadecimal"
          description="Practice converting between denary, binary, and hexadecimal with our interactive tool"
          href="/corecs/hex"
          icon={Braces}
        />
      </ContentSection>

      {/* Revision Tools */}
      <ContentSection 
        title="Revision Tools"
        description="Study smarter with interactive learning aids"
      >
        <ActivityCard
          title="Flashcards"
          description="Review key terms and concepts with interactive flashcards organized by topic"
          href="/corecs/gcse/flashcards"
          icon={Layers}
        />
        <ActivityCard
          title="Concept Detective"
          description="Recognize key concepts in different scenarios to build transfer learning skills"
          href="/corecs/concept-detective"
          icon={Brain}
        />
        <ActivityCard
          title="Quick Quiz"
          description="Test your knowledge with quick quizzes on various computer science topics"
          href="/corecs/quick-quiz"
          icon={BookOpen}
          disabled={true}
        />
      </ContentSection>
    </div>
  );
}
