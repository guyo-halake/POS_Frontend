import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote } from 'lucide-react';

interface QuickCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onSelectPayment: (method: 'mpesa' | 'cash' | 'card') => void;
}

export const QuickCheckoutModal: React.FC<QuickCheckoutModalProps> = ({ open, onOpenChange, total, onSelectPayment }) => {
  const [selected, setSelected] = useState<'mpesa' | 'cash'>('mpesa');

  // Reset selection to default (mpesa) when opened
  useEffect(() => {
    if (open) {
      setSelected('mpesa');
    }
  }, [open]);

  // Keyboard navigation within the modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default to avoid scrolling
      if (['ArrowRight', 'ArrowLeft', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setSelected(prev => prev === 'mpesa' ? 'cash' : 'mpesa');
      }

      if (e.key === 'Enter') {
        onSelectPayment(selected);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selected, onSelectPayment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/10 glass-panel shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-4">Complete Payment</DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Due</p>
          <div className="text-5xl font-extrabold text-primary drop-shadow-md">KES {total.toLocaleString()}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelectPayment('mpesa')}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 border-2 ${
              selected === 'mpesa' 
                ? 'border-[#00b050] bg-[#00b050]/10 shadow-[0_0_20px_rgba(0,176,80,0.3)] scale-105' 
                : 'border-white/10 bg-card/40 hover:bg-card/80'
            }`}
          >
            <div className={`p-4 rounded-full ${selected === 'mpesa' ? 'bg-[#00b050] text-white' : 'bg-muted text-muted-foreground'}`}>
              <CreditCard className="w-8 h-8" />
            </div>
            <span className={`text-xl font-bold ${selected === 'mpesa' ? 'text-[#00b050]' : 'text-muted-foreground'}`}>M-Pesa</span>
          </button>

          <button
            onClick={() => onSelectPayment('cash')}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 border-2 ${
              selected === 'cash' 
                ? 'border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105' 
                : 'border-white/10 bg-card/40 hover:bg-card/80'
            }`}
          >
            <div className={`p-4 rounded-full ${selected === 'cash' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              <Banknote className="w-8 h-8" />
            </div>
            <span className={`text-xl font-bold ${selected === 'cash' ? 'text-green-500' : 'text-muted-foreground'}`}>Cash</span>
          </button>
        </div>
        
        <div className="text-center mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
          Use <kbd className="px-2 py-1 bg-muted rounded border border-white/20 font-mono text-xs text-foreground">←</kbd> <kbd className="px-2 py-1 bg-muted rounded border border-white/20 font-mono text-xs text-foreground">→</kbd> to select and <kbd className="px-2 py-1 bg-muted rounded border border-white/20 font-mono text-xs text-foreground">Enter</kbd> to confirm
        </div>
      </DialogContent>
    </Dialog>
  );
};
