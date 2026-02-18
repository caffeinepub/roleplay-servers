import type { Server, ServerRole } from '../backend';

export function getCurrentUserRole(server: Server, currentPrincipal: string | null): ServerRole | null {
  if (!currentPrincipal) return null;
  
  const membership = server.memberships.find(m => m.userId.toString() === currentPrincipal);
  return membership?.role || null;
}

export function canEditServer(server: Server, currentPrincipal: string | null): boolean {
  const role = getCurrentUserRole(server, currentPrincipal);
  return role === 'owner' || role === 'admin';
}

export function canModeratePosts(server: Server, currentPrincipal: string | null): boolean {
  const role = getCurrentUserRole(server, currentPrincipal);
  return role === 'owner' || role === 'admin';
}

export function canRemoveMembers(server: Server, currentPrincipal: string | null): boolean {
  const role = getCurrentUserRole(server, currentPrincipal);
  return role === 'owner' || role === 'admin';
}

export function isServerMember(server: Server, currentPrincipal: string | null): boolean {
  if (!currentPrincipal) return false;
  return server.memberships.some(m => m.userId.toString() === currentPrincipal);
}
