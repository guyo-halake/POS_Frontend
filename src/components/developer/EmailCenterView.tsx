import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, LayoutTemplate, Plus, Trash2, Edit2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { toast } from 'sonner';

export const EmailCenterView: React.FC = () => {
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [templates, setTemplates] = useState<any[]>([]);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<any>(null);

    const fetchTemplates = async () => {
        try {
            const res = await apiFetch('/api/developer/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (e) {
            console.error("Failed to fetch templates", e);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleApplyTemplate = (tpl: any) => {
        setSubject(tpl.subject);
        setMessage(tpl.body);
    };

    const handleSaveTemplate = async () => {
        if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.body) {
            toast.error("Please fill in all template fields");
            return;
        }

        try {
            const url = currentTemplate.id ? `/api/developer/templates/${currentTemplate.id}` : `/api/developer/templates`;
            const method = currentTemplate.id ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTemplate)
            });

            if (res.ok) {
                toast.success(`Template ${currentTemplate.id ? 'updated' : 'created'} successfully`);
                setIsEditingTemplate(false);
                setCurrentTemplate(null);
                fetchTemplates();
            } else {
                toast.error("Failed to save template");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await apiFetch(`/api/developer/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Template deleted");
                fetchTemplates();
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleSend = async () => {
        if (!recipient || !subject || !message) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSending(true);
        try {
            const res = await apiFetch('/api/developer/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: recipient, subject, message })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.simulated) {
                    toast.info(data.message);
                } else {
                    toast.success("Email sent successfully!");
                }
                setRecipient('');
                setSubject('');
                setMessage('');
            } else {
                toast.error(data.error || "Failed to send email");
            }
        } catch (e) {
            toast.error("Network error while sending email");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-3xl font-bold tracking-tighter uppercase text-slate-900">Email Operations</h2>
                <p className="text-xs font-bold tracking-widest text-slate-900/50 uppercase mt-2">Dispatch dynamically driven notifications and campaigns</p>
            </div>

            {isEditingTemplate ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-900 mb-6 border-b border-slate-200/10 pb-4">
                        <LayoutTemplate className="w-5 h-5" /> {currentTemplate.id ? 'Edit Template' : 'New Template'}
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Template Name</Label>
                            <Input 
                                value={currentTemplate.name}
                                onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                                className="rounded-md border-slate-300 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Email Subject</Label>
                            <Input 
                                value={currentTemplate.subject}
                                onChange={e => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
                                className="rounded-md border-slate-300 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">HTML Body</Label>
                            <textarea 
                                className="flex min-h-[250px] w-full rounded-none border border-black bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                                value={currentTemplate.body}
                                onChange={e => setCurrentTemplate({...currentTemplate, body: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setIsEditingTemplate(false)} className="rounded-none border-black text-slate-900 hover:bg-slate-50 text-xs font-bold uppercase tracking-widest px-8">CANCEL</Button>
                            <Button onClick={handleSaveTemplate} className="rounded-none bg-black hover:bg-black/80 text-white text-xs font-bold uppercase tracking-widest px-8">
                                SAVE TEMPLATE
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Editor */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-900">
                                <Mail className="w-5 h-5" /> Dispatch Console
                            </h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Recipient Email</Label>
                                <Input 
                                    placeholder="user@example.com" 
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    className="rounded-md border-slate-300 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Subject</Label>
                                <Input 
                                    placeholder="Email Subject" 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="rounded-md border-slate-300 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-900">Message (HTML Supported)</Label>
                                <textarea 
                                    className="flex min-h-[250px] w-full rounded-none border border-black bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                                    placeholder="<p>Type your message here...</p>"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <Button onClick={handleSend} disabled={isSending} className="rounded-none bg-black hover:bg-black/80 text-white text-xs font-bold uppercase tracking-widest h-12 px-8 w-full sm:w-auto">
                                    <Send className="w-4 h-4 mr-2" /> {isSending ? 'DISPATCHING...' : 'DISPATCH NOW'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Templates Sidebar */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-slate-900/50" /> Database Templates
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => { setIsEditingTemplate(true); setCurrentTemplate({ name: '', subject: '', body: '' }); }} className="h-6 px-2 rounded-none hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest">
                                <Plus className="w-3 h-3 mr-1" /> New
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {templates.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-black/20 text-[10px] font-bold uppercase tracking-widest text-slate-900/40">
                                    No templates stored
                                </div>
                            ) : (
                                templates.map((tpl) => (
                                    <div 
                                        key={tpl.id}
                                        className="text-left p-4 rounded-none border border-black/20 bg-white hover:border-black transition-all group flex flex-col justify-between cursor-pointer"
                                        onClick={() => handleApplyTemplate(tpl)}
                                    >
                                        <div>
                                            <p className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-1">{tpl.name}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900/50 line-clamp-2">{tpl.subject}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-50 rounded-none" onClick={(e) => { e.stopPropagation(); setCurrentTemplate(tpl); setIsEditingTemplate(true); }}>
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 rounded-none" onClick={(e) => handleDeleteTemplate(tpl.id, e)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
