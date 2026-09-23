# Rock Guitar AI

AI-powered rock guitar coaching for beginners through advanced players.

## Current MVP

- Beginner rock, solo, chord/rhythm, technique, and song coach modes
- Interactive OpenAI coach panel in the web dashboard
- Personalized practice-plan foundation
- Secure server-side OpenAI coaching endpoint
- Mobile-ready Next.js foundation

## Run locally

```bash
npm install
cp .env.example .env.local
# Add your OpenAI key to .env.local
npm run dev
```

Open http://localhost:3000. The app also has a safe fallback response when no API key is configured. Never commit API keys to GitHub.

## Roadmap

Authentication and saved progress, microphone recording, pitch/rhythm analysis, mobile packaging, and subscriptions will be added in later milestones.
