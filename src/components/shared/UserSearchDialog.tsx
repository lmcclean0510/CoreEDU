
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserListItem } from './UserListItem';
import type { UserProfile } from '@/lib/types';

interface UserSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  availableUsers: UserProfile[];
  isLoadingUsers: boolean;
  onSearchUser: (email: string) => Promise<void>;
  searchResult: UserProfile | null;
  searchError: string | null;
  isSearching: boolean;
  onAddUser: (userId: string) => Promise<void>;
  searchEmail: string;
  onSearchEmailChange: (email: string) => void;
  renderAsTabs?: boolean;
}

export function UserSearchDialog({
  isOpen,
  onClose,
  title,
  searchLabel,
  searchPlaceholder,
  availableUsers,
  isLoadingUsers,
  onSearchUser,
  searchResult,
  searchError,
  isSearching,
  onAddUser,
  searchEmail,
  onSearchEmailChange,
  renderAsTabs = false,
}: UserSearchDialogProps) {
  const handleSearch = () => {
    if (searchEmail.trim()) {
      onSearchUser(searchEmail.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchEmail.trim()) {
      handleSearch();
    }
  };
  
  const searchContent = (
      <div className="space-y-4">
        <Label htmlFor="user-email">{searchLabel}</Label>
        <div className="flex gap-2">
          <Input
            id="user-email"
            type="email"
            value={searchEmail}
            onChange={(e) => onSearchEmailChange(e.target.value)}
            placeholder={searchPlaceholder}
            onKeyPress={handleKeyPress}
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchEmail.trim()} 
            size="icon"
          >
            {isSearching ? <LoaderCircle className="animate-spin" /> : <Search />}
          </Button>
        </div>
        
        {searchResult && (
          <div className="animate-fade-in bg-muted/50 rounded-lg">
            <UserListItem
              user={searchResult}
              onAction={() => onAddUser(searchResult.uid)}
              actionLabel="Add"
            />
          </div>
        )}
        
        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}
      </div>
  );
  
  const listContent = (
     <ScrollArea className="h-full pr-4">
        <div className="space-y-2">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-full">
              <LoaderCircle className="animate-spin text-primary" />
            </div>
          ) : availableUsers.length > 0 ? (
            availableUsers.map(user => (
              <UserListItem
                key={user.uid}
                user={user}
                onAction={() => onAddUser(user.uid)}
                actionLabel="Add"
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users available, or all have been added.
            </p>
          )}
        </div>
      </ScrollArea>
  );

  if (renderAsTabs) {
      return (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">User List</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="h-80 py-4">
            {listContent}
          </TabsContent>
          <TabsContent value="search" className="h-80 py-4">
            {searchContent}
          </TabsContent>
        </Tabs>
      );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">User List</TabsTrigger>
            <TabsTrigger value="search">Search by Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="h-80 py-4">
            {listContent}
          </TabsContent>
          
          <TabsContent value="search" className="h-80 py-4 space-y-4">
            {searchContent}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
