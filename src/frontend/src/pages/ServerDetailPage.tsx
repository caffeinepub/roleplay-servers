import { useState } from 'react';
import { useGetServer, useJoinServer, useLeaveServer, useCreateRoom, useGetCallerUserProfile } from '../hooks/useQueries';
import { useHashRouter } from '../hooks/useHashRouter';
import { useCurrentUserPrincipal } from '../hooks/useCurrentUserPrincipal';
import { canEditServer, isServerMember } from '../lib/serverRoles';
import RequireAuthInline from '../components/common/RequireAuthInline';
import ErrorNotice from '../components/common/ErrorNotice';
import RemoveMemberButton from '../components/moderation/RemoveMemberButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Users, MessageSquare, ArrowLeft, Crown, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { ServerId } from '../backend';

interface ServerDetailPageProps {
  serverId: ServerId;
}

export default function ServerDetailPage({ serverId }: ServerDetailPageProps) {
  const { navigate } = useHashRouter();
  const currentPrincipal = useCurrentUserPrincipal();
  const { data: server, isLoading, error } = useGetServer(serverId);
  const { data: userProfile } = useGetCallerUserProfile();
  const joinServer = useJoinServer();
  const leaveServer = useLeaveServer();
  const createRoom = useCreateRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const isMember = server ? isServerMember(server, currentPrincipal) : false;
  const canEdit = server ? canEditServer(server, currentPrincipal) : false;

  const handleJoin = async () => {
    try {
      await joinServer.mutateAsync(serverId);
      toast.success('Joined server successfully!');
    } catch (error: any) {
      console.error('Failed to join server:', error);
      toast.error(error.message || 'Failed to join server');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveServer.mutateAsync(serverId);
      toast.success('Left server successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Failed to leave server:', error);
      toast.error(error.message || 'Failed to leave server');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await createRoom.mutateAsync({
        serverId,
        roomId,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      toast.success('Room created successfully!');
      setDialogOpen(false);
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(error.message || 'Failed to create room');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading server...</p>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>
        <ErrorNotice message="Failed to load server. You may not have access to this server." />
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    if (role === 'owner') return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />Owner</Badge>;
    if (role === 'admin') return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
    return <Badge variant="outline">Member</Badge>;
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Directory
      </Button>

      <div
        className="h-48 bg-cover bg-center rounded-lg shadow-lg"
        style={{
          backgroundImage: `url(${server.bannerImageUrl || '/assets/generated/server-banner-default.dim_1600x400.png'})`,
        }}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{server.name}</h1>
          <p className="text-muted-foreground mt-2">{server.description}</p>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{server.memberships.length} members</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!currentPrincipal ? (
            <RequireAuthInline message="Sign in to join this server" />
          ) : !isMember ? (
            <Button onClick={handleJoin} disabled={joinServer.isPending}>
              {joinServer.isPending ? 'Joining...' : 'Join Server'}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleLeave} disabled={leaveServer.isPending}>
              {leaveServer.isPending ? 'Leaving...' : 'Leave Server'}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Rooms</h2>
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name">Room Name</Label>
                      <Input
                        id="room-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter room name"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-description">Description</Label>
                      <Textarea
                        id="room-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe this room..."
                        rows={3}
                        maxLength={300}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createRoom.isPending}>
                      {createRoom.isPending ? 'Creating...' : 'Create Room'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {server.rooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Rooms Yet</h3>
                <p className="text-muted-foreground">
                  {canEdit ? 'Create the first room to start roleplaying!' : 'No rooms available yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {server.rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {room.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/room', { serverId, roomId: room.id })}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>{room.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {room.roleplayPosts.length} posts
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {server.memberships.map((membership) => {
                  const isCurrentUser = membership.userId.toString() === currentPrincipal;
                  const canRemove = canEdit && membership.role !== 'owner' && !isCurrentUser;
                  
                  return (
                    <div key={membership.userId.toString()} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {membership.userId.toString().slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {isCurrentUser ? userProfile?.name || 'You' : membership.userId.toString().slice(0, 8)}
                          </span>
                          {getRoleBadge(membership.role)}
                        </div>
                      </div>
                      {canRemove && (
                        <RemoveMemberButton
                          serverId={serverId}
                          memberId={membership.userId}
                          memberName={membership.userId.toString().slice(0, 8)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
