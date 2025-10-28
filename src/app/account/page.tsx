
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/shared/use-toast';
import { LoaderCircle, Gift, ToggleRight, Palette, Paintbrush, Pencil, Type } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateAvatar } from '@/ai/flows/generate-avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type UnlockedFeatures = {
  [key: string]: {
    unlocked: boolean;
    active: boolean;
  };
};

const FEATURE_CODES: { [code: string]: { key: string; name: string } } = {
  'Unlock1234': { key: 'aiAvatarGenerator', name: 'AI Avatar Generator' },
};

const backgroundColors = [
    // Pinks & Reds
    '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c',
    // Oranges
    '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
    // Yellows
    '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    // Greens
    '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d',
    // Teals & Cyans
    '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
    '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2',
    // Blues
    '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
    // Indigos & Purples
    '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
    '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
];

const outlineColors = [
    // Darker Reds & Oranges
    '#991b1b', '#7f1d1d', '#7c2d12', '#78350f',
    // Darker Yellows & Browns
    '#854d0e', '#713f12',
    // Darker Greens
    '#166534', '#14532d',
    // Darker Teals & Cyans
    '#047857', '#115e59', '#0891b2',
    // Darker Blues
    '#1e40af', '#1e3a8a',
    // Darker Purples
    '#5b21b6', '#4c1d95',
    // Dark Grays & Neutrals
    '#4b5563', '#374151', '#1f2937', '#111827',
];


export default function AccountPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarGenColor, setAvatarGenColor] = useState('');
  const [avatarBgColor, setAvatarBgColor] = useState<string>(backgroundColors[0]);
  const [avatarOutlineColor, setAvatarOutlineColor] = useState<string>(outlineColors[0]);
  const [avatarTextColor, setAvatarTextColor] = useState<string>('#000000');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [unlockedFeatures, setUnlockedFeatures] = useState<UnlockedFeatures>({});
  const [rewardsCode, setRewardsCode] = useState('');
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            const userRole = data.role || '';
            setRole(userRole);
            setUnlockedFeatures(data.unlockedFeatures || {});
            const avatar = data.photoURL || user.photoURL || null;
            setSelectedAvatar(avatar);
            setAvatarBgColor(data.avatarBgColor || backgroundColors[0]);
            setAvatarOutlineColor(data.avatarOutlineColor || outlineColors[0]);
            setAvatarTextColor(data.avatarTextColor || '#000000');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProfileError("Could not load your profile data.");
        } finally {
          setIsProfileLoading(false);
        }
      }
    }

    if (!isAuthLoading) {
        fetchUserData();
    }
  }, [user, isAuthLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
        firstName, 
        lastName,
        photoURL: selectedAvatar,
        avatarBgColor: avatarBgColor,
        avatarOutlineColor: avatarOutlineColor,
        avatarTextColor: avatarTextColor,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordError(null);
    if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError("This action requires you to have signed in recently. Please log out and log back in to change your password.");
      } else {
        setPasswordError('Failed to update password. Please try again.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      toast({ title: 'Prompt is empty', description: 'Please enter a word for your avatar.', variant: 'destructive' });
      return;
    }
    setIsGeneratingAvatar(true);
    setProfileError(null);
    try {
      const imageDataUri = await generateAvatar({ prompt: avatarPrompt, color: avatarGenColor });
      setSelectedAvatar(imageDataUri);
    } catch (error) {
      console.error("Error generating avatar:", error);
      setProfileError("Failed to generate avatar. The model may not support that prompt. Please try a different word.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setAvatarBgColor(color);
    // Switch back to initials avatar by clearing the selected image
    setSelectedAvatar(null);
  }
  
  const handleRedeemCode = async () => {
    if (!user) return;
    const feature = FEATURE_CODES[rewardsCode];

    if (!feature) {
      toast({
        title: 'Invalid Code',
        description: 'The code you entered is not valid. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRedeeming(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const newFeature = { unlocked: true, active: true };
      
      await updateDoc(userDocRef, {
        [`unlockedFeatures.${feature.key}`]: newFeature
      });
      
      setUnlockedFeatures(prev => ({
        ...prev,
        [feature.key]: newFeature,
      }));
      setRewardsCode('');
      
      toast({
        title: 'Feature Unlocked!',
        description: `You have successfully unlocked the ${feature.name}.`,
      });
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast({
        title: 'Redemption Failed',
        description: 'Could not unlock the feature. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  };
  
  const handleToggleFeature = async (featureKey: string, active: boolean) => {
    if (!user) return;
    
    const newFeatures = { ...unlockedFeatures, [featureKey]: { ...unlockedFeatures[featureKey], active }};
    setUnlockedFeatures(newFeatures);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        [`unlockedFeatures.${featureKey}.active`]: active
      });
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your feature setting. Please try again.',
        variant: 'destructive',
      });
      setUnlockedFeatures(unlockedFeatures);
    }
  };

  const isLoading = isAuthLoading || isProfileLoading;
  const showAvatarGenerator = unlockedFeatures.aiAvatarGenerator?.unlocked && unlockedFeatures.aiAvatarGenerator?.active;
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  // Protected by server-side layout - if we reach here, user exists
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">Account Settings</h1>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name and profile picture.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
               <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                 <DialogTrigger asChild>
                   <div className="relative group mx-auto w-24 h-24 mb-6 cursor-pointer">
                     <Avatar 
                       className="h-24 w-24 border-4"
                       style={{ borderColor: avatarOutlineColor }}
                     >
                       <AvatarImage src={selectedAvatar || undefined} alt="User Avatar" />
                       <AvatarFallback 
                         className="text-3xl font-bold"
                         style={{ 
                           backgroundColor: selectedAvatar ? undefined : avatarBgColor,
                           color: selectedAvatar ? undefined : avatarTextColor
                         }}
                       >
                         {initials}
                       </AvatarFallback>
                     </Avatar>
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="text-white w-8 h-8" />
                     </div>
                   </div>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Customize Your Avatar</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex justify-center pt-4">
                       <Avatar 
                         className="h-24 w-24 border-4"
                         style={{ borderColor: avatarOutlineColor }}
                       >
                         <AvatarImage src={selectedAvatar || undefined} alt="Avatar Preview" />
                         <AvatarFallback 
                           className="text-3xl font-bold"
                           style={{ 
                             backgroundColor: selectedAvatar ? undefined : avatarBgColor,
                             color: selectedAvatar ? undefined : avatarTextColor
                           }}
                         >
                           {initials}
                         </AvatarFallback>
                       </Avatar>
                    </div>

                    <div className="grid gap-6 py-4">
                      <div className="space-y-4">
                        <Label className="font-semibold flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
                          Avatar Background Color
                        </Label>
                        <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-md mx-auto">
                          <CarouselContent>
                            {backgroundColors.map((color) => (
                              <CarouselItem key={color} className="basis-1/8">
                                <div className="p-1 flex justify-center">
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-10 h-10 rounded-full cursor-pointer border-2 transition-all",
                                      avatarBgColor === color && !selectedAvatar ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent'
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                    aria-label={`Select color ${color}`}
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      </div>
                      <div className="space-y-4">
                        <Label className="font-semibold flex items-center gap-2">
                          <Paintbrush className="w-5 h-5 text-primary" />
                          Avatar Outline Color
                        </Label>
                         <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-md mx-auto">
                          <CarouselContent>
                            {outlineColors.map((color) => (
                              <CarouselItem key={color} className="basis-1/8">
                                <div className="p-1 flex justify-center">
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-10 h-10 rounded-full cursor-pointer border-2 transition-all",
                                      avatarOutlineColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent'
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setAvatarOutlineColor(color)}
                                    aria-label={`Select outline color ${color}`}
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      </div>
                      <div className="space-y-4">
                        <Label className="font-semibold flex items-center gap-2">
                            <Type className="w-5 h-5 text-primary" />
                            Initials Color
                        </Label>
                        <div className="p-1 bg-muted rounded-lg flex w-full max-w-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarTextColor('#000000');
                              setSelectedAvatar(null);
                            }}
                            className={cn(
                              "flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all",
                              avatarTextColor === '#000000' 
                                ? 'bg-card shadow-md text-card-foreground' 
                                : 'text-muted-foreground hover:shadow-lg hover:text-card-foreground'
                            )}
                          >
                            Black
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarTextColor('#FFFFFF');
                              setSelectedAvatar(null);
                            }}
                            className={cn(
                              "flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all",
                              avatarTextColor === '#FFFFFF' 
                                ? 'bg-card shadow-md text-card-foreground' 
                                : 'text-muted-foreground hover:shadow-lg hover:text-card-foreground'
                            )}
                          >
                            White
                          </button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={() => setIsAvatarDialogOpen(false)}>Done</Button>
                    </DialogFooter>
                 </DialogContent>
               </Dialog>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="firstName">First Name</Label>
                   <Input
                     id="firstName"
                     type="text"
                     placeholder="Your First Name"
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                     disabled={isUpdatingProfile}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="lastName">Last Name</Label>
                   <Input
                     id="lastName"
                     type="text"
                     placeholder="Your Last Name"
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                     disabled={isUpdatingProfile}
                   />
                 </div>
               </div>
              
              {showAvatarGenerator && (
                <div className="space-y-4 p-4 border rounded-lg bg-background-alt">
                  <Label htmlFor="avatar-prompt" className="font-semibold">Generate AI Avatar</Label>
                  <p className="text-xs text-muted-foreground">Select a color above to go back to an initials-based avatar.</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="avatar-prompt"
                      type="text"
                      placeholder="Prompt (e.g., Dragon)"
                      value={avatarPrompt}
                      onChange={(e) => setAvatarPrompt(e.target.value)}
                      disabled={isGeneratingAvatar}
                      className="flex-grow"
                    />
                    <Input
                      id="avatar-color"
                      type="text"
                      placeholder="Color (e.g., Blue)"
                      value={avatarGenColor}
                      onChange={(e) => setAvatarGenColor(e.target.value)}
                      disabled={isGeneratingAvatar}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar || !avatarPrompt.trim()}
                    >
                      {isGeneratingAvatar ? <LoaderCircle className="animate-spin" /> : 'Generate'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter a word and an optional color to generate a unique avatar.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Your role cannot be changed.</p>
              </div>

              {profileError && <p className="text-sm font-medium text-destructive">{profileError}</p>}
              <Button type="submit" disabled={isUpdatingProfile || isGeneratingAvatar}>
                {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Choose a new, strong password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  required
                />
              </div>
              {passwordError && <p className="text-sm font-medium text-destructive">{passwordError}</p>}
              <Button type="submit" variant="destructive" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Rewards & Unlocks
            </CardTitle>
            <CardDescription>
              Enter reward codes to unlock special features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rewards-code">Redeem Code</Label>
              <div className="flex gap-2">
                <Input
                  id="rewards-code"
                  type="text"
                  placeholder="e.g. Unlock1234"
                  value={rewardsCode}
                  onChange={(e) => setRewardsCode(e.target.value)}
                  disabled={isRedeeming}
                />
                <Button onClick={handleRedeemCode} disabled={isRedeeming || !rewardsCode}>
                  {isRedeeming ? <LoaderCircle className="animate-spin" /> : 'Redeem'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-md font-semibold flex items-center gap-2">
                <ToggleRight className="w-5 h-5 text-muted-foreground" />
                Unlocked Features
              </h3>
              {Object.keys(unlockedFeatures).length > 0 ? (
                <div className="space-y-2">
                  {unlockedFeatures.aiAvatarGenerator?.unlocked && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label htmlFor="toggle-ai-avatar" className="font-medium">
                        AI Avatar Generator
                      </Label>
                      <Switch
                        id="toggle-ai-avatar"
                        checked={unlockedFeatures.aiAvatarGenerator.active}
                        onCheckedChange={(checked) => handleToggleFeature('aiAvatarGenerator', checked)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You haven't unlocked any features yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
