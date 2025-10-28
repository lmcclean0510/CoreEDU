"use client";

import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { useAuth } from '@/providers/UserProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Pages that should NOT use the app layout (public pages, auth pages)
const excludedPaths = [
  '/',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
];

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if current path should use app layout
  // Use pathname only - don't remove layout when auth changes to prevent flash
  const shouldUseAppLayout = !excludedPaths.includes(pathname);

  // Redirect unauthenticated users trying to access protected pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !excludedPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state only on initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't use app layout for excluded pages (public pages)
  if (!shouldUseAppLayout) {
    return <>{children}</>;
  }

  const isFullWidthPage = pathname.startsWith('/coretools/seating-plan');

  // Full app layout with sidebar and top bar
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <AppSidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <AppTopBar />

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-muted/30 relative",
          isFullWidthPage && "px-4 md:px-6 py-4 md:py-6"
        )}>
          <div
            className={cn(
              "mx-auto",
              isFullWidthPage
                ? "w-full h-full"
                : "container p-4 md:p-6 max-w-7xl"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
