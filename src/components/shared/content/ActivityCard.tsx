import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor?: string;
  disabled?: boolean;
}

export function ActivityCard({
  title,
  description,
  href,
  icon: Icon,
  iconColor = 'text-primary',
  disabled = false,
}: ActivityCardProps) {
  const content = (
    <Card
      className={cn(
        'group relative h-full transition-all duration-300',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-xl hover:border-primary/40 hover:animate-cardPulse'
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent transition-colors duration-300 group-hover:border-primary/50" />
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300',
              disabled ? 'bg-muted' : 'bg-primary/10 group-hover:bg-primary/15'
            )}
          >
            <Icon className={cn('h-6 w-6 transition-colors duration-300', disabled ? 'text-muted-foreground' : iconColor)} />
          </div>
        </div>
        <div>
          <CardTitle
            className={cn(
              'text-lg font-semibold transition-all duration-300',
              disabled ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            <span className="inline-block bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size,color] duration-300 ease-out group-hover:text-primary group-hover:bg-[length:100%_2px]">
              {title}
            </span>
          </CardTitle>
          <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
