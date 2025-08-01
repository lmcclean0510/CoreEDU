"use client";

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/lib/types';

interface UserListItemProps {
  user: UserProfile;
  onAction?: () => void;
  actionLabel?: string;
  actionVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  actionIcon?: React.ReactNode;
  disabled?: boolean;
  showEmail?: boolean;
  className?: string;
}

export function UserListItem({
  user,
  onAction,
  actionLabel,
  actionVariant = 'default',
  actionIcon,
  disabled = false,
  showEmail = true,
  className = '',
}: UserListItemProps) {
  const displayName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();
  const fallbackInitial = user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`p-2 border rounded-lg flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.photoURL || undefined} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{displayName}</p>
          {showEmail && user.email && (
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
      </div>
      
      {onAction && (
        <Button
          size="sm"
          variant={actionVariant}
          onClick={onAction}
          disabled={disabled}
          className="flex-shrink-0"
        >
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
