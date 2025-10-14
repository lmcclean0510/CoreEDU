"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Get assistance with using CoreEDU</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>Learn the basics of CoreEDU</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Check out our guides for students and teachers to get started quickly.
            </p>
            <Button variant="outline" className="w-full">View Guides</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>Reach out to our team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Need help? Send us a message and we'll get back to you soon.
            </p>
            <Button variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Feedback
            </CardTitle>
            <CardDescription>Help us improve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Share your thoughts and suggestions to help make CoreEDU better.
            </p>
            <Button variant="outline" className="w-full">Send Feedback</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
