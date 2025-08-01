"use client";

import Link from 'next/link';
import { UserNav } from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Menu, Code, Beaker, GraduationCap, Grid3X3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/UserProvider';

const mainNavItems = [
  { href: '/corecs', label: 'CoreCS', icon: <Code className="h-5 w-5" /> },
  { href: '/corelabs', label: 'CoreLabs', icon: <Beaker className="h-5 w-5" /> },
  { href: '/coretools', label: 'CoreTools', icon: <Grid3X3 className="h-5 w-5" /> },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isCoreCSPage = pathname.startsWith('/corecs');
  const isAdminPage = pathname.startsWith('/admin');
  
  // Check if user is admin (check both token claim and email pattern for flexibility)
  const isAdmin = user && (
    (user as any).admin === true || 
    user.email?.includes('admin') ||
    pathname.startsWith('/admin') // Allow access if already on admin page
  );

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link
      href={href}
      className="relative font-medium text-foreground after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:scale-105 hover:after:scale-x-100"
    >
      {children}
    </Link>
  );

  // Create nav items with admin panel if user is admin
  const getNavItems = () => {
    const items = [...mainNavItems];
    if (isAdmin) {
      items.push({ 
        href: '/admin', 
        label: 'Admin Panel', 
        icon: <Settings className="h-5 w-5" /> 
      });
    }
    return items;
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        
        <div className="flex items-center gap-6">
          {/* Mobile Menu / Main Menu Trigger */}
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-xs animate-slide-in-from-left">
                <SheetHeader className="text-left mb-6">
                  <SheetClose asChild>
                    <SheetTitle asChild>
                      <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold font-headline text-lg">
                          <span className="text-foreground">Core</span><span className="text-primary">EDU</span>
                        </span>
                      </Link>
                    </SheetTitle>
                  </SheetClose>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  {getNavItems().map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg py-2 px-3 transition-colors",
                          item.href === '/admin' 
                            ? "text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Menu Trigger for CoreCS pages (desktop) */}
          {isCoreCSPage && (
            <div className="hidden md:block">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open main menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-xs animate-slide-in-from-left">
                  <SheetHeader className="text-left mb-6">
                    <SheetClose asChild>
                      <SheetTitle asChild>
                        <Link href="/" className="flex items-center space-x-2">
                          <span className="font-bold font-headline text-lg">
                            <span className="text-foreground">Core</span><span className="text-primary">EDU</span>
                          </span>
                        </Link>
                      </SheetTitle>
                    </SheetClose>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4">
                    {getNavItems().map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg py-2 px-3 transition-colors",
                            item.href === '/admin' 
                              ? "text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          
          {/* Logo - Changes based on context */}
          {isCoreCSPage ? (
            <Link 
              href="/corecs" 
              className="flex items-center space-x-2 relative after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:scale-105 hover:after:scale-x-100"
            >
              <span className="font-bold font-headline text-xl">
                <span className="text-foreground">Core</span><span className="text-primary">CS</span>
              </span>
            </Link>
          ) : isAdminPage ? (
            <Link 
              href="/admin" 
              className="flex items-center space-x-2 relative after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-orange-500 after:transition-transform after:duration-300 hover:scale-105 hover:after:scale-x-100"
            >
              <span className="font-bold font-headline text-xl">
                <span className="text-foreground">Core</span><span className="text-orange-600">ADMIN</span>
              </span>
            </Link>
          ) : (
            <Link 
              href="/" 
              className="flex items-center space-x-2 relative after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:scale-105 hover:after:scale-x-100"
            >
              <span className="font-bold font-headline text-xl">
                <span className="text-foreground">Core</span><span className="text-primary">EDU</span>
              </span>
            </Link>
          )}

          {/* Navigation - Changes based on context */}
          {isCoreCSPage ? (
            // CoreCS Navigation - only show CS GCSE when not on main CoreCS page
            pathname !== '/corecs' && (
              <nav className="hidden md:flex items-center gap-8 text-sm">
                <NavLink href="/corecs/gcse">
                  CS GCSE
                </NavLink>
              </nav>
            )
          ) : isAdminPage ? (
            // Admin Navigation - show quick admin links
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <NavLink href="/admin">
                Content
              </NavLink>
              <span className="text-muted-foreground">•</span>
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to CoreEDU
              </Link>
            </nav>
          ) : (
            // Main Navigation
            <nav className="hidden md:flex items-center gap-8 text-sm">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
              {/* Admin link for desktop - only show if user is admin */}
              {isAdmin && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href="/admin"
                    className="relative font-medium text-orange-600 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-orange-500 after:transition-transform after:duration-300 hover:scale-105 hover:after:scale-x-100"
                  >
                    Admin
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
        
        <div className="flex flex-1 items-center justify-end">
          <UserNav />
        </div>
      </div>
    </header>
  );
}