import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowRight,
  Smartphone,
  Banknote,
  AlertTriangle,
  RefreshCw,
  Clock,
  List,
  Users,
  PieChart,
  BarChart4,
  Briefcase,
  Receipt,
  FileSpreadsheet,
  DownloadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AuditLogs } from './AuditLogs';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const { currentUser, products, fetchProducts, shifts, currentShift } = useStore();
  const [range, setRange] = useState('today');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [allSalesList, setAllSalesList] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Fetch Dashboard Stats from Backend
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, expensesRes] = await Promise.all([
         apiFetch(`/api/sales/stats?range=${range}`),
         apiFetch(`/api/expenses`) // Should also filter by business and range ideally, but assuming it gets all
      ]);
      const statsData = await statsRes.json();
      setStats(statsData);

      if (expensesRes.ok) {
         const expensesData = await expensesRes.json();
         // Filter expenses by range manually if needed
         let filteredExpenses = expensesData;
         const now = new Date();
         if (range === 'today') {
            filteredExpenses = expensesData.filter((e:any) => new Date(e.timestamp).toDateString() === now.toDateString());
         } else if (range === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filteredExpenses = expensesData.filter((e:any) => new Date(e.timestamp) >= startOfWeek);
         } else if (range === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredExpenses = expensesData.filter((e:any) => new Date(e.timestamp) >= startOfMonth);
         } else if (range === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filteredExpenses = expensesData.filter((e:any) => new Date(e.timestamp) >= startOfYear);
         }
         setExpenses(filteredExpenses);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Detailed Sales for Lists
  const fetchDetails = async () => {
    try {
      const res = await apiFetch(`/api/sales`);
      const allSales = await res.json();
      
      if (Array.isArray(allSales)) {
        // Filter by range
        let filteredSales = allSales;
        const now = new Date();
        if (range === 'today') {
            filteredSales = allSales.filter((s:any) => new Date(s.timestamp).toDateString() === now.toDateString());
        } else if (range === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filteredSales = allSales.filter((s:any) => new Date(s.timestamp) >= startOfWeek);
        } else if (range === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredSales = allSales.filter((s:any) => new Date(s.timestamp) >= startOfMonth);
        } else if (range === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filteredSales = allSales.filter((s:any) => new Date(s.timestamp) >= startOfYear);
        }
        setAllSalesList(filteredSales.sort((a:any,b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setAllSalesList([]);
      }
    } catch (err) { 
      console.error(err); 
      setAllSalesList([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDetails();
  }, [range]);

  // DERIVED DATA
  const supermarketProducts = useMemo(() => {
    const activeBizId = currentUser?.business?.id || currentUser?.business_id;
    return products.filter(p => p.business_id === activeBizId || !p.business_id || p.business_id === '11111111-1111-1111-1111-111111111111');
  }, [products, currentUser]);

  const stockValue = supermarketProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const stockCost = supermarketProducts.reduce((acc, p) => acc + ((p.buyingPrice || 0) * p.stock), 0);
  const expectedProfit = stockValue - stockCost;

  const lowStockProducts = supermarketProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const outOfStockProducts = supermarketProducts.filter(p => p.stock <= 0);
  const totalStockCount = supermarketProducts.reduce((acc, p) => acc + p.stock, 0);

  // Cashier Performance
  const cashierStats = useMemo(() => {
    const stats: Record<string, { total: number, count: number }> = {};
    allSalesList.forEach(sale => {
       const cName = sale.cashierName || 'Unknown';
       if (!stats[cName]) stats[cName] = { total: 0, count: 0 };
       stats[cName].total += sale.total;
       stats[cName].count += 1;
    });
    return Object.entries(stats).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.total - a.total);
  }, [allSalesList]);

  // Payment Breakdown
  const mpesaTotal = stats?.payments?.find((p:any) => p.paymentMethod === 'mpesa')?.total || 0;
  const cashTotal = stats?.payments?.find((p:any) => p.paymentMethod === 'cash')?.total || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  
  // Total expenses
  const totalExpenses = expenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
  
  // Net profit = Gross Profit (totalProfit from backend) - Expenses
  const totalGrossProfit = stats?.totalProfit || 0;
  const totalNetProfit = totalGrossProfit - totalExpenses;
  
  const profitMargin = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : 0;

  // PDF DOWNLOAD GENERATOR
  const downloadReport = () => {
     const doc = new jsPDF();
     const nowStr = new Date().toLocaleString();
     const bizName = currentUser?.business?.name || 'SUPERMARKET';

     // Simple P3L Logo & Header
     doc.setFillColor(244, 244, 245); // light gray background for header
     doc.rect(14, 14, 182, 35, 'F');
     
     doc.setFont("helvetica", "bold");
     doc.setFontSize(10);
     doc.setTextColor(0, 0, 0);
     doc.text("[ P3L POS SYSTEM ]", 20, 24);
     
     doc.setFontSize(16);
     doc.text(bizName.toUpperCase(), 20, 34);
     
     doc.setFontSize(10);
     doc.setTextColor(82, 82, 91); // zinc-600
     doc.text(`Business Report | Period: ${range.toUpperCase()}`, 20, 42);

     doc.setFontSize(8);
     doc.text(`Generated: ${nowStr}`, 140, 24);
     doc.text(`Status: Official Records`, 140, 32);

     // Card 1: Revenue & Profit
     doc.setDrawColor(228, 228, 231); // zinc-200
     doc.setFillColor(255, 255, 255);
     doc.rect(14, 60, 85, 45, 'FD');
     
     doc.setFontSize(9);
     doc.setFont("helvetica", "bold");
     doc.setTextColor(82, 82, 91);
     doc.text("TOTAL REVENUE", 20, 70);
     doc.setFontSize(14);
     doc.setTextColor(0, 0, 0);
     doc.text(`KES ${totalRevenue.toLocaleString()}`, 20, 80);
     
     doc.setFontSize(9);
     doc.setTextColor(82, 82, 91);
     doc.text("NET PROFIT", 20, 92);
     doc.setFontSize(14);
     doc.setTextColor(16, 185, 129); // emerald-500
     doc.text(`KES ${totalNetProfit.toLocaleString()}`, 20, 100);

     // Card 2: Money Out & Inventory
     doc.rect(110, 60, 86, 45, 'FD');
     doc.setFontSize(9);
     doc.setTextColor(82, 82, 91);
     doc.text("EXPENSES & MONEY OUT", 115, 70);
     doc.setFontSize(12);
     doc.setTextColor(0, 0, 0);
     doc.text(`Expenses: KES ${totalExpenses.toLocaleString()}`, 115, 80);
     
     doc.setFontSize(9);
     doc.setTextColor(82, 82, 91);
     doc.text("INVENTORY HEALTH", 115, 92);
     doc.setFontSize(10);
     doc.setTextColor(0, 0, 0);
     doc.text(`Stock Value: KES ${stockValue.toLocaleString()}`, 115, 100);

     // Separator
     doc.setDrawColor(0, 0, 0);
     doc.setLineWidth(0.5);
     doc.line(14, 120, 196, 120);

     // Top Sellers Table
     let y = 130;
     doc.setFontSize(11);
     doc.setFont("helvetica", "bold");
     doc.text("TOP SELLING ITEMS", 14, y);
     y += 8;
     doc.setFontSize(10);
     doc.setFont("helvetica", "normal");
     if (stats?.topProducts?.length > 0) {
        stats.topProducts.slice(0, 5).forEach((p:any, i:number) => {
           doc.text(`${i+1}. ${p.productName} (${p.sold} sold) - KES ${p.revenue.toLocaleString()}`, 14, y);
           y += 6;
        });
     } else {
        doc.text("No items sold in this period.", 14, y);
        y += 6;
     }

     // Staff Performance
     y = 130;
     doc.setFontSize(11);
     doc.setFont("helvetica", "bold");
     doc.text("STAFF PERFORMANCE", 110, y);
     y += 8;
     doc.setFontSize(10);
     doc.setFont("helvetica", "normal");
     if (cashierStats.length > 0) {
        cashierStats.slice(0, 5).forEach((c, i) => {
           doc.text(`${i+1}. ${c.name} : KES ${c.total.toLocaleString()}`, 110, y);
           y += 6;
        });
     } else {
        doc.text("No staff activity.", 110, y);
     }

     // Footer with Sign-off
     const footerY = 270;
     doc.setDrawColor(228, 228, 231);
     doc.line(14, footerY - 5, 196, footerY - 5);
     doc.setFontSize(9);
     doc.setFont("helvetica", "bold");
     doc.setTextColor(82, 82, 91);
     doc.text("Report Generated by P3L Developers API System. All rights reserved.", 14, footerY);
     doc.setFont("helvetica", "normal");
     doc.setFontSize(8);
     doc.text(`Generated on: ${nowStr}`, 14, footerY + 8);
     
     doc.save(`${bizName}_Report_${range}_${new Date().toISOString().split('T')[0]}.pdf`);
     toast.success("PDF Report generated and downloaded!");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Master Intelligence</h1>
          <p className="text-muted-foreground mt-1 text-sm">Comprehensive business analytics, staff performance, and audit trails.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 font-medium rounded-md border-foreground/20" onClick={downloadReport}>
            <DownloadCloud className="w-4 h-4 text-blue-600" />
            Download Report
          </Button>
          <Button variant="outline" className="gap-2 font-medium rounded-md border-foreground/20" onClick={() => setShowAuditLogs(true)}>
            <List className="w-4 h-4 text-primary" />
            System Audit Logs
          </Button>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px] font-medium rounded-md border-foreground/20">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="today" className="font-medium text-sm">Today</SelectItem>
              <SelectItem value="week" className="font-medium text-sm">This Week</SelectItem>
              <SelectItem value="month" className="font-medium text-sm">This Month</SelectItem>
              <SelectItem value="year" className="font-medium text-sm">This Year</SelectItem>
              <SelectItem value="all" className="font-medium text-sm">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="default" size="icon" onClick={() => { fetchStats(); fetchDetails(); }} className={cn("rounded-md", loading && "animate-spin")}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-md overflow-x-auto flex-nowrap border border-foreground/10">
          <TabsTrigger value="overview" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm px-6 py-2.5">Overview</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm px-6 py-2.5">Sales & Revenue</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm px-6 py-2.5">Inventory Value</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm px-6 py-2.5">Staff Performance</TabsTrigger>
          <TabsTrigger value="business" className="rounded-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-sm px-6 py-2.5">Business Intelligence</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 rounded-md border-foreground/10 bg-gradient-to-br from-primary/5 to-transparent">
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                 Gross Revenue <DollarSign className="w-4 h-4 text-primary" />
               </div>
               <div className="text-3xl font-bold">KES {totalRevenue.toLocaleString()}</div>
               <div className="text-xs text-muted-foreground mt-2 font-medium">{stats?.totalCount || 0} Total Transactions</div>
            </Card>
            <Card className="p-6 rounded-md border-foreground/10">
               <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex justify-between">
                 Net Profit <TrendingUp className="w-4 h-4 text-emerald-600" />
               </div>
               <div className="text-3xl font-bold text-emerald-700">KES {totalNetProfit.toLocaleString()}</div>
               <div className="text-xs text-muted-foreground mt-2 font-medium">{totalExpenses > 0 ? `After KES ${totalExpenses.toLocaleString()} expenses` : `${profitMargin}% Margin`}</div>
            </Card>
            <Card className="p-6 rounded-md border-foreground/10">
               <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex justify-between">
                 Stock Value <Package className="w-4 h-4 text-blue-600" />
               </div>
               <div className="text-3xl font-bold text-blue-700">KES {stockValue.toLocaleString()}</div>
               <div className="text-xs text-muted-foreground mt-2 font-medium">Across {supermarketProducts.length} unique products</div>
            </Card>
            <Card className="p-6 rounded-md border-foreground/10 bg-orange-500/5 border-orange-500/20">
               <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex justify-between">
                 Action Required <AlertTriangle className="w-4 h-4 text-orange-600" />
               </div>
               <div className="text-3xl font-bold text-orange-700">{outOfStockProducts.length + lowStockProducts.length}</div>
               <div className="text-xs text-orange-800/70 mt-2 font-medium">{outOfStockProducts.length} Empty • {lowStockProducts.length} Low</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2 p-6 rounded-md border-foreground/10">
              <h3 className="text-base font-semibold mb-4 border-b border-foreground/10 pb-2 text-foreground">Recent Transactions</h3>
              <div className="border border-foreground/10 overflow-hidden rounded-md">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Ref</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Time</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSalesList.slice(0, 5).map(sale => (
                      <TableRow key={sale.id} className="border-foreground/5">
                        <TableCell className="font-mono text-xs text-muted-foreground">{sale.receiptNumber || sale.id.substring(0,8)}</TableCell>
                        <TableCell className="text-xs font-medium">{new Date(sale.timestamp).toLocaleString([], {hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'})}</TableCell>
                        <TableCell className="text-right font-bold text-sm">KES {sale.total.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-xs font-medium rounded-md", sale.paymentMethod === 'mpesa' ? "border-green-500 text-green-700" : "border-blue-500 text-blue-700")}>
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allSalesList.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm font-medium">No sales found in this period</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-6 rounded-md border-foreground/10">
              <h3 className="text-base font-semibold mb-4 border-b border-foreground/10 pb-2 text-foreground">Top Movers</h3>
              <ScrollArea className="h-[250px] pr-4">
                {stats?.topProducts?.map((item: any, i: number) => (
                   <div key={i} className="mb-4 last:mb-0">
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="truncate pr-2">{item.productName}</span>
                        <span className="text-primary shrink-0">{item.sold} sold</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 overflow-hidden rounded-full">
                         <div 
                           className="h-full bg-primary transition-all rounded-full"
                           style={{ width: `${(item.sold / (stats?.topProducts[0]?.sold || 1)) * 100}%` }}
                         ></div>
                      </div>
                   </div>
                ))}
                {!stats?.topProducts?.length && (
                  <div className="text-center text-muted-foreground py-8 text-sm font-medium">No movement</div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* SALES & REVENUE TAB */}
        <TabsContent value="sales" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-6 rounded-md border-foreground/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-2"><Smartphone className="w-4 h-4" /> M-PESA Revenue</div>
                  <div className="text-3xl font-bold">KES {mpesaTotal.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Share</div>
                  <div className="text-xl font-bold text-muted-foreground">{totalRevenue > 0 ? ((mpesaTotal/totalRevenue)*100).toFixed(0) : 0}%</div>
                </div>
             </Card>
             <Card className="p-6 rounded-md border-foreground/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-2"><Banknote className="w-4 h-4" /> Cash Revenue</div>
                  <div className="text-3xl font-bold">KES {cashTotal.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Share</div>
                  <div className="text-xl font-bold text-muted-foreground">{totalRevenue > 0 ? ((cashTotal/totalRevenue)*100).toFixed(0) : 0}%</div>
                </div>
             </Card>
          </div>
          
          <Card className="rounded-md border-foreground/10 flex flex-col">
            <div className="p-6 border-b border-foreground/10 flex justify-between items-center bg-muted/10">
               <div>
                 <h3 className="text-base font-semibold text-foreground">Full Ledger</h3>
                 <p className="text-xs text-muted-foreground mt-1">Complete record of every transaction in this period</p>
               </div>
               <Badge variant="outline" className="rounded-md border-foreground/20 text-xs font-medium">{allSalesList.length} Records</Badge>
            </div>
            <div className="border-t-0 flex-1 bg-card">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                    <TableRow>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Sale Ref</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Date & Time</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider w-[300px]">Items Purchased</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Total Amount</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Payment Info</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Cashier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSalesList.map((sale: any) => (
                      <TableRow key={sale.id} className="border-foreground/5 hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">{sale.receiptNumber || sale.id.substring(0, 8)}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {sale.items?.map((item: any, idx: number) => (
                               <Badge key={idx} variant="secondary" className="text-xs font-normal rounded-md bg-muted/50 border border-border/50">
                                 {item.quantity}x {item.productName}
                               </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">KES {sale.total.toLocaleString()}</TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1">
                             <span className={cn("text-xs font-bold", sale.paymentMethod === 'mpesa' ? "text-green-600" : "text-blue-600")}>{sale.paymentMethod}</span>
                             {sale.mpesaRef && <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1 w-fit rounded">{sale.mpesaRef}</span>}
                           </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{sale.cashierName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="mt-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="p-6 rounded-md border-foreground/10">
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Stock Units</div>
               <div className="text-3xl font-bold">{totalStockCount.toLocaleString()}</div>
             </Card>
             <Card className="p-6 rounded-md border-foreground/10 bg-blue-500/5 border-blue-500/20">
               <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Cost of Goods (Inventory)</div>
               <div className="text-3xl font-bold text-blue-800">KES {stockCost.toLocaleString()}</div>
             </Card>
             <Card className="p-6 rounded-md border-foreground/10 bg-emerald-500/5 border-emerald-500/20">
               <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Projected Sales Value</div>
               <div className="text-3xl font-bold text-emerald-800">KES {stockValue.toLocaleString()}</div>
             </Card>
           </div>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff" className="mt-6 space-y-6">
           <Card className="p-6 rounded-md border-foreground/10">
              <h3 className="text-base font-semibold mb-4 border-b border-foreground/10 pb-2 text-foreground">Cashier Performance ({range})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {cashierStats.map((staff, i) => (
                   <div key={i} className="p-4 border border-foreground/10 bg-muted/10 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                           {staff.name.substring(0,2).toUpperCase()}
                         </div>
                         <div className="font-semibold text-sm">{staff.name}</div>
                      </div>
                      <div className="mt-4 flex justify-between items-end">
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue Generated</div>
                          <div className="text-xl font-bold">KES {staff.total.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transactions</div>
                          <div className="text-sm font-bold">{staff.count}</div>
                        </div>
                      </div>
                   </div>
                 ))}
                 {cashierStats.length === 0 && <div className="col-span-full text-center text-muted-foreground py-8 text-sm font-medium">No staff activity</div>}
              </div>
           </Card>
        </TabsContent>

        {/* BUSINESS TAB */}
        <TabsContent value="business" className="mt-6 space-y-6">
           <Card className="p-8 rounded-md border-foreground/10 bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center text-center">
              <Briefcase className="w-12 h-12 text-primary mb-4 opacity-80" />
              <h2 className="text-2xl font-bold text-foreground">Business Intelligence Report</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">Advanced margin calculations, tax estimates, and deep financial health metrics for owners.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-10 text-left border-t border-foreground/10 pt-10">
                 <div>
                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> True Profit Margin</div>
                   <div className="text-3xl font-bold">{profitMargin}%</div>
                   <p className="text-xs text-muted-foreground mt-2">Calculated from (Selling Price - Buying Price) across all goods sold.</p>
                 </div>
                 <div>
                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2"><Receipt className="w-4 h-4"/> Estimated VAT Liabilty (16%)</div>
                   <div className="text-3xl font-bold">KES {(totalRevenue * 0.16).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                   <p className="text-xs text-muted-foreground mt-2">Rough estimate based on gross revenue. Consult accountant.</p>
                 </div>
                 <div>
                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/> ROI on Inventory</div>
                   <div className="text-3xl font-bold">
                     {stockCost > 0 ? (((stockValue - stockCost) / stockCost) * 100).toFixed(1) : 0}%
                   </div>
                   <p className="text-xs text-muted-foreground mt-2">Return on investment if all current stock is sold at list price.</p>
                 </div>
              </div>
           </Card>
        </TabsContent>

      </Tabs>

      {/* Audit Logs Modal */}
      <Dialog open={showAuditLogs} onOpenChange={setShowAuditLogs}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 rounded-md border-foreground/20 overflow-hidden">
           <div className="h-full bg-card">
              <AuditLogs />
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
