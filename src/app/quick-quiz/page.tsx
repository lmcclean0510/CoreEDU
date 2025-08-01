
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function QuickQuizPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center bg-background-alt p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Construction className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Coming Soon!</CardTitle>
          <CardDescription className="text-lg">
            This quick quiz feature is currently under construction. Please check back later!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
