import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Product, categories } from '@/data/products';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Minus,
  Edit2,
  Trash2,
  Save,
  PackagePlus,
  FileUp
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    lowStockThreshold: 10,
    image: '📦',
  });

  const isCashier = currentUser?.role === 'cashier';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'developer';

  const [showAdminPinDialog, setShowAdminPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete', product: Product } | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Handle URL params for adding new product from POS
  useEffect(() => {
    const newBarcode = searchParams.get('newBarcode');
    if (newBarcode) {
      setNewProduct(prev => ({ ...prev, barcode: newBarcode }));
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let results = products;
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.barcode.toLowerCase().includes(query) ||
        p.price.toString().includes(query)
      );
    }
    // Sort alphabetically
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchQuery, selectedCategory]);

  const handleStockAdjust = () => {
    if (stockAdjust && stockAdjust.amount) {
      const amount = parseFloat(stockAdjust.amount);
      if (!isNaN(amount)) {
        updateStock(stockAdjust.product.id, amount);
        setStockAdjust(null);
      }
    }
  };

  const handleSaveEdit = () => {
    if (editProduct) {
      updateProduct(editProduct.id, editProduct);
      setEditProduct(null);
    }
  };

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
        image: '📦',
        lowStockThreshold: 10,
      });
    }
  };

  const attemptAction = (type: 'edit' | 'delete', product: Product) => {
    if (isCashier) {
      setPendingAction({ type, product });
      setShowAdminPinDialog(true);
    } else {
      if (type === 'edit') setEditProduct(product);
      if (type === 'delete') {
        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
          deleteProduct(product.id);
        }
      }
    }
  };

  const handleAdminPinConfirm = async () => {
    if (!adminPin) return setAdminPinError('Enter admin PIN');
    const success = await login(adminPin);
    if (success && (currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'developer')) {
      if (pendingAction?.type === 'edit') setEditProduct(pendingAction.product);
      if (pendingAction?.type === 'delete') {
         deleteProduct(pendingAction.product.id);
      }
      setShowAdminPinDialog(false);
      setPendingAction(null);
      setAdminPin('');
      setAdminPinError('');
    } else {
      setAdminPinError('Invalid admin PIN');
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let addedCount = 0;
        results.data.forEach((row: any) => {
          // Normalize row keys to handle different case and spacing
          const normRow: any = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normRow[cleanKey] = row[k];
          });

          const name = normRow.name || normRow.productname || normRow.itemname || normRow.item;
          const price = parseFloat(normRow.price || normRow.cost || normRow.unitprice) || 0;
          
          if (name && price) {
            addProduct({
              name: name,
              category: normRow.category || normRow.department || 'General',
              price: price,
              unit: normRow.unit || 'pcs',
              stock: parseFloat(normRow.stock || normRow.qty || normRow.quantity) || 0,
              barcode: normRow.barcode || normRow.sku || normRow.upc || '',
              image: normRow.image || '📦',
              lowStockThreshold: parseFloat(normRow.lowstockthreshold || normRow.minstock || normRow.alert) || 10,
            });
            addedCount++;
          }
        });
        
        if (addedCount > 0) {
           toast.success(`Successfully imported ${addedCount} products from CSV`);
        } else {
           toast.error('No valid products found. Ensure CSV has Name and Price columns.');
        }
      },
      error: (error: any) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
    
    // Reset the input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-[0.2em] text-foreground uppercase mb-2">INVENTORY</h1>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          {currentUser?.business?.name || 'SUPERMARKET'}
        </p>
      </div>

      {/* Quick Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={() => {
             // For Receive Stock, we can just highlight the search or open a dedicated receive flow.
             // Currently sticking to minimalist: open a prompt or just rely on search + add stock.
             // We can trigger an alert or focus search for now.
             document.getElementById('inventory-search')?.focus();
          }} 
          className="h-12 px-8 rounded-none font-medium tracking-widest uppercase bg-foreground text-background"
        >
          <PackagePlus className="w-4 h-4 mr-2" />
          Receive Stock
        </Button>
        <Button 
          onClick={() => setShowAddModal(true)} 
          variant="outline"
          className="h-12 px-8 rounded-none font-medium tracking-widest uppercase border-foreground/20 hover:bg-muted"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add a Product
        </Button>
        <div className="relative inline-block">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleCSVUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            title="Upload CSV"
          />
          <Button 
            variant="outline"
            className="h-12 px-8 rounded-none font-medium tracking-widest uppercase border-foreground/20 hover:bg-muted pointer-events-none"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Seed CSV
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="inventory-search"
            placeholder="Search by barcode, name, or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-none border-foreground/20 focus-visible:ring-1 focus-visible:ring-foreground bg-transparent font-medium"
          />
        </div>
        <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full md:w-64 h-12 rounded-none border-foreground/20 bg-transparent font-medium uppercase tracking-widest text-xs">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all" className="uppercase tracking-widest text-xs">All Sections</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="uppercase tracking-widest text-xs">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-foreground/10 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-foreground/10">
              <TableHead className="h-12 px-6 font-semibold tracking-wider text-xs uppercase text-muted-foreground">Product Name</TableHead>
              <TableHead className="h-12 px-6 font-semibold tracking-wider text-xs uppercase text-muted-foreground">Barcode</TableHead>
              <TableHead className="h-12 px-6 font-semibold tracking-wider text-xs uppercase text-muted-foreground text-right">Unit Price</TableHead>
              <TableHead className="h-12 px-6 font-semibold tracking-wider text-xs uppercase text-muted-foreground text-right">In Stock</TableHead>
              <TableHead className="h-12 px-6 font-semibold tracking-wider text-xs uppercase text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="border-foreground/5 hover:bg-muted/50 transition-none">
                <TableCell className="px-6 py-4 font-medium">{product.name}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground font-mono">{product.barcode}</TableCell>
                <TableCell className="px-6 py-4 text-right font-medium">KSH {product.price.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <span className={cn(
                    "font-medium", 
                    product.stock <= 0 ? "text-destructive" : 
                    product.stock <= product.lowStockThreshold ? "text-orange-500" : ""
                  )}>
                    {product.stock} {product.unit}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-none h-8 px-3 text-xs tracking-widest uppercase hover:bg-foreground/5"
                      onClick={() => attemptAction('edit', product)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-none h-8 px-3 text-xs tracking-widest uppercase text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => setStockAdjust({ product, amount: '' })}
                    >
                      Add Stock
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-none h-8 px-3 text-xs tracking-widest uppercase text-destructive hover:bg-destructive/10"
                      onClick={() => attemptAction('delete', product)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium uppercase tracking-widest text-sm">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Stock Modal */}
      <Dialog open={!!stockAdjust} onOpenChange={(open) => !open && setStockAdjust(null)}>
        <DialogContent className="sm:max-w-md p-8 rounded-none border-foreground/20">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-light tracking-widest uppercase">Add Stock: {stockAdjust?.product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Quantity to Add</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-none border-foreground/20"
                  onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String((parseFloat(prev.amount) || 0) - 1) } : null)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={stockAdjust?.amount || ''}
                  onChange={(e) => setStockAdjust(prev => prev ? { ...prev, amount: e.target.value } : null)}
                  placeholder="0"
                  className="h-12 rounded-none text-center font-medium border-foreground/20"
                  autoFocus
                />
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-none border-foreground/20"
                  onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String((parseFloat(prev.amount) || 0) + 1) } : null)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Current Stock: {stockAdjust?.product.stock} {stockAdjust?.product.unit}</p>
          </div>
          <DialogFooter className="mt-8">
            <Button variant="outline" className="rounded-none border-foreground/20 uppercase tracking-widest text-xs" onClick={() => setStockAdjust(null)}>Cancel</Button>
            <Button className="rounded-none uppercase tracking-widest text-xs" onClick={handleStockAdjust}>Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-lg p-8 rounded-none border-foreground/20">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-light tracking-widest uppercase">Edit Product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Product Name</label>
                <Input
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="h-12 rounded-none border-foreground/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Unit Price (KSH)</label>
                  <Input
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                    className="h-12 rounded-none border-foreground/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Section</label>
                  <Select value={editProduct.category} onValueChange={(v) => setEditProduct({ ...editProduct, category: v })}>
                    <SelectTrigger className="h-12 rounded-none border-foreground/20 text-xs uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs uppercase tracking-widest">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Barcode</label>
                <Input
                  value={editProduct.barcode}
                  onChange={(e) => setEditProduct({ ...editProduct, barcode: e.target.value })}
                  className="h-12 rounded-none border-foreground/20 font-mono"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-8">
            <Button variant="outline" className="rounded-none border-foreground/20 uppercase tracking-widest text-xs" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button className="rounded-none uppercase tracking-widest text-xs" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg p-8 rounded-none border-foreground/20">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-light tracking-widest uppercase">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Product Name</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="h-12 rounded-none border-foreground/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Unit Price (KSH)</label>
                <Input
                  type="number"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  className="h-12 rounded-none border-foreground/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Section</label>
                <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                  <SelectTrigger className="h-12 rounded-none border-foreground/20 text-xs uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs uppercase tracking-widest">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Initial Stock</label>
                <Input
                  type="number"
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) || 0 })}
                  className="h-12 rounded-none border-foreground/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Unit Type</label>
                <Select value={newProduct.unit} onValueChange={(v: any) => setNewProduct({ ...newProduct, unit: v })}>
                  <SelectTrigger className="h-12 rounded-none border-foreground/20 text-xs uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="pcs" className="text-xs uppercase tracking-widest">Pieces</SelectItem>
                    <SelectItem value="kg" className="text-xs uppercase tracking-widest">Kilograms</SelectItem>
                    <SelectItem value="g" className="text-xs uppercase tracking-widest">Grams</SelectItem>
                    <SelectItem value="liters" className="text-xs uppercase tracking-widest">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Barcode</label>
              <Input
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                className="h-12 rounded-none border-foreground/20 font-mono"
              />
            </div>
          </div>
          <DialogFooter className="mt-8">
            <Button variant="outline" className="rounded-none border-foreground/20 uppercase tracking-widest text-xs" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button className="rounded-none uppercase tracking-widest text-xs" onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin PIN Confirmation Dialog */}
      <Dialog open={showAdminPinDialog} onOpenChange={setShowAdminPinDialog}>
        <DialogContent className="sm:max-w-md p-8 rounded-none border-foreground/20">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-light tracking-widest uppercase">Admin Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Admin PIN required to {pendingAction?.type} product.</p>
            <Input
              type="password"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              placeholder="Enter PIN"
              maxLength={4}
              className="h-12 text-center text-2xl tracking-[0.5em] rounded-none border-foreground/20"
              autoFocus
            />
            {adminPinError && <p className="text-destructive text-xs uppercase tracking-widest text-center mt-2">{adminPinError}</p>}
          </div>
          <DialogFooter className="mt-8">
            <Button variant="outline" className="rounded-none border-foreground/20 uppercase tracking-widest text-xs" onClick={() => setShowAdminPinDialog(false)}>Cancel</Button>
            <Button className="rounded-none uppercase tracking-widest text-xs" onClick={handleAdminPinConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
