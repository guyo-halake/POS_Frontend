import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, MapPin, Users, TrendingUp, Search, Phone, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { SupermarketDetailsModal } from './SupermarketDetailsModal';

export const SupermarketsView: React.FC = () => {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">All Supermarkets</h2>
                    <p className="text-sm text-slate-500">Manage {businesses.length} registered businesses.</p>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        placeholder="Search by name or manager..." 
                        className="pl-9 w-[250px] bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[200px] bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredBusinesses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No supermarkets found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBusinesses.map(biz => (
                        <Card 
                            key={biz.id} 
                            className="group hover:border-slate-300 hover:shadow-md transition-all cursor-pointer overflow-hidden border-slate-200"
                            onClick={() => setSelectedBusiness(biz)}
                        >
                            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                                            {biz.logo && biz.logo.startsWith('http') ? (
                                                <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 truncate max-w-[180px]" title={biz.name}>{biz.name}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {biz.location || 'Location Not Set'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <span className="w-8 flex justify-center"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">{biz.manager?.name?.charAt(0) || '?'}</div></span>
                                        <span className="font-medium text-slate-900 truncate flex-1 ml-2">{biz.manager?.name || 'No Manager'}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Manager</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500">
                                        <span className="w-8 flex justify-center"><Phone className="w-3.5 h-3.5" /></span>
                                        <span className="truncate flex-1 ml-2">{biz.phone || biz.manager?.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500">
                                        <span className="w-8 flex justify-center"><Mail className="w-3.5 h-3.5" /></span>
                                        <span className="truncate flex-1 ml-2">{biz.email || biz.manager?.email || 'No email'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                                    <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <Users className="w-3.5 h-3.5" /> Active Staff
                                        </div>
                                        <span className="font-bold text-slate-900">{biz.userCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-emerald-50 rounded-lg">
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-1">
                                            <TrendingUp className="w-3.5 h-3.5" /> Total Sales
                                        </div>
                                        <span className="font-bold text-emerald-700 text-sm">KES {biz.totalRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedBusiness && (
                <SupermarketDetailsModal 
                    business={selectedBusiness} 
                    open={!!selectedBusiness} 
                    onClose={() => setSelectedBusiness(null)}
                    onRefresh={fetchBusinesses}
                />
            )}
        </div>
    );
};
