import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
    AlertTriangle, 
    TrendingUp, 
    CreditCard, 
    Users, 
    AlertOctagon, 
    Clock, 
    ArrowRight,
    Package,
    Truck,
    Settings,
    Phone,
    MessageCircle,
    MessageSquare,
    Plus,
    List,
    Store,
    BarChart3,
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    FileText,
    Wallet,
    Mail
} from 'lucide-react';
import { WalletDashboard } from '@/components/finance/WalletDashboard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, isToday, isYesterday, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6'];

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
    const { currentUser, products, isShiftActive, currentShift, shifts, sales, notifications, suppliers, addSupplier, fetchSuppliers } = useStore();
    const [timeRange, setTimeRange] = useState('this week');
    const [salesTimeRange, setSalesTimeRange] = useState<'today' | 'this week' | 'this month'>('today');
    const [activeView, setActiveView] = useState<'dashboard' | 'suppliers' | 'expenses' | 'wallet'>('dashboard');
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    
    // Supplier Form State
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierPhone, setNewSupplierPhone] = useState('');
    const [newSupplierEmail, setNewSupplierEmail] = useState('');
    const [newSupplierGoods, setNewSupplierGoods] = useState('');

    const [restockSupplier, setRestockSupplier] = useState<any | null>(null);
    const [restockItem, setRestockItem] = useState('');
    const [restockAmount, setRestockAmount] = useState('');
    const [customRestockItem, setCustomRestockItem] = useState('');

    // --- SMART REPORTING & EXPENSES STATE ---
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'whatsapp' | 'email'>('whatsapp');
    const [reportRange, setReportRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportEmail, setReportEmail] = useState(currentUser?.email || '');
    const [whatsappPreviewText, setWhatsappPreviewText] = useState('');
    const [whatsappPdfUrl, setWhatsappPdfUrl] = useState('');
    const [showWhatsappPreviewModal, setShowWhatsappPreviewModal] = useState(false);

    const [expenses, setExpenses] = useState<any[]>([]);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('General');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

    // Fetch expenses from local database
    const fetchExpenses = async () => {
      setIsLoadingExpenses(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/expenses`);
        if (response.ok) {
          const data = await response.json();
          setExpenses(data);
        }
      } catch (err) {
        console.error('Failed to fetch expenses', err);
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    useEffect(() => {
      fetchExpenses();
      if (activeView === 'suppliers') {
        fetchSuppliers();
      }
    }, [activeView]);

    const handleLogExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseAmount || isNaN(parseFloat(expenseAmount))) {
        toast.error('Please enter a valid amount');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(expenseAmount),
            category: expenseCategory,
            description: expenseDescription
          })
        });

        if (response.ok) {
          toast.success('Expense recorded successfully');
          setShowAddExpense(false);
          setExpenseAmount('');
          setExpenseDescription('');
          setExpenseCategory('General');
          fetchExpenses(); // Refetch list
        } else {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to record expense');
        }
      } catch (err: any) {
        toast.error(err.message || 'Error recording expense');
      }
    };

    const handleGenerateAndSend = async () => {
      setIsGeneratingReport(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            range: reportRange,
            type: reportType,
            email: reportType === 'email' ? reportEmail : undefined
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate report');
        }
        
        const data = await response.json();
        
        if (reportType === 'whatsapp') {
          setWhatsappPreviewText(data.whatsapp_text);
          setWhatsappPdfUrl(data.pdf_url);
          setReportModalOpen(false);
          setShowWhatsappPreviewModal(true);
          toast.success('WhatsApp report generated and ready!');
        } else {
          toast.success(`Report email dispatched successfully to ${data.email_recipient || reportEmail}!`);
          setReportModalOpen(false);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Report generation failed');
      } finally {
        setIsGeneratingReport(false);
      }
    };


    // --- REAL DATA CALCULATIONS ---

    // 1. Low Stock
    const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 5));

    // 2. Sales Data Filtering
    const now = new Date();
    let salesStart = startOfDay(now);
    let salesEnd = new Date(now.setHours(23, 59, 59, 999));
    
    if (salesTimeRange === 'this week') {
        salesStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday start
        salesEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    } else if (salesTimeRange === 'this month') {
        salesStart = startOfMonth(new Date());
        salesEnd = endOfMonth(new Date());
    }

    const filteredSales = sales.filter(s => {
        const d = new Date(s.timestamp);
        return d >= salesStart && d <= salesEnd;
    });

    const revenueTotal = filteredSales.reduce((acc, s) => acc + s.total, 0);
    
    // Profit Calculation (using real expenses and real buying prices)
    const todayExpensesTotal = expenses
      .filter(exp => {
        const d = new Date(exp.timestamp);
        return d >= salesStart && d <= salesEnd;
      })
      .reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

    let realProfit = 0;
    filteredSales.forEach(s => {
        const multiplier = s.total < 0 ? -1 : 1;
        s.items?.forEach(item => {
            const itemCost = item.product.buyingPrice || (item.product.price * 0.8);
            realProfit += ((item.product.price - itemCost) * item.quantity) * multiplier;
        });
    });

    const profitTotal = realProfit - todayExpensesTotal;

    // Payment Methods Breakdown
    const cashTotal = filteredSales.filter(s => s.paymentMethod === 'cash').reduce((acc,s) => acc + s.total, 0);
    const mpesaTotal = filteredSales.filter(s => s.paymentMethod === 'mpesa').reduce((acc,s) => acc + s.total, 0);
    
    // 3. Graph Data Generation based on TimeRange (STRICTLY REAL DATA)
    let graphData: any[] = [];
    if (timeRange === 'this week') {
        const days = eachDayOfInterval({ start: startOfWeek(new Date(), {weekStartsOn: 1}), end: endOfWeek(new Date(), {weekStartsOn: 1}) });
        graphData = days.map(day => {
            const daySales = sales.filter(s => isSameDay(new Date(s.timestamp), day));
            const rev = daySales.reduce((acc, s) => acc + s.total, 0);
            let prof = 0;
            daySales.forEach(s => {
                const m = s.total < 0 ? -1 : 1;
                s.items?.forEach(i => {
                    const c = i.product.buyingPrice || (i.product.price * 0.8);
                    prof += ((i.product.price - c) * i.quantity) * m;
                });
            });
            return { name: format(day, 'EEE'), revenue: rev, profit: prof };
        });
    } else if (timeRange === 'this month') {
        const weeks = eachWeekOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
        graphData = weeks.map((week, idx) => {
            const weekSales = sales.filter(s => isSameWeek(new Date(s.timestamp), week));
            const rev = weekSales.reduce((acc, s) => acc + s.total, 0);
            let prof = 0;
            weekSales.forEach(s => {
                const m = s.total < 0 ? -1 : 1;
                s.items?.forEach(i => {
                    const c = i.product.buyingPrice || (i.product.price * 0.8);
                    prof += ((i.product.price - c) * i.quantity) * m;
                });
            });
            return { name: `Week ${idx + 1}`, revenue: rev, profit: prof };
        });
    } else if (timeRange === 'this year') {
        const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date()) });
        graphData = months.map(month => {
            const monthSales = sales.filter(s => isSameMonth(new Date(s.timestamp), month));
            const rev = monthSales.reduce((acc, s) => acc + s.total, 0);
            let prof = 0;
            monthSales.forEach(s => {
                const m = s.total < 0 ? -1 : 1;
                s.items?.forEach(i => {
                    const c = i.product.buyingPrice || (i.product.price * 0.8);
                    prof += ((i.product.price - c) * i.quantity) * m;
                });
            });
            return { name: format(month, 'MMM'), revenue: rev, profit: prof };
        });
    }

    // 4. Recent Activity
    const recentActivityLog = [
        ...filteredSales.map(s => ({
            id: s.id,
            timestamp: new Date(s.timestamp),
            time: format(new Date(s.timestamp), 'MMM d, h:mm a'),
            title: s.total < 0 ? `Refund by ${s.cashierName}` : `Sale by ${s.cashierName}`,
            details: `KES ${Math.abs(s.total).toLocaleString()} via ${s.paymentMethod}`,
            type: s.total < 0 ? 'alert' : 'info'
        })),
        ...shifts.flatMap(sh => {
            const arr = [{
                id: `shift-start-${sh.id}`,
                timestamp: new Date(sh.startTime),
                time: format(new Date(sh.startTime), 'MMM d, h:mm a'),
                title: 'Shift Started',
                details: `${sh.cashierName} opened register`,
                type: 'success'
            }];
            if (sh.endTime) {
                arr.push({
                    id: `shift-end-${sh.id}`,
                    timestamp: new Date(sh.endTime),
                    time: format(new Date(sh.endTime), 'MMM d, h:mm a'),
                    title: 'Shift Ended',
                    details: `${sh.cashierName} closed register`,
                    type: 'info'
                });
            }
            return arr;
        })
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

    // Handlers
    const handleRequestStock = (method: 'whatsapp' | 'sms') => {
        if (!restockSupplier) return;
        
        const item = restockItem === 'Other' ? customRestockItem : restockItem;
        const message = `Hi ${restockSupplier.name}, please supply: ${item}, Quantity: ${restockAmount}. From FreshFity Supermarket.`;
        const encoded = encodeURIComponent(message);
        
        if (method === 'whatsapp') {
             window.open(`https://wa.me/${restockSupplier.phone}?text=${encoded}`, '_blank');
        } else {
             window.open(`sms:${restockSupplier.phone}?body=${encoded}`, '_target');
        }
        setRestockSupplier(null);
        setRestockItem('');
        setCustomRestockItem('');
        setRestockAmount('');
    };

    const handleAddSupplier = async () => {
        if (!newSupplierName || !newSupplierPhone) return;
        
        const goodsArray = newSupplierGoods.split(',').map(g => g.trim()).filter(g => g.length > 0);
        
        await addSupplier({
            name: newSupplierName,
            phone: newSupplierPhone,
            email: newSupplierEmail,
            goods: goodsArray
        });
        
        setNewSupplierName('');
        setNewSupplierPhone('');
        setNewSupplierEmail('');
        setNewSupplierGoods('');
        setShowAddSupplier(false);
    };


    return (
        <div className="flex-1 bg-background p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full flex flex-col">
            {/* Header info in the dashboard content area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-foreground/10">
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <LayoutDashboard className="w-8 h-8" />
                  Welcome, {currentUser?.name || 'Admin'}
                </h1>
                <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">
                  Admin ({currentUser?.business?.name || 'Supermarket'})
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto justify-end">
                {/* Reporting Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setReportType('whatsapp'); setReportModalOpen(true); }}
                    className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => { setReportType('email'); setReportModalOpen(true); }}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Email</span>
                  </button>
                </div>

                {/* View switcher */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className={`pb-1 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'dashboard' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
                  >
                    Metrics
                  </button>
                  <button 
                    onClick={() => setActiveView('suppliers')}
                    className={`pb-1 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'suppliers' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
                  >
                    Suppliers
                  </button>
                  <button 
                    onClick={() => setActiveView('expenses')}
                    className={`pb-1 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'expenses' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
                  >
                    Expenses
                  </button>
                  <button 
                    onClick={() => setActiveView('wallet')}
                    className={`pb-1 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'wallet' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
                  >
                    Wallet
                  </button>
                </div>
              </div>
            </div>

            <main className="space-y-8 flex-1 animate-fade-in">
                {activeView === 'wallet' ? (
                  <WalletDashboard />
                ) : activeView === 'dashboard' ? (
                <div className="space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Dynamic Sales Card */}
                    <Card className="shadow-none rounded-none border border-foreground/15 bg-card flex flex-col">
                        <CardHeader className="pb-4 flex-none">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                                Revenue 
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="bg-muted px-2 py-0.5 border border-foreground/10 text-[10px] text-foreground font-black cursor-pointer hover:bg-muted/80">
                                      {salesTimeRange.toUpperCase()} ▼
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-none border-foreground/20">
                                    <DropdownMenuItem onClick={() => setSalesTimeRange('today')} className="text-xs font-bold uppercase tracking-widest">Today</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSalesTimeRange('this week')} className="text-xs font-bold uppercase tracking-widest">This Week</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSalesTimeRange('this month')} className="text-xs font-bold uppercase tracking-widest">This Month</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {filteredSales.length === 0 ? (
                              <div className="flex-1 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-muted-foreground/50 h-full py-6">
                                No sales {salesTimeRange}
                              </div>
                            ) : (
                              <>
                                <div className="text-3xl font-black tracking-tight mb-6">KES {revenueTotal.toLocaleString()}</div>
                                <div className="flex gap-6 mt-auto">
                                    <div className="flex-1 border-t border-foreground/10 pt-3">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">M-Pesa</div>
                                        <div className="font-bold text-sm">KES {mpesaTotal.toLocaleString()}</div>
                                    </div>
                                    <div className="flex-1 border-t border-foreground/10 pt-3">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cash</div>
                                        <div className="font-bold text-sm">KES {cashTotal.toLocaleString()}</div>
                                    </div>
                                </div>
                              </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Low Stock Alert */}
                    <Card className={`col-span-1 md:col-span-2 shadow-none rounded-none border bg-card ${lowStockItems.length > 0 ? 'border-destructive/50' : 'border-foreground/15'}`}>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attention Needed</CardTitle>
                            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lowStockItems.length === 0 ? (
                                    <div className="text-center text-xs uppercase tracking-widest text-muted-foreground font-bold mt-4">All stock levels look good</div>
                                ) : (
                                    <div className="max-h-[140px] overflow-y-auto pr-2 space-y-2">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">{lowStockItems.length} items running low</div>
                                        {lowStockItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-foreground/5 last:border-0">
                                                <div className="text-xs font-bold uppercase tracking-wider truncate mr-4">{item.name}</div>
                                                <div className="text-[10px] uppercase font-black px-2 py-0.5 bg-destructive/10 text-destructive flex-shrink-0">{item.stock} left</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Graph */}
                    <Card className="col-span-1 lg:col-span-2 shadow-none rounded-none border border-foreground/15 bg-card">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
                            <div>
                                <CardTitle className="font-bold text-sm uppercase tracking-widest">Income & Revenue</CardTitle>
                                <CardDescription className="text-xs">Performance chart based on current sales log</CardDescription>
                            </div>
                            <div className="flex bg-muted p-1 border border-foreground/10 rounded-none">
                                {['This Week', 'This Month', 'This Year'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range.toLowerCase())}
                                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                                            timeRange === range.toLowerCase() 
                                            ? 'bg-background shadow-sm text-foreground' 
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={value => value >= 1000 ? `${value/1000}k` : value} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '0px', border: '1px solid hsl(var(--foreground))', boxShadow: 'none' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--foreground))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                                    <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-foreground/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-none bg-foreground"></span>
                                    <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-none bg-emerald-500"></span>
                                    <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Estimated Profit</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                     <Card className="col-span-1 shadow-none rounded-none border border-foreground/15 bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivityLog.length === 0 && (
                                    <div className="text-center text-xs uppercase tracking-widest text-muted-foreground py-8 font-bold">No recent activity</div>
                                )}
                                {recentActivityLog.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-4 py-3 border-b last:border-0 border-foreground/10">
                                        <div className={`mt-0.5 p-2 rounded-none ${log.type === 'alert' ? 'bg-destructive/10 text-destructive' : log.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-foreground'}`}>
                                            {log.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold uppercase tracking-wider text-foreground">{log.title}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{log.details}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-2">{log.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </div>
                ) : activeView === 'suppliers' ? (
                <div className="bg-card rounded-none border border-foreground/15 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Suppliers Network</h2>
                            <p className="text-xs text-muted-foreground mt-1">Manage vendor contacts and request rapid restocking</p>
                        </div>
                        {!showAddSupplier && (
                            <Button onClick={() => setShowAddSupplier(true)} className="rounded-none font-bold uppercase tracking-widest text-xs h-10 px-6 border-2 border-foreground hover:bg-muted">
                                <Plus className="w-4 h-4 mr-2" /> Add Supplier
                            </Button>
                        )}
                    </div>
                    
                    {showAddSupplier ? (
                        <div className="p-6 md:p-8 space-y-6 max-w-2xl animate-in slide-in-from-right">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Business Name</Label>
                                <Input className="h-10 rounded-none border-foreground/25" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="e.g. Kenchic Ltd" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Phone Number</Label>
                                <Input className="h-10 rounded-none border-foreground/25" value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="2547..." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Email Address</Label>
                                <Input type="email" className="h-10 rounded-none border-foreground/25" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} placeholder="supplier@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Products (Comma separated)</Label>
                                <Input className="h-10 rounded-none border-foreground/25" value={newSupplierGoods} onChange={e => setNewSupplierGoods(e.target.value)} placeholder="Chicken, Eggs, Sausages" />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-foreground/10">
                                <Button variant="outline" className="h-10 rounded-none flex-1 font-bold uppercase tracking-widest text-xs" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
                                <Button className="h-10 rounded-none flex-1 font-bold uppercase tracking-widest text-xs" onClick={handleAddSupplier}>Save Supplier</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 md:p-8 bg-muted/10">
                            {suppliers.length === 0 ? (
                                <div className="text-center py-20 bg-card border border-dashed border-foreground/20 rounded-none">
                                    <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <div className="text-sm font-bold uppercase tracking-widest text-foreground">No Suppliers Added</div>
                                    <div className="text-xs text-muted-foreground mt-1">Click Add Supplier to build your network.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {suppliers.map(supplier => (
                                        <div key={supplier.id} className="bg-card border border-foreground/15 rounded-none p-6 flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-md font-bold uppercase tracking-wide text-foreground">{supplier.name}</div>
                                                    <div className="flex items-center text-xs text-muted-foreground font-semibold mt-2 gap-4">
                                                        <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {supplier.phone}</span>
                                                        {supplier.email && <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" /> {supplier.email}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {supplier.email && (
                                                        <Button size="icon" variant="outline" className="rounded-none h-10 w-10 border-foreground/20 hover:bg-muted" onClick={() => window.open(`mailto:${supplier.email}`)}>
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="outline" className="rounded-none h-10 w-10 border-foreground/20 hover:bg-muted" onClick={() => window.open(`tel:${supplier.phone}`)}>
                                                        <Phone className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 py-3">
                                                {supplier.goods.map(good => (
                                                    <Badge key={good} variant="secondary" className="rounded-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5">{good}</Badge>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-foreground/10">
                                                <Button variant="outline" className="w-full rounded-none font-bold uppercase tracking-widest text-xs h-10 border-foreground/20 hover:bg-muted" onClick={() => setRestockSupplier(supplier)}>
                                                    <ShoppingBag className="w-4 h-4 mr-2" /> Request Restock
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-card p-6 border border-foreground/15">
                      <div>
                        <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Expenses Ledger</h2>
                        <p className="text-xs text-muted-foreground mt-1">Record and review business operating costs</p>
                      </div>
                      <Button 
                        onClick={() => setShowAddExpense(true)}
                        className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-wider flex items-center gap-2 h-10 px-6"
                      >
                        <Plus className="w-4 h-4" />
                        Log Expense
                      </Button>
                    </div>

                    {/* Expenses Table */}
                    <Card className="rounded-none border-foreground/15 shadow-none">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-foreground/15 bg-muted text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                <th className="p-4">Date</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount (KES)</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-foreground/10">
                              {isLoadingExpenses ? (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                    <span className="animate-spin inline-block w-5 h-5 border-2 border-foreground border-t-transparent rounded-full mr-2" />
                                    Loading expenses...
                                  </td>
                                </tr>
                              ) : expenses.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                                    No expenses logged yet.
                                  </td>
                                </tr>
                              ) : (
                                expenses.map((exp) => (
                                  <tr key={exp.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-mono text-xs">
                                      {new Date(exp.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-bold text-xs uppercase">
                                      <span className="bg-muted px-2 py-0.5 border border-foreground/10">
                                        {exp.category}
                                      </span>
                                    </td>
                                    <td className="p-4 text-xs">{exp.description || '—'}</td>
                                    <td className="p-4 text-right font-black text-xs">
                                      KES {parseFloat(exp.amount).toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}


                {/* Request Restock Dialog */}
                <Dialog open={!!restockSupplier} onOpenChange={(open) => !open && setRestockSupplier(null)}>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-none border-foreground bg-card">
                        <DialogHeader>
                            <DialogTitle className="font-bold uppercase tracking-wider">Restock from {restockSupplier?.name}</DialogTitle>
                            <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Select which goods to order</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Select Item</Label>
                                <div className="flex flex-wrap gap-2">
                                    {restockSupplier?.goods.map((good: string) => (
                                        <Badge 
                                            key={good} 
                                            variant={restockItem === good ? "default" : "outline"}
                                            className="cursor-pointer text-xs py-1 px-3 rounded-none uppercase tracking-widest font-bold"
                                            onClick={() => setRestockItem(good)}
                                        >
                                            {good}
                                        </Badge>
                                    ))}
                                    <Badge 
                                        variant={restockItem === 'Other' ? "default" : "outline"}
                                        className="cursor-pointer text-xs py-1 px-3 rounded-none uppercase tracking-widest font-bold"
                                        onClick={() => setRestockItem('Other')}
                                    >
                                        Other / Custom
                                    </Badge>
                                </div>
                                {restockItem === 'Other' && (
                                    <Input 
                                        placeholder="Enter custom item name" 
                                        value={customRestockItem}
                                        onChange={(e) => setCustomRestockItem(e.target.value)}
                                        className="mt-2 rounded-none h-10 border-foreground/25"
                                    />
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest">Quantity / Amount</Label>
                                <Input 
                                    placeholder="e.g. 50 loaves, 10 crates" 
                                    value={restockAmount}
                                    onChange={(e) => setRestockAmount(e.target.value)}
                                    className="rounded-none h-10 border-foreground/25"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-foreground/10 pt-4">
                             <Button 
                                variant="outline" 
                                className="w-full sm:w-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-none font-bold uppercase tracking-widest text-xs h-10 px-5"
                                onClick={() => handleRequestStock('whatsapp')}
                                disabled={(!restockItem || (restockItem === 'Other' && !customRestockItem)) || !restockAmount}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" /> Send WhatsApp
                             </Button>
                             <Button 
                                variant="outline" 
                                className="w-full sm:w-auto bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 rounded-none font-bold uppercase tracking-widest text-xs h-10 px-5"
                                onClick={() => handleRequestStock('sms')}
                                disabled={(!restockItem || (restockItem === 'Other' && !customRestockItem)) || !restockAmount}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> Send SMS
                             </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Report Generation Modal */}
                <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                  <DialogContent className="max-w-md rounded-none border-2 border-foreground bg-background p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">
                        {reportType === 'whatsapp' ? 'Generate WhatsApp Report' : 'Email Summary Report'}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">
                        Configure delivery for store performance summary
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 my-4">
                      {/* Select Period */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider">Select Period</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['today', 'week', 'month', 'all'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setReportRange(r)}
                              className={`border border-foreground py-2 text-xs font-bold uppercase transition-all rounded-none ${
                                reportRange === r
                                  ? 'bg-foreground text-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[2px] -translate-y-[2px]'
                                  : 'bg-background hover:bg-muted text-foreground'
                              }`}
                            >
                              {r === 'today' ? "Today" : r === 'week' ? "This Week" : r === 'month' ? "This Month" : "All Time"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Email input field if reportType is email */}
                      {reportType === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="report-email" className="text-xs font-bold uppercase tracking-wider">Recipient Email Address</Label>
                          <Input
                            id="report-email"
                            type="email"
                            placeholder="supervisor@example.com"
                            value={reportEmail}
                            onChange={(e) => setReportEmail(e.target.value)}
                            className="rounded-none border border-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-foreground"
                          />
                        </div>
                      )}
                    </div>

                    <DialogFooter className="gap-2 border-t border-foreground/10 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setReportModalOpen(false)}
                        className="rounded-none border-foreground hover:bg-muted font-bold text-xs uppercase tracking-wider h-10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateAndSend}
                        disabled={isGeneratingReport}
                        className="rounded-none border-foreground bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-wider flex items-center gap-2 h-10 px-6"
                      >
                        {isGeneratingReport ? (
                          <>
                            <span className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
                            Generating...
                          </>
                        ) : (
                          'Dispatch Report'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Log Expense Dialog */}
                <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                  <DialogContent className="max-w-md rounded-none border-2 border-foreground bg-background p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Log New Expense</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">
                        Record a business operating cost
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLogExpense} className="space-y-4 my-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="exp-amount" className="text-xs font-bold uppercase tracking-wider">Amount (KES)</Label>
                        <Input
                          id="exp-amount"
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 1500"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="rounded-none border border-foreground/30 focus-visible:ring-0"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exp-category" className="text-xs font-bold uppercase tracking-wider">Category</Label>
                        <select
                          id="exp-category"
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full p-2 border border-foreground/30 rounded-none bg-background text-sm focus-visible:ring-0 outline-none"
                        >
                          <option value="Rent">Rent</option>
                          <option value="Utilities">Utilities (Electricity/Water)</option>
                          <option value="Salaries">Salaries</option>
                          <option value="Transport">Transport</option>
                          <option value="Supplies">Supplies & Restock</option>
                          <option value="General">General/Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exp-desc" className="text-xs font-bold uppercase tracking-wider">Description</Label>
                        <Input
                          id="exp-desc"
                          placeholder="e.g. Electricity bill for June"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          className="rounded-none border border-foreground/30 focus-visible:ring-0"
                        />
                      </div>

                      <DialogFooter className="pt-4 border-t border-foreground/10">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddExpense(false)}
                          className="rounded-none border-foreground font-bold text-xs uppercase tracking-wider h-10"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="rounded-none border-foreground bg-foreground text-background hover:bg-foreground/90 font-bold text-xs uppercase tracking-wider h-10"
                        >
                          Save Expense
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* WhatsApp Preview Modal */}
                <Dialog open={showWhatsappPreviewModal} onOpenChange={setShowWhatsappPreviewModal}>
                  <DialogContent className="max-w-xl rounded-none border-2 border-foreground bg-background p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        WhatsApp Summary Ready
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs uppercase font-semibold tracking-wide">
                        Preview the report before opening WhatsApp
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2">
                      <div className="bg-muted p-4 font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto border border-foreground/20">
                        {whatsappPreviewText}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(whatsappPreviewText);
                            toast.success('Report text copied to clipboard!');
                          }}
                          className="rounded-none border-foreground hover:bg-muted font-bold text-xs uppercase tracking-wider h-10 flex-1"
                        >
                          Copy Text
                        </Button>
                        <Button
                          onClick={() => {
                            const encodedText = encodeURIComponent(whatsappPreviewText);
                            window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
                          }}
                          className="rounded-none border-foreground bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider h-10 flex-1 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Send to WhatsApp
                        </Button>
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowWhatsappPreviewModal(false)}
                        className="rounded-none border-foreground hover:bg-muted font-bold text-xs uppercase tracking-wider h-10 w-full"
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

            </main>

            {/* Admin Footer */}
            <footer className="mt-auto py-8 border-t border-foreground/10">
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Developed by P3L Technology Group
                </div>
            </footer>
        </div>
    );
};
