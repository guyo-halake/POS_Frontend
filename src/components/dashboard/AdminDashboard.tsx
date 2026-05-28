import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    FileText
} from 'lucide-react';
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
    const { currentUser, products, isShiftActive, currentShift, sales, notifications, suppliers, addSupplier } = useStore();
    const [timeRange, setTimeRange] = useState('this week');
    const [activeView, setActiveView] = useState<'dashboard' | 'suppliers'>('dashboard');
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    
    // Supplier Form State
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierPhone, setNewSupplierPhone] = useState('');
    const [newSupplierGoods, setNewSupplierGoods] = useState('');

    const [restockSupplier, setRestockSupplier] = useState<any | null>(null);
    const [restockItem, setRestockItem] = useState('');
    const [restockAmount, setRestockAmount] = useState('');
    const [customRestockItem, setCustomRestockItem] = useState('');


    // --- REAL DATA CALCULATIONS ---

    // 1. Low Stock
    const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 5));

    // 2. Sales Data (Today vs Yesterday)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySales = sales.filter(s => new Date(s.timestamp) >= startOfToday && new Date(s.timestamp) <= endOfToday);
    const yesterdaySales = sales.filter(s => isYesterday(new Date(s.timestamp)));
    
    const revenueToday = todaySales.reduce((acc, s) => acc + s.total, 0);
    const revenueYesterday = yesterdaySales.reduce((acc, s) => acc + s.total, 0);
    
    // Profit Calculation (mocking 20% margin for now)
    const profitToday = revenueToday * 0.2;
    const profitYesterday = revenueYesterday * 0.2;
    
    let revenueTrend = 0;
    if (revenueYesterday > 0) {
        revenueTrend = ((revenueToday - revenueYesterday) / revenueYesterday) * 100;
    }
    const trendLabel = revenueYesterday === 0 ? "+100%" : `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`;

    // Payment Methods Breakdown
    const cashTotal = todaySales.filter(s => s.paymentMethod === 'cash').reduce((acc,s) => acc + s.total, 0);
    const mpesaTotal = todaySales.filter(s => s.paymentMethod === 'mpesa').reduce((acc,s) => acc + s.total, 0);
    
    // 3. Graph Data Generation based on TimeRange (STRICTLY REAL DATA)
    let graphData: any[] = [];
    if (timeRange === 'this week') {
        const days = eachDayOfInterval({ start: startOfWeek(new Date(), {weekStartsOn: 1}), end: endOfWeek(new Date(), {weekStartsOn: 1}) });
        graphData = days.map(day => {
            const daySales = sales.filter(s => isSameDay(new Date(s.timestamp), day));
            const rev = daySales.reduce((acc, s) => acc + s.total, 0);
            return { name: format(day, 'EEE'), revenue: rev, profit: rev * 0.2 };
        });
    } else if (timeRange === 'this month') {
        const weeks = eachWeekOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
        graphData = weeks.map((week, idx) => {
            const weekSales = sales.filter(s => isSameWeek(new Date(s.timestamp), week));
            const rev = weekSales.reduce((acc, s) => acc + s.total, 0);
            return { name: `Week ${idx + 1}`, revenue: rev, profit: rev * 0.2 };
        });
    } else if (timeRange === 'this year') {
        const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date()) });
        graphData = months.map(month => {
            const monthSales = sales.filter(s => isSameMonth(new Date(s.timestamp), month));
            const rev = monthSales.reduce((acc, s) => acc + s.total, 0);
            return { name: format(month, 'MMM'), revenue: rev, profit: rev * 0.2 };
        });
    }

    // 4. Recent Activity
    const recentSalesLog = todaySales.slice().reverse().slice(0, 5).map(s => ({
        id: s.id,
        time: format(new Date(s.timestamp), 'h:mm a'),
        title: `Sale by ${s.cashierName}`,
        details: `KES ${s.total.toLocaleString()} via ${s.paymentMethod}`,
        type: 'info'
    }));

    const recentActivity = [
        ...(isShiftActive && currentShift ? [{
            id: 'shift-start',
            time: format(new Date(currentShift.startTime), 'h:mm a'),
            title: 'Shift Started',
            details: `${currentShift.cashierName} opened the register`,
            type: 'success'
        }] : []),
        ...recentSalesLog
    ];

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

    const handleAddSupplier = () => {
        if (!newSupplierName || !newSupplierPhone) return;
        
        const goodsArray = newSupplierGoods.split(',').map(g => g.trim()).filter(g => g.length > 0);
        
        addSupplier({
            name: newSupplierName,
            phone: newSupplierPhone,
            goods: goodsArray
        });
        
        setNewSupplierName('');
        setNewSupplierPhone('');
        setNewSupplierGoods('');
        setShowAddSupplier(false);
    };


    return (
        <div className="min-h-screen bg-background pb-20 flex flex-col">
            {/* Minimalist Dashboard Header */}
            <header className="bg-background border-b sticky top-0 z-30 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-foreground flex items-center justify-center rounded-lg text-background font-medium text-lg">
                        {currentUser?.name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">Welcome, {currentUser?.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{format(new Date(), 'EEEE, d MMMM')}</span>
                            <span className="w-1 h-1 bg-border rounded-full"></span>
                            <span className="flex items-center gap-1.5 text-foreground">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                     <Button variant={activeView === 'dashboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('dashboard')} className="font-medium px-4">
                        <LayoutDashboard className="w-4 h-4 mr-2 opacity-50"/> Dashboard
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => onNavigate('pos')} className="font-medium px-4">
                        <ShoppingCart className="w-4 h-4 mr-2 opacity-50"/> POS
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => onNavigate('inventory')} className="font-medium px-4">
                        <Package className="w-4 h-4 mr-2 opacity-50"/> Inventory
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')} className="font-medium px-4">
                        <BarChart3 className="w-4 h-4 mr-2 opacity-50"/> Reports
                     </Button>
                     <Button variant={activeView === 'suppliers' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('suppliers')} className="font-medium px-4">
                        <Truck className="w-4 h-4 mr-2 opacity-50"/> Suppliers
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => onNavigate('settings')} className="font-medium px-4">
                        <Settings className="w-4 h-4 mr-2 opacity-50"/> Settings
                     </Button>
                </div>
            </header>

            <main className="p-8 max-w-[1400px] mx-auto w-full space-y-8 flex-1 animate-fade-in">
                
                {activeView === 'dashboard' ? (
                <div className="space-y-8">
                {/* KPI Cards - Minimalist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Today's Sales Card */}
                    <Card className="shadow-sm rounded-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                                Today's Sales 
                                <span className="bg-muted px-2 py-0.5 rounded text-xs text-foreground">12:00 AM - 11:59 PM</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-semibold tracking-tight mb-6">KES {revenueToday.toLocaleString()}</div>
                            <div className="flex gap-6">
                                <div className="flex-1 border-t pt-3">
                                    <div className="text-xs text-muted-foreground mb-1">M-Pesa</div>
                                    <div className="font-medium">KES {mpesaTotal.toLocaleString()}</div>
                                </div>
                                <div className="flex-1 border-t pt-3">
                                    <div className="text-xs text-muted-foreground mb-1">Cash</div>
                                    <div className="font-medium">KES {cashTotal.toLocaleString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Alert */}
                    <Card className={`shadow-sm rounded-xl ${lowStockItems.length > 0 ? 'border-destructive/30' : ''}`}>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Attention Needed</CardTitle>
                            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-semibold tracking-tight mb-2">{lowStockItems.length}</div>
                            <div className="text-sm text-muted-foreground">Items running low</div>
                            {lowStockItems.length > 0 && (
                                <Button variant="link" onClick={() => onNavigate('inventory')} className="p-0 h-auto text-sm text-destructive mt-4 font-medium hover:no-underline">Review Items &rarr;</Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Current Shift */}
                    <Card className="shadow-sm rounded-xl">
                         <CardHeader className="pb-4 flex flex-row justify-between items-center">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Shift</CardTitle>
                            <div className={`h-2 w-2 rounded-full ${isShiftActive ? 'bg-emerald-500' : 'bg-destructive'}`}></div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col justify-center h-full pt-1">
                                {isShiftActive && currentShift ? (
                                    <>
                                        <div className="text-3xl font-semibold capitalize tracking-tight mb-2">{currentShift.cashierName}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Started at {format(new Date(currentShift.startTime), 'h:mm a')}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-3xl font-semibold tracking-tight text-muted-foreground mb-2">Shop Closed</div>
                                        <div className="text-sm text-muted-foreground">
                                            No active cashier
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Graph */}
                    <Card className="col-span-1 lg:col-span-2 shadow-sm rounded-xl">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
                            <div>
                                <CardTitle className="font-semibold text-lg">Income & Revenue</CardTitle>
                                <CardDescription className="text-sm">Realtime performance from live database</CardDescription>
                            </div>
                            <div className="flex bg-muted p-1 rounded-lg">
                                {['This Week', 'This Month', 'This Year'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range.toLowerCase())}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
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
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => value >= 1000 ? `K${value/1000}k` : value} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--foreground))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                                    <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-6 pt-6 border-t">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-foreground"></span>
                                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-sm text-muted-foreground">Estimated Profit</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                     <Card className="col-span-1 shadow-sm rounded-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground py-8">No recent activity</div>
                                )}
                                {recentActivity.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-4 py-3 border-b last:border-0 border-border">
                                        <div className={`mt-0.5 p-2 rounded-lg ${log.type === 'alert' ? 'bg-destructive/10 text-destructive' : log.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-foreground'}`}>
                                            {log.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-foreground">{log.title}</div>
                                            <div className="text-sm text-muted-foreground mt-0.5">{log.details}</div>
                                            <div className="text-xs text-muted-foreground mt-1.5">{log.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </div>
                ) : (
                <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in">
                    <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Suppliers Network</h2>
                            <p className="text-sm text-muted-foreground mt-1">Manage your vendors and request restocks</p>
                        </div>
                        {!showAddSupplier && (
                            <Button onClick={() => setShowAddSupplier(true)} className="font-medium px-6">
                                <Plus className="w-4 h-4 mr-2" /> Add Supplier
                            </Button>
                        )}
                    </div>
                    
                    {showAddSupplier ? (
                        <div className="p-8 space-y-6 max-w-2xl animate-in slide-in-from-right">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Business Name</Label>
                                <Input className="h-11" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="e.g. Kenchic Ltd" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Phone Number</Label>
                                <Input className="h-11" value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="2547..." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Products (Comma separated)</Label>
                                <Input className="h-11" value={newSupplierGoods} onChange={e => setNewSupplierGoods(e.target.value)} placeholder="Chicken, Eggs, Sausages" />
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                <Button variant="outline" className="h-11 flex-1 font-medium" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
                                <Button className="h-11 flex-1 font-medium" onClick={handleAddSupplier}>Save Supplier</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-muted/20">
                            {suppliers.length === 0 ? (
                                <div className="text-center py-20 bg-background rounded-xl border border-dashed border-border">
                                    <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <div className="text-lg font-medium text-foreground">No Suppliers Added</div>
                                    <div className="text-sm text-muted-foreground mt-1">Click add supplier to build your network</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {suppliers.map(supplier => (
                                        <div key={supplier.id} className="bg-background border border-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-lg font-semibold text-foreground">{supplier.name}</div>
                                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                        <Phone className="w-3.5 h-3.5 mr-2" /> {supplier.phone}
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="secondary" className="rounded-full" onClick={() => window.open(`tel:${supplier.phone}`)}>
                                                    <Phone className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 py-3">
                                                {supplier.goods.map(good => (
                                                    <Badge key={good} variant="secondary" className="font-normal text-xs">{good}</Badge>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-border">
                                                <Button variant="outline" className="w-full font-medium" onClick={() => setRestockSupplier(supplier)}>
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
                )}



                {/* Request Restock Dialog */}
                <Dialog open={!!restockSupplier} onOpenChange={(open) => !open && setRestockSupplier(null)}>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Restock from {restockSupplier?.name}</DialogTitle>
                            <DialogDescription>Select which goods to order</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Item</Label>
                                <div className="flex flex-wrap gap-2">
                                    {restockSupplier?.goods.map((good: string) => (
                                        <Badge 
                                            key={good} 
                                            variant={restockItem === good ? "default" : "outline"}
                                            className="cursor-pointer text-sm py-1 px-3"
                                            onClick={() => setRestockItem(good)}
                                        >
                                            {good}
                                        </Badge>
                                    ))}
                                    <Badge 
                                        variant={restockItem === 'Other' ? "default" : "outline"}
                                        className="cursor-pointer text-sm py-1 px-3"
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
                                        className="mt-2"
                                    />
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Quantity / Amount</Label>
                                <Input 
                                    placeholder="e.g. 50 loaves, 10 crates" 
                                    value={restockAmount}
                                    onChange={(e) => setRestockAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                             <Button 
                                variant="outline" 
                                className="w-full sm:w-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => handleRequestStock('whatsapp')}
                                disabled={(!restockItem || (restockItem === 'Other' && !customRestockItem)) || !restockAmount}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" /> Send WhatsApp
                             </Button>
                             <Button 
                                variant="outline" 
                                className="w-full sm:w-auto bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                onClick={() => handleRequestStock('sms')}
                                disabled={(!restockItem || (restockItem === 'Other' && !customRestockItem)) || !restockAmount}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> Send SMS
                             </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>

            {/* Admin Footer */}
            <footer className="mt-auto py-8">
                <div className="max-w-7xl mx-auto px-8 text-center text-sm text-muted-foreground">
                    Developed by P3L Technology Group
                </div>
            </footer>
        </div>
    );
};
