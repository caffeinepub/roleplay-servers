import { useState } from 'react';
import { useRemoveMember } from '../../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import type { ServerId, UserId } from '../../backend';

interface RemoveMemberButtonProps {
  serverId: ServerId;
  memberId: UserId;
  memberName: string;
}

export default function RemoveMemberButton({ serverId, memberId, memberName }: RemoveMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const removeMember = useRemoveMember();

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({ serverId, memberId });
      toast.success('Member removed successfully');
      setOpen(false);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserMinus className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {memberName} from this server? They will lose access to all rooms and content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={removeMember.isPending}>
            {removeMember.isPending ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
