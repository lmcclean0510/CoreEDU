"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/UserProvider';
import {
  LayoutDashboard,
  Code,
  Gamepad2,
  Grid3X3,
  FileText,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Home,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: ('student' | 'teacher' | 'admin')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Classes',
    href: '/dashboard/teacher',
    icon: GraduationCap,
    roles: ['teacher'],
  },
  {
    title: 'Homework Overview',
    href: '/dashboard/teacher/homeworks',
    icon: ClipboardList,
    roles: ['teacher'],
  },
  {
    title: 'My Homework',
    href: '/homework',
    icon: FileText,
    roles: ['student'],
  },
  {
    title: 'CoreCS',
    href: '/corecs',
    icon: Code,
  },
  {
    title: 'CoreLabs',
    href: '/corelabs',
    icon: Gamepad2,
  },
  {
    title: 'CoreTools',
    href: '/coretools',
    icon: Grid3X3,
    roles: ['teacher'], // Only teachers can access classroom management tools
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: 'Account',
    href: '/account',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const shouldShowItem = (item: NavItem) => {
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard/student' || pathname === '/dashboard/teacher' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Logo/Brand */}
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-xl">
              <span className="text-foreground">Core</span>
              <span className="text-primary">EDU</span>
            </div>
            <p className="text-xs text-muted-foreground">Learn From Home</p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.filter(shouldShowItem).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    active && 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    active && 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Info & Logout */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
