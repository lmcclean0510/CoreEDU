"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
  Sparkles,
  Trophy,
  Star,
  Zap,
  UserPlus
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import Link from 'next/link';


// Animated CoreEDU Logo for right side
const AnimatedLogoLarge = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-7xl md:text-8xl font-bold mb-6">
        <span className="text-white/90">Core</span>
        <span className="text-white bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm">EDU</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-white/80 text-xl">
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span>Educational Excellence</span>
        <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
};

// Floating geometric shapes for right side
const FloatingShape = ({ size, color, position, delay, shape = "circle" }: { 
  size: string, 
  color: string, 
  position: string, 
  delay: number,
  shape?: "circle" | "square" | "triangle"
}) => {
  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-2xl rotate-12",
    triangle: "rounded-lg rotate-45"
  };

  return (
    <div 
      className={`absolute ${position} ${size} ${color} ${shapeClasses[shape]} opacity-70`}
      style={{ 
        animation: `floatAndRotate 6s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    />
  );
};

// Educational icon floating around
const FloatingEducationIcon = ({ icon: Icon, position, delay, color }: {
  icon: any,
  position: string,
  delay: number,
  color: string
}) => {
  return (
    <div 
      className={`absolute ${position} w-16 h-16 ${color} rounded-2xl flex items-center justify-center backdrop-blur-sm opacity-80 hover:opacity-100 transition-all duration-300`}
      style={{ 
        animation: `gentleFloat 4s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      <Icon className="w-8 h-8 text-white" />
    </div>
  );
};

// Motivational quotes for right side
const motivationalQuotes = [
  "Unlock your potential with every lesson",
  "Knowledge is the key to your future",
  "Excellence begins with curiosity", 
  "Transform learning into achievement",
  "Your educational journey starts here"
];

export default function SplitScreenLogin() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [emailValid, setEmailValid] = useState(false);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(formData.email));
  }, [formData.email]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Step 2: Get the ID token (this contains all claims)
      const idToken = await userCredential.user.getIdToken();
      
      // Step 3: Create server-side session cookie via API
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      // Step 4: Success! Show toast and redirect
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      // Step 5: Check for redirect parameter (if user was redirected to login)
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      
      if (redirectPath && redirectPath.startsWith('/')) {
        // Redirect to where they were trying to go
        window.location.href = redirectPath;
      } else {
        // Let middleware handle the redirect based on user role
        window.location.href = '/';
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      const errorCode = error.code;
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (errorCode === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Contact your administrator.';
      } else if (error.message.includes('session')) {
        errorMessage = 'Login successful but session creation failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Functional Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Simple logo for left side */}
          <div className="text-center">
            <div className="text-2xl font-bold">
              <span className="text-foreground">Core</span>
              <span className="text-primary">EDU</span>
            </div>
          </div>

          {/* Welcome message */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to continue your learning journey</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                Email Address
                {emailValid && formData.email && (
                  <CheckCircle className="w-4 h-4 text-success animate-in fade-in duration-300" />
                )}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@school.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`pl-10 h-12 transition-all duration-300 border-slate-200 ${
                    focusedField === 'email' 
                      ? 'ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5' 
                      : emailValid && formData.email
                      ? 'border-success/50 bg-success/5'
                      : 'hover:border-slate-300'
                  }`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  className={`pl-10 pr-12 h-12 transition-all duration-300 border-slate-200 ${
                    focusedField === 'password' 
                      ? 'ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5' 
                      : 'hover:border-slate-300'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                disabled={isLoading}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Remember me for 30 days
              </Label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 animate-in slide-in-from-top-1 duration-300">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSignIn}
              className="w-full h-12 text-base font-semibold transition-all duration-300 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl group" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing you in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-200">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              )}
            </Button>

            {/* Footer */}
            <div className="space-y-4 pt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    New to CoreEDU?
                  </span>
                </div>
              </div>
              
              <Button asChild variant="outline" className="w-full h-12 group">
                <Link href="/signup">
                  <div className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-200">
                     <UserPlus className="w-4 h-4" />
                     <span>Create an Account</span>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Animated & Alive - Hidden on mobile */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden flex-col items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Geometric Shapes */}
          <FloatingShape size="w-32 h-32" color="bg-white/10" position="top-20 right-20" delay={0} shape="circle" />
          <FloatingShape size="w-24 h-24" color="bg-white/15" position="bottom-32 left-16" delay={2} shape="square" />
          <FloatingShape size="w-20 h-20" color="bg-white/10" position="top-1/3 left-12" delay={4} shape="triangle" />
          <FloatingShape size="w-28 h-28" color="bg-white/5" position="bottom-20 right-12" delay={1} shape="circle" />
          <FloatingShape size="w-16 h-16" color="bg-white/20" position="top-1/2 right-8" delay={3} shape="square" />
          
          {/* Floating Educational Icons - Fixed positioning */}
          <FloatingEducationIcon icon={BookOpen} position="top-24 left-20" delay={0} color="bg-white/20" />
          <FloatingEducationIcon icon={GraduationCap} position="bottom-40 right-24" delay={2} color="bg-white/15" />
          <FloatingEducationIcon icon={Lightbulb} position="top-1/2 left-8" delay={4} color="bg-white/20" />
          <FloatingEducationIcon icon={Trophy} position="top-32 right-16" delay={1} color="bg-white/15" />
          <FloatingEducationIcon icon={Target} position="bottom-24 left-16" delay={3} color="bg-white/20" />
          <FloatingEducationIcon icon={Star} position="top-3/4 right-8" delay={5} color="bg-white/15" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center space-y-12 px-8">
          {/* Large Animated Logo */}
          <AnimatedLogoLarge />
          
          {/* Animated Quote - Fixed height container */}
          <div className="space-y-6">
            <div className="text-white/90 text-xl md:text-2xl font-medium leading-relaxed max-w-md mx-auto h-16 flex items-center justify-center">
              <span className="block transition-all duration-700 ease-in-out text-center">
                {motivationalQuotes[currentQuote]}
              </span>
            </div>
            
            {/* Quote indicators */}
            <div className="flex justify-center space-x-2">
              {motivationalQuotes.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentQuote ? 'bg-white w-8' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
            <div className="text-center text-white/80">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Collaborative</p>
            </div>
            <div className="text-center text-white/80">
              <Zap className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Interactive</p>
            </div>
            <div className="text-center text-white/80">
              <Trophy className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Rewarding</p>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary to-transparent" />
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-10px); 
          }
        }
        
        @keyframes floatAndRotate {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-15px) rotate(120deg); 
          }
          66% { 
            transform: translateY(-5px) rotate(240deg); 
          }
        }
      `}</style>
    </div>
  );
}