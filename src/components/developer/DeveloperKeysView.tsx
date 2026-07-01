import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Key, Save, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const DeveloperKeysView = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">API Key Vault</h2>
                <p className="text-sm text-slate-500 mt-1">Manage global environment variables without redeploying the cluster.</p>
            </div>

            <Card className="p-8 border-slate-200 shadow-sm rounded-md space-y-8 bg-white">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Google Gemini API Key</Label>
                        <div className="relative">
                            <Input type="password" value="AIzaSyA88x_*******************" readOnly className="pr-10 font-mono text-sm bg-slate-50" />
                            <EyeOff className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                        </div>
                        <p className="text-[10px] text-slate-400">Used for generating AI Insights on Master PDF reports.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Global SMTP Password (Nodemailer)</Label>
                        <div className="relative">
                            <Input type="password" value="****************" readOnly className="pr-10 font-mono text-sm bg-slate-50" />
                            <EyeOff className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                        </div>
                        <p className="text-[10px] text-slate-400">App password for p3lcodes@gmail.com</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Paystack Master Secret</Label>
                        <div className="relative">
                            <Input type="password" value="sk_live_0923091092309123091" readOnly className="pr-10 font-mono text-sm bg-slate-50" />
                            <EyeOff className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <Button onClick={() => toast.success("Environment keys synced to Vercel production!")} className="bg-black hover:bg-slate-800 text-white rounded-sm h-10 px-8">
                        <Save className="w-4 h-4 mr-2" /> Sync to Edge
                    </Button>
                </div>
            </Card>
        </div>
    );
};
