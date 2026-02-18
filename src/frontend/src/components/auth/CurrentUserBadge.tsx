import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export default function CurrentUserBadge() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  if (!identity) {
    return (
      <Badge variant="outline" className="gap-2">
        <User className="h-4 w-4" />
        Guest
      </Badge>
    );
  }

  const displayName = userProfile?.name || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={userProfile?.avatarUrl || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
    </div>
  );
}
