import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, MapPin, Users, TrendingUp, Search, Phone, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

interface SupermarketsViewProps {
    onSelect: (business: any) => void;
}

export const SupermarketsView: React.FC<SupermarketsViewProps> = ({ onSelect }) => {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/developer/businesses');
            const data = await res.json();
            if (data.success) {
                setBusinesses(data.businesses);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const filteredBusinesses = businesses.filter(b => 
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.manager?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Supermarket Directory</h2>
                    <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Manage {businesses.length} registered facilities</p>
                </div>
                <div className="w-full md:w-auto flex items-center gap-2">
                    <Input 
                        placeholder="Search facilities..." 
                        className="w-full md:w-64 h-12 bg-white rounded-md border-slate-300 focus-visible:ring-indigo-500 text-xs font-bold uppercase tracking-widest"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-[10px] uppercase tracking-widest font-bold text-slate-900/40 border border-dashed border-black/20">LOADING DIRECTORY...</div>
            ) : filteredBusinesses.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-black/20 text-slate-900/40">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Facilities Found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBusinesses.map(biz => (
                        <div 
                            key={biz.id} 
                            className="bg-white border-2 border-black hover:bg-slate-50 cursor-pointer transition-all rounded-none group flex flex-col"
                            onClick={() => onSelect(biz)}
                        >
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        {biz.logo && biz.logo.startsWith('http') ? (
                                            <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        ) : (
                                            <Store className="w-6 h-6 text-slate-900/40" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 uppercase tracking-wider truncate max-w-[180px]">{biz.name}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {biz.location || 'Location Not Set'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-center justify-between border-b border-slate-200/10 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/40">Manager</span>
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{biz.manager?.name || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-200/10 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/40">Contact</span>
                                    <span className="text-xs font-bold text-slate-900">{biz.phone || biz.manager?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900/40">Email</span>
                                    <span className="text-[10px] font-bold text-slate-900 lowercase">{biz.email || biz.manager?.email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 border-t border-black bg-slate-50">
                                <div className="p-4 border-r border-black text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-1">Users</p>
                                    <p className="text-lg font-bold text-slate-900">{biz.userCount || 0}</p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 mb-1">Revenue</p>
                                    <p className="text-sm font-bold text-slate-900 flex items-center justify-center h-full">KES {biz.totalRevenue?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
