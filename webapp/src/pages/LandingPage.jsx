import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Globe, ArrowRight, Zap, Stars, Shield, Cpu, MessageSquare } from 'lucide-react';

const languages = [
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'gu-IN', name: 'Gujarati' },
];

export default function LandingPage() {
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
    const [session, setSession] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        socketService.connect();
        socketService.on('session-created', (newSession) => setSession(newSession));
        socketService.on('session-active', (activeSession) => {
            navigate(`/session/${activeSession.session_code}`, {
                state: { language: selectedLanguage, session: activeSession }
            });
        });

        return () => {
            socketService.off('session-created');
            socketService.off('session-active');
        };
    }, [navigate, selectedLanguage]);

    const handleStartSession = () => {
        socketService.emit('create-session', { language: selectedLanguage });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 animate-float" />

            <div className="relative z-10 container mx-auto px-6 py-12 xl:py-24">
                <header className="flex items-center justify-between mb-20 animate-float" style={{ animationDuration: '8s' }}>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">NEURA<span className="text-primary">TRANS</span></span>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
                    {/* Left: Content & Lang Selector */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border border-primary/20">
                            <Stars className="w-4 h-4" />
                            <span>Powered by Sarvam AI & Duplex Engine</span>
                        </div>

                        <h1 className="text-6xl xl:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
                            Break the barrier <br />
                            <span className="gradient-text">Speak in Sync.</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-12 max-w-xl leading-relaxed">
                            Start a real-time translated session. Scan, speak, and hear your voice transformed instantly into 8+ Indian languages.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-1.5 h-6 bg-primary rounded-full" />
                                <h3 className="text-lg font-bold text-slate-800">Select Your Persona Language</h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setSelectedLanguage(lang.code)}
                                        className={`group relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-300 ${selectedLanguage === lang.code
                                                ? 'border-primary bg-primary/5 text-primary shadow-lg'
                                                : 'border-slate-200 bg-white hover:border-primary/50 text-slate-500'
                                            }`}
                                    >
                                        <Globe className={`w-5 h-5 mb-2 transition-transform group-hover:rotate-12 ${selectedLanguage === lang.code ? 'text-primary' : 'text-slate-400'}`} />
                                        <span className="text-sm font-bold">{lang.name}</span>
                                        {selectedLanguage === lang.code && (
                                            <motion.div layoutId="selector" className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full shadow-lg" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {!session && (
                                <button
                                    onClick={handleStartSession}
                                    className="glow-button w-full mt-8 py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center space-x-4"
                                >
                                    <span>Initiate Translation Session</span>
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: Interaction Hub */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {session ? (
                                <motion.div
                                    key="session-hub"
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="premium-card relative z-20"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                                            <Cpu className="text-primary w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">Sync Point Ready</h3>
                                        <p className="text-slate-500 mb-10 text-center text-sm">Scan with mobile to bridge the language gap</p>

                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative bg-white p-8 rounded-[2rem] shadow-2xl">
                                                <QRCodeSVG
                                                    value={`${window.location.origin}/join/${session.session_code}`}
                                                    size={220}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-12 flex flex-col items-center w-full">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center w-full">Session Secure Link</span>
                                            <div className="flex items-center space-x-3 w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                <span className="font-mono font-bold text-slate-700 flex-1 truncate">{session.session_code}</span>
                                                <button className="text-xs font-black text-primary hover:underline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${session.session_code}`)}>COPY</button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative flex flex-col items-center"
                                >
                                    <div className="w-full aspect-square max-w-md glass rounded-[3rem] border-2 border-white/50 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#0ea5e9_0%,_transparent_70%)]"
                                        />
                                        <div className="relative z-10">
                                            <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-500">
                                                <Mic className="w-12 h-12 text-primary animate-pulse" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Waiting for Host</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed">Select your language and trigger a new bridge to generate a QR sync point.</p>
                                        </div>
                                    </div>

                                    {/* Feature Badges */}
                                    <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                                        <div className="glass p-4 rounded-2xl border-white/50 flex flex-col items-center text-center">
                                            <Shield className="w-5 h-5 text-green-500 mb-2" />
                                            <span className="text-[10px] font-black uppercase text-slate-500">Secure P2P</span>
                                        </div>
                                        <div className="glass p-4 rounded-2xl border-white/50 flex flex-col items-center text-center">
                                            <MessageSquare className="w-5 h-5 text-indigo-500 mb-2" />
                                            <span className="text-[10px] font-black uppercase text-slate-500">AI Synced</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
