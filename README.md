# Rock Guitar AI

A full web-first AI rock guitar coaching MVP.

## Features

- Personalized onboarding profile: name, skill level, and goal
- Beginner, solo, chord/rhythm, technique, and song coaching modes
- Daily practice dashboard with progress percentage
- Interactive practice session with timer and completion tracking
- AI coach chat through a secure server-side OpenAI endpoint
- Local progress persistence in the browser
- Responsive UI suitable for desktop and mobile browsers

## Run locally

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local for live OpenAI answers
npm run dev
```

Open http://localhost:3000. Without an API key, the app returns a built-in fallback coaching response. Never commit API keys to GitHub.

## Next production milestones

Add authentication and cloud-saved profiles, audio recording/pitch analysis, lesson content management, billing, and native iOS/Android packaging.
