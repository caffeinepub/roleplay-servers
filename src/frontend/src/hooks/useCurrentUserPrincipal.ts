import { useInternetIdentity } from './useInternetIdentity';

export function useCurrentUserPrincipal(): string | null {
  const { identity } = useInternetIdentity();
  
  if (!identity) {
    return null;
  }
  
  return identity.getPrincipal().toString();
}
