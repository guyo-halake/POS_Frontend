import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductSeederModalProps {
    open: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
}

export const ProductSeederModal: React.FC<ProductSeederModalProps> = ({ open, onClose, businessId, businessName }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        setIsParsing(true);
        setParsedData([]);

        try {
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        processParsedRows(results.data);
                        setIsParsing(false);
                    },
                    error: (error) => {
                        toast.error(`CSV Parsing Error: ${error.message}`);
                        setIsParsing(false);
                    }
                });
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = e.target?.result;
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet);
                        processParsedRows(json);
                    } catch (error: any) {
                        toast.error(`Excel Parsing Error: ${error.message}`);
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsBinaryString(file);
            } else {
                toast.error("Unsupported file type. Please upload CSV or Excel.");
                setIsParsing(false);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse file.");
            setIsParsing(false);
        }
    };

    const processParsedRows = (rows: any[]) => {
        // Map common column names to our schema
        const standardizedRows = rows.map((row: any) => {
            const getVal = (keys: string[]) => {
                for (let k of keys) {
                    const match = Object.keys(row).find(r => r.toLowerCase().trim() === k);
                    if (match) return row[match];
                }
                return null;
            };

            return {
                name: getVal(['name', 'product name', 'item', 'product']),
                category: getVal(['category', 'type', 'group']) || 'General',
                price: parseFloat(getVal(['price', 'cost', 'selling price']) || '0'),
                unit: getVal(['unit', 'measure', 'qty type']) || 'pcs',
                stock: parseInt(getVal(['stock', 'quantity', 'qty']) || '0'),
                barcode: getVal(['barcode', 'code', 'sku']) || '',
                lowStockThreshold: parseInt(getVal(['low stock', 'threshold', 'min']) || '10'),
            };
        }).filter(r => r.name); // Must have a name

        if (standardizedRows.length === 0) {
            toast.error("No valid products found. Ensure your file has a 'Name' column.");
        } else {
            setParsedData(standardizedRows);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setParsedData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (parsedData.length === 0) return;
        
        setIsUploading(true);
        try {
            const res = await apiFetch('/api/products/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-business-id': businessId
                },
                body: JSON.stringify({ products: parsedData })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Successfully seeded ${data.count} products!`);
                onClose();
            } else {
                toast.error(data.error || "Failed to seed products");
            }
        } catch (e) {
            console.error(e);
            toast.error("Network error while uploading products");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Seed Products to <span className="text-indigo-600 font-bold">{businessName}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    {!file ? (
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileChange}
                            />
                            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Click to upload CSV or Excel</h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Your file should contain columns like Name, Category, Price, Stock, and Barcode.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full border rounded-xl overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {isParsing ? 'Parsing...' : `${parsedData.length} valid products extracted`}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={clearSelection} disabled={isUploading}>
                                    <X className="w-4 h-4 mr-2" /> Clear
                                </Button>
                            </div>
                            
                            <ScrollArea className="flex-1 bg-white">
                                {isParsing ? (
                                    <div className="h-64 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : parsedData.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0 shadow-sm z-10">
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Price (KES)</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                                <TableHead>Barcode</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 50).map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{row.name}</TableCell>
                                                    <TableCell>{row.category}</TableCell>
                                                    <TableCell className="text-right">{row.price.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{row.stock} {row.unit}</TableCell>
                                                    <TableCell className="font-mono text-xs">{row.barcode || '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                                        <AlertCircle className="w-8 h-8 mb-2 text-amber-500" />
                                        <p>No valid products parsed.</p>
                                    </div>
                                )}
                            </ScrollArea>
                            {parsedData.length > 50 && (
                                <div className="p-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                                    Showing first 50 of {parsedData.length} products.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button 
                        onClick={handleUpload} 
                        disabled={parsedData.length === 0 || isUploading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Seeding Database...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Upload {parsedData.length} Products</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
