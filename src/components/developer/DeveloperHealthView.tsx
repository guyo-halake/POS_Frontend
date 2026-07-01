import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DeveloperHealthView = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">System Health & Errors</h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time cluster monitoring and error telemetry.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    All Systems Operational
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'API Uptime', value: '99.99%', status: 'optimal' },
                    { label: 'DB Latency', value: '42ms', status: 'optimal' },
                    { label: 'SMTP Queue', value: '0', status: 'optimal' },
                    { label: 'Gemini AI', value: 'Degraded', status: 'warning' },
                ].map((stat, i) => (
                    <Card key={i} className="p-4 border-slate-200 shadow-sm rounded-md flex flex-col justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <div className="mt-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold tracking-tight">{stat.value}</h3>
                            {stat.status === 'optimal' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-800">Recent Error Logs</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {[
                        { time: '2 mins ago', type: 'API_TIMEOUT', message: 'Gemini API exceeded 10000ms timeout during report generation.', tenant: 'UUID-9823-A4' },
                        { time: '14 mins ago', type: 'SMTP_FAIL', message: 'Failed to dispatch email to client. Invalid recipient address.', tenant: 'UUID-1002-B8' },
                        { time: '1 hour ago', type: 'DB_SYNC_ERR', message: 'Supabase constraint violation on sales_receipt_id duplicate.', tenant: 'UUID-5511-X1' },
                    ].map((log, i) => (
                        <div key={i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                            <div className="mt-1">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive" className="text-[10px] font-mono rounded-sm px-1.5 py-0">{log.type}</Badge>
                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {log.time}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">{log.message}</p>
                                <p className="text-xs font-mono text-slate-400">Tenant: {log.tenant}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
