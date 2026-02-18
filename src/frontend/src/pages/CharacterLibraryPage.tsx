import { useState } from 'react';
import { useListCharacterProfiles, useCreateCharacterProfile, useEditCharacterProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCurrentUserPrincipal } from '../hooks/useCurrentUserPrincipal';
import RequireAuthInline from '../components/common/RequireAuthInline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import type { CharacterProfile } from '../backend';

export default function CharacterLibraryPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = useCurrentUserPrincipal();
  const userId = identity ? identity.getPrincipal() : Principal.anonymous();
  const { data: characters, isLoading } = useListCharacterProfiles(userId, null);
  const createCharacter = useCreateCharacterProfile();
  const editCharacter = useEditCharacterProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    appearance: '',
  });

  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setFormData({ name: '', description: '', appearance: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (character: CharacterProfile) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description,
      appearance: character.appearance,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    if (!identity) {
      toast.error('Please sign in first');
      return;
    }

    try {
      if (editingCharacter) {
        await editCharacter.mutateAsync({
          ...editingCharacter,
          name: formData.name.trim(),
          description: formData.description.trim(),
          appearance: formData.appearance.trim(),
        });
        toast.success('Character updated successfully!');
      } else {
        const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await createCharacter.mutateAsync({
          id: characterId,
          owner: identity.getPrincipal(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          appearance: formData.appearance.trim(),
          avatarImageUrl: undefined,
          serverId: undefined,
        });
        toast.success('Character created successfully!');
      }
      setDialogOpen(false);
      setFormData({ name: '', description: '', appearance: '' });
    } catch (error: any) {
      console.error('Failed to save character:', error);
      toast.error(error.message || 'Failed to save character');
    }
  };

  if (!identity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Character Library</h1>
          <p className="text-muted-foreground mt-1">Create and manage your roleplay characters</p>
        </div>
        <RequireAuthInline message="Sign in to create and manage your characters" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Character Library</h1>
          <p className="text-muted-foreground mt-1">Create and manage your roleplay characters</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCharacter ? 'Edit Character' : 'Create New Character'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="char-name">Character Name</Label>
                <Input
                  id="char-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter character name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="char-description">Description</Label>
                <Textarea
                  id="char-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your character's personality, background, etc."
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="char-appearance">Appearance</Label>
                <Textarea
                  id="char-appearance"
                  value={formData.appearance}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  placeholder="Describe your character's physical appearance"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createCharacter.isPending || editCharacter.isPending}
              >
                {createCharacter.isPending || editCharacter.isPending
                  ? 'Saving...'
                  : editingCharacter
                  ? 'Update Character'
                  : 'Create Character'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {characters && characters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first character to start roleplaying!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters?.map((character) => (
            <Card key={character.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={character.avatarImageUrl || '/assets/generated/character-portrait-placeholder.dim_512x512.png'}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {character.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle>{character.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {character.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Appearance</p>
                    <p className="text-sm line-clamp-2">{character.appearance}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleOpenEdit(character)}
                  >
                    Edit Character
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
