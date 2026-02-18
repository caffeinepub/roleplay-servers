import { useState } from 'react';
import { useListServers, useCreateServer } from '../hooks/useQueries';
import { useHashRouter } from '../hooks/useHashRouter';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import RequireAuthInline from '../components/common/RequireAuthInline';
import ErrorNotice from '../components/common/ErrorNotice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ServerDirectoryPage() {
  const { navigate } = useHashRouter();
  const { identity } = useInternetIdentity();
  const { data: servers, isLoading, error } = useListServers();
  const createServer = useCreateServer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    const serverId = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await createServer.mutateAsync({
        id: serverId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        bannerImageUrl: null,
      });
      toast.success('Server created successfully!');
      setDialogOpen(false);
      setFormData({ name: '', description: '' });
      navigate('/server', { id: serverId });
    } catch (error: any) {
      console.error('Failed to create server:', error);
      toast.error(error.message || 'Failed to create server');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorNotice message="Failed to load servers. Please try again later." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Server Directory</h1>
          <p className="text-muted-foreground mt-1">Join a community and start your roleplay adventure</p>
        </div>
        {identity && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Server
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Server</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateServer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Server Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter server name"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your server..."
                    rows={4}
                    maxLength={500}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createServer.isPending}>
                  {createServer.isPending ? 'Creating...' : 'Create Server'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!identity && (
        <RequireAuthInline message="Sign in to create your own server or join existing ones" />
      )}

      {servers && servers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Servers Yet</h3>
            <p className="text-muted-foreground mb-4">
              {identity ? 'Be the first to create a server!' : 'Sign in to see and join servers'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers?.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <div
                className="h-32 bg-cover bg-center rounded-t-lg"
                style={{
                  backgroundImage: `url(${server.bannerImageUrl || '/assets/generated/server-banner-default.dim_1600x400.png'})`,
                }}
              />
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {server.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/server', { id: server.id })}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="line-clamp-2">{server.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{server.memberships.length} members</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
