import { useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';

export const useAudioRecorder = (sessionCode, sourceLanguage, targetLanguage) => {
    const [isRecording, setIsRecording] = useState(false);
    const audioContext = useRef(null);
    const processor = useRef(null);
    const stream = useRef(null);

    const startRecording = useCallback(async () => {
        console.log('startRecording called', { sessionCode, sourceLanguage, targetLanguage });
        try {
            stream.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            // Resume context if suspended (common on mobile)
            if (audioContext.current.state === 'suspended') {
                await audioContext.current.resume();
            }

            const source = audioContext.current.createMediaStreamSource(stream.current);
            processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

            source.connect(processor.current);
            processor.current.connect(audioContext.current.destination);

            processor.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                }

                const wavBuffer = createWavBuffer(pcmData, 16000);

                socketService.emit('audio-chunk', {
                    sessionCode,
                    audio: wavBuffer,
                    sourceLanguage,
                    targetLanguage
                });
            };

            setIsRecording(true);
            console.log('Recording started (WAV mode)');
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }, [sessionCode, sourceLanguage, targetLanguage]);

    const stopRecording = useCallback(() => {
        if (processor.current) {
            processor.current.disconnect();
            processor.current = null;
        }
        if (audioContext.current) {
            audioContext.current.close().catch(console.error);
            audioContext.current = null;
        }
        if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
            stream.current = null;
        }
        setIsRecording(false);
        console.log('Recording stopped');
    }, []);

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
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, pcmData.length * 2, true);

        for (let i = 0; i < pcmData.length; i++) {
            view.setInt16(44 + i * 2, pcmData[i], true);
        }

        return buffer;
    };

    return { isRecording, startRecording, stopRecording };
};
