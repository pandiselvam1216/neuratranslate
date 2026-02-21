const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SessionManager {
    async createSession(userALanguage) {
        const sessionCode = uuidv4().split('-')[0].toUpperCase();
        const { data, error } = await supabase
            .from('sessions')
            .insert([
                {
                    session_code: sessionCode,
                    usera_language: userALanguage,
                    status: 'waiting'
                }
            ])
            .select();

        if (error) throw error;
        return data[0];
    }

    async getSession(sessionCode) {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .single();

        if (error) return null;
        return data;
    }

    async joinSession(sessionCode, userBLanguage) {
        const { data, error } = await supabase
            .from('sessions')
            .update({
                userb_language: userBLanguage,
                status: 'active'
            })
            .eq('session_code', sessionCode)
            .select();

        if (error) throw error;
        return data[0];
    }

    async endSession(sessionCode) {
        const { error } = await supabase
            .from('sessions')
            .update({ status: 'ended' })
            .eq('session_code', sessionCode);

        if (error) console.error('Error ending session:', error);
    }
}

module.exports = new SessionManager();
