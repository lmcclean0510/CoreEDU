"use client";

import { useState, useEffect } from 'react';
import { MousePointerClick, Keyboard, Gamepad2, Binary } from 'lucide-react';
import { ActivityCard, ContentSection } from '@/components/shared/content';

export default function CoreLabsPage() {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    // Check if device has fine pointer (mouse) - hide mouse/keyboard games on touch devices
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(pointer: fine)');
      setHasFinePointer(mediaQuery.matches);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Skill Training */}
      {hasFinePointer && (
        <ContentSection 
          title="Skill Training"
          description="Improve your computer skills with targeted practice"
        >
          <ActivityCard
            title="Mouse Skills"
            description="Hone your mouse accuracy, tracking, and control with a series of targeted challenges"
            href="/corelabs/mouse-skills"
            icon={MousePointerClick}
            badge="Available"
            badgeVariant="default"
          />
          <ActivityCard
            title="Keyboard Ninja"
            description="Memorize important keyboard shortcuts by slicing them before they fall off screen"
            href="/corelabs/keyboard-ninja"
            icon={Keyboard}
            badge="Available"
            badgeVariant="default"
          />
        </ContentSection>
      )}

      {/* Educational Games */}
      <ContentSection 
        title="Educational Games"
        description="Learn through play with our gamified challenges"
      >
        <ActivityCard
          title="Binary Fall"
          description="Convert falling binary numbers to denary before the stack overflows! Fast-paced conversion challenge"
          href="/corelabs/binary-game"
          icon={Gamepad2}
          badge="Popular"
          badgeVariant="default"
        />
        <ActivityCard
          title="Binary Builder"
          description="Convert denary numbers to binary by clicking the bits. Test your binary construction skills"
          href="/corelabs/denary-game"
          icon={Binary}
        />
      </ContentSection>
    </div>
  );
}
