import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, Settings, RefreshCw, LogOut, Trash, Phone, Edit, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { AddClientModal } from './AddClientModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { API_BASE_URL } from '@/config/api';

export const DeveloperDashboard: React.FC = () => {
    const { currentUser, users, logout, deleteUser, fetchUsers, setActiveBusiness, activeBusinessId, fetchProducts } = useStore();
    const [showAddClient, setShowAddClient] = useState(false);
    const [debugBusinessId, setDebugBusinessId] = useState('');
    
    // Manage Users State
    const [editingPinUser, setEditingPinUser] = useState<string | null>(null);
    const [newPin, setNewPin] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSwitchContext = async () => {
        if (!debugBusinessId) {
             setActiveBusiness(1); // Default
             toast.info("Switched to Default Business (1)");
        } else {
            setActiveBusiness(parseInt(debugBusinessId));
            toast.success(`Switched context to Business ID: ${debugBusinessId}`);
        }
        // Reload data
        await fetchProducts();
    };

    // Computed Stats
    const totalUsers = users.length;
    const activeClients = users.filter(u => u.business).length; // Business owners/managers
    // Improve logic: Group by business ID if available, or just count distinct business references
    const uniqueBusinesses = new Set(users.map(u => u.business?.name).filter(Boolean)).size;
    const systemHealth = "100%"; // Mock

    // Filtered Users
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.business?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (userId: string) => {
        if (confirm('Are you sure you want to delete this user/client? This cannot be undone.')) {
            try {
                // Assuming deleteUser store action calls API
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
            const res = await fetch(`${API_BASE_URL}/api/users/update-pin`, { // Ensure this route exists
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPin })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("PIN updated successfully");
                setEditingPinUser(null);
                setNewPin('');
                fetchUsers(); // Refresh list
            } else {
                toast.error("Failed to update PIN");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleContact = (email: string) => {
        window.open(`mailto:${email}`);
    };

    // Mock functionality for placeholders
    const handleComingSoon = (feature: string) => {
        alert(`${feature} is coming soon!`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Developer Console</h1>
                    <p className="text-slate-500">System Administration & Client Management</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                        <span className="text-xs text-slate-400">Context:</span>
                        <Input 
                            className="w-20 h-8 border-slate-200 text-xs" 
                            placeholder="Biz ID" 
                            value={debugBusinessId}
                            onChange={(e) => setDebugBusinessId(e.target.value)}
                        />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSwitchContext}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Badge variant="outline" className="text-xs">
                             Active: {activeBusinessId || 'Global'}
                        </Badge>
                    </div>

                    <Button variant="destructive" onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="text-4xl font-bold mb-1">{totalUsers}</div>
                        <div className="text-blue-100 text-sm font-medium">Total Users</div>
                    </CardContent>
                </Card>
                <Card className="bg-white border text-foreground shadow-sm">
                    <CardContent className="p-6">
                        <div className="text-4xl font-bold mb-1 text-primary">{uniqueBusinesses}</div>
                        <div className="text-muted-foreground text-sm font-medium">Total Businesses</div>
                    </CardContent>
                </Card>
                <Card className="bg-white border text-foreground shadow-sm">
                    <CardContent className="p-6">
                        <div className="text-4xl font-bold mb-1 text-green-600">{activeClients}</div>
                        <div className="text-muted-foreground text-sm font-medium">Active Managers</div>
                    </CardContent>
                </Card>
                 <Card className="bg-white border text-foreground shadow-sm">
                    <CardContent className="p-6">
                         <div className="text-4xl font-bold mb-1 text-purple-600">Stable</div>
                        <div className="text-muted-foreground text-sm font-medium">System Health</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Bar */}
            <Card>
                <CardContent className="p-4 flex gap-4 flex-wrap">
                    <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-700" 
                        onClick={() => setShowAddClient(true)}
                    >
                        <UserPlus className="mr-2 h-5 w-5" /> Add Client
                    </Button>
                    <Button 
                        size="lg" 
                        variant="ghost"
                        className="text-amber-600 border-amber-200 border bg-amber-50"
                        onClick={() => alert("Check server logs/email for mobile app requests from clients.")}
                    >
                        <Bell className="mr-2 h-5 w-5" /> Check Alerts
                    </Button>
                </CardContent>
            </Card>

            {/* Users / Clients List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center flex-wrap gap-4">
                        <span>All App Users & Clients</span>
                        
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Search by name, business, role..." 
                                className="w-64 max-w-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button variant="ghost" size="sm" onClick={() => fetchUsers()}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>User Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>PIN</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No users found matches "{searchQuery}"
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                <React.Fragment key={user.id}>
                                    <TableRow className={expandedUser === user.id ? "bg-slate-50 border-b-0" : ""}>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                                                {expandedUser === user.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{user.avatar || '👤'}</span>
                                                {user.name}
                                                {user.business && <Badge variant="outline" className="text-xs">{user.business.name}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.active ? 'outline' : 'destructive'} className={user.active ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">
                                            {user.pin}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                 <Button variant="outline" size="sm" onClick={() => setEditingPinUser(user.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Expanded Detail View */}
                                    {expandedUser === user.id && (
                                        <TableRow className="bg-slate-50">
                                            <TableCell colSpan={6} className="p-4 pt-0">
                                                <div className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg bg-white shadow-sm">
                                                    <div className="space-y-2">
                                                        <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Contact Info</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">📧</div>
                                                            <span>{user.email || 'No email'}</span>
                                                            {user.email && <Button size="sm" variant="link" onClick={() => user.email && handleContact(user.email)}>Email</Button>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">📱</div>
                                                            <span>{user.business?.phone || 'No phone'}</span>
                                                        </div>
                                                    </div>

                                                    {user.business && (
                                                        <div className="space-y-2">
                                                            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Business Details</h3>
                                                            <p><strong>Name:</strong> {user.business.name}</p>
                                                            <p><strong>Payment Config:</strong> {user.business.paymentConfig ? 'Configured' : 'Default'}</p>
                                                            {user.business.logo && (
                                                                <div className="mt-2">
                                                                     <img src={user.business.logo} alt="Logo" className="h-12 object-contain border rounded p-1"/>
                                                                </div>
                                                            )}
                                                             {/* User Logs Link could go here */}
                                                            <Button variant="link" size="sm" className="px-0 text-blue-600">View Client Audit Logs</Button>
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

            {showAddClient && (
                <AddClientModal 
                    open={showAddClient} 
                    onClose={() => setShowAddClient(false)} 
                />
            )}

            {/* Edit PIN Modal */}
            <Dialog open={!!editingPinUser} onOpenChange={(o) => !o && setEditingPinUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update User PIN</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            placeholder="Enter New 4-Digit PIN" 
                            maxLength={4} 
                            value={newPin} 
                            onChange={(e) => setNewPin(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPinUser(null)}>Cancel</Button>
                        <Button onClick={() => editingPinUser && handleUpdatePin(editingPinUser)}>Update PIN</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
