# Meditation Timer (React + Vite)

A minimal, futuristic single-page meditation timer with calm visuals, loopable audio, and essential controls.

## Features

- Duration presets: **15 / 20 / 30 minutes** (default: 15)
- Start, Pause/Resume, End controls
- Countdown timer with subtle animated progress ring
- Completion state with gentle message and restart option
- Local calming audio file support (`/public/calm.mp3`)
- Automatic fallback to a gentle generated ambient tone when audio file is missing/invalid
- Minimal volume slider (saved locally)
- Remembers last selected duration and volume with `localStorage`
- Keyboard shortcuts:
  - `Space`: Start / Pause / Resume
  - `Esc`: End and reset
- Mobile-friendly, one-screen layout
- Optional screen wake lock while timer is running (if browser supports it)

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Audio setup

A placeholder file exists at `public/calm.mp3`.

To use your own calming track:

1. Replace `public/calm.mp3` with a real MP3 file.
2. Keep the same filename (`calm.mp3`) or update the path in `src/hooks/useMeditationAudio.ts`.

If `calm.mp3` is missing, unreadable, or invalid, the app will automatically use a gentle generated tone so sessions still work end-to-end.

## Build for production

```bash
npm run build
npm run preview
```
