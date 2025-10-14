import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ContentSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ContentSection({
  title,
  description,
  children,
  className,
}: ContentSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
}
