import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  iconColor?: string;
  disabled?: boolean;
}

export function ActivityCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant = 'default',
  iconColor = 'text-primary',
  disabled = false,
}: ActivityCardProps) {
  const content = (
    <Card className={cn(
      "h-full transition-all duration-200",
      disabled 
        ? "opacity-60 cursor-not-allowed" 
        : "hover:shadow-lg hover:border-primary/50 cursor-pointer"
    )}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            disabled ? "bg-muted" : "bg-primary/10"
          )}>
            <Icon className={cn("h-6 w-6", disabled ? "text-muted-foreground" : iconColor)} />
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full" 
          disabled={disabled}
          variant={disabled ? "secondary" : "default"}
        >
          {disabled ? 'Coming Soon' : 'Start'}
          {!disabled && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
