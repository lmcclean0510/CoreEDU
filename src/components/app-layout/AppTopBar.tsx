"use client";

import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    if (!user?.firstName || !user?.lastName) {
      return user?.email?.substring(0, 2).toUpperCase() || 'U';
    }
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

      {/* Right: Date + Avatar only */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {getCurrentDate()}
        </span>
        
        <Avatar className="h-9 w-9 border-2" style={{ borderColor: user?.avatarOutlineColor || '#0f766e' }}>
          <AvatarImage src={user?.photoURL || undefined} alt="User Avatar" />
          <AvatarFallback 
            className="text-sm font-semibold"
            style={{ 
              backgroundColor: user?.photoURL ? undefined : (user?.avatarBgColor || '#14b8a6'),
              color: user?.photoURL ? undefined : (user?.avatarTextColor || '#000000')
            }}
          >
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
