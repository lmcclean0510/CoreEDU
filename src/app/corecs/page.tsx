"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Book, GraduationCap, Laptop } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const features = [
  {
    title: 'CS GCSE',
    description: 'Explore curriculum-aligned topics, puzzles, and challenges specifically designed for the GCSE Computer Science course.',
    href: '/corecs/gcse',
    icon: <GraduationCap className="w-8 h-8 text-[#14b8a6]" />,
    badge: 'Available Now',
    badgeColor: 'bg-[#14b8a6] text-white',
    disabled: false,
  },
  {
    title: 'CS KS3',
    description: 'An introduction to the world of computer science for Key Stage 3 students. (This section is not yet available).',
    href: '#',
    icon: <Book className="w-8 h-8 text-slate-400" />,
    badge: 'Coming Soon',
    badgeColor: 'bg-slate-400 text-white',
    disabled: true,
  },
];

export default function CoreCSPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-1 flex-col items-center justify-center text-center bg-background">
        <div className="max-w-4xl w-full">
          <div className="animate-fade-in-up space-y-2 mb-8">
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl font-headline">
                <span className="text-foreground">Core</span><span className="text-primary">CS</span>
              </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
            {features.map((feature) => (
              <Card key={feature.title} className={cn(
                  "group transition-all duration-300 border-2 shadow-md relative overflow-hidden flex flex-col",
                  feature.disabled ? "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 cursor-not-allowed" : "hover:border-primary/30 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50"
                )}>
                <CardHeader className="text-left pb-4">
                  {feature.badge ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={cn("text-xs", feature.badgeColor)}>
                          {feature.badge}
                        </Badge>
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", feature.disabled ? "bg-slate-100" : "bg-white")}>
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground font-headline">{feature.title}</CardTitle>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <CardTitle className="text-xl font-bold text-foreground font-headline">{feature.title}</CardTitle>
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", feature.disabled ? "bg-slate-100" : "bg-white")}>
                          {feature.icon}
                        </div>
                      </div>
                    </>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-grow text-left">
                  <CardDescription className="flex-grow">{feature.description}</CardDescription>
                  <Link href={feature.href} passHref className="mt-6">
                    <Button className="w-full" disabled={feature.disabled}>
                      Go to {feature.title.split('(')[0].trim()}
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