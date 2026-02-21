import { useState, useCallback, useRef } from 'react';
import socketService from '../services/socket';

export const useAudioRecorder = (sessionCode, sourceLanguage, targetLanguage) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const audioContext = useRef(null);
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
            console.log('Stream obtained:', stream.current.id);

            mediaRecorder.current = new MediaRecorder(stream.current, { mimeType: 'audio/webm' });

            mediaRecorder.current.ondataavailable = async (event) => {
                console.log('MediaRecorder dataavailable, size:', event.data.size);
                if (event.data.size > 0) {
                    const blob = event.data;
                    const arrayBuffer = await blob.arrayBuffer();
                    console.log('Emitting audio-chunk', { size: arrayBuffer.byteLength });

                    socketService.emit('audio-chunk', {
                        sessionCode,
                        audio: arrayBuffer,
                        sourceLanguage,
                        targetLanguage
                    });
                }
            };

            // Record in 500ms chunks as per requirement
            mediaRecorder.current.start(500);
            setIsRecording(true);
            console.log('MediaRecorder started');
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }, [sessionCode, sourceLanguage, targetLanguage]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
        }
        if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    }, []);

    return { isRecording, startRecording, stopRecording };
};
BlackedOnUser: false
