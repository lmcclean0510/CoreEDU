import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Check, X } from 'lucide-react';

interface JoinRequestWithStudentInfo {
  id: string;
  classId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
  studentInfo: {
    name: string;
    email: string;
  };
  className: string;
}

interface JoinRequestCardProps {
  request: JoinRequestWithStudentInfo;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

export function JoinRequestCard({ request, onApprove, onDeny }: JoinRequestCardProps) {
  return (
    <Card className="border-l-4 border-l-orange-400 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {request.studentInfo.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {request.studentInfo.email}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            Pending
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Wants to join: <span className="font-medium text-foreground">{request.className}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(request.id)}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => onDeny(request.id)}
              variant="outline"
              size="sm"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-4 h-4 mr-2" />
              Deny
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}