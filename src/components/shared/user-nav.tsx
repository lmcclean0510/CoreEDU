
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogIn, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/shared/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/UserProvider';
export function UserNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getProfileFromAppUser = (appUser: AppUser) => {
    if (!appUser) return null;
    // The AppUser object from useAuth now contains all the profile info we need.
    // However, the structure of the `profile` state in this component was slightly different.
    // We will adapt to the new structure provided by `useAuth`.
    // The AppUser contains `photoURL`, `firstName`, etc., directly if we fetch it.
    // My new `useAuth` hook merges the firebase auth user with the firestore user document.
    // Let's assume `user` from `useAuth` has firstName, lastName, etc.
    // The AppUser type needs to be defined in useAuth and exported.
    return {
        firstName: (user as any).firstName || null,
        lastName: (user as any).lastName || null,
        photoURL: user.photoURL || null,
        avatarBgColor: (user as any).avatarBgColor || null,
        avatarOutlineColor: (user as any).avatarOutlineColor || null,
        avatarTextColor: (user as any).avatarTextColor || null,
        role: user.role || null,
    };
  }
  
  const profile = user ? getProfileFromAppUser(user) : null;
  const initials = ((user as any)?.firstName?.[0] || '' + (user as any)?.lastName?.[0] || '').toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';


  if (isLoading) {
    return <div className="w-28 h-10 bg-muted rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon">
              <Link href="/login">
                <LogIn />
                <span className="sr-only">Sign In</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign In</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-auto px-2 py-1 flex items-center gap-3 rounded-full hover:bg-muted/50">
           {(user as any).firstName && (
            <span className="text-sm font-medium text-muted-foreground">
              {(user as any).firstName}
            </span>
          )}
          <Avatar 
            className="h-8 w-8 border-2"
            style={{ borderColor: (user as any).avatarOutlineColor || 'transparent' }}
          >
            <AvatarImage src={user.photoURL || undefined} alt={user.email || ''} />
            <AvatarFallback 
              style={{ 
                backgroundColor: user.photoURL ? undefined : (user as any).avatarBgColor || undefined,
                color: user.photoURL ? undefined : ((user as any).avatarTextColor || 'hsl(var(--foreground))')
              }}
            >
              {initials.substring(0,2)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Signed in as</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/account')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Account</span>
          </DropdownMenuItem>
          {user.role === 'teacher' && (
            <DropdownMenuItem onClick={() => router.push('/dashboard/teacher')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Teacher Dashboard</span>
            </DropdownMenuItem>
          )}
          {user.role === 'student' && (
            <DropdownMenuItem onClick={() => router.push('/dashboard/student')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Student Dashboard</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
