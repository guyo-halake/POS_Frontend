import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, Download, Cloud, ShieldCheck } from 'lucide-react';

export const DeveloperDatabaseView: React.FC = () => {

    const handleDownloadBackup = () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        window.open(`${API_URL}/api/developer/backup`, '_blank');
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="border-b border-black pb-4">
                <h2 className="text-3xl font-bold tracking-tighter uppercase text-black">Database & Infrastructure</h2>
                <p className="text-xs font-bold tracking-widest text-black/50 uppercase mt-2">Manage offline backups and system synchronization</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                <div className="mb-6 border-b border-black/10 pb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-black">
                        <Database className="w-5 h-5" /> Offline Database Backup
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-black/50 mt-2">
                        Download a complete copy of the primary edge SQLite database for offline safekeeping.
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 p-6 bg-black/5 items-start md:items-center justify-between border border-black/10">
                    <div>
                        <p className="font-bold text-black uppercase tracking-wider text-sm">pos.db (SQLite Format)</p>
                        <p className="text-[10px] text-black/60 uppercase tracking-widest font-bold mt-1">Contains all multi-tenant core data</p>
                    </div>
                    <Button onClick={handleDownloadBackup} className="bg-black hover:bg-black/80 text-white rounded-none uppercase tracking-widest text-xs font-bold w-full md:w-auto h-12 px-6 shrink-0">
                        <Download className="w-4 h-4 mr-2" /> Download Backup
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-black/10 rounded-none p-8">
                <div className="mb-6 border-b border-black/10 pb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-black">
                        <Cloud className="w-5 h-5" /> Cloud Synchronization
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-black/50 mt-2">
                        PostgreSQL Data Warehouse Configuration
                    </p>
                </div>
                
                <div className="p-6 bg-black text-white flex items-center gap-6">
                    <ShieldCheck className="w-10 h-10 text-white/50" />
                    <div>
                        <p className="font-bold text-white uppercase tracking-wider text-sm">Sync Active & Managed</p>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold mt-1 max-w-md">
                            Synchronization runs securely in the background via edge environment variables defined securely on the server.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
