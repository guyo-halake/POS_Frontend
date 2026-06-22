import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiClient';
import { API_BASE_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowRight,
  Smartphone, // for MPesa
  Banknote,    // for Cash
  AlertTriangle,
  RefreshCw,
  Clock,
  List,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from "@/components/ui/progress"
import { AuditLogs } from './AuditLogs';

export const ReportsPage: React.FC = () => {
  const { currentUser, products, updateStock, fetchProducts, shifts, currentShift } = useStore();
  const [range, setRange] = useState('today');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showSoldItems, setShowSoldItems] = useState(false);
  const [showStockList, setShowStockList] = useState(false);
  const [showMpesaList, setShowMpesaList] = useState(false);
  const [showShiftList, setShowShiftList] = useState(false);
  const [showCashList, setShowCashList] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [soldItemsList, setSoldItemsList] = useState<any[]>([]);
  const [mpesaTransactions, setMpesaTransactions] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [allSalesList, setAllSalesList] = useState<any[]>([]);

  // Fetch Dashboard Stats from Backend
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/sales/stats?range=${range}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Detailed Sales for Lists
  const fetchDetails = async () => {
    try {
      const res = await apiFetch(`/api/sales`); // Get all sales
      const allSales = await res.json();
      
      // Filter client-side for simplicity on modals for now
      // (Ideally backend would filter these too)
      
      // Flatten for "Sold Items"
      const items: any[] = [];
      const mpesaTxns: any[] = [];
      const cashTxns: any[] = [];

      allSales.forEach((sale: any) => {
        // M-Pesa
        if (sale.paymentMethod === 'mpesa') {
          mpesaTxns.push({
            id: sale.id,
            ref: sale.mpesaRef || 'N/A',
            phone: sale.mpesaPhone || 'N/A', // Assuming we save this
            amount: sale.total,
            cashier: sale.cashierName,
            time: sale.timestamp,
            mode: sale.mpesaRef ? 'Prompt' : 'Manual' 
          });
        }
        
        // Cash
        if (sale.paymentMethod === 'cash') {
          cashTxns.push({
            id: sale.id,
            amount: sale.total,
            cashier: sale.cashierName,
            time: sale.timestamp,
            cashGiven: sale.cashGiven || 0,
            change: sale.change || 0
          });
        }
        
        // Items
        sale.items.forEach((item: any) => {
          items.push({
            ...item,
            saleId: sale.id,
            time: sale.timestamp,
            cashier: sale.cashierName
          });
        });
      });
      
      // Sort detailed lists by time desc
      setSoldItemsList(items.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setMpesaTransactions(mpesaTxns.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setCashTransactions(cashTxns.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      
      // All sales history
      setAllSalesList(allSales.sort((a:any,b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchDetails(); // Pre-fetch for modals
  }, [range]);

  const stockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 bg-background min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sales & Reports</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
            <Users className="w-4 h-4" />
            <span>Cashier: {currentUser?.name || 'Admin'}</span>
            <span className="text-border">|</span>
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2 font-medium" onClick={() => setShowAuditLogs(true)}>
            <List className="w-4 h-4" />
            Audit Logs
          </Button>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px] font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchStats} className={cn(loading && "animate-spin")}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - Minimalist */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Sales */}
        <Card className="p-6 shadow-sm rounded-xl">
           <div className="flex justify-between items-start mb-4">
             <div className="text-sm font-medium text-muted-foreground">Total Revenue ({range})</div>
             <DollarSign className="w-5 h-5 text-muted-foreground" />
           </div>
           <div className="text-3xl font-semibold tracking-tight">
             KES {(stats?.totalRevenue || 0).toLocaleString()}
           </div>
           <div className="mt-2 text-sm text-muted-foreground flex items-center">
             <TrendingUp className="w-4 h-4 mr-1" />
             {(stats?.totalCount || 0)} Transactions
           </div>
        </Card>

        {/* Goods Sold */}
        <Card 
          className="p-6 shadow-sm rounded-xl cursor-pointer hover:border-foreground/20 transition-all group"
          onClick={() => setShowSoldItems(true)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-muted-foreground">Goods Sold</div>
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-semibold tracking-tight">
            {soldItemsList.length.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-muted-foreground flex items-center group-hover:text-foreground transition-colors">
            View Item List <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Card>

        {/* Stock Status */}
        <Card 
          className="p-6 shadow-sm rounded-xl cursor-pointer hover:border-foreground/20 transition-all group"
          onClick={() => setShowStockList(true)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-muted-foreground">Stock Units</div>
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold tracking-tight">
              {totalStockCount.toLocaleString()}
            </div>
            {lowStockProducts.length > 0 && (
              <span className="text-sm font-medium text-destructive">{lowStockProducts.length} low</span>
            )}
          </div>
          <div className="mt-2 text-sm text-muted-foreground flex items-center group-hover:text-foreground transition-colors">
            Full Inventory <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Card>

        {/* Shifts */}
        <Card 
          className="p-6 shadow-sm rounded-xl cursor-pointer hover:border-foreground/20 transition-all group"
          onClick={() => setShowShiftList(true)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-muted-foreground">Active Shift</div>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
            {currentShift ? (
              <div>
                <div className="text-xl font-semibold tracking-tight truncate max-w-[120px]">
                  {currentShift.cashierName}
                </div>
                <div className="text-sm text-emerald-600 font-medium flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(currentShift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ) : (
              <div className="text-xl font-semibold text-muted-foreground">No Active Shift</div>
            )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods Breakdown */}
        <Card className="col-span-1 lg:col-span-2 p-6 shadow-sm rounded-xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" /> Payment Methods
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* MPESA Card */}
             <div 
               className="bg-muted/30 rounded-xl p-5 border border-border cursor-pointer hover:border-foreground/30 transition-all group"
               onClick={() => setShowMpesaList(true)}
             >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-background p-2 rounded-lg border border-border">
                    <Smartphone className="w-5 h-5 text-foreground" /> 
                  </div>
                  <Badge variant="secondary" className="font-medium">Detailed View</Badge>
                </div>
                <div className="text-sm font-medium text-muted-foreground">M-Pesa Transfers</div>
                <div className="text-3xl font-semibold tracking-tight mt-1">
                   KES {(stats?.payments?.find((p:any) => p.paymentMethod === 'mpesa')?.total || 0).toLocaleString()}
                </div>
             </div>

             {/* Cash Card */}
             <div 
                className="bg-muted/30 rounded-xl p-5 border border-border cursor-pointer hover:border-foreground/30 transition-all group"
                onClick={() => setShowCashList(true)}
             >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-background p-2 rounded-lg border border-border">
                    <Banknote className="w-5 h-5 text-foreground" /> 
                  </div>
                  <Badge variant="secondary" className="font-medium">Detailed View</Badge>
                </div>
                <div className="text-sm font-medium text-muted-foreground">Cash Payments</div>
                <div className="text-3xl font-semibold tracking-tight mt-1">
                   KES {(stats?.payments?.find((p:any) => p.paymentMethod === 'cash')?.total || 0).toLocaleString()}
                </div>
             </div>
          </div>
        </Card>

        {/* Top Selling Products */}
        <Card className="p-6 shadow-sm rounded-xl">
           <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-muted-foreground" /> Top Selling
           </h3>
           <ScrollArea className="h-[200px] pr-4">
             {stats?.topProducts?.map((item: any, i: number) => (
                <div key={i} className="mb-4 last:mb-0 group">
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium">{item.productName}</span>
                     <span className="text-muted-foreground">{item.sold} sold</span>
                   </div>
                   <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${(item.sold / (stats?.topProducts[0]?.sold || 1)) * 100}%` }}
                      ></div>
                   </div>
                </div>
             ))}
             {!stats?.topProducts?.length && (
               <div className="text-center text-muted-foreground py-8">No sales yet</div>
             )}
           </ScrollArea>
        </Card>
      </div>

      {/* FULL SALES HISTORY MASTER TABLE */}
      <Card className="p-6 shadow-sm rounded-xl border border-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Full Sales History</h3>
              <p className="text-sm text-muted-foreground">Complete record of every transaction in the database</p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">{allSalesList.length} Total Records</Badge>
          </div>
          
          <div className="border rounded-lg overflow-hidden flex-1">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-medium whitespace-nowrap">Sale Ref</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Date & Time</TableHead>
                    <TableHead className="font-medium min-w-[200px]">Items Purchased</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Total Amount</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Payment</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Customer Info</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Cashier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSalesList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales records found in the database.</TableCell>
                    </TableRow>
                  ) : (
                    allSalesList.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">{sale.receiptNumber || sale.id.substring(0, 8)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-wrap gap-1">
                            {sale.items?.map((item: any, idx: number) => (
                               <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                                 {item.quantity}x {item.productName}
                               </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">KES {sale.total.toLocaleString()}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5">
                             {sale.paymentMethod === 'mpesa' ? <Smartphone className="w-3.5 h-3.5 text-muted-foreground" /> : <Banknote className="w-3.5 h-3.5 text-muted-foreground" />}
                             <span className="capitalize text-sm font-medium">{sale.paymentMethod}</span>
                           </div>
                           {sale.mpesaRef && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{sale.mpesaRef}</div>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                           {sale.mpesaPhone ? sale.mpesaPhone : sale.customerName || 'Walk-in'}
                        </TableCell>
                        <TableCell className="text-sm">{sale.cashierName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
      </Card>

      {/* --- MODALS --- */}

      {/* 1. M-Pesa Detailed List */}
      <Dialog open={showMpesaList} onOpenChange={setShowMpesaList}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" /> M-Pesa Transactions
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Code (Ref)</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mpesaTransactions.map((txn, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">
                       {new Date(txn.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{txn.ref}</TableCell>
                    <TableCell>{txn.phone}</TableCell>
                    <TableCell className="font-bold">KES {txn.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={txn.mode === 'Prompt' ? 'default' : 'secondary'}>{txn.mode}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{txn.cashier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Goods Sold List */}
      <Dialog open={showSoldItems} onOpenChange={setShowSoldItems}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" /> Goods Sold List
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldItemsList.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">
                       {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right text-xs">KES {item.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-purple-700">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{item.cashier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Shift History List */}
      <Dialog open={showShiftList} onOpenChange={setShowShiftList}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Shift History
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Active Shift First */}
                {currentShift && (
                  <TableRow className="bg-green-50">
                    <TableCell className="font-bold">{currentShift.cashierName} (Active)</TableCell>
                    <TableCell>{new Date(currentShift.startTime).toLocaleString()}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="animate-pulse">Ongoing...</TableCell>
                  </TableRow>
                )}
                {shifts.map((shift, i) => (
                  <TableRow key={i}>
                    <TableCell>{shift.cashierName}</TableCell>
                    <TableCell>{new Date(shift.startTime).toLocaleString()}</TableCell>
                    <TableCell>{shift.endTime ? new Date(shift.endTime).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>
                      {shift.endTime 
                        ? ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2) + ' hrs'
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 3. Global Stock List */}
      <Dialog open={showStockList} onOpenChange={setShowStockList}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" /> Full Stock Inventory
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                   <TableHead>Product Name</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead className="text-right">Stock Level</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.sort((a,b) => a.stock - b.stock).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="text-right font-mono text-lg">{p.stock} <span className="text-xs text-muted-foreground">{p.unit}</span></TableCell>
                    <TableCell>
                       {p.stock === 0 ? <Badge variant="destructive">Empty</Badge> : 
                        p.stock <= p.lowStockThreshold ? <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Low</Badge> :
                        <Badge variant="outline" className="text-green-600 border-green-200">OK</Badge>
                       }
                    </TableCell>
                    <TableCell className="text-right">
                       <Button size="sm" variant="outline" onClick={() => updateStock(p.id, 10)}>
                         + Restock
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Cash Transactions List */}
      <Dialog open={showCashList} onOpenChange={setShowCashList}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-slate-600" /> Cash Transactions
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Cash Given</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashTransactions.map((txn, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">
                       {new Date(txn.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="font-bold">KES {txn.amount.toLocaleString()}</TableCell>
                    <TableCell>KES {(txn.cashGiven || txn.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-green-600 font-medium">KES {(txn.change || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{txn.cashier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      {/* Audit Logs Modal */}
      <Dialog open={showAuditLogs} onOpenChange={setShowAuditLogs}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <AuditLogs />
        </DialogContent>
      </Dialog>
    </div>
  );
};
