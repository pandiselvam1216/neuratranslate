import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, LogOut, Globe, Clock, Headphones } from 'lucide-react';

export default function Dashboard() {
    const { sessionCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { language, session } = location.state || {};

    const [targetLanguage, setTargetLanguage] = useState('');
    const [status, setStatus] = useState('active');
    const [subtitles, setSubtitles] = useState([]); // { text, type: 'mine' | 'theirs' }
    const [isTheirsSpeaking, setIsTheirsSpeaking] = useState(false);

    const audioQueue = useRef([]);
    const isPlaying = useRef(false);

    useEffect(() => {
        if (!language || !session) {
            navigate('/');
            return;
        }

        const tLang = session.usera_language === language ? session.userb_language : session.usera_language;
        setTargetLanguage(tLang);

        socketService.on('partial-transcript', ({ userId, transcript }) => {
            if (userId === socketService.socket.id) {
                // My partial transcript (optional display)
            }
        });

        socketService.on('translated-audio', ({ audio, subtitle, originalSubtitle }) => {
            // audio is a base64 string from Sarvam
            audioQueue.current.push({ audio, subtitle });
            playNextInQueue();

            setSubtitles(prev => [...prev, { text: subtitle, original: originalSubtitle, type: 'theirs' }].slice(-10));
        });

        return () => {
            socketService.off('partial-transcript');
            socketService.off('translated-audio');
        };
    }, [language, session, navigate]);

    const playNextInQueue = async () => {
        if (isPlaying.current || audioQueue.current.length === 0) return;

        isPlaying.current = true;
        setIsTheirsSpeaking(true);
        const { audio } = audioQueue.current.shift();

        const audioObj = new Audio(`data:audio/wav;base64,${audio}`);
        audioObj.onended = () => {
            isPlaying.current = false;
            setIsTheirsSpeaking(false);
            playNextInQueue();
        };
        audioObj.play();
    };

    const { isRecording, startRecording, stopRecording } = useAudioRecorder(
        sessionCode,
        language,
        targetLanguage
    );

    const handleEndSession = () => {
        socketService.emit('end-session', { sessionCode });
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center space-x-6">
                    <h2 className="text-xl font-bold text-slate-900">NeuraTranslate</h2>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center space-x-4 text-sm font-medium">
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Connected</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>08:45</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleEndSession}
                    className="flex items-center space-x-2 text-slate-600 hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="font-semibold">End Session</span>
                </button>
            </header>

            <main className="flex-1 container mx-auto p-6 flex gap-6">
                {/* Left Side: My Controls & Subtitles */}
                <section className="flex-1 flex flex-col gap-6">
                    <div className="premium-card flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3 text-slate-900">
                                <Globe className="w-5 h-5 text-primary-500" />
                                <span className="font-bold">My Language: {language}</span>
                            </div>
                            <div className={`p-4 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                                {isRecording ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 overflow-y-auto max-h-[400px]">
                            <div className="space-y-4">
                                {subtitles.filter(s => s.type === 'mine').map((s, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <p className="text-slate-800 font-medium">{s.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center">
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording
                                    ? 'bg-red-500 scale-95 shadow-red-200 ring-8 ring-red-50'
                                    : 'bg-primary-600 hover:bg-primary-500 hover:scale-105 shadow-primary-200'
                                    }`}
                            >
                                <Mic className="w-10 h-10 text-white" />
                            </button>
                            <p className="mt-4 text-sm font-medium text-slate-500">
                                {isRecording ? 'Listening...' : 'Hold to Speak'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Right Side: Translation Feed */}
                <section className="flex-1 flex flex-col gap-6">
                    <div className="premium-card flex-1 flex flex-col bg-slate-900 text-white">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3 text-white">
                                <Headphones className="w-5 h-5 text-primary-400" />
                                <span className="font-bold text-slate-300">Target Language: {targetLanguage}</span>
                            </div>
                            <div className={`p-4 rounded-full transition-all ${isTheirsSpeaking ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-800 text-slate-600'}`}>
                                <Zap className={`w-6 h-6 ${isTheirsSpeaking ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 overflow-y-auto max-h-[400px]">
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {subtitles.map((s, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 rounded-xl border ${s.type === 'theirs'
                                                ? 'bg-primary-600/10 border-primary-500/30'
                                                : 'bg-slate-700/50 border-slate-600/50 opacity-40'
                                                }`}
                                        >
                                            <p className="text-xs text-slate-400 mb-1">{s.type === 'theirs' ? 'Translated' : 'You said'}</p>
                                            <p className="text-white font-medium">{s.text}</p>
                                            {s.original && <p className="text-xs text-slate-500 mt-2 italic">Original: {s.original}</p>}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center py-6">
                            {isTheirsSpeaking ? (
                                <div className="flex items-center space-x-1 h-8">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div
                                            key={i}
                                            className="w-1 bg-primary-400 rounded-full animate-wave"
                                            style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm italic">Waiting for incoming speech...</div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
BlackedOnUser: false
