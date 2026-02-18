import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn } from 'lucide-react';

interface RequireAuthInlineProps {
  children?: React.ReactNode;
  message?: string;
}

export default function RequireAuthInline({ children, message = 'Please sign in to continue' }: RequireAuthInlineProps) {
  const { identity, login, loginStatus } = useInternetIdentity();

  if (!identity) {
    return (
      <Alert>
        <LogIn className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          <Button
            size="sm"
            onClick={login}
            disabled={loginStatus === 'logging-in'}
          >
            {loginStatus === 'logging-in' ? 'Logging in...' : 'Sign In'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
