import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface AddClientModalProps {
    open: boolean;
    onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ open, onClose }) => {
    // Business Info State
    const [bizName, setBizName] = useState('');
    const [bizEmail, setBizEmail] = useState('');
    const [bizPhone, setBizPhone] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    
    // Payment Methods State
    const [methods, setMethods] = useState<{
        cash: boolean;
        mpesaTill: boolean;
        mpesaPaybill: boolean;
        bank: boolean;
    }>({
        cash: true,
        mpesaTill: false,
        mpesaPaybill: false,
        bank: false
    });

    const [tillNumber, setTillNumber] = useState('');
    const [paybillNumber, setPaybillNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankDetails, setBankDetails] = useState('');

    // Manager Info State
    const [mgrName, setMgrName] = useState('');
    const [mgrEmail, setMgrEmail] = useState('');
    const [mgrPhone, setMgrPhone] = useState('');
    const [mgrPin, setMgrPin] = useState('');
    const [mgrConfirmPin, setMgrConfirmPin] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!bizName || !bizPhone || !mgrName || !mgrPin) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (mgrPin.length !== 4) {
             toast.error('PIN must be 4 digits');
             return;
        }
        if (mgrPin !== mgrConfirmPin) {
            toast.error('PINs do not match');
            return;
        }

        if (methods.mpesaTill && !tillNumber) {
            toast.error('Please enter Till Number');
            return;
        }
        if (methods.mpesaPaybill && (!paybillNumber || !accountNumber)) {
             toast.error('Please enter Paybill Details');
             return;
        }

        setLoading(true);

        const payload = {
            business: {
                name: bizName,
                email: bizEmail,
                phone: bizPhone,
                logo: logoUrl || '/main logos/main.png',
                paymentConfig: {
                    cash: methods.cash,
                    mpesaTill: methods.mpesaTill ? { tillNumber } : null,
                    mpesaPaybill: methods.mpesaPaybill ? { paybillNumber, accountNumber } : null,
                    bank: methods.bank ? { details: bankDetails } : null
                }
            },
            manager: {
                name: mgrName,
                email: mgrEmail,
                phone: mgrPhone,
                pin: mgrPin,
                role: 'admin' // The manager becomes the admin of their instance
            }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/users/create-client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Client Business & Manager Created Successfully!');
                onClose();
                // Optionally reload or update list
                window.location.reload();
            } else {
                toast.error(data.error || 'Failed to create client');
            }
        } catch (error) {
            toast.error('Network error occurred');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add New Client Business</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-8 py-4">
                    {/* LEFT COLUMN: BUSINESS INFO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Business Information</h3>
                        
                        <div className="space-y-2">
                            <Label>Business Name *</Label>
                            <Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Ruiru Supermarket" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Business Phone *</Label>
                            <Input value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="07..." />
                        </div>

                         <div className="space-y-2">
                            <Label>Business Email</Label>
                            <Input value={bizEmail} onChange={e => setBizEmail(e.target.value)} placeholder="info@business.com" />
                        </div>

                         <div className="space-y-2">
                            <Label>Business Logo URL (Optional)</Label>
                            <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
                            <p className="text-xs text-muted-foreground">If empty, system defaults to P3L Company Logo.</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-base">Payment Methods</Label>
                            
                            <div className="flex items-center gap-2">
                                <Checkbox checked={methods.cash} onCheckedChange={(c) => setMethods(p => ({...p, cash: !!c}))} />
                                <span>Cash</span>
                            </div>

                            <div className="flex flex-col gap-2 p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={methods.mpesaTill} onCheckedChange={(c) => setMethods(p => ({...p, mpesaTill: !!c}))} />
                                    <span>M-Pesa Till Number</span>
                                </div>
                                {methods.mpesaTill && (
                                    <Input 
                                        placeholder="Enter Till Number" 
                                        value={tillNumber} 
                                        onChange={e => setTillNumber(e.target.value)} 
                                        className="mt-1"
                                    />
                                )}
                            </div>

                             <div className="flex flex-col gap-2 p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={methods.mpesaPaybill} onCheckedChange={(c) => setMethods(p => ({...p, mpesaPaybill: !!c}))} />
                                    <span>M-Pesa Paybill</span>
                                </div>
                                {methods.mpesaPaybill && (
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <Input 
                                            placeholder="Paybill No." 
                                            value={paybillNumber} 
                                            onChange={e => setPaybillNumber(e.target.value)} 
                                        />
                                        <Input 
                                            placeholder="Account No." 
                                            value={accountNumber} 
                                            onChange={e => setAccountNumber(e.target.value)} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MANAGER INFO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Manager Information</h3>
                        
                        <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
                            <div className="space-y-2">
                                <Label>Manager Full Name *</Label>
                                <Input value={mgrName} onChange={e => setMgrName(e.target.value)} placeholder="John Doe" />
                            </div>

                            <div className="space-y-2">
                                <Label>Manager Email</Label>
                                <Input value={mgrEmail} onChange={e => setMgrEmail(e.target.value)} placeholder="manager@business.com" />
                            </div>

                            <div className="space-y-2">
                                <Label>Manager Phone *</Label>
                                <Input value={mgrPhone} onChange={e => setMgrPhone(e.target.value)} placeholder="07..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Set PIN (4 digits) *</Label>
                                    <Input 
                                        type="password" 
                                        maxLength={4} 
                                        value={mgrPin} 
                                        onChange={e => setMgrPin(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="****"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm PIN *</Label>
                                    <Input 
                                        type="password" 
                                        maxLength={4} 
                                        value={mgrConfirmPin} 
                                        onChange={e => setMgrConfirmPin(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="****" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                             <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
                                <h4 className="font-semibold mb-1">Creation Summary</h4>
                                <p>This will create a dedicated workspace for <strong>{bizName || 'This Business'}</strong>.</p>
                                <p>The manager <strong>{mgrName || '...'}</strong> will be the Super Admin.</p>
                             </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
                        {loading ? 'Creating System...' : 'Confirm & Create Client'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
