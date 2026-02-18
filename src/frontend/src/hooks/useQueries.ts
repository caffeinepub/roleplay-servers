import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Server, Room, RoleplayPost, CharacterProfile, UserProfile, ServerId, RoomId, RoleplayPostId, CharacterId, UserId } from '../backend';
import { Principal } from '@dfinity/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Server Queries
export function useListServers() {
  const { actor, isFetching } = useActor();

  return useQuery<Server[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetServer(serverId: ServerId) {
  const { actor, isFetching } = useActor();

  return useQuery<Server>({
    queryKey: ['server', serverId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getServer(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useCreateServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: ServerId; name: string; description: string; bannerImageUrl: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createServer(data.id, data.name, data.description, data.bannerImageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useUpdateServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serverId: ServerId; name: string; description: string; bannerImageUrl: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateServer(data.serverId, data.name, data.description, data.bannerImageUrl);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useJoinServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: ServerId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinServer(serverId);
    },
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: ['server', serverId] });
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useLeaveServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: ServerId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveServer(serverId);
    },
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: ['server', serverId] });
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serverId: ServerId; memberId: UserId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeMember(data.serverId, data.memberId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server', variables.serverId] });
    },
  });
}

// Room Queries
export function useListRooms(serverId: ServerId) {
  const { actor, isFetching } = useActor();

  return useQuery<Room[]>({
    queryKey: ['rooms', serverId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRooms(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetRoom(serverId: ServerId, roomId: RoomId) {
  const { actor, isFetching } = useActor();

  return useQuery<Room>({
    queryKey: ['room', serverId, roomId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRoom(serverId, roomId);
    },
    enabled: !!actor && !isFetching && !!serverId && !!roomId,
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serverId: ServerId; roomId: RoomId; name: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRoom(data.serverId, data.roomId, data.name, data.description);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['server', variables.serverId] });
    },
  });
}

// Roleplay Post Queries
export function useListRoleplayPosts(serverId: ServerId, roomId: RoomId) {
  const { actor, isFetching } = useActor();

  return useQuery<RoleplayPost[]>({
    queryKey: ['posts', serverId, roomId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRoleplayPosts(serverId, roomId);
    },
    enabled: !!actor && !isFetching && !!serverId && !!roomId,
  });
}

export function useCreateRoleplayPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serverId: ServerId; roomId: RoomId; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRoleplayPost(data.serverId, data.roomId, data.content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.serverId, variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.serverId, variables.roomId] });
    },
  });
}

export function useDeleteRoleplayPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { serverId: ServerId; roomId: RoomId; postId: RoleplayPostId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRoleplayPost(data.serverId, data.roomId, data.postId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.serverId, variables.roomId] });
    },
  });
}

// Character Profile Queries
export function useListCharacterProfiles(userId: UserId, serverId: ServerId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CharacterProfile[]>({
    queryKey: ['characters', userId.toString(), serverId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCharacterProfiles(userId, serverId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetCharacterProfile(profileId: CharacterId) {
  const { actor, isFetching } = useActor();

  return useQuery<CharacterProfile>({
    queryKey: ['character', profileId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCharacterProfile(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

export function useCreateCharacterProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: CharacterProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCharacterProfile(profile);
    },
    onSuccess: (_, profile) => {
      queryClient.invalidateQueries({ queryKey: ['characters', profile.owner.toString(), profile.serverId] });
    },
  });
}

export function useEditCharacterProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: CharacterProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editCharacterProfile(profile);
    },
    onSuccess: (_, profile) => {
      queryClient.invalidateQueries({ queryKey: ['character', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['characters', profile.owner.toString(), profile.serverId] });
    },
  });
}
