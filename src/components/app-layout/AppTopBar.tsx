"use client";

import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/UserProvider';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Map paths to readable names
const pathNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/student': 'Dashboard',
  '/dashboard/teacher': 'Dashboard',
  '/corecs': 'CoreCS',
  '/corecs/gcse': 'CS GCSE',
  '/corecs/gcse/python': 'Python',
  '/corecs/gcse/binary': 'Binary',
  '/corecs/gcse/hex': 'Hexadecimal',
  '/corelabs': 'CoreLabs',
  '/corelabs/binary-game': 'Binary Game',
  '/corelabs/denary-game': 'Denary Game',
  '/corelabs/keyboard-ninja': 'Keyboard Ninja',
  '/corelabs/mouse-skills': 'Mouse Skills',
  '/coretools': 'CoreTools',
  '/coretools/seating-plan': 'Seating Plan',
  '/homework': 'Homework',
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

  // Generate breadcrumbs from current path
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      const name = pathNameMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ name, path: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-14 border-b bg-card flex items-center justify-between px-6">
      {/* Left: Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.name}</span>
            ) : (
              <Link 
                href={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.name}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Right: Date + User Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline-block">
          {getCurrentDate()}
        </span>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </span>
            <Badge variant="secondary" className="w-fit mt-1 capitalize text-xs py-0">
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
