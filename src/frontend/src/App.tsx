import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import AppLayout from './components/layout/AppLayout';
import ServerDirectoryPage from './pages/ServerDirectoryPage';
import ServerDetailPage from './pages/ServerDetailPage';
import RoomViewPage from './pages/RoomViewPage';
import CharacterLibraryPage from './pages/CharacterLibraryPage';
import UserProfilePage from './pages/UserProfilePage';
import { useHashRouter } from './hooks/useHashRouter';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { currentRoute, params } = useHashRouter();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppLayout>
        {currentRoute === '/' && <ServerDirectoryPage />}
        {currentRoute === '/server' && params.id && <ServerDetailPage serverId={params.id} />}
        {currentRoute === '/room' && params.serverId && params.roomId && (
          <RoomViewPage serverId={params.serverId} roomId={params.roomId} />
        )}
        {currentRoute === '/characters' && <CharacterLibraryPage />}
        {currentRoute === '/profile' && <UserProfilePage />}
        {!currentRoute && <ServerDirectoryPage />}
      </AppLayout>
      {showProfileSetup && <ProfileSetupDialog />}
      <Toaster />
    </ThemeProvider>
  );
}
