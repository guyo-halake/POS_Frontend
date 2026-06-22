import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Circle, Clock, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

export const SupportInboxView: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            const res = await apiFetch('/api/developer/tickets');
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 15000);
        return () => clearInterval(interval);
    }, []);

    const markResolved = async (id: string) => {
        try {
            const res = await apiFetch(`/api/developer/tickets/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });
            if (res.ok) {
                toast.success('Ticket marked as resolved');
                fetchTickets();
            }
        } catch (e) {
            toast.error('Network error');
        }
    };

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Support Inbox</h2>
                <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Incoming tickets from POS clients</p>
            </div>

            {loading ? (
                <div className="p-12 text-center text-[10px] uppercase tracking-widest font-bold text-slate-900/40 border border-dashed border-black/20">LOADING TICKETS...</div>
            ) : tickets.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-black/20 text-slate-900/40">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">Inbox Zero</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className={`p-6 border-2 transition-colors ${ticket.status === 'resolved' ? 'border-slate-100 bg-slate-50 opacity-75' : 'border-black bg-white'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        {ticket.status === 'resolved' ? <CheckCircle2 className="w-4 h-4 text-slate-900/50" /> : <Circle className="w-4 h-4 text-slate-900 fill-black" />}
                                        <h3 className={`text-lg font-bold tracking-tight uppercase ${ticket.status === 'resolved' ? 'line-through text-slate-900/50' : 'text-slate-900'}`}>{ticket.subject}</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-900/60 bg-slate-50 px-3 py-1 w-fit">
                                        <Building className="w-3 h-3" /> {ticket.business_name} • From: {ticket.sender_name || 'System User'}
                                    </div>
                                    <p className={`text-sm font-medium whitespace-pre-wrap ${ticket.status === 'resolved' ? 'text-slate-900/50' : 'text-slate-900/80'}`}>{ticket.message}</p>
                                </div>
                                
                                {ticket.status !== 'resolved' && (
                                    <Button onClick={() => markResolved(ticket.id)} className="shrink-0 rounded-none bg-black text-white hover:bg-black/80 text-[10px] font-bold uppercase tracking-widest px-6 h-10">
                                        Mark Resolved
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
