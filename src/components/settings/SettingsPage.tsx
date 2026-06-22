import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { User, UserRole, BusinessConfig } from '@/data/users';
import { cn } from '@/lib/utils';
import { 
  User as UserIcon,
  Briefcase,
  Save,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Users,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { 
    currentUser, 
    users,
    sales,
    addUser,
    updateUser,
    deleteUser,
    activeBusinessId,
    isDarkMode, 
    toggleDarkMode,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const businessUsers = users.filter(u => String(u.business_id || '') === String(activeBusinessId || '11111111-1111-1111-1111-111111111111'));

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
    role: 'cashier' as UserRole,
  });

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        pin: user.pin,
        role: user.role,
      });
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', email: '', phone: '', pin: '', role: 'cashier' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.pin) {
      toast.error('Name and PIN are required');
      return;
    }
    if (editingUserId) {
      updateUser(editingUserId, { ...userForm });
      toast.success('User updated successfully');
    } else {
      addUser({ 
        ...userForm, 
        avatar: '👤', 
        active: true, 
        business_id: String(activeBusinessId || '11111111-1111-1111-1111-111111111111') 
      });
      toast.success('User added successfully');
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
      toast.success('User deleted successfully');
    }
  };

  const [showPin, setShowPin] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  // Business settings state (local before save)
  const [bizSettings, setBizSettings] = useState<Partial<BusinessConfig>>({
    uiSettings: currentUser?.business?.uiSettings || {
      showQuickItems: true,
      cartStyle: 'receipt',
      layoutDensity: 'spaced',
      theme: isDarkMode ? 'dark' : 'light',
    },
    receiptSettings: currentUser?.business?.receiptSettings || {
      supermarketName: currentUser?.business?.name || 'ROSEMARY SUPERMARKET',
      footerMessage: 'Thank you for shopping with us! Karibu Tena.',
      showDate: true,
      showServedBy: true,
    },
    paymentMng: currentUser?.business?.paymentMng || {
      type: 'till',
      tillNumber: '5849302',
      paybillNumber: '247247',
      paybillAccount: 'ROSEMARY',
      phoneNumber: '254700000000'
    },
    paymentGateway: currentUser?.business?.paymentGateway || {
      gateway: 'Paystack Backend API',
      defaultMethod: 'Prompt Payment',
    }
  });

  const { updateCurrentUserLocal } = useStore();

  // Auto-sync UI settings locally for real-time preview
  React.useEffect(() => {
    if (currentUser) {
      updateCurrentUserLocal({ 
        business: { ...currentUser.business, ...bizSettings } as BusinessConfig 
      });
    }
  }, [bizSettings]);

  const handleProfileSave = () => {
    if (currentUser) {
      updateUser(currentUser.id, { ...profileForm });
      toast.success("Profile updated successfully!");
    }
  };

  const handleBusinessSave = () => {
    if (currentUser) {
      const updatedBusiness = { ...currentUser.business, ...bizSettings } as BusinessConfig;
      updateUser(currentUser.id, { business: updatedBusiness });
      toast.success("Business settings saved successfully!");
    }
  };

  const generateSalesSummaryText = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter(s => new Date(s.timestamp) >= today);
    const mpesaSales = todaySales.filter(s => s.paymentMethod === 'mpesa');
    const cashSales = todaySales.filter(s => s.paymentMethod === 'cash');

    const totalMpesa = mpesaSales.reduce((sum, s) => sum + s.total, 0);
    const totalCash = cashSales.reduce((sum, s) => sum + s.total, 0);
    const totalRevenue = totalMpesa + totalCash;

    const report = `*${bizSettings.receiptSettings?.supermarketName?.toUpperCase() || 'ROSEMARY SUPERMARKET'}*
*END OF DAY SALES SUMMARY*
Date: ${new Date().toLocaleDateString()}

*TOTAL REVENUE:* KES ${totalRevenue.toLocaleString()}
*TOTAL TRANSACTIONS:* ${todaySales.length}

*BREAKDOWN:*
- M-PESA: KES ${totalMpesa.toLocaleString()} (${mpesaSales.length} txns)
- CASH: KES ${totalCash.toLocaleString()} (${cashSales.length} txns)

Generated by P3L POS System`;

    return encodeURIComponent(report);
  };

  const handleShareWhatsApp = () => {
    const text = generateSalesSummaryText();
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const text = generateSalesSummaryText();
    window.location.href = `mailto:?subject=End of Day Sales Summary&body=${text}`;
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight uppercase">Settings</h1>
        <p className="text-muted-foreground">Manage your personal profile and terminal configurations.</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-8">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3 lg:w-[600px]' : 'grid-cols-2 lg:w-[400px]'} h-14 rounded-none border border-foreground/20 bg-transparent p-1`}>
          <TabsTrigger value="personal" className="rounded-none uppercase tracking-widest text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
            <UserIcon className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-none uppercase tracking-widest text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Briefcase className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="rounded-none uppercase tracking-widest text-xs font-bold data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Users className="w-4 h-4 mr-2" />
              Staff & Users
            </TabsTrigger>
          )}
        </TabsList>

        {/* PERSONAL ACCOUNTS TAB */}
        <TabsContent value="personal">
          <Card className="rounded-none border-foreground/10 p-6 shadow-sm">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-foreground/10">
              <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center text-5xl shadow-inner text-background">
                {currentUser?.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest">{currentUser?.name}</h2>
                <Badge className="mt-2 uppercase tracking-widest bg-foreground text-background rounded-none px-3 py-1">
                  {currentUser?.role}
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="rounded-none border-foreground/20 h-12 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="rounded-none border-foreground/20 h-12 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                <Input 
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  className="rounded-none border-foreground/20 h-12 focus-visible:ring-0 focus-visible:border-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security PIN</Label>
                <div className="relative">
                  <Input 
                    value={currentUser?.pin || ''} 
                    readOnly
                    type={showPin ? "text" : "password"}
                    className="rounded-none border-foreground/20 h-12 bg-muted/50 focus-visible:ring-0"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-12 rounded-none" onClick={() => setShowPin(!showPin)}>
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-foreground/10">
              <Button onClick={handleProfileSave} className="rounded-none h-12 px-8 uppercase tracking-widest font-bold">
                <Save className="w-4 h-4 mr-2" />
                Change Profile Details
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* BUSINESS SETTINGS TAB */}
        <TabsContent value="business">
          <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
            <div className="space-y-8">
              
              {/* Receipt Settings */}
              <Card className="rounded-none border-foreground/10 p-6 shadow-sm">
                <h2 className="text-lg font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">Receipt Settings</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Supermarket Name</Label>
                    <Input 
                      value={bizSettings.receiptSettings?.supermarketName}
                      onChange={e => setBizSettings({
                        ...bizSettings, 
                        receiptSettings: {...bizSettings.receiptSettings!, supermarketName: e.target.value}
                      })}
                      className="rounded-none border-foreground/20 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Footer Message</Label>
                    <Input 
                      value={bizSettings.receiptSettings?.footerMessage}
                      onChange={e => setBizSettings({
                        ...bizSettings, 
                        receiptSettings: {...bizSettings.receiptSettings!, footerMessage: e.target.value}
                      })}
                      className="rounded-none border-foreground/20 h-12"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-foreground/10 bg-muted/30">
                    <Label className="font-bold tracking-wide">Print Date on Receipt</Label>
                    <Switch 
                      checked={bizSettings.receiptSettings?.showDate}
                      onCheckedChange={v => setBizSettings({
                        ...bizSettings, 
                        receiptSettings: {...bizSettings.receiptSettings!, showDate: v}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-foreground/10 bg-muted/30">
                    <Label className="font-bold tracking-wide">Show 'Served By'</Label>
                    <Switch 
                      checked={bizSettings.receiptSettings?.showServedBy}
                      onCheckedChange={v => setBizSettings({
                        ...bizSettings, 
                        receiptSettings: {...bizSettings.receiptSettings!, showServedBy: v}
                      })}
                    />
                  </div>
                </div>
              </Card>

              {/* Payment Management */}
              <Card className="rounded-none border-foreground/10 p-6 shadow-sm">
                <h2 className="text-lg font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">Payment Management</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mobile Money Type</Label>
                    <Select 
                      value={bizSettings.paymentMng?.type || 'till'} 
                      onValueChange={(v: any) => setBizSettings({
                        ...bizSettings, 
                        paymentMng: {...bizSettings.paymentMng!, type: v}
                      })}
                    >
                      <SelectTrigger className="rounded-none border-foreground/20 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="till">Till Number</SelectItem>
                        <SelectItem value="paybill">Paybill</SelectItem>
                        <SelectItem value="sendMoney">Send Money (P2P)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bizSettings.paymentMng?.type === 'till' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Till Number</Label>
                      <Input 
                        value={bizSettings.paymentMng?.tillNumber}
                        onChange={e => setBizSettings({
                          ...bizSettings, 
                          paymentMng: {...bizSettings.paymentMng!, tillNumber: e.target.value}
                        })}
                        placeholder="e.g. 123456"
                        className="rounded-none border-foreground/20 h-12"
                      />
                    </div>
                  )}

                  {bizSettings.paymentMng?.type === 'paybill' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paybill Number</Label>
                        <Input 
                          value={bizSettings.paymentMng?.paybillNumber}
                          onChange={e => setBizSettings({
                            ...bizSettings, 
                            paymentMng: {...bizSettings.paymentMng!, paybillNumber: e.target.value}
                          })}
                          className="rounded-none border-foreground/20 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account Number</Label>
                        <Input 
                          value={bizSettings.paymentMng?.paybillAccount}
                          onChange={e => setBizSettings({
                            ...bizSettings, 
                            paymentMng: {...bizSettings.paymentMng!, paybillAccount: e.target.value}
                          })}
                          className="rounded-none border-foreground/20 h-12"
                        />
                      </div>
                    </div>
                  )}

                  {bizSettings.paymentMng?.type === 'sendMoney' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                      <Input 
                        value={bizSettings.paymentMng?.phoneNumber}
                        onChange={e => setBizSettings({
                          ...bizSettings, 
                          paymentMng: {...bizSettings.paymentMng!, phoneNumber: e.target.value}
                        })}
                        placeholder="254..."
                        className="rounded-none border-foreground/20 h-12"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* End of Day Reports */}
              <Card className="rounded-none border-foreground/10 p-6 shadow-sm bg-muted/20">
                <h2 className="text-lg font-black uppercase tracking-widest mb-2">End of Day Reports</h2>
                <p className="text-xs text-muted-foreground mb-6">Instantly generate and share perfectly calculated math for today's sales.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleShareWhatsApp} className="flex-1 rounded-none font-bold uppercase tracking-widest h-12 bg-[#25D366] hover:bg-[#128C7E] text-white">
                    Share via WhatsApp
                  </Button>
                  <Button onClick={handleShareEmail} variant="outline" className="flex-1 rounded-none font-bold uppercase tracking-widest h-12 border-foreground/20 hover:bg-foreground hover:text-background">
                    Share via Email
                  </Button>
                </div>
              </Card>

              {/* Payment Gateways */}
              <Card className="rounded-none border-foreground/10 p-6 shadow-sm">
                <h2 className="text-lg font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">Payment Gateways</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Gateway</Label>
                    <div className="h-12 border border-foreground/20 bg-muted/50 px-4 flex items-center text-sm font-bold opacity-70">
                      {bizSettings.paymentGateway?.gateway} (Read-Only)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Default Method</Label>
                    <Select 
                      value={bizSettings.paymentGateway?.defaultMethod || 'Prompt Payment'} 
                      onValueChange={(v: any) => setBizSettings({
                        ...bizSettings, 
                        paymentGateway: {...bizSettings.paymentGateway!, defaultMethod: v}
                      })}
                    >
                      <SelectTrigger className="rounded-none border-foreground/20 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="Prompt Payment">Prompt Payment</SelectItem>
                        <SelectItem value="Till Direct Payment">Till Direct Payment</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Sidebar: UI & Widget Settings */}
            <div className="space-y-6">
              <Card className="rounded-none border-foreground/10 p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">UI & Widgets</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-bold tracking-wide">Quick Items Grid</Label>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Show Fast Movers</p>
                    </div>
                    <Switch 
                      checked={bizSettings.uiSettings?.showQuickItems}
                      onCheckedChange={v => setBizSettings({
                        ...bizSettings, 
                        uiSettings: {...bizSettings.uiSettings!, showQuickItems: v}
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cart Style</Label>
                    <Select 
                      value={bizSettings.uiSettings?.cartStyle} 
                      onValueChange={(v: any) => setBizSettings({
                        ...bizSettings, 
                        uiSettings: {...bizSettings.uiSettings!, cartStyle: v}
                      })}
                    >
                      <SelectTrigger className="rounded-none border-foreground/20 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="receipt">Classic Receipt</SelectItem>
                        <SelectItem value="modern">Modern Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                    <div>
                      <Label className="font-bold tracking-wide">Dark Theme</Label>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Global Color Scheme</p>
                    </div>
                    <Switch 
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>

                  <div className="pt-6 border-t border-foreground/10">
                    <Button onClick={handleBusinessSave} className="w-full rounded-none h-14 uppercase tracking-widest font-bold">
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* STAFF & USERS TAB */}
        {isAdmin && (
          <TabsContent value="users">
            <Card className="rounded-none border-foreground/10 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-lg font-black uppercase tracking-widest">Staff & Users</h2>
                <Button onClick={() => handleOpenUserModal()} className="rounded-none font-bold uppercase tracking-widest h-10 px-6">
                  <Plus className="w-4 h-4 mr-2" /> Add Cashier
                </Button>
              </div>

              <div className="border border-foreground/10">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold uppercase tracking-widest text-xs">Name</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-xs">Email</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-xs">Role</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-xs">PIN</TableHead>
                      <TableHead className="font-bold uppercase tracking-widest text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businessUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase tracking-widest text-[10px] rounded-none">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">****</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenUserModal(u)} className="mr-2">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} disabled={u.id === currentUser.id}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-md rounded-none border-foreground/20">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-black text-lg flex items-center gap-2">
               <Users className="w-5 h-5" /> {editingUserId ? 'Edit User' : 'Add Cashier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Full Name</Label>
                <Input placeholder="John Doe" className="rounded-none border-foreground/20" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Email Address</Label>
                <Input placeholder="john@example.com" type="email" className="rounded-none border-foreground/20" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Phone Number</Label>
                <Input placeholder="07XXXXXXXX" className="rounded-none border-foreground/20" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Login PIN</Label>
                <Input placeholder="4-digit PIN" maxLength={4} type="password" className="rounded-none border-foreground/20 text-xl tracking-widest font-mono" value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Role</Label>
                <Select value={userForm.role} onValueChange={(v: UserRole) => setUserForm({...userForm, role: v})}>
                  <SelectTrigger className="rounded-none border-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <Button onClick={handleSaveUser} className="w-full rounded-none font-bold uppercase tracking-widest h-12 mt-4">
               Save User
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
