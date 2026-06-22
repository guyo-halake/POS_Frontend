import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, Trash, ChevronDown, ChevronUp, Store } from 'lucide-react';
import { AddClientModal } from './AddClientModal';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

export const DeveloperUsersView: React.FC = () => {
    const { users, fetchUsers, deleteUser } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddClient, setShowAddClient] = useState(false);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '', pin: '', active: true });

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.business?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (userId: string) => {
        if (confirm('Are you sure you want to disable this user?')) {
            try {
                await deleteUser(userId);
                toast.success("User disabled successfully");
            } catch (e) {
                toast.error("Failed to disable user");
            }
        }
    };

    const handleEditSave = async () => {
        if (!editingUser) return;
        try {
            const res = await apiFetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                toast.success("User updated successfully");
                setEditingUser(null);
                fetchUsers();
            } else {
                toast.error("Failed to update user");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email || '',
            role: user.role,
            pin: user.pin,
            active: user.active === 1 || user.active === true
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">User Access Management</h2>
                    <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Manage platform users, roles, and security credentials</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Input 
                        placeholder="Search users..." 
                        className="w-full md:w-64 h-12 bg-white rounded-md border-slate-300 focus-visible:ring-indigo-500 text-xs font-bold uppercase tracking-widest"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={() => setShowAddClient(true)} className="h-12 bg-black hover:bg-black/80 text-white rounded-none text-xs font-bold uppercase tracking-widest px-6 shrink-0">
                        <UserPlus className="h-4 w-4 mr-2" /> Add User
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>PIN Password</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-slate-900/40 text-[10px] font-bold uppercase tracking-widest border-dashed border-b-0">
                                        No users found matching your search
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                <React.Fragment key={user.id}>
                                    <TableRow className="hover:bg-slate-50 border-slate-100 group transition-colors">
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-900/40 rounded-none hover:bg-transparent" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                                                {expandedUser === user.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-50 flex items-center justify-center text-[10px] font-bold border border-slate-100 shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    {user.business && <span className="text-[10px] text-slate-900/50 tracking-widest mt-1 flex items-center gap-1"><Store className="w-3 h-3" /> {user.business.name}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-100 text-slate-900 px-2 py-1">{user.role}</span>
                                        </TableCell>
                                        <TableCell>
                                            {user.active ? (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/40">
                                                    DISABLED
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold tracking-[0.2em] text-slate-900 bg-slate-50 px-2 py-1">{user.pin}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-900/40 hover:text-slate-900 rounded-none hover:bg-slate-50" onClick={() => openEditModal(user)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-900/40 hover:text-slate-900 rounded-none hover:bg-slate-50" onClick={() => handleDelete(user.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {expandedUser === user.id && (
                                        <TableRow className="bg-slate-50">
                                            <TableCell colSpan={6} className="p-0 border-b border-slate-200/10">
                                                <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-900/60 space-y-4 pl-12 border-l-2 border-black ml-4 my-4">
                                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                                        <span className="text-slate-900">Email Address</span>
                                                        <span>{user.email || '—'}</span>
                                                    </div>
                                                    {user.business && (
                                                        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                                            <span className="text-slate-900">Business ID</span>
                                                            <span className="font-mono bg-white px-2 py-1 border border-black/20 text-slate-900">{user.business.id}</span>
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
                </div>
            </div>

            <AddClientModal 
                open={showAddClient} 
                onClose={() => setShowAddClient(false)} 
            />

            <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
                <DialogContent className="rounded-none border-2 border-black p-0">
                    <DialogHeader className="p-6 border-b border-slate-200">
                        <DialogTitle className="text-xl font-bold tracking-tighter uppercase text-slate-900">Edit User Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 p-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Full Name</label>
                            <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Email Address</label>
                            <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} type="email" className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Role</label>
                                <select 
                                    className="flex h-10 w-full rounded-none border border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest focus:ring-black outline-none"
                                    value={editForm.role}
                                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                                >
                                    <option value="cashier">CASHIER</option>
                                    <option value="manager">MANAGER</option>
                                    <option value="admin">ADMIN</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Login PIN</label>
                                <Input 
                                    className="font-mono tracking-widest rounded-md border-slate-300 focus-visible:ring-indigo-500"
                                    value={editForm.pin} 
                                    maxLength={4}
                                    onChange={e => setEditForm({...editForm, pin: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <input 
                                type="checkbox" 
                                id="active-status" 
                                checked={editForm.active} 
                                onChange={e => setEditForm({...editForm, active: e.target.checked})}
                                className="w-4 h-4 rounded-none border-black text-slate-900 focus:ring-black"
                            />
                            <label htmlFor="active-status" className="text-xs font-bold uppercase tracking-widest text-slate-900">Account is Active</label>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t border-black bg-slate-50">
                        <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-none border-black text-slate-900 hover:bg-slate-50 text-xs font-bold uppercase tracking-widest">CANCEL</Button>
                        <Button onClick={handleEditSave} className="rounded-none bg-black hover:bg-black/80 text-white text-xs font-bold uppercase tracking-widest">SAVE CHANGES</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
