import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Server {
    id: ServerId;
    owner: UserId;
    name: string;
    description: string;
    bannerImageUrl?: string;
    memberships: Array<ServerMembership>;
    rooms: Array<Room>;
}
export type UserId = Principal;
export type RoleplayPostId = bigint;
export type CharacterId = string;
export interface RoleplayPost {
    id: RoleplayPostId;
    content: string;
    author: UserId;
    timestamp: bigint;
    roomId: RoomId;
}
export type RoomId = string;
export interface Room {
    id: RoomId;
    creator: UserId;
    members: Array<UserId>;
    name: string;
    description: string;
    roleplayPosts: Array<RoleplayPost>;
    serverId: ServerId;
}
export type ServerId = string;
export interface CharacterProfile {
    id: CharacterId;
    owner: UserId;
    appearance: string;
    name: string;
    description: string;
    avatarImageUrl?: string;
    serverId?: ServerId;
}
export interface UserProfile {
    bio?: string;
    name: string;
    avatarUrl?: string;
}
export interface ServerMembership {
    userId: UserId;
    role: ServerRole;
}
export enum ServerRole {
    member = "member",
    admin = "admin",
    owner = "owner"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCharacterProfile(profile: CharacterProfile): Promise<void>;
    createRoleplayPost(serverId: ServerId, roomId: RoomId, content: string): Promise<void>;
    createRoom(serverId: ServerId, roomId: RoomId, name: string, description: string): Promise<void>;
    createServer(id: ServerId, name: string, description: string, bannerImageUrl: string | null): Promise<void>;
    deleteRoleplayPost(serverId: ServerId, roomId: RoomId, postId: RoleplayPostId): Promise<void>;
    editCharacterProfile(profile: CharacterProfile): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCharacterProfile(profileId: CharacterId): Promise<CharacterProfile>;
    getRoleplayPost(serverId: ServerId, roomId: RoomId, postId: RoleplayPostId): Promise<RoleplayPost>;
    getRoom(serverId: ServerId, roomId: RoomId): Promise<Room>;
    getServer(serverId: ServerId): Promise<Server>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinServer(serverId: ServerId): Promise<void>;
    leaveServer(serverId: ServerId): Promise<void>;
    listCharacterProfiles(userId: UserId, serverId: ServerId | null): Promise<Array<CharacterProfile>>;
    listRoleplayPosts(serverId: ServerId, roomId: RoomId): Promise<Array<RoleplayPost>>;
    listRooms(serverId: ServerId): Promise<Array<Room>>;
    listServers(): Promise<Array<Server>>;
    removeMember(serverId: ServerId, memberId: UserId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateServer(serverId: ServerId, name: string, description: string, bannerImageUrl: string | null): Promise<void>;
}
