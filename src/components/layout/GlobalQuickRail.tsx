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
    <aside className="w-full lg:w-48 shrink-0 px-4 pb-4 z-40 hidden lg:block border-r border-foreground/10 bg-card">
      <div className="sticky top-28 flex flex-col h-full pt-4">
        
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 pl-2">
          Quick Access
        </div>
        
        <div className="flex flex-col gap-2 mb-8">
          {quickItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab && item.id !== 'receipts';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'receipts') {
                    onNavigate('pos');
                    import('@/store/useStore').then(({ useStore }) => {
                      useStore.getState().setSalesHistoryOpen(true);
                    });
                  } else {
                    onNavigate(item.tab);
                  }
                }}
                className={cn(
                  'group flex flex-col items-center justify-center gap-2 px-2 py-4 w-full text-center transition-all duration-300 rounded-2xl border',
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-sm scale-[1.02]'
                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full mb-1 transition-transform group-hover:scale-110",
                  isActive ? "bg-background/20" : "bg-muted text-foreground"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 pl-2">
            Keyboard Shortcuts
          </div>
          <div className="space-y-3 px-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-wide">Search</span>
              <kbd className="px-2 py-1 bg-muted text-[10px] font-mono rounded">F3</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-wide">Checkout</span>
              <kbd className="px-2 py-1 bg-muted text-[10px] font-mono rounded">F9</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-wide">Hold Sale</span>
              <kbd className="px-2 py-1 bg-muted text-[10px] font-mono rounded">F4</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tracking-wide">Clear</span>
              <kbd className="px-2 py-1 bg-muted text-[10px] font-mono rounded">ESC</kbd>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default GlobalQuickRail;
