"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  School,
  User,
  ArrowRight,
  UserPlus,
  CheckCircle,
  Shield,
  BookOpen,
  Users,
  TrendingUp,
  Target,
  Award,
  GraduationCap,
  Lightbulb,
  Trophy,
  Star
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import Link from 'next/link';

// Large animated logo for right side
const AnimatedSignupLogo = () => {
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
        <TrendingUp className="w-6 h-6 animate-pulse" />
        <span>Transform Your Learning</span>
        <Award className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
};

// Dynamic floating knowledge nodes that move around the entire screen
const FloatingKnowledgeNode = ({ size, delay, duration = 12 }: {
  size: "small" | "medium" | "large",
  delay: number,
  duration?: number
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6", 
    large: "w-10 h-10"
  };

  const baseOpacity = {
    small: "bg-white/30",
    medium: "bg-white/40",
    large: "bg-white/50"
  };

  return (
    <div 
      className={`absolute ${sizeClasses[size]} rounded-full ${baseOpacity[size]} border-2 border-white/50 backdrop-blur-sm shadow-lg`}
      style={{ 
        animation: `floatAround ${duration}s ease-in-out infinite, growShrink 4s ease-in-out infinite`,
        animationDelay: `${delay}s, ${delay * 0.5}s`,
        left: '10%',
        top: '10%'
      }}
    >
      <div className="w-full h-full rounded-full bg-white/20" />
    </div>
  );
};

// Clean flowing connection lines
const FlowingConnection = ({ delay }: { delay: number }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <path
        d="M50,500 Q150,400 250,350 Q350,300 450,250"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5,10"
        style={{ 
          animation: `flowConnection 8s ease-in-out infinite`,
          animationDelay: `${delay}s`
        }}
      />
    </svg>
  );
};

// Academic-inspired floating elements
const AcademicElement = ({ type, position, delay }: {
  type: "formula" | "concept" | "idea",
  position: string,
  delay: number
}) => {
  const elements = {
    formula: "∑x²",
    concept: "{ }",
    idea: "→"
  };

  return (
    <div 
      className={`absolute ${position} text-white/20 font-mono text-lg select-none`}
      style={{ 
        animation: `academicFloat 6s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      {elements[type]}
    </div>
  );
};

// Inspirational messages for signup
const signupMessages = [
  "Your educational journey starts here",
  "Transform your learning experience", 
  "Build knowledge, build confidence",
  "Discover your academic potential",
  "Where learning leads to achievement"
];

// Password strength indicator
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    };

    score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      checks,
      level: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
  };

  if (!password) return null;

  const strength = getStrength(password);
  const colors = {
    weak: 'bg-destructive',
    medium: 'bg-yellow-500',
    strong: 'bg-success'
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.score ? colors[strength.level] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          {strength.checks.length ? (
            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
          ) : (
            <div className="w-3 h-3 border border-muted-foreground/50 rounded-full flex-shrink-0" />
          )}
          <span className={strength.checks.length ? 'text-success' : 'text-muted-foreground'}>
            At least 8 characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          {strength.checks.number ? (
            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
          ) : (
            <div className="w-3 h-3 border border-muted-foreground/50 rounded-full flex-shrink-0" />
          )}
          <span className={strength.checks.number ? 'text-success' : 'text-muted-foreground'}>
            Contains numbers
          </span>
        </div>
      </div>
    </div>
  );
};

export default function SplitScreenSignup() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    schoolCode: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [emailValid, setEmailValid] = useState(false);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % signupMessages.length);
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
    if (!formData.email || !formData.password || !formData.schoolCode) {
      setError('Please fill in all required fields.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Validate school code exists (optional - implement if you have schools collection)
      // const schoolDoc = await getDoc(doc(db, 'schools', formData.schoolCode));
      // if (!schoolDoc.exists()) {
      //   throw new Error('Invalid school code. Please check with your administrator.');
      // }

      // Step 2: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const user = userCredential.user;

      // Step 3: Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        role: formData.role,
        schoolId: formData.schoolCode,
        firstName: '', // They can fill this in later in account settings
        lastName: '',
        createdAt: new Date(),
        lastLogin: new Date(),
        emailVerified: user.emailVerified
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Step 4: Get ID token and create session
      const idToken = await user.getIdToken();
      
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

      // Step 5: Success! Show toast and redirect
      toast({
        title: 'Account Created Successfully!',
        description: 'Welcome to CoreEDU! Setting up your account...',
      });

      // Step 6: Redirect based on role
      if (formData.role === 'teacher') {
        window.location.href = '/dashboard/teacher';
      } else {
        window.location.href = '/dashboard/student';
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase errors
      const errorCode = error.code;
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = 'Account creation is currently disabled. Contact your administrator.';
      } else if (error.message.includes('school code')) {
        errorMessage = error.message;
      } else if (error.message.includes('session')) {
        errorMessage = 'Account created but login failed. Please try signing in.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Functional Signup Form */}
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
            <h1 className="text-3xl font-bold text-foreground">Join CoreEDU</h1>
            <p className="text-muted-foreground">Create your account to start learning</p>
          </div>

          {/* Signup Form */}
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

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                I am a
              </Label>
              <Select 
                onValueChange={(value) => handleInputChange('role', value)} 
                defaultValue="student"
                disabled={isLoading}
              >
                <SelectTrigger className="w-full h-12">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4" />
                      Student
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4" />
                      Teacher
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* School Code */}
            <div className="space-y-2">
              <Label htmlFor="school-code" className="text-sm font-medium text-foreground">
                School Code
              </Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="school-code"
                  type="text"
                  placeholder="Enter your school code"
                  value={formData.schoolCode}
                  onChange={(e) => handleInputChange('schoolCode', e.target.value.toUpperCase())}
                  onFocus={() => setFocusedField('schoolCode')}
                  onBlur={() => setFocusedField(null)}
                  className={`pl-10 h-12 font-mono transition-all duration-300 border-slate-200 ${
                    focusedField === 'schoolCode' 
                      ? 'ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5' 
                      : 'hover:border-slate-300'
                  }`}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Don't have a school code? Contact your administrator.
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
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
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={`pl-10 pr-12 h-12 transition-all duration-300 border-slate-200 ${
                    focusedField === 'confirmPassword' 
                      ? 'ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5' 
                      : formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-destructive'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-success/50 bg-success/5'
                      : 'hover:border-slate-300'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 z-10"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 animate-in slide-in-from-top-1 duration-300">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSignUp}
              className="w-full h-12 text-base font-semibold transition-all duration-300 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl group" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-200">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              )}
            </Button>

            {/* Footer */}
            <div className="text-center space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline">
                  Sign In
                </Link>
              </p>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Same as Login with Join/Learn/Achieve - Hidden on mobile */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center">
        {/* Same background elements as login */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gentle geometric shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-3xl rotate-12 blur-sm" 
               style={{ animation: 'gentleFloat 6s ease-in-out infinite' }} />
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-primary/3 rounded-2xl -rotate-12 blur-sm" 
               style={{ animation: 'gentleFloat 8s ease-in-out infinite', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-8 w-16 h-16 bg-primary/4 rounded-xl rotate-45 blur-sm" 
               style={{ animation: 'gentleFloat 5s ease-in-out infinite', animationDelay: '1s' }} />
          
          {/* Educational floating icons */}
          <div className="absolute top-20 right-16 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="absolute bottom-40 left-12 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite', animationDelay: '2s' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="absolute top-1/2 left-8 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite', animationDelay: '4s' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <Lightbulb className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="absolute top-32 right-16 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite', animationDelay: '1s' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="absolute bottom-24 left-16 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite', animationDelay: '3s' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <Target className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="absolute top-3/4 right-8 opacity-80 transition-all duration-700 hover:opacity-100 hover:scale-110"
               style={{ animation: 'gentleFloat 4s ease-in-out infinite', animationDelay: '5s' }}>
            <div className="w-24 h-24 rounded-3xl bg-primary/30 backdrop-blur-md border-2 border-primary/50 flex items-center justify-center shadow-2xl">
              <Star className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center space-y-12 px-8">
          {/* Large Animated Logo */}
          <AnimatedSignupLogo />
          
          {/* Animated Message - Fixed height to prevent jumping */}
          <div className="space-y-6">
            <div className="text-white/90 text-xl md:text-2xl font-medium leading-relaxed max-w-md mx-auto h-16 flex items-center justify-center">
              <span className="block transition-all duration-700 ease-in-out text-center">
                {signupMessages[currentMessage]}
              </span>
            </div>
            
            {/* Message indicators */}
            <div className="flex justify-center space-x-2">
              {signupMessages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentMessage ? 'bg-white w-8' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Journey Steps */}
          <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
            <div className="text-center text-white/80">
              <UserPlus className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Join</p>
            </div>
            <div className="text-center text-white/80">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Learn</p>
            </div>
            <div className="text-center text-white/80">
              <Award className="w-6 h-6 mx-auto mb-2" />
              <p className="text-xs">Achieve</p>
            </div>
          </div>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary to-transparent" />
      </div>

      {/* Custom animations - same as login */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-10px) rotate(1deg); 
          }
        }
      `}</style>
    </div>
  );
}