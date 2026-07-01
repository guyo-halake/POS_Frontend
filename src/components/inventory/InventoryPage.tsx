import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  PackagePlus,
  FileUp,
  AlertTriangle,
  Calendar,
  Building2,
  Tag,
  Lock
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    buyingPrice: 0,
    unit: 'pcs',
    stock: 0,
    barcode: '',
    lowStockThreshold: 10,
    image: '📦',
    expiryDate: '',
    supplierId: ''
  });

  const isCashier = currentUser?.role === 'cashier';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'developer';

  const [showAdminPinDialog, setShowAdminPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete', product: Product } | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter out products that don't belong to the current supermarket
  const activeBusinessId = currentUser?.business?.id || currentUser?.business_id;
  
  const supermarketProducts = useMemo(() => {
    return products.filter(p => p.business_id === activeBusinessId || !p.business_id || p.business_id === '11111111-1111-1111-1111-111111111111');
  }, [products, activeBusinessId]);

  // Handle URL params for adding new product from POS
  useEffect(() => {
    const newBarcode = searchParams.get('newBarcode');
    if (newBarcode) {
      setNewProduct(prev => ({ ...prev, barcode: newBarcode }));
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let results = supermarketProducts;
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.barcode.toLowerCase().includes(query) ||
        (p.supplierId && p.supplierId.toLowerCase().includes(query)) ||
        p.price.toString().includes(query)
      );
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [supermarketProducts, searchQuery, selectedCategory]);

  const handleStockAdjust = () => {
    if (stockAdjust && stockAdjust.amount) {
      const amount = parseFloat(stockAdjust.amount);
      if (!isNaN(amount)) {
        updateStock(stockAdjust.product.id, amount);
        setStockAdjust(null);
        toast.success(`Stock adjusted for ${stockAdjust.product.name}`);
      }
    }
  };

  const handleSaveEdit = () => {
    if (editProduct) {
      updateProduct(editProduct.id, editProduct);
      setEditProduct(null);
      toast.success("Product updated successfully");
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price) {
      addProduct({
        ...newProduct,
        business_id: activeBusinessId
      } as Omit<Product, 'id'>);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: 'Beverages',
        price: 0,
        buyingPrice: 0,
        unit: 'pcs',
        stock: 0,
        barcode: '',
        image: '📦',
        lowStockThreshold: 10,
        expiryDate: '',
        supplierId: ''
      });
      toast.success("Product added successfully");
    } else {
      toast.error("Please fill all required fields (Name, Price)");
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
          toast.success("Product deleted");
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
         toast.success("Product deleted");
      }
      setShowAdminPinDialog(false);
      setPendingAction(null);
      setAdminPin('');
      setAdminPinError('');
    } else {
      setAdminPinError('Invalid admin PIN');
    }
  };

  // Smart remap for data rows
  const processImportedData = (data: any[]) => {
    let addedCount = 0;
    data.forEach((row: any) => {
      const normRow: any = {};
      Object.keys(row).forEach(k => {
        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        normRow[cleanKey] = row[k];
      });

      const name = normRow.name || normRow.productname || normRow.itemname || normRow.item || normRow.product;
      const price = parseFloat(normRow.price || normRow.sellingprice || normRow.cost || normRow.unitprice) || 0;
      const buyingPrice = parseFloat(normRow.buyingprice || normRow.costprice || normRow.purchaseprice) || 0;
      const expiryDate = normRow.expirydate || normRow.expiry || normRow.expiration || '';
      
      if (name && price) {
        addProduct({
          name: name,
          category: normRow.category || normRow.department || normRow.section || 'General',
          price: price,
          buyingPrice: buyingPrice,
          unit: normRow.unit || normRow.measure || 'pcs',
          stock: parseFloat(normRow.stock || normRow.qty || normRow.quantity || normRow.balance) || 0,
          barcode: normRow.barcode || normRow.sku || normRow.upc || normRow.code || '',
          image: normRow.image || '📦',
          lowStockThreshold: parseFloat(normRow.lowstockthreshold || normRow.minstock || normRow.alert || normRow.reorder) || 10,
          expiryDate: expiryDate,
          supplierId: normRow.supplier || normRow.suppliername || normRow.vendor || '',
          business_id: activeBusinessId
        });
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
       toast.success(`Successfully imported ${addedCount} products`);
    } else {
       toast.error('No valid products found. Ensure columns have Name and Price/Cost.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(results.data);
        },
        error: (error: any) => {
          toast.error(`Error parsing CSV: ${error.message}`);
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processImportedData(data);
        } catch (error: any) {
          toast.error(`Error parsing Excel file: ${error.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Unsupported file format. Please upload CSV or Excel (.xlsx)');
    }

    e.target.value = '';
  };

  const isNearExpiry = (dateString?: string) => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(expiry.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30; // 30 days warning
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 bg-background">
      
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Inventory Master</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage products, stock levels, suppliers, and expiry dates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={handleFileUpload} 
            className="hidden" 
            ref={fileInputRef}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline"
            className="h-10 px-6 rounded-none font-bold tracking-widest uppercase border-blue-600/20 text-blue-600 bg-blue-50 hover:bg-blue-100"
          >
            <FileUp className="w-4 h-4 mr-2 hidden md:inline-block" /> 
            <span className="hidden md:inline">Bulk Seed (CSV/Excel)</span>
            <span className="md:hidden">Bulk Seed</span>
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="h-10 px-6 rounded-none font-black tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2 hidden md:inline-block" /> 
            <span className="hidden md:inline">Add Product</span>
            <span className="md:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-none border-foreground/10 p-4 bg-muted/10 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Products</p>
          <p className="text-2xl font-black mt-1">{supermarketProducts.length}</p>
        </Card>
        <Card className="rounded-none border-foreground/10 p-4 bg-orange-500/5 border-orange-500/20 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-widest text-orange-600">Low Stock</p>
          <p className="text-2xl font-black mt-1 text-orange-600">{supermarketProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length}</p>
        </Card>
        <Card className="rounded-none border-foreground/10 p-4 bg-red-500/5 border-red-500/20 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-widest text-red-600">Out of Stock</p>
          <p className="text-2xl font-black mt-1 text-red-600">{supermarketProducts.filter(p => p.stock <= 0).length}</p>
        </Card>
        <Card className="rounded-none border-foreground/10 p-4 bg-purple-500/5 border-purple-500/20 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-widest text-purple-600">Near Expiry</p>
          <p className="text-2xl font-black mt-1 text-purple-600">{supermarketProducts.filter(p => p.expiryDate && isNearExpiry(p.expiryDate) && !isExpired(p.expiryDate)).length}</p>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="rounded-none border-foreground/10 p-2 md:p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 bg-background sticky top-0 z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="inventory-search"
            placeholder="Search by barcode, name, or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-none border-transparent focus-visible:ring-0 bg-muted/30 font-medium w-full text-base"
          />
        </div>
        <div className="w-full md:w-px md:h-12 bg-foreground/10 hidden md:block"></div>
        <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full md:w-64 h-12 rounded-none border-transparent bg-transparent font-bold uppercase tracking-widest text-xs focus:ring-0">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all" className="uppercase tracking-widest text-xs font-bold">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="uppercase tracking-widest text-xs font-medium">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* MODERN DATA TABLE */}
      <div className="border border-foreground/10 bg-card custom-scrollbar shadow-sm mb-12">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-foreground/10">
              <TableHead className="h-12 px-6 font-black tracking-widest text-[10px] uppercase text-muted-foreground">Product</TableHead>
              <TableHead className="h-12 px-6 font-black tracking-widest text-[10px] uppercase text-muted-foreground">Supplier / Barcode</TableHead>
              <TableHead className="h-12 px-6 font-black tracking-widest text-[10px] uppercase text-muted-foreground text-right hidden sm:table-cell">Pricing (Buy/Sell)</TableHead>
              <TableHead className="h-12 px-6 font-black tracking-widest text-[10px] uppercase text-muted-foreground text-right">Stock & Expiry</TableHead>
              <TableHead className="h-12 px-6 font-black tracking-widest text-[10px] uppercase text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const expired = isExpired(product.expiryDate);
              const nearExpiry = !expired && isNearExpiry(product.expiryDate);

              return (
                <TableRow key={product.id} className="border-foreground/5 hover:bg-muted/30">
                  <TableCell className="px-6 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xl shrink-0 hidden sm:flex">
                        {product.image || '📦'}
                      </div>
                      <div>
                        <div className="font-bold text-sm leading-tight">{product.name}</div>
                        <Badge variant="outline" className="mt-1.5 text-[8px] uppercase tracking-widest rounded-none border-foreground/20">{product.category}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 align-top text-sm">
                    {product.supplierId ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="font-semibold line-clamp-1">{product.supplierId}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/50 italic mb-1.5">No Supplier</div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded-sm">
                      <Tag className="w-3 h-3 shrink-0" />
                      {product.barcode || 'N/A'}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 align-top text-right hidden sm:table-cell">
                    <div className="font-black text-sm">KSH {product.price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Buy: KSH {(product.buyingPrice || 0).toLocaleString()}</div>
                  </TableCell>

                  <TableCell className="px-6 py-4 align-top text-right">
                    <div className="font-black text-sm block sm:hidden mb-2">KSH {product.price.toLocaleString()}</div>
                    <div className={cn(
                      "font-black text-sm flex items-center justify-end gap-2", 
                      product.stock <= 0 ? "text-red-600" : 
                      product.stock <= product.lowStockThreshold ? "text-orange-500" : "text-green-600"
                    )}>
                      {product.stock <= product.lowStockThreshold && <AlertTriangle className="w-4 h-4 shrink-0" />}
                      {product.stock} <span className="text-xs font-normal uppercase">{product.unit}</span>
                    </div>
                    {product.expiryDate && (
                      <div className={cn(
                        "flex items-center justify-end gap-1.5 text-[10px] font-bold mt-1.5 uppercase tracking-widest",
                        expired ? "text-red-600 bg-red-100 w-fit ml-auto px-1.5 py-0.5" : 
                        nearExpiry ? "text-orange-600 bg-orange-100 w-fit ml-auto px-1.5 py-0.5" : "text-muted-foreground"
                      )}>
                        <Calendar className="w-3 h-3 shrink-0" /> {product.expiryDate}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="px-6 py-4 align-top text-right">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 rounded-none text-emerald-600 hover:bg-emerald-100 font-bold text-[10px] uppercase tracking-widest px-2"
                        onClick={() => setStockAdjust({ product, amount: '' })}
                      >
                        <PackagePlus className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Restock</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 rounded-none text-blue-600 hover:bg-blue-100 font-bold text-[10px] uppercase tracking-widest px-2"
                        onClick={() => attemptAction('edit', product)}
                      >
                        <Edit2 className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 rounded-none text-red-600 hover:bg-red-100 font-bold text-[10px] uppercase tracking-widest px-2"
                        onClick={() => attemptAction('delete', product)}
                      >
                        <Trash2 className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Del</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <PackagePlus className="w-12 h-12 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">No products found</p>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-none border-foreground/20 font-bold uppercase tracking-widest text-xs">
                       Seed from CSV / Excel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* QUICK ADD STOCK MODAL */}
      <Dialog open={!!stockAdjust} onOpenChange={(open) => !open && setStockAdjust(null)}>
        <DialogContent className="sm:max-w-sm p-6 rounded-none border-foreground/20">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-black tracking-widest uppercase flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
              Receive Stock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 border border-foreground/10 text-sm">
               <span className="font-bold block mb-1">{stockAdjust?.product.name}</span>
               <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Current: {stockAdjust?.product.stock} {stockAdjust?.product.unit}</span>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Quantity Received</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-12 w-12 rounded-none border-foreground/20" onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String((parseFloat(prev.amount) || 0) - 1) } : null)}><Minus className="w-4 h-4" /></Button>
                <Input type="number" value={stockAdjust?.amount || ''} onChange={(e) => setStockAdjust(prev => prev ? { ...prev, amount: e.target.value } : null)} placeholder="0" className="h-12 rounded-none text-center font-black text-xl border-foreground/20 flex-1 focus-visible:ring-emerald-500" autoFocus />
                <Button variant="outline" className="h-12 w-12 rounded-none border-foreground/20" onClick={() => setStockAdjust(prev => prev ? { ...prev, amount: String((parseFloat(prev.amount) || 0) + 1) } : null)}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button className="w-full rounded-none uppercase tracking-widest font-black h-12 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleStockAdjust}>Confirm Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT MODAL */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-2xl p-0 rounded-none border-foreground/20 overflow-hidden">
          <div className="bg-muted/50 border-b border-foreground/10 p-6">
             <DialogTitle className="font-black tracking-widest uppercase text-lg flex items-center gap-2">
               <Edit2 className="w-5 h-5 text-blue-600" /> Edit Product Profile
             </DialogTitle>
          </div>
          {editProduct && (
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Product Name <span className="text-red-500">*</span></label>
                  <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="h-12 rounded-none border-foreground/20 font-bold text-lg focus-visible:ring-blue-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selling Price (KSH) <span className="text-red-500">*</span></label>
                  <Input type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })} className="h-12 rounded-none border-foreground/20 font-black text-blue-600 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Buying Price (Cost)</label>
                  <Input type="number" value={editProduct.buyingPrice || ''} onChange={(e) => setEditProduct({ ...editProduct, buyingPrice: parseFloat(e.target.value) || 0 })} className="h-12 rounded-none border-foreground/20 font-bold focus-visible:ring-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                  <Select value={editProduct.category} onValueChange={(v) => setEditProduct({ ...editProduct, category: v })}>
                    <SelectTrigger className="h-12 rounded-none border-foreground/20 text-xs uppercase tracking-widest font-bold focus-visible:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs uppercase tracking-widest font-medium">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unit Type</label>
                  <Select value={editProduct.unit} onValueChange={(v: any) => setEditProduct({ ...editProduct, unit: v })}>
                    <SelectTrigger className="h-12 rounded-none border-foreground/20 text-xs uppercase tracking-widest font-bold focus-visible:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {['pcs', 'kg', 'g', 'liters', 'bottles', 'trays', 'sachets'].map(u => (
                        <SelectItem key={u} value={u} className="text-xs uppercase tracking-widest font-medium">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Barcode / SKU</label>
                  <Input value={editProduct.barcode} onChange={(e) => setEditProduct({ ...editProduct, barcode: e.target.value })} className="h-12 rounded-none border-foreground/20 font-mono tracking-widest focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Supplier Name</label>
                  <Input placeholder="e.g. Coca-Cola Distributors" value={editProduct.supplierId || ''} onChange={(e) => setEditProduct({ ...editProduct, supplierId: e.target.value })} className="h-12 rounded-none border-foreground/20 focus-visible:ring-blue-500 font-bold" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-orange-600">Expiry Date</label>
                  <Input type="date" value={editProduct.expiryDate || ''} onChange={(e) => setEditProduct({ ...editProduct, expiryDate: e.target.value })} className="h-12 rounded-none border-foreground/20 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-orange-600">Low Stock Alert Level</label>
                  <Input type="number" value={editProduct.lowStockThreshold} onChange={(e) => setEditProduct({ ...editProduct, lowStockThreshold: parseInt(e.target.value) || 0 })} className="h-12 rounded-none border-foreground/20 focus-visible:ring-blue-500 font-bold" />
                </div>
              </div>
            </div>
          )}
          <div className="p-6 bg-muted/20 border-t border-foreground/10 flex gap-4">
             <Button variant="outline" className="flex-1 rounded-none border-foreground/20 uppercase tracking-widest font-bold h-12" onClick={() => setEditProduct(null)}>Cancel</Button>
             <Button className="flex-1 rounded-none uppercase tracking-widest font-black h-12 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD PRODUCT MODAL */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-none border-foreground/20 overflow-hidden bg-card">
          <div className="bg-primary border-b border-foreground/10 p-6 text-primary-foreground">
             <DialogTitle className="font-black tracking-widest uppercase text-xl flex items-center gap-3">
               <Plus className="w-6 h-6" /> Add New Inventory Item
             </DialogTitle>
             <p className="text-xs uppercase tracking-widest opacity-80 mt-2">Fill in the product details to register it into the master database.</p>
          </div>
          
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Core Info */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b pb-2 border-foreground/10 text-muted-foreground">Core Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Product Name <span className="text-red-500">*</span></label>
                  <Input placeholder="e.g. Premium Basmati Rice 2kg" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="h-14 rounded-none border-foreground/20 font-black text-lg focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                    <SelectTrigger className="h-14 rounded-none border-foreground/20 text-xs uppercase tracking-widest font-bold focus-visible:ring-primary bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs uppercase tracking-widest font-medium">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Barcode / SKU</label>
                  <Input placeholder="Scan or type barcode" value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} className="h-14 rounded-none border-foreground/20 font-mono tracking-widest focus-visible:ring-primary bg-muted/30" />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b pb-2 border-foreground/10 text-muted-foreground">Pricing & Logistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selling Price <span className="text-red-500">*</span></label>
                  <Input type="number" placeholder="KSH" value={newProduct.price || ''} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="h-14 rounded-none border-foreground/20 font-black text-xl text-primary focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Buying Cost</label>
                  <Input type="number" placeholder="KSH" value={newProduct.buyingPrice || ''} onChange={(e) => setNewProduct({ ...newProduct, buyingPrice: parseFloat(e.target.value) || 0 })} className="h-14 rounded-none border-foreground/20 font-bold focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Initial Stock</label>
                  <Input type="number" placeholder="0" value={newProduct.stock || ''} onChange={(e) => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) || 0 })} className="h-14 rounded-none border-foreground/20 font-bold focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Supplier Name</label>
                  <Input placeholder="Supplier details..." value={newProduct.supplierId || ''} onChange={(e) => setNewProduct({ ...newProduct, supplierId: e.target.value })} className="h-14 rounded-none border-foreground/20 font-bold focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expiry Date</label>
                  <Input type="date" value={newProduct.expiryDate || ''} onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })} className="h-14 rounded-none border-foreground/20 font-bold focus-visible:ring-primary bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Low Stock Alert</label>
                  <Input type="number" value={newProduct.lowStockThreshold} onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: parseInt(e.target.value) || 0 })} className="h-14 rounded-none border-foreground/20 font-bold focus-visible:ring-primary bg-muted/30" />
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-muted/30 border-t border-foreground/10 flex gap-4">
             <Button variant="outline" className="flex-1 rounded-none border-foreground/20 uppercase tracking-widest font-bold h-14" onClick={() => setShowAddModal(false)}>Cancel</Button>
             <Button className="flex-[2] rounded-none uppercase tracking-widest font-black h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg shadow-lg" onClick={handleAddProduct}>Create Product</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin PIN Confirmation Dialog */}
      <Dialog open={showAdminPinDialog} onOpenChange={setShowAdminPinDialog}>
        <DialogContent className="sm:max-w-xs p-6 rounded-none border-foreground/20">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-black tracking-widest uppercase text-center text-red-600 flex flex-col items-center gap-2">
              <Lock className="w-8 h-8" /> Security Check
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-center font-bold tracking-widest uppercase text-muted-foreground">Admin PIN required</p>
            <Input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="****" maxLength={4} className="h-14 text-center text-3xl tracking-[1em] font-mono rounded-none border-foreground/20 focus-visible:ring-red-500" autoFocus />
            {adminPinError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center mt-2">{adminPinError}</p>}
          </div>
          <DialogFooter className="mt-6">
            <Button className="w-full rounded-none font-black uppercase tracking-widest h-14 bg-red-600 hover:bg-red-700 text-white" onClick={handleAdminPinConfirm}>Authenticate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
