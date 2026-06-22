import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Store, Users, Mail, Database, MessageSquare } from "lucide-react";
import { toast } from 'sonner';

import { DeveloperOverviewView } from './DeveloperOverviewView';
import { SupermarketsView } from './SupermarketsView';
import { SupermarketDetailView } from './SupermarketDetailView';
import { DeveloperUsersView } from './DeveloperUsersView';
import { EmailCenterView } from './EmailCenterView';
import { DeveloperDatabaseView } from './DeveloperDatabaseView';
import { SupportInboxView } from './SupportInboxView';

export const DeveloperDashboard: React.FC = () => {
    const { logout, setActiveBusiness, fetchProducts } = useStore();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'supermarkets' | 'users' | 'email' | 'inbox' | 'database'>('dashboard');
    const [debugBusinessId, setDebugBusinessId] = useState('');
    const [selectedSupermarket, setSelectedSupermarket] = useState<any>(null);

    const handleSwitchContext = async () => {
        if (!debugBusinessId) {
             setActiveBusiness('11111111-1111-1111-1111-111111111111');
             toast.info("Switched to Default Business");
        } else {
            setActiveBusiness(debugBusinessId);
            toast.success(`Switched context to Business ID: ${debugBusinessId}`);
        }
        await fetchProducts();
    };

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
        { id: 'supermarkets', icon: Store, label: 'Supermarkets' },
        { id: 'users', icon: Users, label: 'Access Control' },
        { id: 'email', icon: Mail, label: 'Email Templates' },
        { id: 'inbox', icon: MessageSquare, label: 'Support Tickets' },
        { id: 'database', icon: Database, label: 'Database & Sync' },
    ];

    return (
        <div className="flex h-screen bg-white overflow-hidden text-slate-900 font-sans selection:bg-black selection:text-white">
            {/* Minimalist Sidebar */}
            <aside className="w-64 border-r border-slate-100 flex flex-col hidden md:flex">
                <div className="p-8 pb-4">
                    <h2 className="text-xl font-bold tracking-tighter uppercase text-slate-900">
                        System OS
                    </h2>
                    <p className="text-[10px] uppercase tracking-widest text-slate-900/40 mt-1 font-bold">Admin Console</p>
                </div>

                <div className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as any);
                                setSelectedSupermarket(null); // Reset detail view
                            }}
                            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium transition-all rounded-md ${
                                activeTab === item.id 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'text-slate-900/60 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon className="w-4 h-4 mr-3" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-900/40 uppercase tracking-widest px-2">Override Mode</p>
                        <div className="flex flex-col gap-2">
                            <input 
                                className="w-full text-xs px-3 py-2 rounded-md border border-black/20 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-transparent" 
                                placeholder="UUID Override" 
                                value={debugBusinessId}
                                onChange={(e) => setDebugBusinessId(e.target.value)}
                            />
                            <button className="w-full text-xs font-bold py-2 border border-black hover:bg-black hover:text-white transition-colors rounded-md" onClick={handleSwitchContext}>
                                APPLY
                            </button>
                        </div>
                    </div>
                    
                    <button className="w-full flex items-center justify-center py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" /> EXIT SYSTEM
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#fafafa]">
                <div className="flex-1 overflow-y-auto p-4 md:p-12 pb-24">
                    <div className="max-w-7xl mx-auto h-full">
                        {selectedSupermarket ? (
                            <SupermarketDetailView business={selectedSupermarket} onBack={() => setSelectedSupermarket(null)} />
                        ) : (
                            <>
                                {activeTab === 'dashboard' && <DeveloperOverviewView />}
                                {activeTab === 'supermarkets' && <SupermarketsView onSelect={setSelectedSupermarket} />}
                                {activeTab === 'users' && <DeveloperUsersView />}
                                {activeTab === 'email' && <EmailCenterView />}
                                {activeTab === 'inbox' && <SupportInboxView />}
                                {activeTab === 'database' && <DeveloperDatabaseView />}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
