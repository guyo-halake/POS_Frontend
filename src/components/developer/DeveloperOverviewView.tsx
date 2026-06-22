import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Database, Cloud, BarChart3, Send, ShieldCheck, Activity } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DeveloperOverviewView: React.FC = () => {
    const [sysStatus, setSysStatus] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isDispatching, setIsDispatching] = useState(false);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);

    const fetchDevData = async () => {
        try {
            const statRes = await apiFetch('/api/developer/status');
            if (statRes.ok) setSysStatus(await statRes.json());
            
            const activeRes = await apiFetch('/api/developer/active-users');
            if (activeRes.ok) setActiveSessions(await activeRes.json());

            const salesRes = await apiFetch('/api/sales/stats?range=today');
            if (salesRes.ok) setStats(await salesRes.json());
        } catch (e) {
            console.error("Failed to load dev data", e);
        }
    };

    useEffect(() => {
        fetchDevData();
        const interval = setInterval(fetchDevData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDispatchReport = async () => {
        setIsDispatching(true);
        try {
            const res = await apiFetch('/api/developer/dispatch', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Daily Sales Report sent via email!");
            } else {
                toast.error(data.error || "Failed to send report");
            }
        } catch (e) {
            toast.error("Network error during dispatch");
        } finally {
            setIsDispatching(false);
        }
    };

    const paymentChartData = stats?.payments?.map((p: any) => ({
        name: p.paymentMethod,
        total: p.total
    })) || [];

    return (
        <div className="space-y-6">
            <div className="mb-8 border-b border-black pb-4">
                <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Platform Overview</h2>
                <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Real-time telemetry and platform economics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black text-white p-6 rounded-none">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Gross Volume</p>
                    <h3 className="text-3xl font-bold tracking-tighter">KES {stats?.totalRevenue?.toLocaleString() || 0}</h3>
                </div>
                
                <div className="bg-white border-2 border-black p-6 rounded-none">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-2">True Profit</p>
                    <h3 className="text-3xl font-bold tracking-tighter">KES {stats?.totalProfit?.toLocaleString() || 0}</h3>
                </div>
                
                <div className="bg-white border border-slate-100 p-6 rounded-none">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-2">Transactions</p>
                    <h3 className="text-3xl font-bold tracking-tighter">{stats?.totalCount || 0}</h3>
                </div>
                
                <div className="bg-white border border-slate-100 p-6 rounded-none flex flex-col justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-2">Active Users</p>
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold tracking-tighter">{activeSessions.length}</h3>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-black opacity-20"></span>
                            <span className="relative inline-flex h-3 w-3 bg-black"></span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Analytics */}
                <div className="bg-white border border-slate-100 rounded-none lg:col-span-2 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                            <BarChart3 className="w-4 h-4" /> Payment Analytics
                        </h3>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] uppercase tracking-widest font-bold rounded-none border-black text-slate-900 hover:bg-black hover:text-white"
                            onClick={handleDispatchReport}
                            disabled={isDispatching}
                        >
                            <Send className="w-3 h-3 mr-2" /> 
                            {isDispatching ? 'SENDING...' : 'EMAIL REPORT'}
                        </Button>
                    </div>
                    <div className="p-6 flex-1 min-h-[300px]">
                        <div className="h-full w-full">
                            {paymentChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} />
                                        <Tooltip 
                                            cursor={{ fill: '#f5f5f5' }}
                                            contentStyle={{ borderRadius: '0px', border: '1px solid #000', boxShadow: 'none', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="total" fill="#000" radius={[0, 0, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-900/40 border border-dashed border-black/20 bg-slate-50">
                                    NO SALES DATA
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Infrastructure Snapshot */}
                <div className="bg-white border border-slate-100 rounded-none flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                            <Server className="w-4 h-4" /> Systems Check
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between pb-6 border-b border-black/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 border border-slate-100 text-slate-900"><Database className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Local DB</p>
                                    <p className="text-[10px] font-bold text-slate-900/50 uppercase tracking-widest">SQLite</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 bg-black text-white uppercase tracking-widest">
                                {sysStatus?.primaryStatus || 'CHECKING'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pb-6 border-b border-black/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 border border-slate-100 text-slate-900"><Cloud className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cloud Sync</p>
                                    <p className="text-[10px] font-bold text-slate-900/50 uppercase tracking-widest">Supabase</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-widest ${sysStatus?.syncStatus === 'Connected' ? 'bg-black text-white' : 'bg-black/10 text-slate-900'}`}>
                                {sysStatus?.syncStatus || 'CHECKING'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 border border-slate-100 text-slate-900"><ShieldCheck className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Paystack</p>
                                    <p className="text-[10px] font-bold text-slate-900/50 uppercase tracking-widest">Gateway</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 bg-black text-white uppercase tracking-widest">
                                {sysStatus?.paystackStatus || 'ONLINE'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
