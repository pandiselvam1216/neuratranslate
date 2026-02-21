const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const FormData = require('form-data');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

class SarvamService {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY;
        this.baseUrl = 'https://api.sarvam.ai';
    }

    async transcribe(audioBuffer, languageCode) {
        try {
            const formData = new FormData();
            formData.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
            formData.append('model', 'saaras:v1');
            formData.append('language_code', languageCode);

            const response = await axios.post(`${this.baseUrl}/speech-to-text`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api-subscription-key': this.apiKey
                }
            });

            return response.data.transcript;
        } catch (error) {
            console.error('Sarvam STT Error:', error.response?.data || error.message);
            return '';
        }
    }

    async translate(text, sourceLang, targetLang) {
        try {
            const response = await axios.post(`${this.baseUrl}/translate`, {
                input: text,
                source_language_code: sourceLang,
                target_language_code: targetLang,
                speaker_gender: 'Female', // Default
                model: 'mayura:v1'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                }
            });

            return response.data.translated_text;
        } catch (error) {
            console.error('Sarvam Translation Error:', error.response?.data || error.message);
            return text;
        }
    }

    async synthesize(text, languageCode) {
        try {
            const response = await axios.post(`${this.baseUrl}/text-to-speech`, {
                inputs: [text],
                target_language_code: languageCode,
                speaker: 'meera', // Sarvam default high quality speaker
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                model: 'bulbul:v1'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                }
            });

            // Sarvam usually returns a base64 encoded audio or a URL depending on the specific API endpoint version.
            // Adjust based on latest Sarvam documentation.
            return response.data.audios[0];
        } catch (error) {
            console.error('Sarvam TTS Error:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = new SarvamService();
