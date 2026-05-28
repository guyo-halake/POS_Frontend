import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PackagePlus, ReceiptText, ScanLine } from 'lucide-react';

interface GlobalQuickRailProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onBack: () => void;
}

const quickItems = [
  {
    id: 'pos',
    label: 'Scan / POS',
    description: 'Sell fast',
    icon: ScanLine,
    tab: 'pos',
  },
  {
    id: 'inventory',
    label: 'Add / Update Stock',
    description: 'Inventory',
    icon: PackagePlus,
    tab: 'inventory',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    description: 'Recent sales',
    icon: ReceiptText,
    tab: 'pos',
  },
];

export const GlobalQuickRail: React.FC<GlobalQuickRailProps> = ({ activeTab, onNavigate, onBack }) => {
  return (
    <aside className="w-full lg:w-36 xl:w-40 shrink-0 px-2 lg:px-4 pb-4 z-40">
      <div className="sticky top-28 flex w-full flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-x-hidden pt-2 lg:pt-0">
        <div className="rounded-2xl glass-panel p-2 min-w-[18rem] lg:min-w-0 lg:w-full">
          <div className="px-2 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 text-center">
            Quick Access
          </div>
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden px-1 pb-1">
            {quickItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.tab)}
                  className={cn(
                    'group relative flex min-w-28 lg:w-full flex-col items-center justify-center gap-2 rounded-xl px-2 py-4 text-center transition-all duration-300',
                    isActive
                      ? 'bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-[1.02] border border-primary/50'
                      : 'bg-card/40 text-foreground border border-white/10 hover:border-primary/40 hover:bg-white/10 dark:hover:bg-white/5'
                  )}
                >
                  <span className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 shadow-sm',
                    isActive ? 'bg-white/20' : 'bg-background/80 dark:bg-black/40'
                  )}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-semibold leading-tight mt-1">
                    {item.label}
                  </span>
                  <span className={cn(
                    'text-[10px] leading-none opacity-80',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default GlobalQuickRail;
