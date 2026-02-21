import { useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';

export const useAudioRecorder = (sessionCode, sourceLanguage, targetLanguage) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);

    const startRecording = useCallback(async () => {
        console.log('🎤 startRecording: Requesting mic access');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            // Browser support check: use 'audio/webm;codecs=opus' or fallback
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Let browser decide
            }

            console.log('🎤 MediaRecorder using mimeType:', mimeType);
            mediaRecorder.current = new MediaRecorder(stream, { mimeType });
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                console.log('🎤 MediaRecorder stopped, processing final blob');
                const blob = new Blob(chunks.current, { type: mediaRecorder.current.mimeType });
                const arrayBuffer = await blob.arrayBuffer();

                console.log('🚀 Emitting final audio-chunk', { sizeBytes: arrayBuffer.byteLength, mime: mediaRecorder.current.mimeType });

                socketService.emit('audio-chunk', {
                    sessionCode,
                    audio: arrayBuffer,
                    sourceLanguage,
                    targetLanguage
                });

                // Clear stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            console.log('🎤 Recording active...');
        } catch (error) {
            console.error('❌ Error starting recording:', error);
        }
    }, [sessionCode, sourceLanguage, targetLanguage]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            console.log('🎤 Stopping MediaRecorder...');
            mediaRecorder.current.stop();
        }
        setIsRecording(false);
    }, []);

    return { isRecording, startRecording, stopRecording };
};
