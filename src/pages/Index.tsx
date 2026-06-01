import React, { useState, useEffect, useRef } from 'react';
import Screensaver from '@/components/ui/Screensaver';
import { useStore } from '@/store/useStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { SignUpScreen } from '@/components/auth/SignUpScreen';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { GlobalQuickRail } from '@/components/layout/GlobalQuickRail';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { POSPage } from '@/components/pos/POSPage';
import { InventoryPage } from '@/components/inventory/InventoryPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { DeveloperDashboard } from '@/components/developer/DeveloperDashboard';

const Index = () => {
  const { isAuthenticated, setOnlineStatus, isDarkMode, users, fetchProducts, fetchUsers, currentUser, setCurrentUser, activeBusinessId } = useStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('pos');
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [screensaverOpen, setScreensaverOpen] = useState(false);
  const activityTimer = useRef<number | null>(null);
  const isMobile = useIsMobile();

  // Role-based logic
  const isDeveloper = currentUser?.role === 'developer';

  // Role-based tab access
  const isCashier = currentUser?.role === 'cashier';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  
  const allowedTabs = isCashier
    ? ['pos', 'inventory']
    : ['dashboard', 'pos', 'inventory', 'reports', 'settings'];

  // Admin redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && isAdmin && !initialRedirectDone) {
      setActiveTab('dashboard');
      setNavigationHistory([]);
      setInitialRedirectDone(true);
    }
  }, [isAuthenticated, isAdmin, initialRedirectDone]);

  const handleTabChange = (nextTab: string) => {
    setActiveTab((currentTab) => {
      if (currentTab !== nextTab) {
        setNavigationHistory((history) => [...history, currentTab]);
      }
      return nextTab;
    });
  };

  const handleBack = () => {
    setNavigationHistory((history) => {
      const nextHistory = [...history];
      const previousTab = nextHistory.pop();
      if (previousTab) {
        setActiveTab(previousTab);
      } else {
        setActiveTab('pos');
      }
      return nextHistory;
    });
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, [activeBusinessId]);

  // Listen for global auto-login events and set current user in store
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('user-logged-in', handler as EventListener);
    return () => window.removeEventListener('user-logged-in', handler as EventListener);
  }, [setCurrentUser]);

  // If cashier tries to access forbidden tab, force to POS
  useEffect(() => {
    if (isCashier && !allowedTabs.includes(activeTab)) {
      setActiveTab('pos');
      setNavigationHistory([]);
    }
  }, [activeTab, isCashier]);

  // If Developer, Show Developer Dashboard directly (No POS)
  // Moved this logic to the bottom to avoid early return hook errors

  // Inactivity handling: show screensaver after INACTIVITY_MS when shift active
  useEffect(() => {
    const resetTimer = () => {
      if (activityTimer.current) {
        window.clearTimeout(activityTimer.current);
      }
      const state = useStore.getState();
      const minutes = state.inactivityTimeoutMinutes ?? 5;
      const ms = Math.max(10, minutes) * 60 * 1000;
      activityTimer.current = window.setTimeout(() => {
        // Only show screensaver when shift is active and user is authenticated
        const s = useStore.getState();
        const mobileOk = s.allowScreensaverOnMobile;
        if (s.isShiftActive && s.isAuthenticated && (mobileOk || !isMobile)) {
          setScreensaverOpen(true);
        }
      }, ms);
    };

    const activityHandler = () => {
      if (screensaverOpen) setScreensaverOpen(false);
      resetTimer();
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, activityHandler));

    // Start initial timer only if authenticated and shift active
    resetTimer();

    return () => {
      if (activityTimer.current) window.clearTimeout(activityTimer.current);
      events.forEach(e => window.removeEventListener(e, activityHandler));
    };
  }, [screensaverOpen]);

  let content;
  if (!isAuthenticated) {
    if (showSignUp) {
      content = <SignUpScreen onSignUp={() => setShowSignUp(false)} />;
    } else {
      content = <LoginScreen />;
    }
  } else if (isDeveloper) {
    content = <DeveloperDashboard />;
  } else {
    const renderPage = () => {
      if (isCashier && !allowedTabs.includes(activeTab)) return <POSPage />;
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard onNavigate={handleTabChange} />;
        case 'pos': return <POSPage />;
        case 'inventory': return <InventoryPage />;
        case 'reports': return isCashier ? <POSPage /> : <ReportsPage />;
        case 'settings': return isCashier ? <POSPage /> : <SettingsPage />;
        default: return <POSPage />;
      }
    };
    content = (
      <div className="min-h-screen">
        {activeTab !== 'dashboard' && (
          <DesktopHeader activeTab={activeTab} onTabChange={handleTabChange} onBack={handleBack} allowedTabs={allowedTabs} />
        )}
        <div className={`flex ${activeTab !== 'dashboard' ? 'min-h-[calc(100vh-9rem)]' : 'min-h-screen'}`}>
          {activeTab !== 'pos' && activeTab !== 'dashboard' && (
            <GlobalQuickRail activeTab={activeTab} onNavigate={handleTabChange} onBack={handleBack} />
          )}
          <main className="animate-fade-in relative flex-1 min-w-0">
            {renderPage()}
            <Screensaver open={screensaverOpen && isAuthenticated && Boolean(useStore.getState().isShiftActive)} onClose={() => setScreensaverOpen(false)} logoSrc={'./main%20logos/main.png'} title={currentUser?.business?.name || 'Point of Sale System'} />
          </main>
        </div>
      </div>
    );
  }
  return content;
};

export default Index;
