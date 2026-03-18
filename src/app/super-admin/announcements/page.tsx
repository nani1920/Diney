'use client';

import { useState, useEffect } from 'react';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '@/app/actions/super-admin';
import { AlertCircle, Trash2, Megaphone, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', message: '', type: 'info' });

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setIsLoading(true);
        const result = await getAnnouncements();
        if (result.success) {
            setAnnouncements(result.data || []);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await createAnnouncement(formData.title, formData.message, formData.type);
        if (result.success) {
            setFormData({ title: '', message: '', type: 'info' });
            loadAnnouncements();
        } else {
            alert(result.error || 'Failed to create announcement');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        const result = await deleteAnnouncement(id);
        if (result.success) {
            loadAnnouncements();
        } else {
            alert(result.error || 'Failed to delete announcement');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <header>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-red-500 text-black rounded-2xl ring-8 ring-red-500/10">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase underline decoration-red-500 decoration-4 underline-offset-4">
                        Broadcaster
                    </h1>
                </div>
                <p className="text-neutral-500 font-medium text-lg ml-1">Send priority alerts to all merchant dashboards.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                { }
                <div className="bg-[#0d0d0d] border border-white/5 p-8 rounded-[2rem] space-y-6 h-fit sticky top-8">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Post New Announcement
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Alert Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Platform Update, Maintenance, etc."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Alert Type</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['info', 'warning', 'success', 'error'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={clsx(
                                            "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                            formData.type === type 
                                                ? "bg-white text-black border-white" 
                                                : "bg-white/5 text-neutral-500 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Message Content</label>
                            <textarea 
                                required
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Details about this announcement..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-500 transition-colors font-medium text-neutral-300 resize-none"
                            />
                        </div>
                        <button 
                            disabled={isSubmitting}
                            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                            Broadcast Message
                        </button>
                    </form>
                </div>

                { }
                <div className="space-y-6">
                    <h2 className="text-xl font-bold px-2">Recent Broadcasts</h2>
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] p-12 text-center text-neutral-600 italic">
                            No active announcements.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((ann) => (
                                <div key={ann.id} className="bg-[#0d0d0d] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">{getTypeIcon(ann.type)}</div>
                                            <div>
                                                <h3 className="font-bold text-lg">{ann.title}</h3>
                                                <p className="text-neutral-500 text-sm mt-1 leading-relaxed">{ann.message}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mt-4 italic">
                                                    Sent {new Date(ann.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(ann.id)}
                                            className="p-2 text-neutral-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
