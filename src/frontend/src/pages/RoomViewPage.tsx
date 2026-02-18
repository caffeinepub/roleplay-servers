import { useState } from 'react';
import { useGetRoom, useListRoleplayPosts, useCreateRoleplayPost } from '../hooks/useQueries';
import { useHashRouter } from '../hooks/useHashRouter';
import { useCurrentUserPrincipal } from '../hooks/useCurrentUserPrincipal';
import { useGetServer } from '../hooks/useQueries';
import { canModeratePosts, isServerMember } from '../lib/serverRoles';
import RequireAuthInline from '../components/common/RequireAuthInline';
import ErrorNotice from '../components/common/ErrorNotice';
import DeletePostButton from '../components/moderation/DeletePostButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { ServerId, RoomId } from '../backend';

interface RoomViewPageProps {
  serverId: ServerId;
  roomId: RoomId;
}

export default function RoomViewPage({ serverId, roomId }: RoomViewPageProps) {
  const { navigate } = useHashRouter();
  const currentPrincipal = useCurrentUserPrincipal();
  const { data: room, isLoading: roomLoading, error: roomError } = useGetRoom(serverId, roomId);
  const { data: server } = useGetServer(serverId);
  const { data: posts, isLoading: postsLoading, refetch } = useListRoleplayPosts(serverId, roomId);
  const createPost = useCreateRoleplayPost();

  const [content, setContent] = useState('');

  const isMember = server ? isServerMember(server, currentPrincipal) : false;
  const canModerate = server ? canModeratePosts(server, currentPrincipal) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      await createPost.mutateAsync({
        serverId,
        roomId,
        content: content.trim(),
      });
      setContent('');
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Posts refreshed');
  };

  if (roomLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/server', { id: serverId })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Server
        </Button>
        <ErrorNotice message="Failed to load room. You may not have access to this room." />
      </div>
    );
  }

  const sortedPosts = posts ? [...posts].sort((a, b) => Number(a.id) - Number(b.id)) : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/server', { id: serverId })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Server
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{room.name}</CardTitle>
          <CardDescription>{room.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Roleplay Posts</h2>

          {postsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading posts...</p>
            </div>
          ) : sortedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  {isMember ? 'Be the first to start the story!' : 'Join the server to participate'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-lg border p-4">
              <div className="space-y-4">
                {sortedPosts.map((post) => {
                  const isAuthor = post.author.toString() === currentPrincipal;
                  return (
                    <Card key={post.id.toString()}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {post.author.toString().slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {isAuthor ? 'You' : post.author.toString().slice(0, 12)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Post #{post.id.toString()}
                              </p>
                            </div>
                          </div>
                          {canModerate && (
                            <DeletePostButton serverId={serverId} roomId={roomId} postId={post.id} />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
            </CardHeader>
            <CardContent>
              {!currentPrincipal ? (
                <RequireAuthInline message="Sign in to post" />
              ) : !isMember ? (
                <ErrorNotice title="Access Denied" message="You must be a server member to post" />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your roleplay post..."
                    rows={8}
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{content.length}/2000</span>
                  </div>
                  <Button type="submit" className="w-full" disabled={createPost.isPending}>
                    {createPost.isPending ? (
                      'Posting...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
