
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const tools = [
  {
    title: 'Seating Plan Generator',
    description: 'Create optimized classroom seating arrangements with intelligent conflict resolution and flexible layouts.',
    href: '/coretools/seating-plan',
    icon: <Grid3X3 className="w-8 h-8 text-[#14b8a6]" />,
    badge: 'Available Now',
    badgeColor: 'bg-[#14b8a6] text-white',
    disabled: false,
  },
];

export default function CoreToolsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-1 flex-col items-center justify-center text-center bg-background">
        <div className="max-w-4xl w-full">
          <div className="animate-fade-in-up space-y-2 mb-8">
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl font-headline">
                <span className="text-foreground">Core</span><span className="text-primary">Tools</span>
              </h1>
              <p className="text-lg text-muted-foreground">A suite of powerful utilities for teachers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
              {tools.map((tool) => (
                  <Card key={tool.title} className={cn(
                      "group transition-all duration-300 border-2 shadow-md relative overflow-hidden flex flex-col",
                      tool.disabled ? "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 cursor-not-allowed" : "hover:border-primary/30 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50"
                    )}>
                      <CardHeader className="text-left pb-4">
                        {tool.badge ? (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <Badge className={cn("text-xs", tool.badgeColor)}>
                                {tool.badge}
                              </Badge>
                              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", tool.disabled ? "bg-slate-100" : "bg-white")}>
                                {tool.icon}
                              </div>
                            </div>
                            <CardTitle className="text-xl font-bold text-foreground font-headline">{tool.title}</CardTitle>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-4">
                              <CardTitle className="text-xl font-bold text-foreground font-headline">{tool.title}</CardTitle>
                              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-md", tool.disabled ? "bg-slate-100" : "bg-white")}>
                                {tool.icon}
                              </div>
                            </div>
                          </>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow text-left">
                        <CardDescription className="flex-grow">{tool.description}</CardDescription>
                          <Link href={tool.href} passHref className="mt-6">
                            <Button className="w-full" disabled={tool.disabled}>
                                Go to {tool.title.split('(')[0].trim()}
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
