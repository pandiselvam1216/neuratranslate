import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Mic, Globe, ArrowRight, Zap } from 'lucide-react';

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
        socketService.on('session-created', (newSession) => {
            setSession(newSession);
        });
        socketService.on('session-active', (activeSession) => {
            navigate(`/session/${activeSession.session_code}`, { state: { language: selectedLanguage, session: activeSession } });
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
                <div>
                    <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Zap className="w-4 h-4" />
                        <span>Real-time Duplex Translation</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                        Neura<span className="gradient-text">Translate</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Experience natural, bidirectional conversations across languages with near-zero latency. Speak, hear, and connect instantly.
                    </p>

                    <div className="space-y-4">
                        <label className="block font-semibold text-slate-700">Select Your Language</label>
                        <div className="grid grid-cols-2 gap-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setSelectedLanguage(lang.code)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all ${selectedLanguage === lang.code
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-white bg-white text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <Globe className="w-4 h-4 opacity-50" />
                                    <span className="text-sm font-medium">{lang.name}</span>
                                </button>
                            ))}
                        </div>

                        {!session && (
                            <button
                                onClick={handleStartSession}
                                className="w-full mt-6 bg-slate-900 text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span>Start New Session</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    {session ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="premium-card text-center w-full max-w-sm"
                        >
                            <h3 className="text-xl font-bold mb-4">Scan to Join</h3>
                            <div className="bg-white p-6 rounded-2xl shadow-inner mb-6 flex justify-center">
                                <QRCodeSVG value={`${window.location.origin}/join/${session.session_code}`} size={200} />
                            </div>
                            <p className="text-sm text-slate-500 mb-6">
                                Share this QR code with the person you want to talk to.
                            </p>
                            <div className="flex items-center justify-center space-x-2 py-3 bg-slate-100 rounded-xl font-mono text-lg font-bold text-slate-700">
                                <span>{session.session_code}</span>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="w-full aspect-square bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-primary-200/20 to-indigo-200/20"
                            />
                            <Mic className="w-16 h-16 text-slate-300 group-hover:text-primary-400 transition-colors" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
