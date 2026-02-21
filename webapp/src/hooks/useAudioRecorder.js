import { useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';

export const useAudioRecorder = (sessionCode, sourceLanguage, targetLanguage) => {
    const [isRecording, setIsRecording] = useState(false);
    const audioContext = useRef(null);
    const processor = useRef(null);
    const stream = useRef(null);
    const audioData = useRef([]);

    const startRecording = useCallback(async () => {
        console.log('🎤 startRecording: Requesting mic access for WAV capture');
        try {
            stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            const source = audioContext.current.createMediaStreamSource(stream.current);
            processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
            audioData.current = [];

            source.connect(processor.current);
            processor.current.connect(audioContext.current.destination);

            processor.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                audioData.current.push(new Float32Array(inputData));
            };

            setIsRecording(true);
            console.log('🎤 Recording phrase...');
        } catch (error) {
            console.error('❌ Error starting recording:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (!isRecording) return;

        console.log('🎤 stopRecording: Encoding to WAV');
        setIsRecording(false);

        if (processor.current) {
            processor.current.disconnect();
            processor.current = null;
        }

        if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
            stream.current = null;
        }

        // Flatten audio fragments
        const totalLength = audioData.current.reduce((acc, current) => acc + current.length, 0);
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (const fragment of audioData.current) {
            result.set(fragment, offset);
            offset += fragment.length;
        }

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(result.length);
        for (let i = 0; i < result.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, result[i])) * 0x7FFF;
        }

        // Create WAV blob
        const wavBuffer = createWavBuffer(pcmData, 16000);

        console.log('🚀 Emitting final phrase WAV', { size: wavBuffer.byteLength });
        socketService.emit('audio-chunk', {
            sessionCode,
            audio: wavBuffer,
            sourceLanguage,
            targetLanguage
        });

        if (audioContext.current) {
            audioContext.current.close().catch(console.error);
            audioContext.current = null;
        }
    }, [isRecording, sessionCode, sourceLanguage, targetLanguage]);

    const createWavBuffer = (pcmData, sampleRate) => {
        const buffer = new ArrayBuffer(44 + pcmData.length * 2);
        const view = new DataView(buffer);

        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + pcmData.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        writeString(view, 36, 'data');
        view.setUint32(40, pcmData.length * 2, true);

        for (let i = 0; i < pcmData.length; i++) {
            view.setInt16(44 + i * 2, pcmData[i], true);
        }

        return buffer;
    };

    return { isRecording, startRecording, stopRecording };
};
