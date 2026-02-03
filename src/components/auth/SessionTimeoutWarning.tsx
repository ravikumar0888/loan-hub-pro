import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface SessionTimeoutWarningProps {
  open: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function SessionTimeoutWarning({
  open,
  countdown,
  onStayLoggedIn,
  onLogoutNow,
}: SessionTimeoutWarningProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <DialogTitle>Session Timeout Warning</DialogTitle>
              <DialogDescription className="mt-1">
                You will be automatically logged out in{' '}
                <strong className="text-warning">{countdown}</strong> second
                {countdown !== 1 ? 's' : ''} due to inactivity.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={onStayLoggedIn}
            className="flex-1 sm:flex-initial"
            size="lg"
          >
            Stay Logged In
          </Button>
          <Button
            onClick={onLogoutNow}
            variant="destructive"
            className="flex-1 sm:flex-initial"
            size="lg"
          >
            Logout Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
