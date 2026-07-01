import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DeveloperWebhooksView = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Payment Webhooks</h2>
                    <p className="text-sm text-slate-500 mt-1">Audit log of M-PESA and Paystack C2B events.</p>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                    <RefreshCw className="w-4 h-4 mr-2" /> Sync Ledger
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-200 shadow-sm rounded-md border-l-4 border-l-emerald-500">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total M-PESA Hooks</p>
                    <h3 className="text-3xl font-bold tracking-tight">1,204</h3>
                </Card>
                <Card className="p-6 border-slate-200 shadow-sm rounded-md border-l-4 border-l-indigo-500">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Paystack Hooks</p>
                    <h3 className="text-3xl font-bold tracking-tight">854</h3>
                </Card>
                <Card className="p-6 border-slate-200 shadow-sm rounded-md border-l-4 border-l-red-500">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Failed Deliveries</p>
                    <h3 className="text-3xl font-bold tracking-tight">2</h3>
                </Card>
            </div>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Timestamp</th>
                            <th className="px-6 py-3 font-medium">Provider</th>
                            <th className="px-6 py-3 font-medium">Ref / Trans ID</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {[
                            { time: '10:45:22 AM', provider: 'M-PESA', ref: 'QWE8923MKN', amount: 'KES 2,500', status: 'Success' },
                            { time: '10:42:10 AM', provider: 'Paystack', ref: 'pstk_9281_x2', amount: 'KES 1,200', status: 'Success' },
                            { time: '10:30:05 AM', provider: 'M-PESA', ref: 'QWE8911AAA', amount: 'KES 5,000', status: 'Success' },
                            { time: '09:15:00 AM', provider: 'Paystack', ref: 'pstk_8822_ff', amount: 'KES 800', status: 'Failed' },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">{row.time}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={row.provider === 'M-PESA' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-indigo-700 bg-indigo-50 border-indigo-200'}>
                                        {row.provider}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">{row.ref}</td>
                                <td className="px-6 py-4 text-slate-900 font-sans font-semibold">{row.amount}</td>
                                <td className="px-6 py-4">
                                    {row.status === 'Success' ? (
                                        <span className="flex items-center text-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/> OK</span>
                                    ) : (
                                        <span className="text-red-500 font-bold">FAIL</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
