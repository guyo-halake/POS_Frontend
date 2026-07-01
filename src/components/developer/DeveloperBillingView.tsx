import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DeveloperBillingView = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Billing & Subscriptions</h2>
                <p className="text-sm text-slate-500 mt-1">Manage tenant MRR and recurring SaaS payments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-200 shadow-sm rounded-md">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current MRR</p>
                    <h3 className="text-3xl font-bold tracking-tight">KES 145,000</h3>
                    <p className="text-xs text-emerald-600 mt-2 font-medium">+12% from last month</p>
                </Card>
                <Card className="p-6 border-slate-200 shadow-sm rounded-md">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Subscriptions</p>
                    <h3 className="text-3xl font-bold tracking-tight">42</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Out of 45 registered tenants</p>
                </Card>
                <Card className="p-6 border-slate-200 shadow-sm rounded-md">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Invoices</p>
                    <h3 className="text-3xl font-bold tracking-tight">3</h3>
                    <p className="text-xs text-red-600 mt-2 font-medium">KES 15,000 outstanding</p>
                </Card>
            </div>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Recent Invoices</h3>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Download className="w-3 h-3 mr-2" /> Download CSV
                    </Button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">Tenant</th>
                            <th className="px-6 py-3 font-medium">Plan</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[
                            { id: 1, name: 'Fresh Fity Supermarket', plan: 'Pro', amount: 'KES 5,000', status: 'paid' },
                            { id: 2, name: 'Rosemary POS Retail', plan: 'Enterprise', amount: 'KES 15,000', status: 'pending' },
                            { id: 3, name: 'QuickMart Westlands', plan: 'Starter', amount: 'KES 2,500', status: 'paid' }
                        ].map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                <td className="px-6 py-4 text-slate-500">{row.plan}</td>
                                <td className="px-6 py-4 font-mono">{row.amount}</td>
                                <td className="px-6 py-4">
                                    <Badge variant={row.status === 'paid' ? 'default' : 'destructive'} className={row.status === 'paid' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}>
                                        {row.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        View <ExternalLink className="w-3 h-3 ml-2" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
