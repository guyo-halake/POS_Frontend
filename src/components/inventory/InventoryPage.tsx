import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Product, categories } from '@/data/products';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Minus,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  Save,
  X,
  Filter,
  LayoutGrid,
  List,
  ScanBarcode,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const InventoryPage: React.FC = () => {
  const { products, updateProduct, updateStock, addProduct, deleteProduct, currentUser, login } = useStore();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockAdjust, setStockAdjust] = useState<{ product: Product; amount: string } | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Beverages',
    price: 0,
    unit: 'pcs',
    stock: 0,
    barcode: '',
    image: '',
    lowStockThreshold: 10,
  });

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [receiveMode, setReceiveMode] = useState(false);

  // Handle URL params for adding new product
  useEffect(() => {
    const newBarcode = searchParams.get('newBarcode');
    if (newBarcode) {
      setNewProduct(prev => ({ ...prev, barcode: newBarcode }));
      setShowAddModal(true);
    }
  }, [searchParams]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'developer';
  const isCashier = currentUser?.role === 'cashier';
  // State for admin PIN confirmation
  const [showAdminPinDialog, setShowAdminPinDialog] = useState(false);
  const [pendingEditProduct, setPendingEditProduct] = useState<Product | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  // Filter products using Weighted Scoring Algorithm
  const filteredProducts = useMemo(() => {
    let results = products;
    
    // Apply low stock filter first
    if (showLowStock) {
      results = results.filter(p => p.stock <= p.lowStockThreshold);
    }
    
    if (!searchQuery) {
      return results.filter(p => !selectedCategory || p.category === selectedCategory);
    }
    
    const query = searchQuery.toLowerCase();
    
    const scoredProducts = results.map(product => {
      let score = 0;
      const name = product.name.toLowerCase();
      const barcode = product.barcode.toLowerCase();
      
      if (barcode === query) score = 100;
      else if (name === query) score = 90;
      else if (name.startsWith(query)) score = 80;
      else if (name.split(' ').some(word => word.startsWith(query))) score = 75;
      else if (barcode.startsWith(query)) score = 70;
      else if (name.includes(query)) score = 50;
      else if (barcode.includes(query)) score = 40;
      
      return { product, score };
    });
    
    return scoredProducts
      .filter(p => p.score > 0 && (!selectedCategory || p.product.category === selectedCategory))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.name.localeCompare(b.product.name);
      })
      .map(p => p.product);
  }, [products, searchQuery, selectedCategory, showLowStock]);

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * Math.max(0, p.stock)), 0);
  // Handle stock adjustment
  const handleStockAdjust = () => {
    if (stockAdjust && stockAdjust.amount) {
      const amount = parseFloat(stockAdjust.amount);
      if (!isNaN(amount)) {
        updateStock(stockAdjust.product.id, amount);
        setStockAdjust(null);
      }
    }
  };
  // Helper to check if price changed
  const priceChanged = (original: Product, edited: Product) => original.price !== edited.price;
  const handleSaveEdit = () => {
    if (editProduct) {
      // If cashier and price changed, require admin PIN
      if (isCashier && pendingEditProduct && priceChanged(pendingEditProduct, editProduct)) {
        setShowAdminPinDialog(true);
        return;
      }
      updateProduct(editProduct.id, editProduct);
      setEditProduct(null);
      setPendingEditProduct(null);
    }
  };
  // When opening edit modal, store original product for price comparison
  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setPendingEditProduct(product);
  };
  // Handle admin PIN confirmation
  const handleAdminPinConfirm = async () => {
    if (!adminPin) return setAdminPinError('Enter admin PIN');
    const success = await login(adminPin);
    if (success && (currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'developer')) {
      if (editProduct) {
        updateProduct(editProduct.id, editProduct);
        setEditProduct(null);
        setPendingEditProduct(null);
      }
      setShowAdminPinDialog(false);
      setAdminPin('');
      setAdminPinError('');
    } else {
      setAdminPinError('Invalid admin PIN');
    }
  };
  // Handle add product
  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price) {
      addProduct(newProduct as Omit<Product, 'id'>);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: 'Beverages',
        price: 0,
        unit: 'pcs',
        stock: 0,
        barcode: '',
        image: '',
        lowStockThreshold: 10,
      });
    }
  };
  const totalProducts = products.length;
  return (
    <div className="p-4 md:p-6 pb-32 md:pb-12 flex flex-col gap-6 min-h-screen">
      {/* Minimalist Header & Control Bar */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Inventory</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Est. Value: KSH {totalValue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
             <Badge variant="secondary" className="px-3 py-1.5 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap">Total: {totalProducts}</Badge>
             <Badge variant="outline" className={cn("px-3 py-1.5 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap", lowStockCount > 0 ? "border-warning text-warning" : "")}>
                Low Stock: {lowStockCount}
             </Badge>
             <Badge variant="outline" className={cn("px-3 py-1.5 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap", outOfStockCount > 0 ? "border-destructive text-destructive" : "")}>
                Empty: {outOfStockCount}
             </Badge>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={receiveMode ? "SCAN BARCODE TO RECEIVE..." : "Search product or barcode..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === 'Enter' && receiveMode && searchQuery) {
                    const prod = products.find(p => p.barcode === searchQuery || p.name.toLowerCase() === searchQuery.toLowerCase());
                    if (prod) {
                       setStockAdjust({ product: prod, amount: '' });
                       setSearchQuery('');
                    }
                 }
              }}
              className={cn("pl-12 h-12 text-sm lg:text-lg font-bold bg-background border-none shadow-sm rounded-lg transition-colors", receiveMode && "bg-emerald-500/10 text-emerald-600 placeholder:text-emerald-600/50")}
            />
          </div>
        
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar w-full lg:w-auto">
            <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[140px] lg:w-[160px] h-12 bg-background border-none shadow-sm rounded-lg font-bold text-xs lg:text-sm">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button
                onClick={() => setReceiveMode(!receiveMode)}
                variant={receiveMode ? "default" : "secondary"}
                className={cn("h-12 px-4 lg:px-6 font-black tracking-widest shadow-sm transition-all whitespace-nowrap text-[10px] lg:text-xs", receiveMode && "bg-emerald-600 hover:bg-emerald-500 text-white")}
              >
                <ScanBarcode className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">{receiveMode ? 'RECEIVING ON' : 'RECEIVE STOCK'}</span>
              </Button>
            )}

            <div className="flex bg-background rounded-lg shadow-sm p-1 ml-auto shrink-0">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-md" onClick={() => setViewMode('table')}>
                <List className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-md" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={() => setShowAddModal(true)} className="h-12 px-4 lg:px-6 font-bold tracking-widest shadow-sm bg-foreground text-background whitespace-nowrap text-[10px] lg:text-xs">
              <Plus className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">NEW PRODUCT</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'table' ? (
        <Card className="border-border shadow-sm rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 text-center font-bold tracking-widest text-[10px] uppercase">Image</TableHead>
                  <TableHead className="font-bold tracking-widest text-[10px] uppercase">Product / Barcode</TableHead>
                  <TableHead className="font-bold tracking-widest text-[10px] uppercase">Section</TableHead>
                  <TableHead className="text-right font-bold tracking-widest text-[10px] uppercase">Selling Price</TableHead>
                  <TableHead className="text-right font-bold tracking-widest text-[10px] uppercase">In Store</TableHead>
                  <TableHead className="font-bold tracking-widest text-[10px] uppercase">Status</TableHead>
                  <TableHead className="text-right font-bold tracking-widest text-[10px] uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-3xl mx-auto shadow-inner">
                        {product.image}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-base">{product.name}</span>
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground">{product.barcode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold tracking-widest text-[10px] uppercase">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-lg tracking-tighter">KSH {product.price.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-lg">{product.stock}</span>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{product.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.stock === 0 ? (
                        <Badge variant="destructive" className="font-black tracking-widest text-[10px] uppercase">Empty</Badge>
                      ) : product.stock <= product.lowStockThreshold ? (
                        <Badge className="bg-warning/10 text-warning hover:bg-warning/20 font-black tracking-widest text-[10px] uppercase">Order Soon</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-black tracking-widest text-[10px] uppercase">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg"
                          onClick={() => setStockAdjust({ product, amount: '' })}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                        {(isAdmin || isCashier) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg"
                            onClick={() => handleEditProduct(product)}
                            disabled={isCashier && !isAdmin}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-bold tracking-widest">
                      NO PRODUCTS FOUND
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="aspect-square bg-muted/30 flex items-center justify-center relative p-4">
                     <div className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{product.image}</div>
                     {product.stock === 0 && (
                       <div className="absolute top-2 right-2 bg-destructive text-white text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-sm">
                         Empty
                       </div>
                     )}
                     {product.stock > 0 && product.stock <= product.lowStockThreshold && (
                       <div className="absolute top-2 right-2 bg-warning text-white text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-sm">
                         Order
                       </div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                     <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                     <p className="text-[9px] font-black text-muted-foreground tracking-widest uppercase mb-3">{product.barcode}</p>
                     
                     <div className="mt-auto">
                       <div className="flex items-end justify-between mb-3">
                         <span className="font-black tracking-tighter text-lg">KSH {product.price}</span>
                         <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{product.stock} {product.unit}</span>
                       </div>
                       <Button 
                         variant="secondary" 
                         className="w-full font-bold tracking-widest text-[10px]"
                         onClick={() => setStockAdjust({ product, amount: '' })}
                       >
                         ADD STOCK
                       </Button>
                     </div>
                  </div>
                </Card>
              ))}
          </div>
          {filteredProducts.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
               <Package className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-bold tracking-widest uppercase text-sm opacity-50">No products found</p>
              </div>
          )}
        </>
      )}

      {/* Stock Adjustment Modal */}
      <Dialog open={!!stockAdjust} onOpenChange={(open) => !open && setStockAdjust(null)}>
        <DialogContent className="sm:max-w-md p-6 overflow-hidden border border-border bg-background shadow-lg rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center text-5xl shadow-inner">
                 {stockAdjust?.product.image}
              </div>
              <div>
                 <span className="font-bold text-xl block">{stockAdjust?.product.name}</span>
                 <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{stockAdjust?.product.barcode}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            <div className="bg-muted/30 px-6 py-2 rounded-full mb-6 border border-border">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                CURRENTLY IN STORE: <span className="text-foreground text-sm">{stockAdjust?.product.stock} {stockAdjust?.product.unit}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 w-full">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-2xl bg-destructive/5 hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors"
                onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String(parseFloat(prev.amount || '0') - 1) } : null)}
              >
                <Minus className="w-8 h-8" />
              </Button>
              <Input
                type="number"
                value={stockAdjust?.amount || ''}
                onChange={(e) => setStockAdjust(prev => prev ? { ...prev, amount: e.target.value } : null)}
                placeholder="0"
                className="flex-1 h-20 text-center text-5xl font-black tracking-tighter bg-muted/20 border-border rounded-2xl focus-visible:ring-emerald-500/20"
                autoFocus
              />
              <Button
                variant="outline"
                className="h-16 w-16 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-600 border-emerald-500/20 transition-colors"
                onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String(parseFloat(prev.amount || '0') + 1) } : null)}
              >
                <Plus className="w-8 h-8" />
              </Button>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-4 tracking-widest uppercase">
              Use positive numbers to add stock, negative to remove
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockAdjust(null)}>Cancel</Button>
            <Button onClick={handleStockAdjust}>Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-xl p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-bold tracking-widest uppercase">Edit Product Details</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Product Name</label>
                <Input
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="h-12 font-bold text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Selling Price (KSH)</label>
                  <Input
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                    disabled={isCashier}
                    className="h-12 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Aisle / Section</label>
                  <Select value={editProduct.category} onValueChange={(v) => setEditProduct({ ...editProduct, category: v })}>
                    <SelectTrigger className="h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Barcode / SKU</label>
                  <Input
                    value={editProduct.barcode}
                    onChange={(e) => setEditProduct({ ...editProduct, barcode: e.target.value })}
                    className="h-12 font-bold font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-warning uppercase tracking-widest mb-2 block">Alert Me When Stock Falls Below:</label>
                  <Input
                    type="number"
                    value={editProduct.lowStockThreshold}
                    onChange={(e) => setEditProduct({ ...editProduct, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="h-12 font-bold border-warning/50 focus-visible:ring-warning"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Admin PIN Confirmation Dialog (moved outside Edit Product Dialog) */}
      <Dialog open={showAdminPinDialog} onOpenChange={setShowAdminPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Confirmation Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">Enter admin PIN to confirm price change.</p>
            <Input
              type="password"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              placeholder="Admin PIN"
              maxLength={4}
            />
            {adminPinError && <p className="text-destructive text-sm">{adminPinError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminPinDialog(false)}>Cancel</Button>
            <Button onClick={handleAdminPinConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-xl p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-bold tracking-widest uppercase">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Product Name</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
                className="h-12 font-bold text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Selling Price (KSH)</label>
                <Input
                  type="number"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  className="h-12 font-bold text-lg"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Aisle / Section</label>
                <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                  <SelectTrigger className="h-12 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Unit Type</label>
                <Select value={newProduct.unit} onValueChange={(v: any) => setNewProduct({ ...newProduct, unit: v })}>
                  <SelectTrigger className="h-12 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                    <SelectItem value="sachets">Sachets</SelectItem>
                    <SelectItem value="trays">Trays</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Initial Stock On Hand</label>
                <Input
                  type="number"
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) || 0 })}
                  className="h-12 font-bold text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Barcode / SKU</label>
              <Input
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                placeholder="Scan or enter barcode"
                className="h-12 font-bold font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
};
