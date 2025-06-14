import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import OnboardingTutorial from "@/components/onboarding/OnboardingTutorial";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Transcribe from "@/pages/transcribe";
import VideoEditor from "@/pages/video-editor";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Settings from "@/pages/settings";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}

function ProtectedRoutes() {
  const { toast } = useToast();
  const { settings, hasCompletedOnboarding } = useSettings();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (settings && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [settings, hasCompletedOnboarding]);

  useEffect(() => {
    // Global error handler for unauthorized errors
    const handleUnauthorizedError = (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    };

    // This would be used for global error handling
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof Error) {
        handleUnauthorizedError(event.reason);
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, [toast]);

  return (
    <>
      {showOnboarding && (
        <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
      )}
      <Switch>
        <Route path="/">
          <AppLayout>
            <Header title="Dashboard" subtitle="Welcome back to VoxTailor" />
            <Dashboard />
          </AppLayout>
        </Route>
        
        <Route path="/transcribe">
          <AppLayout>
            <Header title="Transcribe" subtitle="Convert speech to text" />
            <Transcribe />
          </AppLayout>
        </Route>
        
        <Route path="/video-editor">
          <AppLayout>
            <Header title="Video Editor" subtitle="Edit and enhance your content" />
            <VideoEditor />
          </AppLayout>
        </Route>
        
        <Route path="/projects">
          <AppLayout>
            <Header title="Projects" subtitle="Manage your work" />
            <Projects />
          </AppLayout>
        </Route>
        
        <Route path="/projects/:id">
          <AppLayout>
            <ProjectDetail />
          </AppLayout>
        </Route>
        
        <Route path="/settings">
          <AppLayout>
            <Header title="Settings" subtitle="Configure your preferences" />
            <Settings />
          </AppLayout>
        </Route>
        
        <Route path="/pricing">
          <AppLayout>
            <Header title="Pricing" subtitle="Choose the perfect plan for you" />
            <Pricing />
          </AppLayout>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading VoxTailor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <ProtectedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-950 text-white">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
