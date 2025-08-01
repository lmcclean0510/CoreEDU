
"use client";

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const gamePaths = ['/corelabs/binary-game', '/corelabs/denary-game', '/corelabs/mouse-skills', '/corelabs/keyboard-ninja'];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGamePage = useMemo(() => gamePaths.some(path => pathname.startsWith(path)), [pathname]);

  return (
    <>
      {!isGamePage && <Header />}
      <main className="flex flex-col flex-grow">
        {children}
      </main>
      {!isGamePage && <Footer />}
    </>
  );
}
