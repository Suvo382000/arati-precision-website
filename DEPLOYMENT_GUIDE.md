# ARATI PRECISION INDUSTRIES — Deployment Guide
## Make your website live globally (FREE)

---

## OVERVIEW
| Part     | Platform | URL Format                          | Cost |
|----------|----------|-------------------------------------|------|
| Frontend | Netlify  | `your-site.netlify.app`             | FREE |
| Backend  | Render   | `your-service.onrender.com`         | FREE |

---

## STEP 1 — Install Git (if not installed)
1. Download from: https://git-scm.com/download/win
2. Install with default settings
3. Open **Command Prompt** and verify: `git --version`

---

## STEP 2 — Create a GitHub Account
1. Go to https://github.com
2. Click **Sign Up** → create a free account

---

## STEP 3 — Push your project to GitHub

Open **Command Prompt** in `D:\Placement\ARATI WEBSITE\` and run:

```cmd
git init
git add .
git commit -m "Initial commit - ARATI PRECISION INDUSTRIES website"
git branch -M main
```

Then:
1. Go to https://github.com/new
2. Repository name: `arati-precision-website`
3. Set to **Public**
4. Click **Create repository**
5. Copy the commands shown under "push an existing repository" and run them:

```cmd
git remote add origin https://github.com/YOUR_USERNAME/arati-precision-website.git
git push -u origin main
```

---

## STEP 4 — Deploy BACKEND on Render (Free)

1. Go to https://render.com → **Sign Up** with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `arati-precision-website`
4. Fill in:
   - **Name**: `arati-precision-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Advanced** → **Add Environment Variables**:

| Key            | Value                          |
|----------------|--------------------------------|
| `NODE_ENV`     | `production`                   |
| `PORT`         | `10000`                        |
| `ADMIN_SECRET` | `choose-a-secret-password`     |
| `FRONTEND_URL` | *(leave blank for now, add after Netlify deploy)* |

6. Click **Create Web Service**
7. Wait ~3 minutes for deployment
8. Copy your backend URL — it looks like: `https://arati-precision-backend.onrender.com`

---

## STEP 5 — Update frontend with your Render URL

Open `frontend/js/main.js` and update line 5:
```js
: 'https://arati-precision-backend.onrender.com';  // ← replace with YOUR actual Render URL
```

Then commit and push:
```cmd
git add .
git commit -m "Update backend URL to Render"
git push
```

---

## STEP 6 — Deploy FRONTEND on Netlify (Free)

### Option A — Drag & Drop (Easiest, no GitHub needed)
1. Go to https://app.netlify.com
2. Sign Up (free)
3. On the dashboard, find **"Deploy manually"** or drag-and-drop area
4. Drag your entire **`frontend`** folder onto the page
5. Wait 30 seconds — your site is LIVE!
6. Netlify gives you a URL like: `https://random-name-123.netlify.app`
7. Click **Site settings** → **Change site name** → set it to `arati-precision`
   - Your URL becomes: `https://arati-precision.netlify.app`

### Option B — Connect GitHub (Auto-deploy on every change)
1. Go to https://app.netlify.com → **Add new site** → **Import from Git**
2. Choose **GitHub** → select `arati-precision-website`
3. Settings:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
   - Build command: *(leave empty)*
4. Click **Deploy site**

---

## STEP 7 — Update CORS on Render

1. Go to your Render service → **Environment**
2. Add/update:
   - `FRONTEND_URL` = `https://arati-precision.netlify.app` *(your actual Netlify URL)*
3. Render will auto-redeploy

---

## STEP 8 — Custom Domain (Optional, if you have one)

### On Netlify:
1. Go to **Site settings** → **Domain management** → **Add custom domain**
2. Enter: `www.aratiprecision.com` (or whatever you own)
3. Follow the DNS instructions

---

## FINAL RESULT

| What          | URL                                          |
|---------------|----------------------------------------------|
| Your Website  | `https://arati-precision.netlify.app`        |
| Your API      | `https://arati-precision-backend.onrender.com` |
| Health Check  | `https://arati-precision-backend.onrender.com/api/health` |

---

## IMPORTANT NOTES

- **Free Render plan**: The backend "sleeps" after 15 minutes of inactivity.
  First request after sleep takes ~30 seconds to wake up. This is normal on free tier.
  To avoid this, upgrade to Render Starter ($7/month) or use a cron ping service.

- **Enquiries**: All enquiries are saved to the JSON file on Render.
  To view them: `GET https://your-backend.onrender.com/api/admin/enquiries`
  with header: `X-Admin-Secret: your-secret-password`

- **Email**: To enable email notifications, add to Render environment:
  - `EMAIL_USER` = your Gmail address
  - `EMAIL_PASS` = Gmail App Password (not your regular password)
  - Go to Gmail → Settings → Security → 2FA → App Passwords → generate one

---

## NEED HELP?
Contact your developer or refer to:
- Netlify docs: https://docs.netlify.com
- Render docs: https://render.com/docs
