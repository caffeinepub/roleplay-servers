# Specification

## Summary
**Goal:** Build a roleplay-focused community app with Internet Identity auth, servers, in-server roleplay rooms, character profiles, and post-based roleplay feeds, with role-based permissions and basic moderation.

**Planned changes:**
- Add Internet Identity sign-in/sign-out and show authenticated user state (principal + display name) across the UI; restrict write actions to signed-in users.
- Implement backend data models with stable storage for users, servers, memberships/roles, rooms, characters, and posts (IDs + timestamps) with authorization based on caller principal and server role.
- Create backend APIs for servers (create/list/view, join/leave, update settings incl. optional banner image reference).
- Create backend APIs for rooms and posts (create/list/view; posts support pagination and include author, optional character used, content, timestamps).
- Create backend APIs for character profiles (create/edit/list/view) with optional per-server scoping and optional portrait image reference.
- Build frontend pages and navigation: Server Directory, Server Detail (rooms + join/leave), Room View (post feed + create post), Character Library (create/edit/select), and User Profile/settings (set display name).
- Enforce Owner/Admin/Member permissions in backend and frontend UI (hide/disable unauthorized actions; handle errors).
- Add basic moderation per server: Owner/Admin can delete posts and remove members; record actor principal + timestamps for moderation actions.
- Apply a coherent roleplay-themed visual design across pages (avoid blue/purple as primary palette) using Tailwind and existing UI components.
- Add and use generated static assets (logo, default server banner, default character portrait placeholder) in the UI.

**User-visible outcome:** Users can sign in with Internet Identity, browse and join servers, create and manage servers/rooms/posts based on their role, create/select character profiles for roleplay posts, and admins can moderate by deleting posts and removing members, all within a consistent roleplay-themed UI.
