import { useState } from 'react';
import { useDeleteRoleplayPost } from '../../hooks/useQueries';
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
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ServerId, RoomId, RoleplayPostId } from '../../backend';

interface DeletePostButtonProps {
  serverId: ServerId;
  roomId: RoomId;
  postId: RoleplayPostId;
}

export default function DeletePostButton({ serverId, roomId, postId }: DeletePostButtonProps) {
  const [open, setOpen] = useState(false);
  const deletePost = useDeleteRoleplayPost();

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync({ serverId, roomId, postId });
      toast.success('Post deleted successfully');
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deletePost.isPending}>
            {deletePost.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
