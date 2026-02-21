# NeuraTranslate - Setup Guide

## Prerequisites
- Node.js (v18+)
- Supabase account
- Sarvam AI API Key

## Backend Setup
1. Navigate to `server/`
2. Create `.env` based on `.env.example`
3. Fill in your Supabase and Sarvam AI credentials.
4. Run:
   ```bash
   npm install
   node index.js
   ```

## Frontend Setup
1. Navigate to `webapp/`
2. Create `.env` with:
   ```
   VITE_SERVER_URL=http://localhost:5000
   ```
3. Run:
   ```bash
   npm install
   npm run dev
   ```

## Database Setup
1. Go to your Supabase SQL Editor.
2. Paste the contents of `schema.sql` and run it.
