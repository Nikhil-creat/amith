# AMITH — Autonomous Multimodal Intelligent Technology Hub
ORBE-style hero + console. `web/` = static PWA (Vercel). `server/` = Node API proxy (Render/Docker).

## Features
Groq + Gemini with auto-detected live models and fallback · voice in/out with barge-in · camera presence + Gemini vision (`/see`) · admin/guest passphrase · tasks · long-term memory (`/remember`) · live system telemetry · accent themes · chat export · installable PWA · rate limit + security headers · CI + Docker.

## Run locally
cd server && cp .env.example .env   # add keys
npm install && npm start            # http://localhost:3000
Open web/index.html, Settings → Backend URL → http://localhost:3000
(or: docker compose up)

## Deploy
1. GitHub: git init && git add . && git commit -m "AMITH" && git branch -M main
   git remote add origin https://github.com/<you>/amith.git && git push -u origin main
2. Render: New → Blueprint → pick repo (reads render.yaml). Set GROQ_API_KEY, GEMINI_API_KEY, ADMIN_PASSPHRASE.
3. Vercel: import repo, Root Directory = web, Framework = Other. Then in Settings paste the Render URL
   (or set window.AMITH_API in web/index.html), and set Render ALLOWED_ORIGIN to your Vercel URL.

## Build the mobile app
Easiest: open the Vercel URL in Chrome → Install app. APK: pwabuilder.com → paste URL → Android package.
Native: npm i @capacitor/core @capacitor/cli @capacitor/android && npx cap add android && npx cap sync && npx cap open android (needs Android Studio).
