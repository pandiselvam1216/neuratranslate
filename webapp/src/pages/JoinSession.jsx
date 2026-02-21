import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { motion } from 'framer-motion';
import { Globe, ArrowRight } from 'lucide-react';

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
            navigate(`/session/${activeSession.session_code}`, { state: { language: selectedLanguage, session: activeSession } });
        });

        return () => {
            socketService.off('session-active');
        };
    }, [navigate, selectedLanguage]);

    const handleJoinSession = () => {
        socketService.emit('join-session', { sessionCode, language: selectedLanguage });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full premium-card"
            >
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Join Session</h2>
                <p className="text-slate-500 mb-8">Code: <span className="font-mono font-bold text-primary-600">{sessionCode}</span></p>

                <div className="space-y-4">
                    <label className="block font-semibold text-slate-700">Your Speaking Language</label>
                    <div className="grid grid-cols-1 gap-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLanguage(lang.code)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all ${selectedLanguage === lang.code
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-white bg-white text-slate-600 hover:border-slate-200 shadow-sm'
                                    }`}
                            >
                                <Globe className="w-4 h-4 opacity-50" />
                                <span className="text-sm font-medium">{lang.name}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleJoinSession}
                        className="w-full mt-6 bg-primary-600 text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-primary-500 transition-all shadow-xl"
                    >
                        <span>Join Conversation</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
