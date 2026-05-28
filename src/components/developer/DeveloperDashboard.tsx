import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, RefreshCw, LogOut, Trash, Edit, ChevronDown, ChevronUp, Database, Send, Users, BarChart3, Cloud, Server } from "lucide-react";
import { AddClientModal } from './AddClientModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SupermarketsView } from './SupermarketsView';

export const DeveloperDashboard: React.FC = () => {
    const { currentUser, users, logout, deleteUser, fetchUsers, setActiveBusiness, activeBusinessId, fetchProducts } = useStore();
    
    // UI State
    const [showAddClient, setShowAddClient] = useState(false);
    const [debugBusinessId, setDebugBusinessId] = useState('');
    const [editingPinUser, setEditingPinUser] = useState<string | null>(null);
    const [newPin, setNewPin] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'supermarkets'>('overview');
    
    // Server State
    const [sysStatus, setSysStatus] = useState<any>(null);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [isDispatching, setIsDispatching] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const fetchDevData = async () => {
        try {
            const statRes = await apiFetch('/api/developer/status');
            if (statRes.ok) setSysStatus(await statRes.json());
            
            const activeRes = await apiFetch('/api/developer/active-users');
            if (activeRes.ok) setActiveSessions(await activeRes.json());

            const salesRes = await apiFetch('/api/sales/stats?range=today');
            if (salesRes.ok) setStats(await salesRes.json());
            
            fetchUsers();
        } catch (e) {
            console.error("Failed to load dev data", e);
        }
    };

    useEffect(() => {
        fetchDevData();
        const interval = setInterval(fetchDevData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSwitchContext = async () => {
        if (!debugBusinessId) {
             setActiveBusiness('11111111-1111-1111-1111-111111111111');
             toast.info("Switched to Default Business");
        } else {
            setActiveBusiness(debugBusinessId);
            toast.success(`Switched context to Business ID: ${debugBusinessId}`);
        }
        await fetchProducts();
    };

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

    const handleDelete = async (userId: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId);
                toast.success("User deleted successfully");
            } catch (e) {
                toast.error("Failed to delete user");
            }
        }
    };

    const handleUpdatePin = async (userId: string) => {
        if (newPin.length !== 4) {
            toast.error("PIN must be 4 digits");
            return;
        }
        try {
            const res = await apiFetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: newPin })
            });
            if (res.ok) {
                toast.success("PIN updated successfully");
                setEditingPinUser(null);
                setNewPin('');
                fetchUsers();
            } else {
                toast.error("Failed to update PIN");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.business?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paymentChartData = stats?.payments?.map((p: any) => ({
        name: p.paymentMethod,
        total: p.total
    })) || [];

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 p-4 md:p-8 font-sans pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Developer Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage infrastructure, view analytics, and control access.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500 font-medium">Business ID:</span>
                        <input 
                            className="w-24 h-6 text-sm outline-none bg-transparent" 
                            placeholder="UUID" 
                            value={debugBusinessId}
                            onChange={(e) => setDebugBusinessId(e.target.value)}
                        />
                        <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={handleSwitchContext}>
                            Apply
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="h-9">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>
            </header>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-slate-200 mb-8">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('supermarkets')} 
                    className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'supermarkets' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Supermarkets
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Database & Infrastructure */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                            <Server className="w-4 h-4" /> Infrastructure
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-slate-500" /> Local Database
                                </span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                    {sysStatus?.primaryStatus || 'Checking...'}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 ml-6">SQLite (Primary Edge Store)</p>
                        </div>
                        
                        <div className="h-[1px] bg-slate-100" />

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                    <Cloud className="w-4 h-4 text-slate-500" /> Cloud Sync
                                </span>
                                <Badge variant="secondary" className={sysStatus?.syncStatus === 'Connected' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                                    {sysStatus?.syncStatus || 'Checking...'}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 ml-6">Supabase PostgreSQL</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Analytics */}
                <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
                            <BarChart3 className="w-4 h-4" /> Today's Sales Analytics
                        </CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={handleDispatchReport}
                            disabled={isDispatching}
                        >
                            <Send className="w-3 h-3 mr-2" /> 
                            {isDispatching ? 'Sending...' : 'Email Report'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Stats */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                                    <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
                                        KES {stats?.totalRevenue?.toLocaleString() || 0}
                                    </h3>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Transactions</p>
                                    <p className="text-lg font-medium text-slate-700">{stats?.totalCount || 0}</p>
                                </div>
                            </div>
                            
                            {/* Chart */}
                            <div className="md:col-span-2 h-[150px]">
                                {paymentChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={paymentChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed rounded-lg">
                                        No sales data yet today
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base font-semibold text-slate-900">Users</CardTitle>
                            <div className="flex items-center gap-3">
                                <Input 
                                    placeholder="Search users..." 
                                    className="w-48 h-8 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button size="sm" onClick={() => setShowAddClient(true)} className="h-8">
                                    <UserPlus className="h-4 w-4 mr-2" /> Add User
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>PIN</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                    <React.Fragment key={user.id}>
                                        <TableRow className="hover:bg-slate-50 border-slate-100 group">
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                                                    {expandedUser === user.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    {user.business && <span className="text-xs text-slate-500 font-normal">{user.business.name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 capitalize">{user.role}</span>
                                            </TableCell>
                                            <TableCell>
                                                {user.active ? (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-normal">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50 font-normal">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm text-slate-500">{user.pin}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900" onClick={() => setEditingPinUser(user.id)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" onClick={() => handleDelete(user.id)}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {expandedUser === user.id && (
                                            <TableRow className="bg-slate-50/50">
                                                <TableCell colSpan={6} className="p-4 border-b border-slate-100">
                                                    <div className="text-sm text-slate-600 space-y-2 max-w-lg">
                                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                                            <span className="font-medium text-slate-900">Email</span>
                                                            <span>{user.email || '—'}</span>
                                                        </div>
                                                        {user.business && (
                                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                                <span className="font-medium text-slate-900">Business ID</span>
                                                                <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{user.business.id}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card className="bg-white border-slate-200 shadow-sm h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-medium flex justify-between items-center text-slate-900">
                            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Active Sessions</span>
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{activeSessions.length} Online</span>
                        </CardTitle>
                        <CardDescription>Users active in the last 15 minutes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {activeSessions.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-lg">No active users</p>
                            ) : (
                                activeSessions.map(session => (
                                    <div key={session.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{session.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{session.role}</p>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(session.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </>
            ) : (
                <SupermarketsView />
            )}

            {showAddClient && (
                <AddClientModal 
                    open={showAddClient} 
                    onClose={() => setShowAddClient(false)} 
                />
            )}

            <Dialog open={!!editingPinUser} onOpenChange={(o) => !o && setEditingPinUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update PIN</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            placeholder="0000" 
                            maxLength={4} 
                            value={newPin} 
                            onChange={(e) => setNewPin(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPinUser(null)}>Cancel</Button>
                        <Button onClick={() => editingPinUser && handleUpdatePin(editingPinUser)}>Save PIN</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
