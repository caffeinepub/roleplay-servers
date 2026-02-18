import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type UserId = Principal;
  type ServerId = Text;
  type RoomId = Text;
  type CharacterId = Text;
  type RoleplayPostId = Nat;

  type ServerRole = { #owner; #admin; #member };

  type ServerMembership = {
    userId : UserId;
    role : ServerRole;
  };

  type RoleplayPost = {
    id : RoleplayPostId;
    author : UserId;
    roomId : RoomId;
    content : Text;
    timestamp : Int;
  };

  module RoleplayPost {
    public func compare(a : RoleplayPost, b : RoleplayPost) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type Room = {
    id : RoomId;
    name : Text;
    description : Text;
    serverId : ServerId;
    creator : UserId;
    members : [UserId];
    roleplayPosts : [RoleplayPost];
  };

  module Room {
    public func compare(a : Room, b : Room) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Server = {
    id : ServerId;
    name : Text;
    description : Text;
    bannerImageUrl : ?Text;
    owner : UserId;
    memberships : [ServerMembership];
    rooms : [Room];
  };

  module Server {
    public func compare(a : Server, b : Server) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type CharacterProfile = {
    id : CharacterId;
    owner : UserId;
    name : Text;
    description : Text;
    appearance : Text;
    avatarImageUrl : ?Text;
    serverId : ?ServerId;
  };

  module CharacterProfile {
    public func compare(a : CharacterProfile, b : CharacterProfile) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type UserProfile = {
    name : Text;
    bio : ?Text;
    avatarUrl : ?Text;
  };

  // Initialize state from authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let servers = Map.empty<ServerId, Server>();
  let characterProfiles = Map.empty<CharacterId, CharacterProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper functions for authorization
  func getServerMemberRole(server : Server, userId : UserId) : ?ServerRole {
    server.memberships.values().find(func(m) { m.userId == userId }).map(func(m) { m.role });
  };

  func isServerMember(server : Server, userId : UserId) : Bool {
    server.memberships.values().find(func(m) { m.userId == userId }).isSome();
  };

  func isServerOwnerOrAdmin(server : Server, userId : UserId) : Bool {
    switch (getServerMemberRole(server, userId)) {
      case (?#owner) { true };
      case (?#admin) { true };
      case (_) { false };
    };
  };

  // User Profile Management (required by instructions)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Server Management
  public shared ({ caller }) func createServer(id : ServerId, name : Text, description : Text, bannerImageUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create servers");
    };
    if (servers.containsKey(id)) {
      Runtime.trap("Server already exists");
    };
    let ownerMembership : ServerMembership = {
      userId = caller;
      role = #owner;
    };
    let server : Server = {
      id;
      name;
      description;
      bannerImageUrl;
      owner = caller;
      memberships = [ownerMembership];
      rooms = [];
    };
    servers.add(id, server);
  };

  public query ({ caller }) func listServers() : async [Server] {
    // Return only servers where caller is a member
    servers.values().toArray().filter(func(server) { isServerMember(server, caller) }).sort();
  };

  public query ({ caller }) func getServer(serverId : ServerId) : async Server {
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to view server");
        };
        server;
      };
    };
  };

  public shared ({ caller }) func joinServer(serverId : ServerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join servers");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (isServerMember(server, caller)) {
          Runtime.trap("Already a member of this server");
        };
        let newMembership : ServerMembership = {
          userId = caller;
          role = #member;
        };
        let updatedMemberships = [newMembership].concat(server.memberships);
        let updatedServer : Server = {
          id = server.id;
          name = server.name;
          description = server.description;
          bannerImageUrl = server.bannerImageUrl;
          owner = server.owner;
          memberships = updatedMemberships;
          rooms = server.rooms;
        };
        servers.add(serverId, updatedServer);
      };
    };
  };

  public shared ({ caller }) func leaveServer(serverId : ServerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave servers");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (caller == server.owner) {
          Runtime.trap("Server owner cannot leave the server");
        };
        if (not isServerMember(server, caller)) {
          Runtime.trap("Not a member of this server");
        };
        let updatedMemberships = server.memberships.filter(func(m) { m.userId != caller });
        let updatedServer : Server = {
          id = server.id;
          name = server.name;
          description = server.description;
          bannerImageUrl = server.bannerImageUrl;
          owner = server.owner;
          memberships = updatedMemberships;
          rooms = server.rooms;
        };
        servers.add(serverId, updatedServer);
      };
    };
  };

  public shared ({ caller }) func updateServer(serverId : ServerId, name : Text, description : Text, bannerImageUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update servers");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerOwnerOrAdmin(server, caller)) {
          Runtime.trap("Unauthorized: Only server owner or admin can update server settings");
        };
        let updatedServer : Server = {
          id = server.id;
          name;
          description;
          bannerImageUrl;
          owner = server.owner;
          memberships = server.memberships;
          rooms = server.rooms;
        };
        servers.add(serverId, updatedServer);
      };
    };
  };

  // Room (Roleplay Cabin) Management
  public shared ({ caller }) func createRoom(serverId : ServerId, roomId : RoomId, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerOwnerOrAdmin(server, caller)) {
          Runtime.trap("Unauthorized: Only server owner or admin can create rooms");
        };
        let room : Room = {
          id = roomId;
          name;
          description;
          serverId;
          creator = caller;
          members = [caller];
          roleplayPosts = [];
        };
        let updatedRooms = [room].concat(server.rooms).sort();
        let updatedServer : Server = {
          id = server.id;
          name = server.name;
          description = server.description;
          bannerImageUrl = server.bannerImageUrl;
          rooms = updatedRooms;
          memberships = server.memberships;
          owner = server.owner;
        };
        servers.add(serverId, updatedServer);
      };
    };
  };

  public query ({ caller }) func listRooms(serverId : ServerId) : async [Room] {
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to list rooms");
        };
        server.rooms.sort();
      };
    };
  };

  public query ({ caller }) func getRoom(serverId : ServerId, roomId : RoomId) : async Room {
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to view rooms");
        };
        switch (server.rooms.values().find(func(room) { room.id == roomId })) {
          case (null) { Runtime.trap("Room does not exist") };
          case (?room) { room };
        };
      };
    };
  };

  // Character Profile Management
  public shared ({ caller }) func createCharacterProfile(profile : CharacterProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create character profiles");
    };
    if (profile.owner != caller) {
      Runtime.trap("Unauthorized: Can only create character profiles for yourself");
    };
    if (characterProfiles.containsKey(profile.id)) {
      Runtime.trap("Character profile already exists");
    };
    // If server-scoped, verify membership
    switch (profile.serverId) {
      case (?serverId) {
        switch (servers.get(serverId)) {
          case (null) { Runtime.trap("Server does not exist") };
          case (?server) {
            if (not isServerMember(server, caller)) {
              Runtime.trap("Unauthorized: Must be a server member to create server-scoped character");
            };
          };
        };
      };
      case (null) { /* Global character, no server check needed */ };
    };
    characterProfiles.add(profile.id, profile);
  };

  public shared ({ caller }) func editCharacterProfile(profile : CharacterProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit character profiles");
    };
    switch (characterProfiles.get(profile.id)) {
      case (null) { Runtime.trap("Character profile does not exist") };
      case (?existingProfile) {
        if (caller != existingProfile.owner) {
          Runtime.trap("Unauthorized: Only profile owner can edit character profile");
        };
        if (profile.owner != caller) {
          Runtime.trap("Unauthorized: Cannot change character profile owner");
        };
        // If server-scoped, verify membership
        switch (profile.serverId) {
          case (?serverId) {
            switch (servers.get(serverId)) {
              case (null) { Runtime.trap("Server does not exist") };
              case (?server) {
                if (not isServerMember(server, caller)) {
                  Runtime.trap("Unauthorized: Must be a server member to edit server-scoped character");
                };
              };
            };
          };
          case (null) { /* Global character, no server check needed */ };
        };
        characterProfiles.add(profile.id, profile);
      };
    };
  };

  public query ({ caller }) func listCharacterProfiles(userId : UserId, serverId : ?ServerId) : async [CharacterProfile] {
    characterProfiles.values().toArray().filter(
      func(profile) {
        profile.owner == userId and profile.serverId == serverId;
      }
    );
  };

  public query ({ caller }) func getCharacterProfile(profileId : CharacterId) : async CharacterProfile {
    switch (characterProfiles.get(profileId)) {
      case (null) { Runtime.trap("Character profile does not exist") };
      case (?profile) { profile };
    };
  };

  // Roleplay Post Management
  public shared ({ caller }) func createRoleplayPost(serverId : ServerId, roomId : RoomId, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create roleplay posts");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to create posts");
        };
        switch (server.rooms.values().find(func(room) { room.id == roomId })) {
          case (null) { Runtime.trap("Room does not exist") };
          case (?room) {
            let postId = room.roleplayPosts.size();
            let post : RoleplayPost = {
              id = postId;
              author = caller;
              roomId;
              content;
              timestamp = 0; // Could use current timestamp if available
            };
            let updatedRoleplayPosts = [post].concat(room.roleplayPosts).sort();
            let updatedRoom : Room = {
              id = room.id;
              serverId = room.serverId;
              name = room.name;
              description = room.description;
              creator = room.creator;
              members = room.members;
              roleplayPosts = updatedRoleplayPosts;
            };
            let updatedRooms = server.rooms.map(
              func(r) {
                if (r.id == roomId) { updatedRoom } else { r };
              }
            );
            let updatedServer : Server = {
              id = server.id;
              name = server.name;
              description = server.description;
              bannerImageUrl = server.bannerImageUrl;
              owner = server.owner;
              memberships = server.memberships;
              rooms = updatedRooms;
            };
            servers.add(serverId, updatedServer);
          };
        };
      };
    };
  };

  public query ({ caller }) func listRoleplayPosts(serverId : ServerId, roomId : RoomId) : async [RoleplayPost] {
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to view posts");
        };
        switch (server.rooms.values().find(func(room) { room.id == roomId })) {
          case (null) { Runtime.trap("Room does not exist") };
          case (?room) { room.roleplayPosts };
        };
      };
    };
  };

  public query ({ caller }) func getRoleplayPost(serverId : ServerId, roomId : RoomId, postId : RoleplayPostId) : async RoleplayPost {
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerMember(server, caller)) {
          Runtime.trap("Unauthorized: Must be a server member to view posts");
        };
        switch (server.rooms.values().find(func(room) { room.id == roomId })) {
          case (null) { Runtime.trap("Room does not exist") };
          case (?room) {
            switch (room.roleplayPosts.values().find(func(post) { post.id == postId })) {
              case (null) { Runtime.trap("Roleplay post does not exist") };
              case (?post) { post };
            };
          };
        };
      };
    };
  };

  // Content Safety & Moderation
  public shared ({ caller }) func deleteRoleplayPost(serverId : ServerId, roomId : RoomId, postId : RoleplayPostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerOwnerOrAdmin(server, caller)) {
          Runtime.trap("Unauthorized: Only server owner or admin can delete posts");
        };
        switch (server.rooms.values().find(func(room) { room.id == roomId })) {
          case (null) { Runtime.trap("Room does not exist") };
          case (?room) {
            let remainingPosts = room.roleplayPosts.filter(func(post) { post.id != postId });
            let updatedRoom : Room = {
              id = room.id;
              serverId = room.serverId;
              name = room.name;
              description = room.description;
              creator = room.creator;
              members = room.members;
              roleplayPosts = remainingPosts;
            };
            let updatedRooms = server.rooms.map(
              func(r) {
                if (r.id == roomId) { updatedRoom } else { r };
              }
            );
            let updatedServer : Server = {
              id = server.id;
              name = server.name;
              description = server.description;
              bannerImageUrl = server.bannerImageUrl;
              owner = server.owner;
              memberships = server.memberships;
              rooms = updatedRooms;
            };
            servers.add(serverId, updatedServer);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeMember(serverId : ServerId, memberId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members");
    };
    switch (servers.get(serverId)) {
      case (null) { Runtime.trap("Server does not exist") };
      case (?server) {
        if (not isServerOwnerOrAdmin(server, caller)) {
          Runtime.trap("Unauthorized: Only server owner or admin can remove members");
        };
        if (memberId == server.owner) {
          Runtime.trap("Cannot remove the server owner");
        };
        let remainingMemberships = server.memberships.filter(func(m) { m.userId != memberId });
        let updatedServer : Server = {
          id = server.id;
          name = server.name;
          description = server.description;
          bannerImageUrl = server.bannerImageUrl;
          owner = server.owner;
          memberships = remainingMemberships;
          rooms = server.rooms;
        };
        servers.add(serverId, updatedServer);
      };
    };
  };
};
