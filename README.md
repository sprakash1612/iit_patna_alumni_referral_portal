# IITP Referral Portal

IIT Patna Alumni Referral Network — built with Laravel 11 + React + PostgreSQL.

**Free hosting stack (100% free forever):**
- Database → [Supabase](https://supabase.com) (free PostgreSQL)
- Backend  → [Render](https://render.com) (free Docker web service)
- Frontend → [Netlify](https://netlify.com) (free static hosting)

---

## Step 1 — Push Code to GitHub

1. Create a free account at https://github.com
2. Create a new repository named `iitp-referral-portal` (set to Public or Private)
3. Open **Git Bash** or **Command Prompt** in the `IITP/` folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/sprakash1612/iit_patna_referal_portal.git
git push -u origin main
```

---

## Step 2 — Set Up Database (Supabase — free forever)

1. Go to https://supabase.com → **Start for free** → sign up
2. Click **New project** → name it `iitp-referral` → set a strong database password → choose region (closest to India: ap-south-1)
3. Wait ~2 minutes for it to provision
4. Go to **Settings → Database → Connection string** → copy the **URI** format
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`
5. Save this connection string — you'll need it in the next step

---

## Step 3 — Deploy Backend (Render — free web service)

1. Go to https://render.com → **Get Started for Free** → sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo `iitp-referral-portal`
4. Fill in:
   - **Name**: `iitp-referral-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add these (click Add Environment Variable for each):

| Key | Value |
|-----|-------|
| `APP_NAME` | `IITP Referral Portal` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | *(leave blank — set after first deploy, see note below)* |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | *(from Supabase: Settings → Database → Host)* |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | *(your Supabase database password from Step 2)* |
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_ENCRYPTION` | `tls` |
| `MAIL_USERNAME` | `your_gmail@gmail.com` |
| `MAIL_PASSWORD` | *(your Gmail App Password — see Gmail section below)* |
| `MAIL_FROM_ADDRESS` | `your_gmail@gmail.com` |
| `MAIL_FROM_NAME` | `IITP Referral Portal` |
| `FRONTEND_URL` | `https://your-app.netlify.app` *(update after Step 4)* |
| `SESSION_DRIVER` | `cookie` |
| `SANCTUM_STATEFUL_DOMAINS` | `your-app.netlify.app` |

6. Click **Create Web Service** → it will deploy (takes ~5-10 min first time)
7. After first deploy, go to **Shell** tab in Render and run:
   ```
   php artisan key:generate --show
   ```
   Copy the output and set it as the `APP_KEY` environment variable, then redeploy.

> **Note on DATABASE_URL**: Laravel automatically picks up the `DATABASE_URL` env var when `DB_CONNECTION=pgsql` is set. You don't need separate DB_HOST/DB_PORT/etc.

---

## Gmail App Password Setup

*Required to send OTP and referral emails.*

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is ON
3. Search for **"App Passwords"** in the search bar
4. Click **App Passwords** → select app: **Mail** → device: **Other** → type `IITP Portal`
5. Click **Generate** → copy the 16-character password
6. Use this as `MAIL_PASSWORD` in Render (NOT your regular Gmail password)

---

## Step 4 — Deploy Frontend (Netlify — free forever)

1. Go to https://netlify.com → **Sign up** → sign up with GitHub
2. Click **Add new site → Import an existing project → GitHub**
3. Select `iitp-referral-portal`
4. Fill in:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://iitp-referral-backend.onrender.com/api`
     *(replace with your actual Render URL shown in the Render dashboard)*
6. Click **Deploy site**
7. After deploy, copy your Netlify URL (e.g. `https://amazing-name-123.netlify.app`)

---

## Step 5 — Update Backend CORS

Go back to Render → your backend service → **Environment** tab:
- Update `FRONTEND_URL` to your actual Netlify URL (e.g. `https://amazing-name-123.netlify.app`)
- Update `SANCTUM_STATEFUL_DOMAINS` to `amazing-name-123.netlify.app` (no https://)
- Click **Save Changes** → Render will redeploy automatically

Your app is now live at your Netlify URL!

---

## Local Development Setup

### Prerequisites
1. **PHP 8.2+** → https://windows.php.net/download (VS16 x64 Non Thread Safe ZIP, add to PATH)
2. **Composer** → https://getcomposer.org/Composer-Setup.exe
3. **Node.js 20 LTS** → https://nodejs.org
4. **PostgreSQL 16** → https://www.postgresql.org/download/windows/

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env — set DB credentials and Gmail SMTP
php artisan migrate
php artisan serve   # runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev         # runs on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register (IITP email only) |
| POST | `/api/auth/verify-otp` | No | Verify 6-digit OTP |
| POST | `/api/auth/resend-otp` | No | Resend OTP |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET  | `/api/auth/me` | Bearer | Current user profile |
| GET  | `/api/users` | Bearer | All verified members |
| POST | `/api/referrals` | Bearer | Send referral request |
| GET  | `/api/referrals/sent` | Bearer | My sent requests |
| GET  | `/api/referrals/received` | Bearer | Requests I received |

---

## Project Structure

```
IITP/
├── backend/                  Laravel 11 API
│   ├── Dockerfile            Docker config for Render deployment
│   ├── railway.json          Railway config (optional)
│   ├── nixpacks.toml         Nixpacks config (optional)
│   ├── app/
│   │   ├── Http/Controllers/ AuthController, UserController, ReferralController
│   │   ├── Mail/             OtpMail, ReferralRequestMail
│   │   └── Models/           User, Skill, OtpVerification, ReferralRequest
│   ├── database/migrations/  All migration files
│   ├── resources/views/emails/ HTML email templates
│   └── routes/api.php        All API routes
│
├── frontend/                 React + Vite + Tailwind
│   ├── netlify.toml          Netlify deployment config
│   └── src/
│       ├── api/axios.js      Axios instance + interceptors
│       ├── context/          AuthContext (login/logout state)
│       ├── pages/            Register, Login, VerifyOtp, Dashboard
│       └── components/       Navbar, SkillBadge
│
└── preview/
    └── index.html            Standalone browser preview (no build needed)
```
