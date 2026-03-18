'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QRCode } from 'react-qrcode-logo';
import { 
    Download, 
    Printer, 
    Palette, 
    Image as ImageIcon, 
    RefreshCcw,
    Check
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function QRGeneratorPage() {
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const qrRef = useRef<any>(null);

    // QR State
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [eyeColor, setEyeColor] = useState('#000000');
    const [logoUrl, setLogoUrl] = useState('');
    const [eyeRadius, setEyeRadius] = useState(8);
    const [qrStyle, setQrStyle] = useState<'squares' | 'dots'>('squares');

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const shopUrl = `${protocol}://${tenantSlug}.${baseDomain}`;

    const handleDownload = () => {
        const canvas = document.getElementById('react-qrcode-logo') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${tenantSlug}-qr-code.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const resetDefaults = () => {
        setFgColor('#000000');
        setBgColor('#ffffff');
        setEyeColor('#000000');
        setEyeRadius(8);
        setQrStyle('squares');
        setLogoUrl('');
    };

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                        QR <span className="text-green-500">Engine</span>
                    </h1>
                    <p className="text-neutral-500 font-medium">Customize your shop's bridge to the digital world.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Download PNG
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-white border-2 border-black px-6 py-3 rounded-2xl font-bold hover:bg-neutral-50 transition-all active:scale-95"
                    >
                        <Printer className="w-5 h-5" />
                        Print Mode
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Preview Section */}
                <div className="space-y-6 print:m-0 print:p-0 print:block">
                    <div className="bg-neutral-50 border-2 border-black rounded-[2.5rem] p-12 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group print:bg-white print:border-0 print:p-0">
                        {/* Decorative background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity print:hidden">
                            <div className="grid grid-cols-10 gap-4 p-4 text-black">
                                {Array.from({ length: 100 }).map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-current" />
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl shadow-black/5 border border-neutral-100 print:shadow-none print:p-0">
                            <QRCode
                                id="react-qrcode-logo"
                                value={shopUrl}
                                logoImage={logoUrl}
                                logoWidth={60}
                                logoHeight={60}
                                logoOpacity={1}
                                qrStyle={qrStyle}
                                eyeRadius={[
                                    { outer: [eyeRadius, eyeRadius, eyeRadius, eyeRadius], inner: [eyeRadius/2, eyeRadius/2, eyeRadius/2, eyeRadius/2] },
                                    { outer: [eyeRadius, eyeRadius, eyeRadius, eyeRadius], inner: [eyeRadius/2, eyeRadius/2, eyeRadius/2, eyeRadius/2] },
                                    { outer: [eyeRadius, eyeRadius, eyeRadius, eyeRadius], inner: [eyeRadius/2, eyeRadius/2, eyeRadius/2, eyeRadius/2] }
                                ]}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                eyeColor={eyeColor}
                                size={300}
                                quietZone={10}
                            />
                        </div>

                        <div className="mt-8 text-center print:hidden">
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Target URL</p>
                            <code className="text-lg font-mono font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100 italic">
                                {tenantSlug}.{baseDomain}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="space-y-8 print:hidden">
                    {/* Style Selection */}
                    <section className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-neutral-500">
                            <Palette className="w-4 h-4" /> Styling Pattern
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setQrStyle('squares')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${qrStyle === 'squares' ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-black'}`}
                            >
                                <div className="grid grid-cols-2 gap-0.5">
                                    <div className="w-2 h-2 bg-current" />
                                    <div className="w-2 h-2 bg-current" />
                                    <div className="w-2 h-2 bg-current" />
                                    <div className="w-2 h-2 bg-current" />
                                </div>
                                Classic Square
                            </button>
                            <button 
                                onClick={() => setQrStyle('dots')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${qrStyle === 'dots' ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-black'}`}
                            >
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                </div>
                                Modern Dot
                            </button>
                        </div>
                    </section>

                    {/* Colors */}
                    <section className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-neutral-500">Color Palette</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorInput label="Main Color" value={fgColor} onChange={setFgColor} />
                            <ColorInput label="Eye Color" value={eyeColor} onChange={setEyeColor} />
                        </div>
                    </section>

                    {/* Logo */}
                    <section className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-neutral-500">
                            <ImageIcon className="w-4 h-4" /> Brand Centering
                        </label>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                placeholder="Paste logo URL (optional)" 
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="flex-1 bg-white border-2 border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black transition-all font-medium"
                            />
                            <button 
                                onClick={() => setLogoUrl('')}
                                className="p-4 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-all"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-medium">Use a square logo with a transparent background for best results.</p>
                    </section>

                    {/* Corner Radius */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-black uppercase tracking-widest text-neutral-500">Corner Softness</label>
                            <span className="text-xs font-bold text-neutral-400">{eyeRadius}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="25" 
                            value={eyeRadius}
                            onChange={(e) => setEyeRadius(parseInt(e.target.value))}
                            className="w-full accent-black"
                        />
                    </section>

                    {/* Reset */}
                    <button 
                        onClick={resetDefaults}
                        className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-red-500 transition-colors"
                    >
                        Reset to default settings
                    </button>
                </div>
            </div>

            {/* Print Only Info */}
            <div className="hidden print:block text-center mt-10">
                <h2 className="text-3xl font-black">{params.tenantSlug}</h2>
                <p className="text-neutral-500">Scan to view our digital menu</p>
                <p className="font-mono text-sm mt-2">{shopUrl}</p>
            </div>
        </div>
    );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 flex items-center justify-between hover:border-neutral-300 transition-all">
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</p>
                <p className="font-mono font-bold text-sm uppercase">{value}</p>
            </div>
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-neutral-100 p-0">
                <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -inset-2 w-14 h-14 cursor-pointer"
                />
            </div>
        </div>
    );
}
