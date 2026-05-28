import React, { useState } from 'react';
import { Plus, Package, X } from 'lucide-react';
import { Product } from '@/data/products';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QuickItemsGridProps {
  onQuickAdd: (productStub: Partial<Product>) => void;
  allProducts: Product[];
}

export const QuickItemsGrid: React.FC<QuickItemsGridProps> = ({ onQuickAdd, allProducts }) => {
  const [quickItems, setQuickItems] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search)
  ).slice(0, 10);

  const handleAddQuickItem = (product: Product) => {
    if (!quickItems.find(p => p.id === product.id)) {
      setQuickItems([...quickItems, product]);
    }
    setShowAddModal(false);
    setSearch('');
  };

  const handleRemoveQuickItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setQuickItems(quickItems.filter(p => p.id !== id));
  };

  return (
    <>
      <div className="flex min-h-0 flex-col rounded-3xl glass-panel p-4 overflow-hidden w-full max-w-[12rem] lg:max-w-none">
        <div className="mb-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Items</h2>
        </div>
        <ScrollArea className="flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-1 gap-3">
            {quickItems.map(item => (
              <button
                key={item.id}
                onClick={() => onQuickAdd(item)}
                className="group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm border border-white/10 hover:border-primary/40 bg-card/40 hover:bg-card/80 text-left"
              >
                <div className="p-2 rounded-full bg-primary/20 text-primary shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold leading-tight truncate">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">KES {item.price}</div>
                </div>
                <div 
                  onClick={(e) => handleRemoveQuickItem(e, item.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-md"
                >
                  <X className="w-3 h-3" />
                </div>
              </button>
            ))}

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm border border-dashed border-white/20 bg-transparent hover:bg-white/5"
            >
              <div className="p-2 rounded-full bg-muted/50 text-muted-foreground">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-muted-foreground">Add New</div>
            </button>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Quick Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Search inventory..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No items found</div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => handleAddQuickItem(product)}
                    >
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.barcode}</div>
                      </div>
                      <div className="text-sm font-semibold text-primary">KES {product.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
