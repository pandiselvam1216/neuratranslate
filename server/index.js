require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sessionManager = require('./sessionManager');
const sarvamService = require('./services/sarvam');

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-session', async ({ language }) => {
        console.log('Received create-session request with language:', language);
        try {
            const session = await sessionManager.createSession(language);
            console.log('Session created successfully:', session.session_code);
            socket.join(session.session_code);
            socket.emit('session-created', session);
        } catch (error) {
            console.error('Create Session Error:', error);
            socket.emit('error', 'Failed to create session');
        }
    });

    socket.on('join-session', async ({ sessionCode, language }) => {
        console.log('Received join-session request:', sessionCode, language);
        try {
            const session = await sessionManager.joinSession(sessionCode, language);
            console.log('Session joined successfully:', sessionCode);
            socket.join(sessionCode);
            io.to(sessionCode).emit('session-active', session);
        } catch (error) {
            console.error('Join Session Error:', error);
            socket.emit('error', 'Failed to join session');
        }
    });

    socket.on('audio-chunk', async ({ sessionCode, audio, sourceLanguage, targetLanguage }) => {
        try {
            // Audio chunk is expected to be a Buffer (from client's Wav encoder)
            const buffer = Buffer.from(audio);

            // Pipeline Step 1: STT
            const transcript = await sarvamService.transcribe(buffer, sourceLanguage);
            if (!transcript) return;

            // Pipeline Step 2: Emit partial transcript to reduce perceived latency
            io.to(sessionCode).emit('partial-transcript', {
                userId: socket.id,
                transcript: transcript
            });

            // Pipeline Step 3: Translate
            const translatedText = await sarvamService.translate(transcript, sourceLanguage, targetLanguage);

            // Pipeline Step 4: TTS
            const audioContent = await sarvamService.synthesize(translatedText, targetLanguage);

            if (audioContent) {
                // Pipeline Step 5: Send translated audio and subtitles to the other user(s) in session
                socket.to(sessionCode).emit('translated-audio', {
                    audio: audioContent,
                    subtitle: translatedText,
                    originalSubtitle: transcript
                });
            }
        } catch (error) {
            console.error('Audio Pipeline Error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
