# NeuraTranslate Deployment Guide 🚀

Follow these steps to host your application.

## Part 1: Backend (Render)
1. **Login to Render**: [dashboard.render.com](https://dashboard.render.com).
2. **New Web Service**: Click **"+ New"** -> **"Web Service"**.
3. **Connect GitHub**: Select your repository `neuratranslate`.
4. **Configure Service**:
   - **Name**: `neuratranslate-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. **Add Environment Variables**:
   Under the **Environment** tab, add:
   - `SUPABASE_URL`: (Your Supabase URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your Service Role Key)
   - `SARVAM_API_KEY`: (Your Sarvam API Key)
6. **Deploy**: Click **"Create Web Service"**.
7. **Copy URL**: Once live, copy your site's URL (e.g., `https://neuratranslate-backend.onrender.com`).

---

## Part 2: Frontend (Netlify)
1. **Login to Netlify**: [app.netlify.com](https://app.netlify.com).
2. **Add New Site**: Click **"Add new site"** -> **"Import from existing project"**.
3. **Select GitHub**: Connect and choose `neuratranslate`.
4. **Site Settings**:
   - **Base directory**: `webapp`
   - **Build command**: `npm run build`
   - **Publish directory**: `webapp/dist`
5. **Environment Variables**:
   - Click **"Add Environment Variable"**.
   - **Key**: `VITE_SERVER_URL`
   - **Value**: (Paste your Render Backend URL from Part 1)
6. **Deploy**: Click **"Deploy site"**.

---

### 💡 Troubleshooting Netlify 404
If you see "Page Not Found" when refreshing a page or joining a session, I have added a `_redirects` file to your `public` folder. Netlify will now automatically handle these React Router paths. 

---

## Part 3: Final Step
Once both are live, your app will be accessible via your Netlify URL!
