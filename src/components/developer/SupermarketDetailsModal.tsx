import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Store, MapPin, Phone, Mail, Edit2, Save, ExternalLink, CreditCard, Users, Trash2, Image as ImageIcon, Database, FileSpreadsheet } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { ProductSeederModal } from './ProductSeederModal';

interface SupermarketDetailsModalProps {
    business: any;
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export const SupermarketDetailsModal: React.FC<SupermarketDetailsModalProps> = ({ business, open, onClose, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSeederModal, setShowSeederModal] = useState(false);
    
    // General Info
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        logo: ''
    });

    // Payment Config UI State
    const [payConfig, setPayConfig] = useState({
        cash: true,
        mpesaTill: false,
        tillNumber: '',
        mpesaPaybill: false,
        paybillNumber: '',
        accountNumber: '',
        bank: false,
        bankDetails: ''
    });

    useEffect(() => {
        if (business) {
            setFormData({
                name: business.name || '',
                email: business.email || '',
                phone: business.phone || '',
                location: business.location || '',
                logo: business.logo || ''
            });

            // Parse payment config
            let parsed: any = {};
            try { 
                parsed = typeof business.payment_config === 'string' ? JSON.parse(business.payment_config) : (business.payment_config || {}); 
            } catch (e) {}

            setPayConfig({
                cash: !!parsed.cash,
                mpesaTill: !!parsed.mpesaTill,
                tillNumber: parsed.mpesaTill?.tillNumber || '',
                mpesaPaybill: !!parsed.mpesaPaybill,
                paybillNumber: parsed.mpesaPaybill?.paybillNumber || '',
                accountNumber: parsed.mpesaPaybill?.accountNumber || '',
                bank: !!parsed.bank,
                bankDetails: parsed.bank?.details || ''
            });

            setIsEditing(false);
        }
    }, [business, open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build the JSON payment config
            const newPaymentConfig = {
                cash: payConfig.cash,
                mpesaTill: payConfig.mpesaTill ? { tillNumber: payConfig.tillNumber } : null,
                mpesaPaybill: payConfig.mpesaPaybill ? { paybillNumber: payConfig.paybillNumber, accountNumber: payConfig.accountNumber } : null,
                bank: payConfig.bank ? { details: payConfig.bankDetails } : null
            };

            const res = await apiFetch(`/api/developer/businesses/${business.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    payment_config: newPaymentConfig
                })
            });

            if (res.ok) {
                toast.success('Business details updated successfully');
                setIsEditing(false);
                onRefresh();
            } else {
                toast.error('Failed to update business details');
            }
        } catch (e) {
            console.error(e);
            toast.error('Network error while saving');
        } finally {
            setSaving(false);
        }
    };

    const formatWhatsAppNumber = (num: string) => {
        if (!num) return '';
        let cleaned = num.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
        if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
        return cleaned;
    };

    const whatsAppNumber = formatWhatsAppNumber(business?.manager?.phone || business?.phone);
    const whatsAppLink = `https://wa.me/${whatsAppNumber}?text=Hello%20${business?.manager?.name || 'Manager'},`;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl gap-0">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group">
                            {formData.logo || business?.logo ? (
                                <img src={formData.logo || business.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Store className="w-8 h-8 text-slate-400" />
                            )}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
                                     onClick={() => setFormData(f => ({...f, logo: ''}))}
                                >
                                    <Trash2 className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">{isEditing ? 'Editing Supermarket' : business?.name}</DialogTitle>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5" /> {business?.location || 'Location Not Set'}
                            </p>
                        </div>
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setShowSeederModal(true)}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Seed Products
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-8">
                            {/* General Details */}
                            <section>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">General Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Business Name</Label>
                                        <Input value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input value={formData.location} onChange={e => setFormData(f => ({...f, location: e.target.value}))} placeholder="City, Area" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Phone Number</Label>
                                        <Input value={formData.phone} onChange={e => setFormData(f => ({...f, phone: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Email</Label>
                                        <Input value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Logo Image URL</Label>
                                        <div className="flex gap-2">
                                            <Input value={formData.logo} onChange={e => setFormData(f => ({...f, logo: e.target.value}))} placeholder="https://..." />
                                            <Button variant="outline" onClick={() => setFormData(f => ({...f, logo: ''}))} title="Remove Logo">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Configuration */}
                            <section>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Payment Configurations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Cash */}
                                    <div className="p-4 border rounded-xl space-y-3 bg-slate-50/50">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2 font-semibold"><CreditCard className="w-4 h-4"/> Cash Payments</Label>
                                            <Switch checked={payConfig.cash} onCheckedChange={(c) => setPayConfig(p => ({...p, cash: c}))} />
                                        </div>
                                        <p className="text-xs text-slate-500">Allow cashiers to accept physical cash.</p>
                                    </div>

                                    {/* Till */}
                                    <div className={`p-4 border rounded-xl space-y-3 transition-colors ${payConfig.mpesaTill ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2 font-semibold">M-Pesa Till Number</Label>
                                            <Switch checked={payConfig.mpesaTill} onCheckedChange={(c) => setPayConfig(p => ({...p, mpesaTill: c}))} />
                                        </div>
                                        {payConfig.mpesaTill && (
                                            <div className="pt-2">
                                                <Label className="text-xs text-slate-500 mb-1 block">Till Number</Label>
                                                <Input value={payConfig.tillNumber} onChange={e => setPayConfig(p => ({...p, tillNumber: e.target.value}))} placeholder="e.g. 123456" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Paybill */}
                                    <div className={`p-4 border rounded-xl space-y-3 transition-colors ${payConfig.mpesaPaybill ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2 font-semibold">M-Pesa Paybill</Label>
                                            <Switch checked={payConfig.mpesaPaybill} onCheckedChange={(c) => setPayConfig(p => ({...p, mpesaPaybill: c}))} />
                                        </div>
                                        {payConfig.mpesaPaybill && (
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <div>
                                                    <Label className="text-xs text-slate-500 mb-1 block">Paybill Number</Label>
                                                    <Input value={payConfig.paybillNumber} onChange={e => setPayConfig(p => ({...p, paybillNumber: e.target.value}))} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-500 mb-1 block">Account Number</Label>
                                                    <Input value={payConfig.accountNumber} onChange={e => setPayConfig(p => ({...p, accountNumber: e.target.value}))} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bank */}
                                    <div className={`p-4 border rounded-xl space-y-3 transition-colors ${payConfig.bank ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2 font-semibold">Bank Transfer</Label>
                                            <Switch checked={payConfig.bank} onCheckedChange={(c) => setPayConfig(p => ({...p, bank: c}))} />
                                        </div>
                                        {payConfig.bank && (
                                            <div className="pt-2">
                                                <Label className="text-xs text-slate-500 mb-1 block">Bank Account Details</Label>
                                                <Input value={payConfig.bankDetails} onChange={e => setPayConfig(p => ({...p, bankDetails: e.target.value}))} placeholder="Bank Name, Acc No." />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white py-4">
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                                    {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Users</p>
                                    <p className="text-2xl font-bold text-slate-900">{business?.userCount}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 col-span-2 md:col-span-3">
                                    <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">Total Sales Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-800">KES {business?.totalRevenue?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Col: Contacts & Payment */}
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Contact Information</h4>
                                        <div className="space-y-4">
                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Manager</p>
                                                <p className="font-bold text-slate-900 mb-1">{business?.manager?.name || 'No Manager Assigned'}</p>
                                                <p className="text-sm text-slate-600 flex items-center gap-2 mb-1"><Phone className="w-3.5 h-3.5" /> {business?.manager?.phone || 'N/A'}</p>
                                                <p className="text-sm text-slate-600 flex items-center gap-2 mb-3"><Mail className="w-3.5 h-3.5" /> {business?.manager?.email || 'N/A'}</p>
                                                
                                                {whatsAppNumber && (
                                                    <a href={whatsAppLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full gap-2 text-white text-sm font-medium bg-[#25D366] hover:bg-[#20bd5a] px-3 py-2 rounded-lg transition-colors shadow-sm">
                                                        WhatsApp Manager <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                            
                                            <div className="p-4 rounded-xl border border-slate-200">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Business Contact</p>
                                                <p className="text-sm text-slate-600 flex items-center gap-2 mb-1"><Phone className="w-3.5 h-3.5" /> {business?.phone || 'N/A'}</p>
                                                <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {business?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Payment Configurations</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="text-sm font-medium flex items-center gap-2"><CreditCard className="w-4 h-4"/> Cash</span>
                                                {payConfig.cash ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">ON</span> : <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">OFF</span>}
                                            </div>
                                            <div className={`p-3 rounded-lg border ${payConfig.mpesaTill ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium">M-Pesa Till</span>
                                                    {payConfig.mpesaTill ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">ON</span> : <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">OFF</span>}
                                                </div>
                                                {payConfig.mpesaTill && <p className="text-sm font-mono font-bold text-emerald-700">{payConfig.tillNumber}</p>}
                                            </div>
                                            <div className={`p-3 rounded-lg border ${payConfig.mpesaPaybill ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium">Paybill</span>
                                                    {payConfig.mpesaPaybill ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">ON</span> : <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">OFF</span>}
                                                </div>
                                                {payConfig.mpesaPaybill && <p className="text-sm font-mono font-bold text-blue-700">{payConfig.paybillNumber} <span className="text-slate-500 font-normal">Acc:</span> {payConfig.accountNumber}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Users */}
                                <div className="lg:col-span-2">
                                    <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4 flex justify-between items-center">
                                        <span>Registered Users ({business?.users?.length || 0})</span>
                                        <Users className="w-4 h-4 text-slate-400" />
                                    </h4>
                                    
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 uppercase font-semibold">
                                                    <tr>
                                                        <th className="px-4 py-3 border-b">Name</th>
                                                        <th className="px-4 py-3 border-b">Role</th>
                                                        <th className="px-4 py-3 border-b">Contact</th>
                                                        <th className="px-4 py-3 border-b text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {business?.users && business.users.length > 0 ? (
                                                        business.users.map((u: any) => (
                                                            <tr key={u.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                                    {u.name}
                                                                </td>
                                                                <td className="px-4 py-3 capitalize">
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                                        {u.role}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500">
                                                                    {u.phone || u.email || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {u.active ? (
                                                                        <span className="text-emerald-600 font-medium text-xs flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active</span>
                                                                    ) : (
                                                                        <span className="text-slate-400 font-medium text-xs">Disabled</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {showSeederModal && (
                <ProductSeederModal 
                    open={showSeederModal} 
                    onClose={() => setShowSeederModal(false)}
                    businessId={business.id}
                    businessName={business.name}
                />
            )}
        </Dialog>
    );
};
