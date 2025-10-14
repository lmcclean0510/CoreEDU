"use client";

import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UserProvider';

// Map paths to readable page titles
const pathNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/student': 'Dashboard',
  '/dashboard/teacher': 'Dashboard',
  '/corecs': 'CoreCS',
  '/corecs/gcse': 'CS GCSE',
  '/corecs/gcse/python': 'Python',
  '/corecs/binary': 'Binary Conversion',
  '/corecs/hex': 'Hexadecimal',
  '/corelabs': 'CoreLabs',
  '/corelabs/binary-game': 'Binary Game',
  '/corelabs/denary-game': 'Denary Game',
  '/corelabs/keyboard-ninja': 'Keyboard Ninja',
  '/corelabs/mouse-skills': 'Mouse Skills',
  '/coretools': 'CoreTools',
  '/coretools/seating-plan': 'Seating Plan',
  '/homework': 'My Homework',
  '/account': 'Account',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
};

export function AppTopBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get current page title
  const getPageTitle = () => {
    // Try exact match first
    if (pathNameMap[pathname]) {
      return pathNameMap[pathname];
    }

    // Try to find a partial match for dynamic routes
    for (const [path, title] of Object.entries(pathNameMap)) {
      if (pathname.startsWith(path) && path !== '/') {
        return title;
      }
    }

    // Fallback: capitalize last segment
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Dashboard';
  };

  return (
    <div className="h-14 border-b bg-card flex items-center justify-between px-6">
      {/* Left: Page Title */}
      <h1 className="text-xl font-semibold text-foreground">
        {getPageTitle()}
      </h1>

      {/* Right: Date + User Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline-block">
          {getCurrentDate()}
        </span>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <Badge variant="secondary" className="mt-1 capitalize text-xs py-0 px-2">
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
