import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface DesktopHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
  allowedTabs?: string[];
}


const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS / Sell', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];


export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ activeTab, onTabChange, onBack, allowedTabs }) => {
  const { currentUser, notifications, isOnline, isDarkMode, toggleDarkMode, logout, isShiftActive, startShift, endShift, tillNumber, setTillNumber } = useStore();
  const [tillDialogOpen, setTillDialogOpen] = React.useState(false);
  const [tillInput, setTillInput] = React.useState<string>(String(tillNumber ?? ''));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pt-4 pb-2 px-4 lg:px-6 z-50 sticky top-0 bg-transparent">
      <header className="w-full glass-panel rounded-2xl shadow-soft-lg">
        <div className="flex h-20 items-center gap-4 px-4 lg:px-6">
          {/* Logo */}
        <div className="flex items-center gap-3 mr-4 min-w-0">
          <div className="h-14 w-auto shrink-0 lg:h-16">
            <img 
              src={currentUser?.business?.logo || "/rosemarylogo-.png"} 
              alt={currentUser?.business?.name || "FreshFity Supermarket"} 
              className="h-full w-auto object-contain"
            />
          </div>
          
          {/* Shift Button */}
           <Button 
            variant={isShiftActive ? "destructive" : "default"}
            onClick={isShiftActive ? endShift : startShift}
            className="ml-2 h-9 rounded-full px-3 text-xs font-semibold shadow-sm"
          >
            {isShiftActive ? 'End Shift' : 'Start Shift'}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 flex-1 justify-end mr-2 overflow-x-auto">
          {navItems.filter(item => !allowedTabs || allowedTabs.includes(item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-full"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 font-semibold border-b">Notifications</div>
              {notifications.slice(0, 5).map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium">{notif.title}</span>
                  <span className="text-xs text-muted-foreground">{notif.message}</span>
                </DropdownMenuItem>
              ))}
              {notifications.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No notifications</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cashier & Till (quick) */}
          <div className="hidden md:flex flex-col items-end text-right mr-2">
            <span className="text-sm font-medium">{currentUser?.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">Till: <span className="font-semibold text-foreground">{tillNumber ?? '—'}</span></span>
          </div>

          {/* Till Dialog */}
          <Dialog open={tillDialogOpen} onOpenChange={setTillDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Till Number</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Input placeholder="Enter till number" value={tillInput} onChange={(e) => setTillInput(e.target.value)} />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" onClick={() => setTillDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => { setTillNumber(tillInput || null); setTillDialogOpen(false); }}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-9 items-center gap-2 rounded-full pl-2 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-lg">
                  {currentUser?.avatar}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{currentUser?.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Only show Reports/Settings if allowed */}
              {(!allowedTabs || allowedTabs.includes('reports')) && (
                <DropdownMenuItem onClick={() => onTabChange('reports')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </DropdownMenuItem>
              )}
              {(!allowedTabs || allowedTabs.includes('settings')) && (
                <DropdownMenuItem onClick={() => onTabChange('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </header>
    </div>
  );
};
