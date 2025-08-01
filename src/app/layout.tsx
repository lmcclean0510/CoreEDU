import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Lexend } from 'next/font/google';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';
import { UserProvider } from '@/providers/UserProvider';
import { FirestoreMonitorProvider } from '@/providers/FirestoreMonitorProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
});

export const metadata: Metadata = {
    title: "CoreEDU",
    description: "Interactive learning platforms for education by CoreEDU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={cn("h-full", inter.variable, lexend.variable)}>
      <body className="font-body antialiased flex flex-col h-full">
        <UserProvider>
          <FirestoreMonitorProvider>
            <MainLayout>{children}</MainLayout>
          </FirestoreMonitorProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}