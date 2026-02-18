import { useHashRouter } from '../../hooks/useHashRouter';
import LoginButton from '../auth/LoginButton';
import CurrentUserBadge from '../auth/CurrentUserBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Home, Users, BookOpen, UserCircle } from 'lucide-react';
import { SiCaffeine } from 'react-icons/si';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { navigate, currentRoute } = useHashRouter();

  const navItems = [
    { path: '/', label: 'Servers', icon: Home },
    { path: '/characters', label: 'Characters', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/generated/rp-logo.dim_512x512.png"
                  alt="Roleplay Servers"
                  className="h-10 w-10"
                />
                <h1 className="text-xl font-bold hidden sm:block">Roleplay Servers</h1>
              </button>
              <Separator orientation="vertical" className="h-8 hidden md:block" />
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => navigate(item.path)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <CurrentUserBadge />
              <LoginButton />
            </div>
          </div>
          <nav className="flex md:hidden items-center gap-2 mt-3 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Roleplay Servers. All rights reserved.</p>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              Built with <SiCaffeine className="h-4 w-4 text-primary" /> using caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
