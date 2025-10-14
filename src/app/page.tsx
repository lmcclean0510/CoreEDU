"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code, BookOpen, Users, GraduationCap, Target, Gamepad2, Grid3X3, FileText, Calendar, BarChart3, Clock, Trophy, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Quick access cards for the dashboard
const quickAccessCards = [
  {
    title: 'CoreCS',
    description: 'Computer Science learning hub',
    href: '/corecs',
    icon: Code,
    color: 'bg-blue-500',
    stats: 'Python, Binary & More'
  },
  {
    title: 'CoreLabs',
    description: 'Skills & games platform',
    href: '/corelabs',
    icon: Gamepad2,
    color: 'bg-purple-500',
    stats: 'Typing, Mouse Skills & Games'
  },
  {
    title: 'CoreTools',
    description: 'Teacher utilities',
    href: '/coretools',
    icon: Grid3X3,
    color: 'bg-green-500',
    stats: 'Seating Plans & More'
  },
  {
    title: 'Homework',
    description: 'View assignments',
    href: '/homework',
    icon: FileText,
    color: 'bg-orange-500',
    stats: 'Track your progress'
  },
];

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Learning',
    description: 'Hands-on coding challenges, puzzles, and flashcards designed for active learning.'
  },
  {
    icon: Users,
    title: 'Classroom Management',
    description: 'Create classes, assign homework, and track student progress in real-time.'
  },
  {
    icon: Trophy,
    title: 'Gamified Experience',
    description: 'Engage with educational games and compete on leaderboards.'
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed analytics and insights.'
  },
];

export default function HomePage() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (isAdmin) {
        router.replace('/admin');
      } else if (user.role === 'teacher') {
        router.replace('/dashboard/teacher');
      } else if (user.role === 'student') {
        router.replace('/dashboard/student');
      }
    }
  }, [user, isLoading, isAuthenticated, isAdmin, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo/Title */}
            <div className="inline-block">
              <Badge variant="secondary" className="mb-4">
                Modern Learning Platform
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Welcome to{' '}
              <span className="text-primary">Core</span>
              <span className="text-foreground">EDU</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              An integrated educational platform designed for teachers and students. 
              Interactive learning tools, classroom management, and gamified challenges all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Free for all users
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything You Need to Learn & Teach</h2>
              <p className="text-muted-foreground text-lg">
                Powerful tools designed for modern education
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Explore Our Learning Platforms</h2>
              <p className="text-muted-foreground text-lg">
                Each platform is tailored to specific subjects and skills
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Code className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle>CoreCS</CardTitle>
                  <CardDescription>Computer Science Edition</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Master programming with Python challenges, binary logic, and interactive coding puzzles.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Python</Badge>
                    <Badge variant="secondary" className="text-xs">Binary</Badge>
                    <Badge variant="secondary" className="text-xs">Algorithms</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Gamepad2 className="h-8 w-8 text-purple-500" />
                  </div>
                  <CardTitle>CoreLabs</CardTitle>
                  <CardDescription>Skills & Games Hub</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sharpen your skills with typing practice, mouse accuracy, and cognitive games.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Typing</Badge>
                    <Badge variant="secondary" className="text-xs">Mouse Skills</Badge>
                    <Badge variant="secondary" className="text-xs">Games</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Grid3X3 className="h-8 w-8 text-green-500" />
                  </div>
                  <CardTitle>CoreTools</CardTitle>
                  <CardDescription>Teacher Utilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Powerful utilities for teachers including seating plans and classroom management.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Seating Plans</Badge>
                    <Badge variant="secondary" className="text-xs">Analytics</Badge>
                    <Badge variant="secondary" className="text-xs">Reports</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* For Teachers & Students Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* For Teachers */}
              <Card className="border-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">For Teachers</CardTitle>
                  <CardDescription>Empower your classroom with modern tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Create & Manage Classes</p>
                        <p className="text-sm text-muted-foreground">Easy class setup with join codes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Assign Interactive Homework</p>
                        <p className="text-sm text-muted-foreground">Flashcards, puzzles, and challenges</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Track Student Progress</p>
                        <p className="text-sm text-muted-foreground">Real-time analytics and insights</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* For Students */}
              <Card className="border-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">For Students</CardTitle>
                  <CardDescription>Take control of your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Self-Paced Learning</p>
                        <p className="text-sm text-muted-foreground">Study at your own speed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Interactive Challenges</p>
                        <p className="text-sm text-muted-foreground">Engaging puzzles and games</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Track Your Progress</p>
                        <p className="text-sm text-muted-foreground">See your improvement over time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="inline-block mx-auto">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join teachers and students already using CoreEDU to enhance their learning experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  // This should never show due to redirect, but just in case
  return null;
}
