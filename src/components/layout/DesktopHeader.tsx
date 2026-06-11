import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  Package, 
  Settings, 
  LogOut,
  Lock,
  Receipt,
  LayoutDashboard,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DesktopHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
  allowedTabs?: string[];
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ activeTab, onTabChange, allowedTabs = [] }) => {
  const { currentUser, logout, lockRegister } = useStore();

  return (
    <div className="z-50 sticky top-0 bg-background border-b border-foreground/10">
      <header className="w-full">
        <div className="flex h-16 items-center px-6 max-w-screen-2xl mx-auto">
          {/* Logo & Name */}
          <div className="flex items-center gap-4 mr-auto">
            <div className="h-8 w-auto shrink-0">
              <img 
                src={currentUser?.business?.logo || "./rosemarylogo-.png"} 
                alt={currentUser?.business?.name || "Supermarket"} 
                className="h-full w-auto object-contain"
              />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm hidden md:block">
              {currentUser?.business?.name || "SUPERMARKET"}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6 mr-8">
            {allowedTabs.includes('dashboard') && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'dashboard' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            )}
            {allowedTabs.includes('pos') && (
              <button
                onClick={() => onTabChange('pos')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'pos' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                POS
              </button>
            )}
            {allowedTabs.includes('inventory') && (
              <button
                onClick={() => onTabChange('inventory')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'inventory' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Package className="w-4 h-4" />
                Inventory
              </button>
            )}
            {allowedTabs.includes('sales') && (
              <button
                onClick={() => onTabChange('sales')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'sales' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Receipt className="w-4 h-4" />
                Receipts/Sales
              </button>
            )}
            {allowedTabs.includes('reports') && (
              <button
                onClick={() => onTabChange('reports')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'reports' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </button>
            )}
            {allowedTabs.includes('settings') && (
              <button
                onClick={() => onTabChange('settings')}
                className={cn(
                  "flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors",
                  activeTab === 'settings' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-10 items-center gap-3 rounded-none pl-2 pr-4 hover:bg-muted">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                  {currentUser?.avatar || '👤'}
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{currentUser?.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-1">{currentUser?.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none border-foreground/20">
              <DropdownMenuItem onClick={lockRegister} className="uppercase tracking-widest text-xs font-bold">
                <Lock className="w-3.5 h-3.5 mr-2" />
                Lock Register
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/10" />
              <DropdownMenuItem onClick={logout} className="text-destructive uppercase tracking-widest text-xs font-bold focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>
    </div>
  );
};
