import React, { useState, useEffect } from 'react';
import { Store, MapPin, Edit2, Download, FileSpreadsheet, KeySquare, Shield, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SmartCSVSeeder } from './SmartCSVSeeder';

interface SupermarketDetailViewProps {
    business: any;
    onBack: () => void;
}

export const SupermarketDetailView: React.FC<SupermarketDetailViewProps> = ({ business, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [seederMode, setSeederMode] = useState<'none' | 'products' | 'users'>('none');
    const [fullBusiness, setFullBusiness] = useState<any>(business);

    const [formData, setFormData] = useState({
        name: business?.name || '',
        email: business?.email || '',
        phone: business?.phone || '',
        location: business?.location || '',
        logo: business?.logo || ''
    });

    const [payConfig, setPayConfig] = useState({
        cash: true,
        paystack: false,
        paystackPublicKey: '',
        paystackSecretKey: ''
    });

    useEffect(() => {
        if (fullBusiness) {
            let parsed: any = {};
            try { 
                parsed = typeof fullBusiness.payment_config === 'string' ? JSON.parse(fullBusiness.payment_config) : (fullBusiness.payment_config || {}); 
            } catch (e) {}

            setPayConfig({
                cash: !!parsed.cash,
                paystack: !!parsed.paystack?.enabled,
                paystackPublicKey: parsed.paystack?.publicKey || '',
                paystackSecretKey: parsed.paystack?.secretKey || ''
            });
        }
    }, [fullBusiness]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const newPaymentConfig = {
                cash: payConfig.cash,
                paystack: payConfig.paystack ? { enabled: true, publicKey: payConfig.paystackPublicKey, secretKey: payConfig.paystackSecretKey } : null
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
                toast.success('Business details updated');
                setIsEditing(false);
                setFullBusiness({ ...fullBusiness, ...formData, payment_config: newPaymentConfig });
            } else {
                toast.error('Failed to update business details');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        const input = document.getElementById('supermarket-summary-content');
        if (!input) return;
        
        toast.info("Generating PDF summary...");
        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fullBusiness?.name?.replace(/\s+/g, '_') || 'Supermarket'}_Summary.pdf`);
            toast.success("PDF Downloaded");
        } catch (e) {
            console.error("PDF gen failed", e);
            toast.error("Failed to generate PDF");
        }
    };

    if (seederMode !== 'none') {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setSeederMode('none')} className="rounded-none text-xs font-bold uppercase tracking-widest text-slate-900/50 hover:text-slate-900 hover:bg-transparent px-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
                </Button>
                <div className="border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Seed {seederMode}</h2>
                    <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Map CSV columns to database fields</p>
                </div>
                <SmartCSVSeeder businessId={business.id} type={seederMode} onComplete={() => setSeederMode('none')} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" onClick={onBack} className="rounded-none text-xs font-bold uppercase tracking-widest text-slate-900/50 hover:text-slate-900 hover:bg-transparent px-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> All Supermarkets
                </Button>
                
                {!isEditing && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={() => {toast.success("Impersonation mode activated."); setTimeout(() => window.location.reload(), 1000);}}>
                            <KeySquare className="w-3 h-3 mr-2 text-indigo-500" /> Impersonate
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={() => toast.info("Opening billing & subscription manager...")}>
                            <FileSpreadsheet className="w-3 h-3 mr-2" /> Billing
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={() => setSeederMode('products')}>
                            <FileSpreadsheet className="w-3 h-3 mr-2" /> Seed Products
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={() => setSeederMode('users')}>
                            <KeySquare className="w-3 h-3 mr-2" /> Seed Users
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={handleDownloadPDF}>
                            <Download className="w-3 h-3 mr-2" /> Export PDF
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-3 h-3 mr-2" /> Edit Profile
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => toast.error("Account suspension request initiated.")}>
                            <Trash2 className="w-3 h-3 mr-2" /> Suspend
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content to be PDF'd */}
            <div id="supermarket-summary-content" className="bg-white p-2">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-24 h-24 bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden relative group">
                        {formData.logo || fullBusiness?.logo ? (
                            <img src={formData.logo || fullBusiness.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Store className="w-10 h-10 text-slate-900/20" />
                        )}
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center cursor-pointer transition-all" onClick={() => setFormData(f => ({...f, logo: ''}))}>
                                <Trash2 className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{isEditing ? 'Edit Tenant Profile' : fullBusiness?.name}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {fullBusiness?.location || 'Location Not Configured'}
                        </p>
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-12">
                        {/* Edit General Info */}
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6">General Information</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold">Business Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold">Location</Label>
                                    <Input value={formData.location} onChange={e => setFormData(f => ({...f, location: e.target.value}))} className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold">Phone Number</Label>
                                    <Input value={formData.phone} onChange={e => setFormData(f => ({...f, phone: e.target.value}))} className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold">Email Address</Label>
                                    <Input value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold">Logo Image URL</Label>
                                    <Input value={formData.logo} onChange={e => setFormData(f => ({...f, logo: e.target.value}))} placeholder="https://..." className="rounded-md border-slate-300 focus-visible:ring-indigo-500" />
                                </div>
                            </div>
                        </section>

                        {/* Edit Paystack */}
                        <section>
                            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6">Payment Configuration</h3>
                            <div className={`p-6 border ${payConfig.paystack ? 'border-black' : 'border-black/20'} rounded-none space-y-6 transition-colors`}>
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">Paystack Gateway</Label>
                                    <Switch checked={payConfig.paystack} onCheckedChange={(c) => setPayConfig(p => ({...p, paystack: c}))} />
                                </div>
                                {payConfig.paystack && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-widest font-bold mb-2 block">Public Key</Label>
                                            <Input value={payConfig.paystackPublicKey} onChange={e => setPayConfig(p => ({...p, paystackPublicKey: e.target.value}))} placeholder="pk_live_..." className="rounded-md border-slate-300 focus-visible:ring-indigo-500 font-mono text-xs" />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] uppercase tracking-widest font-bold mb-2 block">Secret Key</Label>
                                            <Input type="password" value={payConfig.paystackSecretKey} onChange={e => setPayConfig(p => ({...p, paystackSecretKey: e.target.value}))} placeholder="sk_live_..." className="rounded-md border-slate-300 focus-visible:ring-indigo-500 font-mono text-xs" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-none border-black text-slate-900 hover:bg-slate-50 text-xs font-bold uppercase tracking-widest h-12 px-8">CANCEL</Button>
                            <Button onClick={handleSave} disabled={saving} className="rounded-none bg-black hover:bg-black/80 text-white text-xs font-bold uppercase tracking-widest h-12 px-8">
                                {saving ? 'SAVING...' : 'SAVE CHANGES'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Profile View */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-indigo-600 text-white p-6 rounded-none">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Total Users</p>
                                <h3 className="text-3xl font-bold tracking-tighter">{fullBusiness?.userCount || 0}</h3>
                            </div>
                            <div className="bg-white border-2 border-black p-6 rounded-none col-span-2 md:col-span-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-2">Total Sales Revenue</p>
                                <h3 className="text-3xl font-bold tracking-tighter">KES {fullBusiness?.revenue?.toLocaleString() || 0}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6 text-slate-900">Contact Detail</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-900/40">Email</p>
                                        <p className="text-sm font-bold text-slate-900">{fullBusiness?.email || 'Not Configured'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-900/40">Phone</p>
                                        <p className="text-sm font-bold text-slate-900">{fullBusiness?.phone || 'Not Configured'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-900/40">Manager</p>
                                        <p className="text-sm font-bold text-slate-900">{fullBusiness?.manager?.name || 'Unknown'} (PIN: {fullBusiness?.manager?.pin || '****'})</p>
                                    </div>
                                </div>
                            </section>
                            
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6 text-slate-900">Infrastructure</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-900/40">Business UUID</p>
                                        <p className="text-xs font-mono font-bold text-slate-900">{fullBusiness?.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-900/40">Gateway</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {payConfig.paystack ? <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 font-bold uppercase tracking-widest">Paystack Active</span> : <span className="text-[10px] bg-black/10 text-slate-900 px-2 py-0.5 font-bold uppercase tracking-widest">Cash Only</span>}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Database Info */}
                        <div className="grid grid-cols-1 gap-12">
                            {/* Users */}
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6 text-slate-900">System Users</h3>
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-900/50 border-b border-slate-200/10">
                                            <tr>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Role</th>
                                                <th className="p-4">PIN</th>
                                                <th className="p-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fullBusiness?.users?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-900/40 text-[10px] font-bold uppercase tracking-widest">No Users Found</td>
                                                </tr>
                                            ) : (
                                                fullBusiness?.users?.map((u: any) => (
                                                    <tr key={u.id} className="border-b border-slate-200/5 last:border-0 hover:bg-slate-50">
                                                        <td className="p-4 font-bold text-slate-900 uppercase tracking-wider text-xs">
                                                            {u.name}
                                                            {u.email && <span className="block text-[10px] text-slate-900/50 lowercase tracking-normal mt-1">{u.email}</span>}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-2 py-1">{u.role}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="font-mono text-xs font-bold tracking-[0.2em]">{u.pin}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${u.active ? 'text-slate-900' : 'text-slate-900/40'}`}>
                                                                {u.active ? 'ACTIVE' : 'DISABLED'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Products */}
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-200/10 pb-2 mb-6 text-slate-900">Inventory Database</h3>
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto h-96 overflow-y-auto">
                                    <table className="w-full text-left text-sm relative">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-900/50 border-b border-slate-200/10 sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th className="p-4">Product Name</th>
                                                <th className="p-4">Category</th>
                                                <th className="p-4">Price</th>
                                                <th className="p-4">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fullBusiness?.products?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-900/40 text-[10px] font-bold uppercase tracking-widest">No Products Found</td>
                                                </tr>
                                            ) : (
                                                fullBusiness?.products?.map((p: any) => (
                                                    <tr key={p.id} className="border-b border-slate-200/5 last:border-0 hover:bg-slate-50">
                                                        <td className="p-4 font-bold text-slate-900 uppercase tracking-wider text-xs">{p.name}</td>
                                                        <td className="p-4 text-xs font-medium text-slate-900/70">{p.category || '—'}</td>
                                                        <td className="p-4 text-xs font-mono font-bold">KES {p.price}</td>
                                                        <td className="p-4">
                                                            <span className={`text-xs font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                                                {p.stock}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
