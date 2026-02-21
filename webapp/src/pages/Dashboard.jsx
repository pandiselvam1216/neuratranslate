import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, LogOut, Globe, Clock, Headphones, Zap, Wifi, Signal, Volume2 } from 'lucide-react';

export default function Dashboard() {
    const { sessionCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { language, session } = location.state || {};

    const [targetLanguage, setTargetLanguage] = useState('');
    const [subtitles, setSubtitles] = useState([]); // { text, type: 'mine' | 'theirs' }
    const [isTheirsSpeaking, setIsTheirsSpeaking] = useState(false);
    const [connectionTime, setConnectionTime] = useState('00:00');

    const audioQueue = useRef([]);
    const isPlaying = useRef(false);
    const startTime = useRef(Date.now());

    useEffect(() => {
        if (!language || !session) {
            navigate('/');
            return;
        }

        const tLang = session.usera_language === language ? session.userb_language : session.usera_language;
        setTargetLanguage(tLang);

        const timer = setInterval(() => {
            const diff = Date.now() - startTime.current;
            const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            setConnectionTime(`${mins}:${secs}`);
        }, 1000);

        socketService.on('translated-audio', ({ audio, subtitle, originalSubtitle }) => {
            audioQueue.current.push({ audio, subtitle });
            playNextInQueue();
            setSubtitles(prev => [...prev, { text: subtitle, original: originalSubtitle, type: 'theirs', id: Date.now() }].slice(-10));
        });

        return () => {
            clearInterval(timer);
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
        audioObj.play().catch(console.error);
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
        <div className="min-h-screen bg-page flex flex-col xl:h-screen overflow-hidden">
            {/* Glossy Header */}
            <header className="glass sticky top-0 z-50 px-6 py-4 xl:px-8 flex items-center justify-between border-b border-white/10 shadow-lg">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Zap className="text-white w-4 h-4" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">NEURA<span className="text-primary">SYNC</span></h2>
                    </div>

                    <div className="hidden md:flex items-center space-x-6 text-xs font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span>Live Bridge</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{connectionTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Wifi className="w-3.5 h-3.5" />
                            <span>Low Latency</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleEndSession}
                        className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 xl:p-8 grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 overflow-y-auto xl:overflow-hidden">
                {/* Left Panel: Speaker Hub */}
                <section className="flex flex-col gap-4 xl:gap-8 h-full">
                    <div className="premium-card flex-1 flex flex-col bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Mic className="w-32 h-32" />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Your Transmission</span>
                                <h3 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
                                    <Globe className="w-6 h-6 text-slate-400" />
                                    <span>{language}</span>
                                </h3>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                                {isRecording ? <Signal className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 overflow-y-auto scrollbar-hide relative">
                            <div className="space-y-6">
                                <AnimatePresence initial={false}>
                                    {subtitles.filter(s => s.type === 'mine').map((s) => (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                                        >
                                            <p className="text-slate-800 font-bold leading-relaxed">{s.text}</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {subtitles.filter(s => s.type === 'mine').length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-sm font-bold uppercase tracking-widest opacity-50">Transcript will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center space-y-6">
                            <div className="relative">
                                {isRecording && (
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-red-500 rounded-full"
                                    />
                                )}
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`w-28 h-28 rounded-full relative z-10 flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${isRecording ? 'bg-red-500 scale-95' : 'glow-button border-4 border-white'
                                        }`}
                                >
                                    <Mic className="w-12 h-12 text-white" />
                                </button>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                                    {isRecording ? 'Broadcasting Now' : 'Voice Command Center'}
                                </p>
                                <p className="text-sm font-bold text-slate-600">
                                    {isRecording ? 'Release to Send' : 'Hold to Speak'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Panel: AI Response Hub */}
                <section className="flex flex-col gap-4 xl:gap-8 h-full">
                    <div className="premium-card flex-1 flex flex-col p-0 bg-slate-900 border-none shadow-indigo-500/10 overflow-hidden">
                        <div className="p-8 xl:p-10 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Target Reception</span>
                                    <h3 className="text-2xl font-black text-white flex items-center space-x-2">
                                        <Volume2 className="w-6 h-6 text-primary" />
                                        <span>{targetLanguage}</span>
                                    </h3>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isTheirsSpeaking ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'bg-slate-800 text-slate-600'}`}>
                                    <Zap className={`w-6 h-6 ${isTheirsSpeaking ? 'animate-pulse' : ''}`} />
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-800 overflow-y-auto scrollbar-hide">
                                <div className="space-y-6">
                                    <AnimatePresence initial={false}>
                                        {subtitles.map((s) => (
                                            <motion.div
                                                key={s.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-6 rounded-[2rem] border transition-all duration-500 ${s.type === 'theirs'
                                                        ? 'bg-primary/10 border-primary/20 text-white'
                                                        : 'bg-slate-800/50 border-white/5 opacity-30 text-slate-400 grayscale'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5">
                                                        {s.type === 'theirs' ? 'Translated' : 'You Said'}
                                                    </span>
                                                </div>
                                                <p className="text-lg font-bold leading-relaxed">{s.text}</p>
                                                {s.original && (
                                                    <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-white/5 italic flex items-center space-x-2">
                                                        <Globe className="w-3 h-3" />
                                                        <span>Source: {s.original}</span>
                                                    </p>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {subtitles.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-700 py-20 text-center">
                                            <Stars className="w-12 h-12 mb-4 opacity-10" />
                                            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-30">AI Pipeline Idle</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center h-20">
                                {isTheirsSpeaking ? (
                                    <div className="flex items-center space-x-1.5 px-8 py-4 bg-white/5 rounded-full border border-white/5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    height: [10, 40, 10],
                                                    backgroundColor: ['#0ea5e9', '#6366f1', '#0ea5e9']
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 0.8,
                                                    delay: i * 0.1,
                                                    ease: "easeInOut"
                                                }}
                                                className="w-1.5 rounded-full"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="flex space-x-1">
                                            <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Transmission</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
