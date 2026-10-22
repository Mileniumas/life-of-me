# Life of Me

A private, offline-first diary PWA with a built-in home workout plan.

**Live:** https://mileniumas.github.io/life-of-me/ (open on iPhone in Safari → Share → *Add to Home Screen*)

- Plain HTML/CSS/JS, no build step, no accounts, no server.
- Diary entries, moods, PIN and workout progress are stored **only on your device** (IndexedDB/localStorage). Nothing in this repo is personal diary data.
- Export/import a JSON backup from Settings.
- Workouts come in blocks; each new block is added with `python3 tools/build-workouts.py --deploy`, which regenerates `workouts-data.js`, compresses the photos, bumps the service-worker cache and pushes here. Installed apps pick up the update on next open.
- Exercise photos and seasonal backdrops are AI-generated.
