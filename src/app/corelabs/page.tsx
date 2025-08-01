"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, MousePointerClick, Keyboard, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const allLabs = [
    {
      title: 'Mouse Skills',
      description: 'Hone your mouse accuracy, tracking, and control with a series of targeted challenges.',
      href: '/corelabs/mouse-skills',
      icon: <MousePointerClick className="w-8 h-8 text-[#14b8a6]" />,
      badge: 'Available Now',
      badgeColor: 'bg-[#14b8a6] text-white',
      disabled: false,
      requiresFinePointer: true,
    },
    {
      title: 'Keyboard Ninja',
      description: 'Memorise important keyboard shortcuts by "slicing" them before they fall off screen.',
      href: '/corelabs/keyboard-ninja',
      icon: <Keyboard className="w-8 h-8 text-[#14b8a6]" />,
      badge: 'Available Now',
      badgeColor: 'bg-[#14b8a6] text-white',
      disabled: false,
      requiresFinePointer: true,
    },
    {
      title: 'Binary Fall',
      description: 'Convert falling binary numbers to denary before the stack overflows! A fast-paced conversion challenge.',
      href: '/corelabs/binary-game',
      icon: <Gamepad2 className="w-8 h-8 text-[#14b8a6]" />,
      badge: 'Available Now',
      badgeColor: 'bg-[#14b8a6] text-white',
      disabled: false,
      requiresFinePointer: false,
    },
    {
      title: 'Binary Builder',
      description: 'Convert denary numbers to binary by clicking the bits. A test of your binary construction skills.',
      href: '/corelabs/denary-game',
      icon: <Gamepad2 className="w-8 h-8 text-[#14b8a6]" />,
      badge: 'Available Now',
      badgeColor: 'bg-[#14b8a6] text-white',
      disabled: false,
      requiresFinePointer: false,
    },
];

export default function CoreLabsPage() {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    // This check runs only on the client side after the component has mounted.
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(pointer: fine)');
      setHasFinePointer(mediaQuery.matches);
    }
  }, []);

  const labs = allLabs.filter(lab => !lab.requiresFinePointer || hasFinePointer);

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-1 flex-col items-center justify-center text-center bg-background">
        <div className="max-w-4xl w-full">
          <div className="animate-fade-in-up space-y-2 mb-8">
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl font-headline">
                <span className="text-foreground">Core</span><span className="text-primary">Labs</span>
              </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
              {labs.map((lab) => (
                  <Card key={lab.title} className={cn(
                      "group transition-all duration-300 border-2 shadow-md relative overflow-hidden flex flex-col",
                      lab.disabled ? "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 cursor-not-allowed" : "hover:border-primary/30 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50"
                    )}>
                      <CardHeader className="text-left pb-4">
                        {lab.badge ? (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <Badge className={cn("text-xs", lab.badgeColor)}>
                                {lab.badge}
                              </Badge>
                              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", lab.disabled ? "bg-slate-100" : "bg-white")}>
                                {lab.icon}
                              </div>
                            </div>
                            <CardTitle className="text-xl font-bold text-foreground font-headline">{lab.title}</CardTitle>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-4">
                              <CardTitle className="text-xl font-bold text-foreground font-headline">{lab.title}</CardTitle>
                              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", lab.disabled ? "bg-slate-100" : "bg-white")}>
                                {lab.icon}
                              </div>
                            </div>
                          </>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow text-left">
                        <CardDescription className="flex-grow">{lab.description}</CardDescription>
                          <Link href={lab.href} passHref className="mt-6">
                            <Button className="w-full" disabled={lab.disabled}>
                                Go to {lab.title.split('(')[0].trim()}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                      </CardContent>
                    </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}