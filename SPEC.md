# Kcal Tracker — Build Spec (v1 / MVP)

This is the brief Claude Code will build from. Hand it this file directly.

## What the app does

A single-page web app, used daily on a phone, that lets you log food by typing what you ate in plain English and see running calorie/macro totals for the day.

## Core features (v1)

1. **Add a food entry** — a text input where the user types a food description (e.g. "grilled chicken breast", "a bowl of oatmeal with berries", "2 slices of pizza"). An "Add" button submits it.
2. **Nutrition lookup** — the typed description is sent to the Groq API (free tier), which returns estimated calories, protein, carbs, and fat as structured JSON.
3. **Daily log list** — each added entry appears in a list for today, showing the food description and its calories/macros, with a "remove" button on each row.
4. **Daily totals** — a summary section at the top showing the sum of calories, protein, carbs, and fat for everything logged today, updating live as entries are added/removed.
5. **Persistence** — today's entries are saved in the browser (localStorage) so refreshing the page doesn't lose the log. Entries are keyed by date so tomorrow starts fresh.

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript — no framework. Keeps every file readable and explainable in an interview.
- Structure:
  - `index.html` — page structure
  - `style.css` — styling
  - `app.js` — logic (form handling, API call, totals calculation, localStorage)
  - `/api/lookup.js` — a small serverless function (see below)

## Nutrition lookup: keep the Groq API key secret

The Groq API key must **not** be embedded directly in the front-end JavaScript, because the code will live in a public GitHub repo — anyone could read the key out of the page source and use up your free quota.

Instead: the front-end calls our own tiny backend endpoint (`/api/lookup`), and that endpoint (a serverless function, deployed alongside the site on Vercel) holds the real Groq key as a private environment variable and forwards the request. This is standard practice for any app that calls a paid or rate-limited API from a browser, and it's a good detail to be able to explain in interviews.

Flow: browser → `/api/lookup?food=...` → serverless function adds the secret key and calls Groq → returns `{ calories, protein_g, carbs_g, fat_g }` → browser displays it.

## Prerequisite before building

Sign up for a free Groq API key at console.groq.com (no credit card required) before starting Phase 2, since Claude Code will need it to test the lookup function locally.

## Out of scope for v1 (later phases)

- PWA manifest/service worker/icons (Phase 3)
- Hosting + phone install (Phase 4)
- History view, goals, charts (Phase 5)
