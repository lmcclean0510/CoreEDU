
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Code, Binary, Layers, ClipboardCheck, Braces, Brain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const coreTopics = [
  {
    title: 'Python',
    description: 'Interactive Python puzzles and challenges to build your programming foundations for KS3 and GCSE.',
    href: '/corecs/python',
    icon: <Code className="w-8 h-8 text-[#14b8a6]" />,
  },
  {
    title: 'Binary Conversion',
    description: 'Master binary and denary conversions with interactive exercises and timed challenges.',
    href: '/corecs/binary',
    icon: <Binary className="w-8 h-8 text-[#14b8a6]" />,
  },
  {
    title: 'Hexadecimal',
    description: 'Practice converting between denary, binary, and hexadecimal with our interactive tool.',
    href: '/corecs/hex',
    icon: <Braces className="w-8 h-8 text-[#14b8a6]" />,
  },
];

const revisionTools = [
  {
    title: 'Flash Cards',
    description: 'Review key terms and concepts with interactive flash cards.',
    href: '/corecs/gcse/flashcards',
    icon: <Layers className="w-8 h-8 text-[#14b8a6]" />,
    badge: 'Available',
    disabled: false,
  },
  {
    title: 'Concept Detective',
    description: 'Recognize key concepts in different scenarios to build your transfer learning skills.',
    href: '/corecs/concept-detective',
    icon: <Brain className="w-8 h-8 text-[#14b8a6]" />,
    badge: 'New!',
    disabled: false,
  },
];

export default function CoreCSGcsePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center bg-background p-4 py-8">
      <div className="max-w-6xl w-full">
        <div className="animate-fade-in-up space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">
              CS GCSE
            </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {coreTopics.map((feature) => (
             <Card key={feature.title} className="group transition-all duration-300 border-2 shadow-md relative overflow-hidden hover:border-primary/30 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
              <CardHeader className="text-left pb-4">
                 <div className="flex justify-between items-center mb-4">
                   <CardTitle className="text-xl font-bold text-foreground font-headline">{feature.title}</CardTitle>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-md">
                      {feature.icon}
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow text-left">
                <CardDescription className="flex-grow">{feature.description}</CardDescription>
                <Link href={feature.href} passHref className="mt-6">
                  <Button className="w-full">
                    Go to {feature.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12" />

        <div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Revision Tools</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 justify-center max-w-4xl mx-auto">
            {revisionTools.map((tool) => (
              <Card key={tool.title} className={cn(
                "group transition-all duration-300 border-2 shadow-md relative overflow-hidden flex flex-col",
                tool.disabled ? "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100" : "hover:border-primary/30 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50"
              )}>
                <CardHeader className="text-left pb-4">
                   <div className="flex justify-between items-start mb-4">
                      <Badge className={cn("text-xs", tool.badge === 'New!' ? 'bg-primary text-white' : tool.disabled ? "bg-slate-400 text-white" : "bg-[#14b8a6] text-white")}>
                        {tool.badge}
                      </Badge>
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-md", tool.disabled ? "bg-slate-100" : "bg-white")}>
                        {tool.icon}
                      </div>
                    </div>
                  <CardTitle className="text-xl font-bold text-foreground font-headline">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow text-left">
                  <CardDescription className="flex-grow">{tool.description}</CardDescription>
                  <Link href={tool.href} passHref className="mt-6">
                    <Button className="w-full" disabled={tool.disabled}>
                      Go to {tool.title}
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
