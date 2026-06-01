import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { User, UserRole } from '@/data/users';
import { cn } from '@/lib/utils';
import { 
  Moon,
  Sun,
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  Shield,
  Code,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch as Toggle } from '@/components/ui/switch';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { 
    currentUser, 
    users, 
    isDarkMode, 
    toggleDarkMode, 
    isOnline,
    pendingSyncs,
    syncPendingSales,
    addUser,
    updateUser,
    deleteUser,
    logout,
    products,
    sales,
    activeBusinessId
  } = useStore();

  const { inactivityTimeoutMinutes, allowScreensaverOnMobile, setInactivityTimeoutMinutes, setAllowScreensaverOnMobile } = useStore();

  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    pin: '',
    role: 'cashier',
    avatar: '👤',
    active: true,
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isDeveloper = currentUser?.role === 'developer';

  const roleColors: Record<UserRole, string> = {
    owner: 'bg-primary text-primary-foreground',
    admin: 'bg-info text-info-foreground',
    cashier: 'bg-secondary text-secondary-foreground',
    developer: 'bg-accent text-accent-foreground',
  };

  const handleAddUser = async () => {
    if (newUser.name && newUser.pin && newUser.role) {
      const result = await addUser({
        ...newUser,
        business_id: activeBusinessId
      } as Omit<User, 'id'>);
      
      if (result && result.success) {
          toast.success(`${newUser.role === 'admin' ? 'Admin' : 'Cashier'} added successfully!`);
          setShowAddUser(false);
          setNewUser({
            name: '',
            pin: '',
            role: 'cashier',
            avatar: '👤',
            active: true,
          });
      } else {
          toast.error(result?.error || 'Failed to add user');
      }
    } else {
        toast.error('Please fill all required fields');
    }
  };

  const handleUpdateUser = () => {
    if (editUser) {
      updateUser(editUser.id, editUser);
      setEditUser(null);
    }
  };

  const tenantUsers = isDeveloper 
    ? users 
    : users.filter(u => u.business_id === activeBusinessId || u.business?.id === activeBusinessId);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users" disabled={!isAdmin && !isDeveloper}>Users</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          {isDeveloper && <TabsTrigger value="developer">Developer</TabsTrigger>}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                    {currentUser?.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{currentUser?.name}</p>
                    <Badge className={roleColors[currentUser?.role || 'cashier']}>
                      {currentUser?.role}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Screensaver & Inactivity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Inactivity Timeout (minutes)</Label>
                    <p className="text-sm text-muted-foreground">How long before the screensaver appears when shift is active.</p>
                  </div>
                  <Input type="number" min={1} value={String(inactivityTimeoutMinutes ?? 5)} onChange={(e) => setInactivityTimeoutMinutes(Number(e.target.value || 1))} style={{ width: 90 }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow on Mobile</Label>
                    <p className="text-sm text-muted-foreground">When off, screensaver will not appear on small screens.</p>
                  </div>
                  <Toggle checked={allowScreensaverOnMobile} onCheckedChange={(v) => setAllowScreensaverOnMobile(Boolean(v))} />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users">
          <Card>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Users
              </h2>
              <Button onClick={() => setShowAddUser(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{user.avatar}</span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">****</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {user.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Sync Settings */}
        <TabsContent value="sync">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
              <div className={cn(
                "flex items-center gap-4 p-6 rounded-xl",
                isOnline ? "bg-success/10" : "bg-warning/10"
              )}>
                {isOnline ? (
                  <Wifi className="w-12 h-12 text-success" />
                ) : (
                  <WifiOff className="w-12 h-12 text-warning" />
                )}
                <div>
                  <p className="text-xl font-semibold">
                    {isOnline ? 'Online' : 'Offline Mode'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline 
                      ? 'All data is being synced automatically'
                      : 'Data will sync when connection is restored'
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Syncs</h2>
              <div className="flex items-center justify-between p-6 bg-secondary/50 rounded-xl">
                <div>
                  <p className="text-3xl font-bold">{pendingSyncs}</p>
                  <p className="text-sm text-muted-foreground">
                    Sales waiting to sync
                  </p>
                </div>
                <Button 
                  onClick={syncPendingSales}
                  disabled={pendingSyncs === 0 || !isOnline}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Developer Mode */}
        {isDeveloper && (
          <TabsContent value="developer">
            <div className="space-y-6">
              <Card className="p-6 border-accent">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="w-6 h-6 text-accent" />
                  <h2 className="text-lg font-semibold">Developer Mode</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Full access to backend data, logs, and system configuration.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4" />
                      <span className="font-medium">Database Stats</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>Products: {products.length}</p>
                      <p>Sales: {sales.length}</p>
                      <p>Users: {users.length}</p>
                    </div>
                  </Card>

                  <Card className="p-4 bg-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">System Status</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
                      <p>Pending Syncs: {pendingSyncs}</p>
                      <p>Dark Mode: {isDarkMode ? 'On' : 'Off'}</p>
                    </div>
                  </Card>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Raw Data (JSON)</h3>
                  <ScrollArea className="h-64 bg-background rounded-lg p-4 border">
                    <pre className="text-xs">
                      {JSON.stringify({ products: products.slice(0, 3), sales: sales.slice(0, 3) }, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Branding Footer */}
      <div className="mt-12 mb-6 text-center">
        <div className="inline-flex flex-col items-center p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-default border border-slate-100">
           <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Developed By</div>
           <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
             P3L Developers
           </div>
           <p className="text-xs text-slate-400 mt-1">Point of Sale System v1.2</p>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label>PIN (4 digits)</Label>
              <Input
                value={newUser.pin}
                onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.slice(0, 4) })}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                type="password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Avatar Emoji removed */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label>PIN (4 digits)</Label>
                <Input
                  value={editUser.pin}
                  onChange={(e) => setEditUser({ ...editUser, pin: e.target.value.slice(0, 4) })}
                  maxLength={4}
                  type="password"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editUser.role} onValueChange={(v: UserRole) => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editUser.active}
                  onCheckedChange={(checked) => setEditUser({ ...editUser, active: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateUser}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
