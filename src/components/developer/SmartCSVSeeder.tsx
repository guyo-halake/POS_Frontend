import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import Papa from 'papaparse';

interface SmartCSVSeederProps {
    businessId: string;
    type: 'products' | 'users';
    onComplete: () => void;
}

export const SmartCSVSeeder: React.FC<SmartCSVSeederProps> = ({ businessId, type, onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    
    // Mapping of Required DB fields -> CSV Headers
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isSeeding, setIsSeeding] = useState(false);

    const requiredFields = type === 'products' 
        ? [
            { key: 'name', label: 'Product Name', required: true },
            { key: 'price', label: 'Selling Price', required: true },
            { key: 'buying_price', label: 'Buying Price (Cost)', required: false },
            { key: 'category', label: 'Category', required: false },
            { key: 'stock', label: 'Current Stock', required: false }
        ]
        : [
            { key: 'name', label: 'Full Name', required: true },
            { key: 'email', label: 'Email Address', required: true },
            { key: 'pin', label: 'Login PIN (Password)', required: true },
            { key: 'role', label: 'Role (e.g. cashier)', required: true }
        ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields) {
                    setHeaders(results.meta.fields);
                    setData(results.data);
                    
                    // Smart auto-map
                    const newMapping: Record<string, string> = {};
                    requiredFields.forEach(f => {
                        const match = results.meta.fields?.find(csvHeader => 
                            csvHeader.toLowerCase().includes(f.key.toLowerCase()) || 
                            f.label.toLowerCase().includes(csvHeader.toLowerCase())
                        );
                        if (match) newMapping[f.key] = match;
                    });
                    setMapping(newMapping);
                }
            }
        });
    };

    const handleSeed = async () => {
        // Validate mapping
        const missing = requiredFields.filter(f => f.required && !mapping[f.key]);
        if (missing.length > 0) {
            toast.error(`Please map required fields: ${missing.map(m => m.label).join(', ')}`);
            return;
        }

        setIsSeeding(true);
        try {
            // Transform data based on mapping
            const payload = data.map(row => {
                const mappedRow: any = { business_id: businessId };
                requiredFields.forEach(f => {
                    mappedRow[f.key] = mapping[f.key] ? row[mapping[f.key]] : undefined;
                });
                return mappedRow;
            });

            const res = await apiFetch(`/api/developer/seed-${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            if (res.ok) {
                toast.success(`Successfully seeded ${payload.length} ${type}!`);
                onComplete();
            } else {
                const err = await res.json();
                toast.error(err.error || `Failed to seed ${type}`);
            }
        } catch (e) {
            console.error(e);
            toast.error("Network error during seeding");
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            {!file ? (
                <div className="border-2 border-dashed border-slate-200 p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer relative rounded-xl">
                    <input 
                        type="file" 
                        accept=".csv" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-xl font-bold tracking-tighter uppercase text-slate-900 mb-2">Upload {type} CSV</h3>
                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Drag and drop or click to browse</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{file.name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{data.length} records found</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setFile(null)} className="rounded-md border-slate-200 text-slate-900 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest h-8">
                            Change File
                        </Button>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4">Map Columns</h4>
                        <div className="grid gap-4">
                            {requiredFields.map(field => (
                                <div key={field.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-900">{field.label}</p>
                                        {field.required && <span className="text-[10px] font-bold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">Required</span>}
                                    </div>
                                    <select 
                                        className="w-48 text-xs p-2 border border-slate-200 bg-white font-bold text-slate-900 focus:border-indigo-500 outline-none rounded-md"
                                        value={mapping[field.key] || ''}
                                        onChange={(e) => setMapping(m => ({...m, [field.key]: e.target.value}))}
                                    >
                                        <option value="">-- Ignore --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button 
                        className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-sm font-bold uppercase tracking-widest shadow-sm"
                        onClick={handleSeed}
                        disabled={isSeeding}
                    >
                        {isSeeding ? 'SEEDING...' : `CONFIRM & SEED ${data.length} ${type.toUpperCase()}`}
                    </Button>
                </div>
            )}
        </div>
    );
};
