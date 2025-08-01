"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code, LayoutDashboard, ChevronDown, BookOpen, Users, GraduationCap, Target, Gamepad2, Grid3X3, CheckCircle, TrendingUp, Award, Clock, Zap, Shield, Sparkles, Edit, UserPlus, FileSignature, BarChart, BookCopy, Trophy } from 'lucide-react';
import { useAuth } from '@/providers/UserProvider';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const coreProducts = [
  {
    title: 'CoreCS',
    subtitle: 'Computer Science Edition',
    description: 'Master programming fundamentals through interactive coding challenges, drag-and-drop puzzles, and real-time feedback systems.',
    href: '/corecs',
    icon: <Code className="w-12 h-12 text-[#14b8a6]" />,
    badge: 'Available Now',
    badgeColor: 'bg-[#14b8a6] text-white',
    features: ['Python Programming', 'Binary Logic', 'Algorithm Design', 'Interactive Coding'],
    pattern: 'bg-gradient-to-br from-slate-50 to-cyan-50',
  },
  {
    title: 'CoreTools',
    subtitle: 'Teacher Utilities',
    description: 'A suite of powerful utilities for teachers, including a seating plan generator and other classroom management tools.',
    href: '/coretools',
    icon: <Grid3X3 className="w-12 h-12 text-[#14b8a6]" />,
    badge: 'New!',
    badgeColor: 'bg-[#14b8a6] text-white',
    features: ['Seating Plans', 'Grade Calculators', 'Report Generators', 'Lesson Planners'],
    pattern: 'bg-gradient-to-br from-slate-50 to-cyan-50',
  },
  {
    title: 'CoreLabs',
    subtitle: 'Skills & Games Hub',
    description: 'Sharpen your skills with gamified challenges including typing practice, mouse accuracy, and cognitive exercises.',
    href: '/corelabs',
    icon: <Gamepad2 className="w-12 h-12 text-[#14b8a6]" />,
    badge: 'Available Now',
    badgeColor: 'bg-[#14b8a6] text-white',
    features: ['Typing Practice', 'Mouse Accuracy', 'Cognitive Games', 'Shortcut Mastery'],
    pattern: 'bg-gradient-to-br from-slate-50 to-cyan-50',
  },
];

export default function CoreEDUHubPage() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasVisited, setHasVisited] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // AUTH REDIRECT LOGIC - Added to your existing code
  useEffect(() => {
    // Only redirect after loading is complete and we have a user
    if (!isLoading && isAuthenticated && user) {
      setShouldRedirect(true);
      
      // Determine redirect based on user role
      if (isAdmin) {
        router.replace('/admin');
      } else if (user.role === 'teacher') {
        router.replace('/dashboard/teacher');
      } else if (user.role === 'student') {
        router.replace('/dashboard/student');
      } else {
        // Fallback for users without roles
        router.replace('/dashboard/student');
      }
    }
  }, [user, isLoading, isAuthenticated, isAdmin, router]);

  // Check if user has visited before
  useEffect(() => {
    const visited = localStorage.getItem('coreEduVisited');
    if (visited) {
      setHasVisited(true);
      setShowWelcome(false);
    } else {
      localStorage.setItem('coreEduVisited', 'true');
    }
  }, []);

  // Auto-hide welcome screen after animation for new users
  useEffect(() => {
    if (!hasVisited && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [hasVisited, showWelcome]);

  // Trigger entrance animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Show loading state while checking auth or while redirecting
  if (isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14b8a6] via-[#0891b2] to-[#0f766e]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">
            {isLoading ? 'Loading...' : 'Redirecting to your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Only show homepage to unauthenticated users
  if (isAuthenticated) {
    return null; // This shouldn't show since we redirect above
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Welcome Screen - Only for new visitors */}
      {showWelcome && !hasVisited && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#14b8a6] via-[#0891b2] to-[#0f766e] text-white">
          <div className="text-center">
            <h1 className={cn(
              "text-4xl md:text-6xl font-bold mb-6 transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )} 
            style={{ textShadow: '0 0 30px rgba(255, 255, 255, 0.4)' }}>
              Welcome to
            </h1>
            <div className={cn(
              "text-6xl md:text-8xl font-black mb-4 transition-all duration-1000 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <span className="text-white drop-shadow-lg">Core</span>
              <span className="text-cyan-100 drop-shadow-lg">EDU</span>
            </div>
            <p className={cn(
              "text-lg md:text-xl mb-8 opacity-90 transition-all duration-1000 delay-700 text-cyan-50",
              isVisible ? "opacity-90 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              The Foundation for Modern Learning
            </p>
            <Button 
              onClick={handleGetStarted}
              variant="outline" 
              size="lg"
              className={cn(
                "bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-1000 delay-900",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              Explore CoreEDU
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Animated elements */}
          <div className={cn(
            "absolute bottom-8 transition-all duration-1000 delay-1200",
            isVisible ? "opacity-70" : "opacity-0"
          )}>
            <ChevronDown className="h-8 w-8 text-white/70 animate-bounce" />
          </div>
          
          {/* Background decoration with moving/glowing effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="floating-shape-1 absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full glow-effect"></div>
            <div className="floating-shape-2 absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-300/20 rounded-full glow-effect"></div>
            <div className="floating-shape-3 absolute top-1/2 left-10 w-64 h-64 bg-white/10 rounded-full glow-effect"></div>
            <div className="floating-shape-4 absolute top-20 right-1/4 w-40 h-40 bg-cyan-100/30 rounded-full glow-effect"></div>
            <div className="floating-shape-5 absolute bottom-32 right-10 w-56 h-56 bg-white/15 rounded-full glow-effect"></div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        .glow-effect {
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .floating-shape-1 {
          animation: float-1 8s ease-in-out infinite;
        }

        .floating-shape-2 {
          animation: float-2 10s ease-in-out infinite;
        }

        .floating-shape-3 {
          animation: float-3 6s ease-in-out infinite;
        }

        .floating-shape-4 {
          animation: float-4 7s ease-in-out infinite;
        }

        .floating-shape-5 {
          animation: float-5 9s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 60px rgba(20, 184, 166, 0.4);
            transform: scale(1.05);
          }
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -20px) rotate(90deg);
          }
          50% {
            transform: translate(-15px, -40px) rotate(180deg);
          }
          75% {
            transform: translate(-30px, -10px) rotate(270deg);
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(-25px, 30px) rotate(120deg);
          }
          66% {
            transform: translate(20px, -25px) rotate(240deg);
          }
        }

        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 20px);
          }
        }

        @keyframes float-4 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(-20px, 25px) rotate(180deg);
          }
        }

        @keyframes float-5 {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(15px, -15px);
          }
          50% {
            transform: translate(-10px, -30px);
          }
          75% {
            transform: translate(-25px, 10px);
          }
        }
        
        .animated-signup-button {
            animation: pulse-signup 2s infinite;
        }

        @keyframes pulse-signup {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7);
            }
            70% {
                transform: scale(1.02);
                box-shadow: 0 0 0 10px rgba(20, 184, 166, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
            }
        }
      `}</style>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-1000",
        showWelcome && !hasVisited ? "opacity-0" : "opacity-100"
      )}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-16">
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              The Foundation for Modern Learning
            </p>
            <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl font-headline mb-6">
              <span className="text-foreground">Core</span>
              <span className="text-primary">EDU</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              An integrated platform for pioneering teachers and curious students.
              Help shape the future of education from the very beginning.
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">3+</div>
                <div className="text-sm text-muted-foreground">Core Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Interactive Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-muted-foreground">∞</div>
                <div className="text-sm text-muted-foreground">Learning Possibilities</div>
              </div>
            </div>
          </div>

          {/* Professional CTA Section - Only show for non-authenticated users */}
          <div className="w-full max-w-5xl mx-auto mb-16">
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/10">
               <div className="grid md:grid-cols-2 gap-px bg-border">
                  {/* For Educators */}
                  <div className="bg-card p-8 text-center">
                     <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
                         <GraduationCap className="w-7 h-7 text-primary"/>
                         For Educators
                      </h3>
                     <p className="text-muted-foreground mb-6">
                         Empower your classroom with tools for managing classes, assigning homework, and tracking progress.
                     </p>
                     <div className="space-y-4 text-left">
                         <div className="flex items-start gap-3">
                             <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-1"><FileSignature className="h-6 w-6 text-green-600"/></div>
                             <div>
                                 <h4 className="font-semibold">Interactive Assignments</h4>
                                 <p className="text-sm text-muted-foreground">Create and assign homework using puzzles and flashcards.</p>
                             </div>
                         </div>
                          <div className="flex items-start gap-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-1"><BarChart className="h-6 w-6 text-blue-600"/></div>
                             <div>
                                 <h4 className="font-semibold">Student Analytics</h4>
                                 <p className="text-sm text-muted-foreground">View leaderboards and track student performance.</p>
                             </div>
                         </div>
                     </div>
                  </div>
                  
                  {/* For Students */}
                  <div className="bg-card p-8 text-center">
                     <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
                         <UserPlus className="w-7 h-7 text-primary"/>
                         For Students
                      </h3>
                     <p className="text-muted-foreground mb-6">
                         Take control of your learning with self-paced tools and gamified challenges to boost your skills.
                     </p>
                     <div className="space-y-4 text-left">
                         <div className="flex items-start gap-3">
                             <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-1"><BookCopy className="h-6 w-6 text-purple-600"/></div>
                             <div>
                                 <h4 className="font-semibold">Self-Paced Practice</h4>
                                 <p className="text-sm text-muted-foreground">Use flashcards and challenges to revise at your own speed.</p>
                             </div>
                         </div>
                          <div className="flex items-start gap-3">
                             <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 mt-1"><Trophy className="h-6 w-6 text-orange-600"/></div>
                             <div>
                                 <h4 className="font-semibold">Gamified Learning</h4>
                                 <p className="text-sm text-muted-foreground">Play skills-based games to master concepts like binary conversion.</p>
                             </div>
                         </div>
                     </div>
                  </div>
               </div>
               <div className="p-8 text-center">
                  <Button asChild size="lg" className="animated-signup-button text-lg px-8 py-6 shadow-lg">
                      <Link href="/signup">
                          <Zap className="mr-2 h-5 w-5"/>
                          Sign Up for Free
                      </Link>
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    No credit card required • Join our founding community
                 </p>
               </div>
            </Card>
          </div>

          {/* Core Products Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">Core Subject Editions</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Professional-grade learning platforms tailored for each subject area
            </p>
            
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
              {coreProducts.map((product, index) => (
                <Card key={product.title} className={cn(
                  "group transition-all duration-300 border-2 shadow-md relative overflow-hidden",
                  product.comingSoon ? "border-slate-200" : "hover:border-primary/30 border-transparent",
                  product.pattern
                )}>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={cn("text-xs", product.badgeColor)}>
                        {product.badge}
                      </Badge>
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300",
                        product.comingSoon ? "bg-slate-100" : "bg-white shadow-md"
                      )}>
                        {product.icon}
                      </div>
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl font-bold text-foreground font-headline">{product.title}</CardTitle>
                      <p className="text-sm text-primary font-medium mb-3">{product.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <div className={cn("w-1 h-1 rounded-full", product.comingSoon ? "bg-slate-400" : "bg-primary")}></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    {product.comingSoon ? (
                      <Button disabled className={cn("w-full")}>
                        Coming Soon
                      </Button>
                    ) : (
                      <Link href={product.href} passHref>
                        <Button className={cn("w-full")}>
                          Explore {product.title}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose CoreEDU?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A comprehensive educational ecosystem built for schools, teachers, and students.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Multi-Subject Coverage</h3>
                <p className="text-muted-foreground">
                  Complete curriculum alignment across Computer Science, Mathematics, and more subjects
                </p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Interactive Learning</h3>
                <p className="text-muted-foreground">
                  Hands-on challenges and real-time feedback that make complex concepts accessible
                </p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">School-Wide Solution</h3>
                <p className="text-muted-foreground">
                  Unified platform for multiple departments with centralized management and reporting
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
