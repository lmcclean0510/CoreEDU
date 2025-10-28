import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor?: string;
  disabled?: boolean;
  ctaLabel?: string;
}

export function ActivityCard({
  title,
  description,
  href,
  icon: Icon,
  iconColor = 'text-primary',
  disabled = false,
  ctaLabel,
}: ActivityCardProps) {
  const buttonLabel = disabled ? 'Coming soon' : ctaLabel ?? 'Explore module';

  const content = (
    <Card
      className={cn(
        'h-full transition-all duration-200',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-xl hover:border-primary/60 cursor-pointer'
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              disabled ? 'bg-muted' : 'bg-primary/10'
            )}
          >
            <Icon className={cn('h-6 w-6', disabled ? 'text-muted-foreground' : iconColor)} />
          </div>
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          className={cn(
            'w-full justify-center rounded-full font-semibold tracking-tight',
            disabled
              ? 'bg-muted text-muted-foreground hover:bg-muted'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          disabled={disabled}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
