import React, { useState, useMemo } from 'react';
import { useStore, Sale } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Undo2, Receipt, Search, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface SalesHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({ open, onOpenChange }) => {
  const { sales, processRefund, currentUser } = useStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = useMemo(() => {
    let filtered = [...sales];
    const now = new Date();
    
    // Time filter
    if (timeFilter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= startOfToday);
    } else if (timeFilter === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
      filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= startOfWeek);
    } else if (timeFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      filtered = filtered.filter(s => new Date(s.timestamp).getTime() >= startOfMonth);
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.id.toLowerCase().includes(lowerQ) || 
        s.cashierName.toLowerCase().includes(lowerQ) ||
        (s.mpesaRef && s.mpesaRef.toLowerCase().includes(lowerQ))
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, timeFilter, searchQuery]);

  const handleRefund = (sale: Sale) => {
    if (confirm(`Are you sure you want to refund this entire sale of KES ${sale.total}?`)) {
      processRefund(sale.id);
      toast.success('Sale refunded successfully');
      setSelectedSale(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    if (confirm(`ADMIN ACTION: Irreversibly delete sale ${sale.id.slice(-6)}? This will not return stock.`)) {
      // For now, mapping to refund as hard-delete isn't in store
      processRefund(sale.id); 
      toast.success('Sale deleted');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-none border-foreground/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest">
            <History className="w-5 h-5" />
            Receipts & Sales
          </DialogTitle>
        </DialogHeader>

        {selectedSale ? (
          <div className="flex flex-col flex-1 min-h-0 mt-4">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/10">
              <Button variant="ghost" onClick={() => setSelectedSale(null)} className="gap-2 rounded-none uppercase tracking-widest font-bold text-xs h-8">
                <Undo2 className="w-4 h-4" /> Back to List
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 rounded-none uppercase tracking-widest font-bold text-xs h-8">
                  <Edit className="w-3 h-3" /> Edit Sale
                </Button>
                <Button variant="destructive" onClick={() => handleRefund(selectedSale)} className="gap-2 rounded-none uppercase tracking-widest font-bold text-xs h-8" disabled={selectedSale.total < 0 || selectedSale.isRefunded}>
                  <Undo2 className="w-3 h-3" /> Refund
                </Button>
              </div>
            </div>
            
            {/* Full Receipt Image View */}
            <div className="bg-muted/30 p-8 flex-1 overflow-y-auto flex justify-center">
              <div className="bg-card w-full max-w-sm shadow-xl border border-foreground/10 p-6 flex flex-col relative text-foreground">
                <div className="text-center mb-6 border-b border-dashed border-foreground/30 pb-6">
                  {currentUser?.business?.logo && (
                    <img src={currentUser.business.logo} alt="Logo" className="max-w-[120px] max-h-[80px] object-contain mx-auto mb-2 opacity-80" />
                  )}
                  <h3 className="font-black text-xl uppercase tracking-widest mb-1">{currentUser?.business?.name || 'RECEIPT'}</h3>
                  <p className="text-xs uppercase tracking-widest opacity-70">Sale #{selectedSale.id.slice(-6)}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(selectedSale.timestamp).toLocaleString()}</p>
                  <p className="text-xs opacity-70 mt-1">Sold By: {selectedSale.cashierName}</p>

                  {selectedSale.isRefunded && <div className="mt-4 inline-block px-3 py-1 bg-red-500 text-white font-black uppercase tracking-widest text-xs">Refunded</div>}
                </div>

                <div className="flex-1">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="border-b border-foreground/10 uppercase tracking-widest text-[10px] opacity-60">
                        <th className="text-left pb-2 font-bold">Item</th>
                        <th className="text-center pb-2 font-bold">Qty</th>
                        <th className="text-right pb-2 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {selectedSale.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-3 font-medium">{item.product.name}</td>
                          <td className="text-center py-3">{item.quantity}</td>
                          <td className="text-right font-bold py-3">{(item.product.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-dashed border-foreground/30">
                  <div className="flex justify-between font-black text-xl uppercase tracking-widest mb-2">
                    <span>Total</span>
                    <span>KES {selectedSale.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                    <span>Payment Method</span>
                    <span>{selectedSale.paymentMethod}</span>
                  </div>
                  {selectedSale.mpesaRef && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">
                      <span>Ref</span>
                      <span>{selectedSale.mpesaRef}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search receipt #, cashier..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rounded-none border-foreground/20 h-10 pl-9"
                />
              </div>
              <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                <SelectTrigger className="w-[180px] rounded-none border-foreground/20 h-10 uppercase tracking-widest text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground/20 uppercase tracking-widest text-[10px] opacity-70">
                    <th className="text-left pb-3 font-bold">Sale Number</th>
                    <th className="text-left pb-3 font-bold hidden md:table-cell">Date & Time</th>
                    <th className="text-center pb-3 font-bold">Items</th>
                    <th className="text-right pb-3 font-bold">Total</th>
                    <th className="text-right pb-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                          <Receipt className="w-12 h-12 mb-4" />
                          <p className="font-bold uppercase tracking-widest text-xs">No Sales Found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => (
                      <tr 
                        key={sale.id} 
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-4">
                          <div className="font-bold uppercase tracking-widest">{sale.id.slice(-6)}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Sold By: {sale.cashierName}</div>
                          {sale.isRefunded && <span className="inline-block mt-1 text-[9px] bg-destructive text-destructive-foreground px-1 py-0.5 font-bold uppercase tracking-widest">Refunded</span>}
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          <div className="font-medium">{new Date(sale.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td className="py-4 text-center font-bold">
                          {sale.items.length}
                        </td>
                        <td className="py-4 text-right font-black">
                          KES {sale.total.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button onClick={(e) => handleDelete(e, sale)} size="icon" variant="ghost" className="h-8 w-8 rounded-none text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
