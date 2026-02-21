import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Zap, ShieldCheck, Stars } from 'lucide-react';

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

export default function JoinSession() {
    const { sessionCode } = useParams();
    const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
    const navigate = useNavigate();

    useEffect(() => {
        socketService.connect();
        socketService.on('session-active', (activeSession) => {
            navigate(`/session/${activeSession.session_code}`, {
                state: { language: selectedLanguage, session: activeSession }
            });
        });

        return () => {
            socketService.off('session-active');
        };
    }, [navigate, selectedLanguage]);

    const handleJoinSession = () => {
        socketService.emit('join-session', { sessionCode, language: selectedLanguage });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/4 animate-pulse-slow" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="max-w-md w-full premium-card"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Zap className="text-primary w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Join Conversation</h2>
                    <div className="mt-4 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center space-x-2">
                        <span className="text-[10px] font-black pointer-events-none uppercase text-slate-400">Bridge Code</span>
                        <span className="font-mono font-bold text-slate-700 tracking-wider">{sessionCode}</span>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <h3 className="font-bold text-slate-800">Your Speaking Persona</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setSelectedLanguage(lang.code)}
                                    className={`relative group flex items-center space-x-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 text-left ${selectedLanguage === lang.code
                                        ? 'border-primary bg-primary/5 text-primary shadow-md'
                                        : 'border-slate-100 bg-white hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${selectedLanguage === lang.code ? 'bg-primary/10' : 'bg-slate-50'}`}>
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold flex-1">{lang.name}</span>
                                    {selectedLanguage === lang.code && (
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleJoinSession}
                        className="glow-button w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center space-x-4"
                    >
                        <span>Enter Bridge</span>
                        <ArrowRight className="w-6 h-6" />
                    </button>

                    <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span>Encrypted Sync Connection</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
