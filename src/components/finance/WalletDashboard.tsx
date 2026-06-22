import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Wallet, ArrowDownLeft, ArrowUpRight, Lock, Loader2, Building, Settings } from 'lucide-react';

export const WalletDashboard = () => {
  const { sales, users, currentUser, updateUser } = useStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const paymentMng = currentUser?.business?.paymentMng || { type: null };

  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [paymentType, setPaymentType] = useState<any>(paymentMng.type || 'till');
  const [tillNumber, setTillNumber] = useState(paymentMng.tillNumber || '');
  const [paybillNumber, setPaybillNumber] = useState(paymentMng.paybillNumber || '');
  const [paybillAccount, setPaybillAccount] = useState(paymentMng.paybillAccount || '');
  const [phoneNumber, setPhoneNumber] = useState(paymentMng.phoneNumber || '');

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  
  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Calculate today's M-Pesa sales from POS
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const mpesaToday = sales
    .filter(s => s.paymentMethod === 'mpesa' && new Date(s.timestamp) >= startOfToday)
    .reduce((sum, s) => sum + s.total, 0);

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_URL}/api/paystack/balance`);
      if (res.ok) {
        const data = await res.json();
        // Paystack balance returns an array of balances, usually index 0 is KES
        if (data.status) {
          if (data.data && data.data.length > 0) {
            // Paystack balance is in smallest currency unit (cents), so divide by 100
            setBalance(data.data[0].balance / 100);
          } else {
            setBalance(0);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch balance from Paystack');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Server error while fetching Paystack balance');
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
      toast.error('Could not fetch Paystack balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSavePaymentConfig = () => {
    if (!currentUser) return;
    const newConfig = {
      ...currentUser.business,
      name: currentUser.business?.name || 'My Supermarket',
      id: currentUser.business?.id || 1,
      paymentMng: {
        type: paymentType,
        tillNumber,
        paybillNumber,
        paybillAccount,
        phoneNumber
      }
    };
    updateUser(currentUser.id, { business: newConfig });
    setShowPaymentSettings(false);
    toast.success('Payment configuration updated');
  };

  const handleWithdraw = async () => {
    // Verify Admin PIN
    const adminUser = users.find(u => u.pin === adminPin && (u.role === 'admin' || u.role === 'owner' || u.role === 'developer'));
    if (!adminUser) {
      toast.error('Invalid Admin PIN');
      return;
    }

    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsWithdrawing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      // 1. Create recipient (simplified to mobile money for now)
      const recRes = await fetch(`${API_URL}/api/paystack/transferrecipient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mobile_money',
          name: 'Business Withdrawal',
          account_number: withdrawDestination,
          bank_code: 'MPESA' // Typically "MPESA" or similar identifier for Paystack Kenya
        })
      });
      const recData = await recRes.json();
      
      if (!recData.status) {
        throw new Error(recData.message || 'Failed to create recipient');
      }

      const recipientCode = recData.data.recipient_code;

      // 2. Initiate Transfer
      const transRes = await fetch(`${API_URL}/api/paystack/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'balance',
          amount: Number(withdrawAmount) * 100, // to kobo/cents
          recipient: recipientCode,
          reason: `Admin Withdrawal by ${adminUser.name}`
        })
      });
      const transData = await transRes.json();

      if (transData.status) {
        toast.success('Withdrawal initiated successfully!');
        setShowWithdraw(false);
        setWithdrawAmount('');
        setWithdrawDestination('');
        setAdminPin('');
        fetchBalance();
      } else {
        throw new Error(transData.message || 'Transfer failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!depositPhone) {
      toast.error('Enter a valid phone number');
      return;
    }

    setIsDepositing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_URL}/api/paystack/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: depositPhone,
          amount: Number(depositAmount) * 100,
          email: 'admin@wallet.local'
        })
      });
      const data = await res.json();
      
      if (data.status) {
        toast.success('STK Push sent to your phone. Complete the PIN prompt to deposit.');
        setShowDeposit(false);
        setDepositAmount('');
        setDepositPhone('');
        // Wait a bit before checking balance
        setTimeout(fetchBalance, 10000); 
      } else {
        throw new Error(data.message || 'Charge failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-5xl mx-auto py-4 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
            Finance
          </h2>
          <div className="flex items-center gap-2 mt-2 opacity-50">
             <Building className="w-4 h-4"/>
             <span className="text-xs uppercase tracking-widest font-bold">Paystack Integrated</span>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto border border-foreground/10 p-1">
           <Button 
             onClick={() => setShowWithdraw(true)}
             variant="ghost"
             className="rounded-none font-bold text-xs uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600"
           >
             <ArrowUpRight className="w-4 h-4 mr-2" /> Withdraw
           </Button>
           <Button 
             onClick={() => setShowDeposit(true)}
             variant="ghost"
             className="rounded-none font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600"
           >
             <ArrowDownLeft className="w-4 h-4 mr-2" /> Top Up
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Main Paystack Balance */}
        <div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-4 flex items-center justify-between">
                <span>Total Paystack Balance</span>
                <span className="cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-1" onClick={fetchBalance}>Refresh</span>
            </div>
            {isLoading ? (
            <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
            </div>
            ) : (
            <div className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none">
                <span className="text-2xl align-top mr-2 opacity-50">KES</span>
                {balance !== null ? balance.toLocaleString() : '---'}
            </div>
            )}
        </div>

        {/* Local M-Pesa Sales Today */}
        <div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-4">Today's POS M-Pesa</div>
            <div className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-muted-foreground">
                <span className="text-2xl align-top mr-2 opacity-30">KES</span>
                {mpesaToday.toLocaleString()}
            </div>
        </div>
      </div>

      <div className="pt-12 mt-12 border-t border-foreground/10 flex justify-between items-center group">
         <div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">Customer Payment Gateway</div>
            <div className="text-xl font-bold tracking-tight">
               {paymentMng.type === 'till' && `Buy Goods & Services - Till: ${paymentMng.tillNumber || 'Not Set'}`}
               {paymentMng.type === 'paybill' && `Paybill - Business: ${paymentMng.paybillNumber || 'Not Set'} (Acc: ${paymentMng.paybillAccount || '-'})`}
               {paymentMng.type === 'sendMoney' && `Send Money - Phone: ${paymentMng.phoneNumber || 'Not Set'}`}
               {!paymentMng.type && 'No Gateway Configured'}
            </div>
         </div>
         <Button variant="ghost" size="icon" onClick={() => setShowPaymentSettings(true)} className="opacity-50 group-hover:opacity-100 transition-opacity rounded-none border border-foreground/10">
            <Settings className="w-5 h-5" />
         </Button>
      </div>

      {/* Payment Settings Dialog */}
      <Dialog open={showPaymentSettings} onOpenChange={setShowPaymentSettings}>
        <DialogContent className="sm:max-w-md rounded-none border-foreground/20">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-black text-lg flex items-center gap-2">
               <Settings className="w-5 h-5" /> Payment Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Payment Type</Label>
                <select 
                  className="w-full h-10 border border-foreground/20 rounded-none bg-background px-3 text-sm font-medium"
                  value={paymentType || ''}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                >
                   <option value="till">Buy Goods (Till Number)</option>
                   <option value="paybill">Paybill</option>
                   <option value="sendMoney">Send Money (Personal Number)</option>
                </select>
             </div>
             
             {paymentType === 'till' && (
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Till Number</Label>
                  <Input placeholder="123456" className="rounded-none border-foreground/20" value={tillNumber} onChange={e => setTillNumber(e.target.value)} />
               </div>
             )}

             {paymentType === 'paybill' && (
               <>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest">Paybill Business Number</Label>
                    <Input placeholder="123456" className="rounded-none border-foreground/20" value={paybillNumber} onChange={e => setPaybillNumber(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest">Account Number</Label>
                    <Input placeholder="e.g. Shop1" className="rounded-none border-foreground/20" value={paybillAccount} onChange={e => setPaybillAccount(e.target.value)} />
                 </div>
               </>
             )}

             {paymentType === 'sendMoney' && (
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Phone Number</Label>
                  <Input placeholder="07XXXXXXXX" className="rounded-none border-foreground/20" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
               </div>
             )}

             <Button onClick={handleSavePaymentConfig} className="w-full rounded-none font-bold uppercase tracking-widest h-12 bg-foreground text-background mt-4 hover:bg-foreground/90">
               Save Configuration
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-md rounded-none border-foreground/20">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-black text-lg text-orange-600 flex items-center gap-2">
               <ArrowUpRight className="w-5 h-5" /> Withdraw Funds
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider">
               Transfer Paystack funds to M-Pesa / Bank
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Amount to Withdraw (KES)</Label>
                <Input type="number" placeholder="1000" className="rounded-none border-foreground/20 text-lg font-bold" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Destination (M-Pesa Number)</Label>
                <Input placeholder="07XXXXXXXX" className="rounded-none border-foreground/20" value={withdrawDestination} onChange={e => setWithdrawDestination(e.target.value)} />
             </div>
             <div className="space-y-2 pt-4 border-t border-foreground/10">
                <Label className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-1"><Lock className="w-3 h-3"/> Admin PIN Required</Label>
                <Input type="password" placeholder="****" maxLength={4} className="rounded-none border-foreground/20 text-center text-xl tracking-widest" value={adminPin} onChange={e => setAdminPin(e.target.value)} />
             </div>
             <Button onClick={handleWithdraw} disabled={isWithdrawing} className="w-full rounded-none font-bold uppercase tracking-widest h-12 bg-orange-600 hover:bg-orange-700 text-white mt-4">
               {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authorize Withdrawal"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="sm:max-w-md rounded-none border-foreground/20">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest font-black text-lg text-emerald-600 flex items-center gap-2">
               <ArrowDownLeft className="w-5 h-5" /> Top Up Wallet
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider">
               Send STK Push to deposit via M-Pesa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Amount to Deposit (KES)</Label>
                <Input type="number" placeholder="1000" className="rounded-none border-foreground/20 text-lg font-bold" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Your M-Pesa Number (For STK Push)</Label>
                <Input placeholder="07XXXXXXXX" className="rounded-none border-foreground/20" value={depositPhone} onChange={e => setDepositPhone(e.target.value)} />
             </div>
             <Button onClick={handleDeposit} disabled={isDepositing} className="w-full rounded-none font-bold uppercase tracking-widest h-12 bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
               {isDepositing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send STK Push"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
