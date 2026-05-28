import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings
} from 'lucide-react';

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'pos', label: 'Sell', icon: ShoppingCart },
  { id: 'inventory', label: 'Stock', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'More', icon: Settings },
];

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange }) => {
  const { cart } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'pos' && cartCount > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "mobile-nav-item flex-1 relative",
                isActive && "active"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
