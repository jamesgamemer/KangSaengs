# Supabase Setup Guide for 7DS Origin

This guide walks you through connecting your 7DS Origin website to Supabase for cloud-based character data management.

## Overview

The website supports two modes:

| Mode | Description | Data Storage |
|------|-------------|-------------|
| **Local Mode** | Works without Supabase | `data/characters.json` + localStorage |
| **Supabase Mode** | Full cloud database | Supabase PostgreSQL + Storage |

When Supabase is not configured, the website automatically falls back to Local Mode. All features work in both modes.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free tier available)
2. Click **"New Project"**
3. Enter a project name (e.g., `7ds-origin`)
4. Set a database password (save this somewhere safe)
5. Choose a region closest to your users
6. Click **"Create new project"** and wait for it to initialize

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **"Run"** to execute

This creates:
- `characters` table with all required columns
- `profiles` table for admin user management
- Row Level Security (RLS) policies
- Storage bucket for character images
- Necessary indexes and triggers

## Step 3: Create an Admin User

1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Enter your admin email and password
4. Check **"Auto Confirm User"**
5. Click **"Create user"**
6. Note the user's UUID (you'll need it next)

### Set Admin Role

1. Go to **SQL Editor**
2. Run this query (replace with your actual user ID and email):

```sql
INSERT INTO public.profiles (id, email, role)
VALUES (
  'YOUR-USER-UUID-HERE',
  'your-admin@email.com',
  'admin'
);
```

## Step 4: Get Your API Keys

1. Go to **Settings** > **API** in the Supabase dashboard
2. You need two values:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 5: Configure the Website

Open `js/supabase-config.js` and replace the placeholder values:

```javascript
var SUPABASE_URL = 'https://your-project-id.supabase.co';
var SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Important:** The anon key is safe to expose in client-side code because RLS policies protect your data.

## Step 6: Import Existing Data

You have two options to import the 26 characters from `data/characters.json`:

### Option A: Browser Console (Easy)

1. Open your website in a browser
2. Log in as admin via `login.html`
3. Open the browser console (F12 > Console)
4. Copy the contents of `supabase/migrate.js`
5. Paste into the console and press Enter
6. Wait for all 26 characters to be imported

### Option B: Node.js Script (Advanced)

```bash
cd supabase/
npm install @supabase/supabase-js
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
node migrate-node.js
```

**Note:** For Option B, use the **service_role** key (not anon key) from Settings > API.

## Step 7: Set Up Storage (for Image Uploads)

The schema.sql already creates a storage bucket called `character-images`. To verify:

1. Go to **Storage** in the Supabase dashboard
2. You should see a `character-images` bucket
3. If not, create it manually:
   - Click **"New bucket"**
   - Name: `character-images`
   - Check **"Public bucket"**
   - Click **"Create bucket"**

## Step 8: Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository **Settings** > **Pages**
3. Set source to your main branch
4. Your site will be available at `https://username.github.io/repo-name/`

## How It Works

### For Normal Users (View Only)
- Visit `characters.html` to browse all characters
- Click a character card to see full details
- Data loads from Supabase in real-time
- No edit buttons visible

### For Admin Users
- Go to `login.html` and sign in with your Supabase admin email/password
- After login:
  - **Admin bar** appears at the top of every page
  - **Admin Dashboard** (`admin.html`) for full CRUD management
  - **Inline Edit** on character detail pages (click "Enable Edit Mode")
  - **Real-time sync** - changes appear instantly for all users

### Admin Features
| Feature | Description |
|---------|-------------|
| Add Character | Fill form with name, rarity, description, image, weapons, skills, potentials, costumes |
| Edit Character | Click edit button on any character in the dashboard |
| Delete Character | Click delete button (with confirmation) |
| Inline Edit | Edit skill descriptions directly on the character page |
| Image Upload | Upload character images to Supabase Storage |
| Export JSON | Download all character data as JSON backup |
| Import JSON | Upload a JSON file to bulk-import characters |
| Real-time | Changes sync to all connected browsers instantly |

## Troubleshooting

### "Supabase not configured" warning
- Check that `js/supabase-config.js` has correct URL and anon key
- Make sure the URL starts with `https://` and ends with `.supabase.co`

### Login fails
- Verify the user exists in Authentication > Users
- Check that the user has a profile with `role = 'admin'` in the profiles table
- Try resetting the password in Supabase dashboard

### Characters not loading
- Check browser console for errors (F12 > Console)
- Verify the `characters` table has data (Table Editor in Supabase)
- Make sure RLS policies are enabled (run schema.sql again if needed)

### Images not uploading
- Verify the `character-images` storage bucket exists and is public
- Check that the storage policies allow authenticated uploads

### Fallback to local mode
- If Supabase is down or not configured, the site automatically uses `data/characters.json`
- Local edits are saved to localStorage
- Use Export JSON to save changes, then re-import when Supabase is available

## File Structure

```
7dsorigin-main/
├── index.html              # Home page
├── characters.html         # Character list (auto-loads from JSON/Supabase)
├── character.html          # Character detail (dynamic, inline edit)
├── admin.html              # Admin dashboard
├── login.html              # Admin login
├── tierlist.html           # Tier list
├── data/
│   └── characters.json     # Local fallback data (26 characters)
├── js/
│   ├── supabase-config.js  # ⚡ YOUR SUPABASE CREDENTIALS HERE
│   ├── supabase-client.js  # Supabase CRUD + Storage + Realtime
│   ├── auth.js             # Authentication (Supabase + local)
│   ├── data.js             # Local data management (fallback)
│   └── navbar.js           # Navigation + auth buttons
├── css/
│   ├── style.css           # Main styles
│   ├── character-detail.css # Character page styles
│   ├── admin.css           # Admin panel styles
│   └── navbar-auth.css     # Auth button styles
├── supabase/
│   ├── schema.sql          # Database schema + RLS policies
│   ├── migrate.js          # Browser console migration script
│   └── migrate-node.js     # Node.js migration script
└── images/                 # Character images
```

## Security Notes

- The **anon key** is safe to expose - RLS policies restrict access
- Only users with `role = 'admin'` in the profiles table can modify data
- Normal users can only read published characters
- Image uploads require authentication
- The **service_role key** should NEVER be exposed in client-side code
