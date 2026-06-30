# IITP Referral Portal

**IIT Patna Alumni Referral Network** — A full-stack web portal that connects IIT Patna alumni for career referrals and job opportunities.

> **Live URL:** https://iitp-referrals.pages.dev
> **Developer:** Shanu Prakash — shanu_24a03res171@iitp.ac.in | spprakashshanu@gmail.com

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Database Schema](#database-schema)
5. [Project Structure](#project-structure)
6. [Environment Variables](#environment-variables)
7. [Deployment Guide](#deployment-guide)
8. [Maintenance Guide](#maintenance-guide)
9. [Edge Functions](#edge-functions)
10. [GitHub Actions](#github-actions)
11. [Admin Panel](#admin-panel)

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling |
| React Router DOM | 6 | Client-side routing |
| @supabase/supabase-js | 2 | Supabase client (auth + DB) |
| Lucide React | 0.395 | Icon library |
| React Hot Toast | 2 | Toast notifications |

### Backend / Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase** | PostgreSQL database + Auth + Row Level Security + Realtime + Edge Functions |
| **Cloudflare Pages** | Frontend hosting + auto-deploy from GitHub |
| **GitHub** | Version control + source of truth |
| **GitHub Actions** | Scheduled keep-alive ping (free automation) |
| **Gmail SMTP** | Email delivery (auth emails + referral notifications) |
| **Deno** | Runtime for Supabase Edge Functions |
| **Nodemailer** | Email sending library inside Edge Functions |

---

## Architecture

```
User Browser
     │
     ▼
Cloudflare Pages          ← Hosts React app (static files)
(iitp-referrals.pages.dev)
     │
     │  @supabase/supabase-js (direct DB + auth calls)
     ▼
Supabase
 ├── Auth          ← Login, register, password reset
 ├── PostgreSQL    ← All application data (RLS enforced)
 ├── Realtime      ← Live referral notifications in navbar
 └── Edge Functions (Deno)
      ├── send-referral-email  ← Triggered by DB webhook on INSERT
      └── send-reset-email     ← Called on forgot password

GitHub Actions (every 6 days)
     └── Pings Supabase REST API → prevents free tier pause
```

**No traditional backend server.** The frontend talks directly to Supabase using Row Level Security (RLS) policies to enforce authorization. Complex operations (email sending) use Supabase Edge Functions.

---

## Features

| Feature | Description |
|---|---|
| **Registration** | Only `@iitp.ac.in` emails allowed. Personal email mandatory. |
| **Authentication** | Supabase Auth (JWT). Auto-verified on signup. |
| **Password Reset** | Verifies college + personal email match → sends reset link to both |
| **Profile Management** | Edit all details, skills (multi-tag), previous companies (multi-tag), mobile privacy |
| **Jobs Feed** | Alumni post job openings. Ask referral directly from a post. |
| **Alumni Network** | Searchable directory of all members with skills, company, contact |
| **Referral Requests** | Send requests from Network or Jobs page. Each job post tracked separately. |
| **Email Notifications** | Both parties emailed on referral request (college + personal email) |
| **Real-time Bell** | Supabase Realtime subscription shows new requests instantly |
| **Notification Panel** | Navbar bell shows all received requests with requester details |
| **Admin Panel** | Manage users, job posts, referrals. Role-based access (`is_admin` flag). |
| **Mobile Responsive** | Full mobile support including profile access |

---

## Database Schema

```sql
profiles              ← Extends auth.users (UUID PK)
  id, name, college_email, personal_email, mobile, show_mobile,
  current_company, previous_company (JSONB), designation,
  total_experience, is_verified, is_admin, created_at, updated_at

skills                ← Normalized skills table
  id, name (unique)

user_skills           ← Many-to-many pivot
  user_id (→ profiles), skill_id (→ skills)

job_posts             ← Job openings posted by alumni
  id, user_id, job_title, company, location, job_type,
  description, created_at

referral_requests     ← Referral request between two users
  id, requester_id, referee_id, job_post_id (nullable),
  message, status, is_seen, created_at, updated_at
```

**Row Level Security (RLS)** enforces:
- Users can only read/write their own profile data
- Referral requests visible only to sender and receiver (+ admins)
- Job posts readable by all authenticated users, deletable only by owner (+ admins)

---

## Project Structure

```
IITP/
├── frontend/                        React + Vite app
│   ├── public/
│   │   └── iitp-logo.png           IIT Patna logo (favicon + navbar)
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js         Supabase client + skill sync helpers
│   │   ├── context/
│   │   │   └── AuthContext.jsx     Auth state (login/register/logout/updateUser)
│   │   ├── components/
│   │   │   ├── Navbar.jsx          Top navigation + notification bell (Realtime)
│   │   │   ├── Footer.jsx          Developer info footer
│   │   │   └── SkillBadge.jsx      Skill tag component
│   │   ├── pages/
│   │   │   ├── Login.jsx           Sign in
│   │   │   ├── Register.jsx        Sign up (multi-step form)
│   │   │   ├── ForgotPassword.jsx  Password reset request
│   │   │   ├── ResetPassword.jsx   Set new password (from email link)
│   │   │   ├── Home.jsx            Job posts feed + Ask Referral
│   │   │   ├── Dashboard.jsx       Alumni directory + Ask Referral
│   │   │   ├── Referrals.jsx       Sent / Received referral requests
│   │   │   ├── Profile.jsx         Edit profile, skills, password
│   │   │   ├── Admin.jsx           Admin panel (users, posts, referrals)
│   │   │   └── VerifyOtp.jsx       Redirects to login (OTP disabled)
│   │   └── App.jsx                 Routes + ProtectedRoute + AdminRoute
│   ├── index.html                  Entry HTML (favicon set here)
│   ├── package.json                Dependencies
│   └── .env                        Local env vars (not committed)
│
├── supabase/
│   ├── schema.sql                  Complete DB schema + RLS policies
│   │                               (run this in Supabase SQL Editor)
│   └── functions/
│       ├── send-referral-email/
│       │   └── index.ts            Edge Function: emails both parties on referral
│       └── send-reset-email/
│           └── index.ts            Edge Function: verify emails + send reset link
│
├── .github/
│   └── workflows/
│       └── keep-supabase-alive.yml GitHub Action: pings Supabase every 6 days
│
└── README.md                       This file
```

---

## Environment Variables

### Frontend (Cloudflare Pages + local `.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | `https://tivqsbekaxijisbnssir.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key (safe to expose) |

### Edge Functions (Supabase Secrets)

Set these in Supabase → Edge Functions → each function → Secrets:

| Variable | Description |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail 16-char App Password |
| `SMTP_FROM` | Gmail address (sender) |
| `SUPABASE_URL` | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |

### GitHub Actions Secret

| Variable | Description |
|---|---|
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` |

---

## Deployment Guide

### 1. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → run entire `supabase/schema.sql`
3. Authentication → Sign In / Providers → Email → **disable "Confirm email"**
4. Authentication → SMTP Settings → enable custom SMTP → add Gmail credentials
5. Authentication → URL Configuration → add `https://iitp-referrals.pages.dev/reset-password`
6. Settings → API → copy **Project URL** and **Publishable key**

### 2. Make Yourself Admin (run in SQL Editor)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE profiles SET is_admin = TRUE WHERE college_email = 'your_email@iitp.ac.in';
```

### 3. Add RLS Policies for Admin (run in SQL Editor)
```sql
CREATE POLICY "profiles: admin can update any"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "profiles: admin can delete any"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
```

### 4. Deploy Edge Functions
In Supabase → Edge Functions → New Function:
- `send-referral-email` → paste `supabase/functions/send-referral-email/index.ts`
- `send-reset-email` → paste `supabase/functions/send-reset-email/index.ts`

Add SMTP secrets to both functions.

### 5. Set Up Database Webhook
Supabase → Database → Webhooks → Create:
- Table: `referral_requests`, Event: INSERT
- Call Edge Function: `send-referral-email`

### 6. Cloudflare Pages Setup
1. Connect GitHub repo in Cloudflare Pages
2. Root directory: `frontend`, Build: `npm run build`, Output: `dist`
3. Environment Variables (as Secrets):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 7. GitHub Actions Secret
GitHub repo → Settings → Secrets → Actions → New repository secret:
- `SUPABASE_ANON_KEY` = your anon key

---

## Maintenance Guide

### Accessing Services

#### Supabase (Database + Auth)
- **URL:** https://supabase.com → sign in → select `iitp-referral-project-db`
- **What you can do:**
  - **Table Editor** → browse/edit any data directly
  - **SQL Editor** → run custom SQL queries
  - **Authentication → Users** → manage registered users, reset passwords
  - **Edge Functions** → view/update email functions and their secrets
  - **Database → Webhooks** → manage the referral email trigger
  - **Database → Extensions** → check installed extensions (pgcrypto)

#### Cloudflare Pages (Frontend Hosting)
- **URL:** https://dash.cloudflare.com → Pages → `iitp-referrals`
- **What you can do:**
  - **Deployments** → see all deploys, rollback to any previous version
  - **Settings → Environment Variables** → update `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`
  - **Settings → Builds** → change build config if needed
  - Every `git push` to `main` triggers an automatic redeploy

#### GitHub (Source Code)
- **URL:** https://github.com/sprakash1612/iit_patna_alumni_referral_portal
- **What you can do:**
  - Push new code → triggers Cloudflare auto-deploy
  - **Settings → Secrets → Actions** → update `SUPABASE_ANON_KEY`
  - View commit history and revert if needed

#### GitHub Actions (Keep-alive automation)
- **URL:** GitHub repo → **Actions** tab
- **What you can do:**
  - See all workflow runs and their status
  - **Run workflow** manually to test
  - The `keep-supabase-alive.yml` runs automatically every 6 days
  - If it shows red ❌ → check if `SUPABASE_ANON_KEY` secret is still valid

#### Gmail SMTP (Email delivery)
- **Account:** spprakashshanu@gmail.com
- **What to check if emails stop working:**
  - Go to myaccount.google.com → Security → App Passwords
  - Regenerate the app password if revoked
  - Update `SMTP_PASS` in both Supabase Edge Function secrets AND Supabase Auth SMTP settings

---

## Edge Functions

### `send-referral-email`
**Trigger:** Database Webhook on `referral_requests` INSERT
**What it does:**
1. Fetches requester and referee profiles
2. Sends email to referee: requester's full profile + message
3. Sends confirmation email to requester
4. Sends to both college and personal email of each party

### `send-reset-email`
**Trigger:** Called from frontend on forgot password
**What it does:**
1. Verifies college_email + personal_email match in `profiles` table
2. Generates a Supabase Auth recovery link (1 hour expiry)
3. Sends reset link to both college and personal email via SMTP

---

## GitHub Actions

### `keep-supabase-alive.yml`
**Schedule:** Every 6 days at 9am UTC (`0 9 */6 * *`)
**What it does:** Sends a GET request to the Supabase REST API
**Why:** Supabase free tier pauses projects after 7 days of inactivity
**Usage:** ~5 minutes/month out of 2,000 free GitHub Actions minutes

To manually trigger: GitHub → Actions → "Keep Supabase Alive" → Run workflow

---

## Admin Panel

**URL:** https://iitp-referrals.pages.dev/admin *(admins only)*

**Access:** Only users with `is_admin = TRUE` in the `profiles` table see the Admin tab.

**Features:**
- **Stats** — total members, job posts, referral requests
- **Users tab** — view all members, toggle verified status, grant/revoke admin, delete users
- **Job Posts tab** — view all posts, delete any post
- **Referrals tab** — view all referral requests (direct + via job post), status

**To grant admin to a new user:**
```sql
UPDATE profiles SET is_admin = TRUE WHERE college_email = 'user@iitp.ac.in';
```

---

## Password Reset Flow

Since OTP email is not required:
1. User visits `/forgot-password`
2. Enters college email + registered personal email
3. If both match → Edge Function `send-reset-email` is called
4. Reset link sent to **both** college and personal email
5. User clicks link → lands on `/reset-password`
6. Sets new password → redirected to login

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/sprakash1612/iit_patna_alumni_referral_portal.git
cd iit_patna_alumni_referral_portal/frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_SUPABASE_URL=https://tivqsbekaxijisbnssir.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env

# Start development server
npm run dev
# Opens at http://localhost:5173
```

---

*Built with React, Supabase, Cloudflare Pages, and GitHub Actions — 100% free forever.*
