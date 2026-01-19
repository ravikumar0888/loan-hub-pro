import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { useAdminPasswordVerification } from '../../hooks/useAdminPasswordVerification';

interface AdminPasswordVerificationDialogProps {
  open: boolean;
  onCancel: () => void;
  pageId: string;
  pageName: string;
}

export function AdminPasswordVerificationDialog({
  open,
  onCancel,
  pageId,
  pageName,
}: AdminPasswordVerificationDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { verifyPasswordForPage, isVerifying } = useAdminPasswordVerification();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    const success = await verifyPasswordForPage(pageId, password);

    if (!success) {
      setError('Invalid password');
      toast({
        title: 'Verification Failed',
        description: 'The password you entered is incorrect',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verification Successful',
        description: `You now have access to ${pageName}`,
      });
      setPassword('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription>
              {pageName} requires password verification to access sensitive data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter your password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  disabled={isVerifying}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isVerifying}>
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
