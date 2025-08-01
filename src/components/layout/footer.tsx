
"use client";

import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      "px-4 md:px-8 border-t bg-card text-card-foreground"
    )}>
      <div className="container mx-auto text-left text-xs text-muted-foreground">
        <p>&copy; {currentYear} CoreEDU by Liam McClean. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
