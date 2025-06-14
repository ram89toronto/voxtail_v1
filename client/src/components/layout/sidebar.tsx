import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileAudio, 
  Video, 
  Folder, 
  Settings, 
  Mic,
  ChevronRight,
  Crown,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transcribe', href: '/transcribe', icon: FileAudio },
  { name: 'Video Editor', href: '/video-editor', icon: Video },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { subscription, isPro, isLoading } = useSubscription();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              VoxTailor
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">AI Speech Recognition</p>
              {!isLoading && subscription && (
                <Badge 
                  variant={isPro ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2 py-0",
                    isPro ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""
                  )}
                >
                  {isPro && <Crown className="h-3 w-3 mr-1" />}
                  {subscription.plan?.toUpperCase() || 'FREE'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-smooth cursor-pointer nav-smooth focus-ring',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Pricing/Upgrade Link */}
        <Link href="/pricing">
          <div className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
            location === '/pricing'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800',
            !isPro && 'border border-purple-600/30 bg-purple-600/10 hover:bg-purple-600/20'
          )}>
            <CreditCard className="w-5 h-5" />
            <span>{isPro ? 'Billing' : 'Upgrade'}</span>
            {!isPro && <Crown className="w-4 h-4 ml-auto text-yellow-500" />}
          </div>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-3">
          <img 
            src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"} 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'User' : 'Guest User'}
            </p>
            <p className="text-xs text-gray-400">
              {!isLoading && subscription ? `${subscription.plan?.charAt(0).toUpperCase()}${subscription.plan?.slice(1)} Plan` : 'Loading...'}
            </p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={() => window.location.href = '/api/auth/logout'}
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-smooth focus-ring"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
