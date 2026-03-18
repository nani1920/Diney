import { Settings as SettingsIcon, ShieldCheck, Globe, Database, Bell } from 'lucide-react';

export default function PlatformSettingsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <header>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase underline decoration-red-500 decoration-4 underline-offset-4">
                    Platform Control
                </h1>
                <p className="text-neutral-500 mt-4 font-medium text-lg">Configure global settings and platform-wide parameters.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                { }
                <div className="bg-[#0d0d0d] border border-white/5 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold">General Configuration</h2>
                    </div>
                    <div className="space-y-4">
                        <SettingItem 
                            icon={Globe} 
                            label="Global Domain" 
                            value="qrsaas.com" 
                            description="Main platform entry point"
                        />
                        <SettingItem 
                            icon={ShieldCheck} 
                            label="Security Level" 
                            value="High (Strict)" 
                            description="Supabase RLS & Admin policies"
                        />
                    </div>
                </div>

                { }
                <div className="bg-[#0d0d0d] border border-white/5 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <Database className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold">Infrastructure</h2>
                    </div>
                    <div className="space-y-4">
                        <SettingItem 
                            icon={Database} 
                            label="Database" 
                            value="Supabase (PostgreSQL)" 
                            description="Persistent storage backend"
                        />
                        <SettingItem 
                            icon={Bell} 
                            label="Notifications" 
                            value="Enabled" 
                            description="Global event broadcasting"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2rem] text-center">
                <p className="text-neutral-500 font-medium">More advanced platform controls are currently in development.</p>
            </div>
        </div>
    );
}

function SettingItem({ icon: Icon, label, value, description }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-4">
                <Icon className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-none mt-1">{description}</p>
                </div>
            </div>
            <div className="text-sm font-mono text-red-400 bg-red-400/5 px-3 py-1 rounded-full border border-red-400/10 italic">
                {value}
            </div>
        </div>
    );
}
