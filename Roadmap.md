# Kcal Tracker — Project Roadmap

**Goal:** Build a free food-tracking app you can use daily on your phone, and publish it to GitHub as a portfolio piece for AI technician job applications.

**Decisions made:**
- Nutrition lookup: Groq API (free tier, no credit card, generous rate limits) — send the food name/description to an LLM hosted on Groq and get back structured calorie/macro data. Chosen over Claude's API because Groq's free tier has no per-token cost, and over USDA's database because it handles natural, casual food descriptions much better.
- Phone delivery: Progressive Web App — add to home screen, no app store fees
- Tools: Claude Code (writes the actual code) + Cowork (planning, docs, coordination)

---

## Phase 0 — Set up accounts and tools
- Create a free GitHub account (if you don't have one) — this is where your code lives and what you'll link in job applications.
- Install Claude Code on your computer (the command-line tool that will write and edit your app's code with you directing it).
- Confirm git is installed and working.
- Confirm this project folder is where the app's code will live.

**Outcome:** you have a place to write code and a place to publish it.

## Phase 1 — Define the MVP and tech stack
- Lock in the minimum feature set:
  - Type a food name (and optionally a quantity) → app looks up calories, protein, carbs, fat
  - Add it to today's log
  - See a running total for the day (calories + macros)
  - Remove an entry if you made a mistake
- Pick the simplest tech stack that still looks professional: plain HTML/CSS/JavaScript built as a PWA (no heavy framework needed for a solo learning project — easier to explain in interviews too, since you understand every file).
- Write a one-page spec so Claude Code has a clear brief to build from.

**Outcome:** a clear, written definition of what "done" looks like for version 1.

## Phase 2 — Build the MVP with Claude Code
- Scaffold the project structure (HTML page, JS logic, CSS styling).
- Build the "add food" form and the daily log list.
- Get a free Groq API key and wire up a call that sends the typed food description to an LLM and gets back structured calories/protein/carbs/fat.
- Calculate and display running daily totals.
- Store the day's entries in the browser (so refreshing doesn't lose your log).

**Outcome:** a working app on your computer that does the core job.

## Phase 3 — Turn it into an installable PWA
- Add a web app manifest (app name, icon, colors).
- Add a service worker so the app can load reliably and cache itself.
- Add app icons.

**Outcome:** the app can be "installed" like a real app, not just viewed as a webpage.

## Phase 4 — Deploy for free and put it on your phone
- Push the code to GitHub.
- Deploy it with a free static hosting service (e.g. Vercel, Netlify, or GitHub Pages) connected to your GitHub repo — every update you push goes live automatically.
- Open the live link on your phone, tap "Add to Home Screen."
- Use it for real for a few days and note anything annoying or missing.

**Outcome:** the app is live, free, and on your phone — the core goal is met here.

## Phase 5 — Polish
- Add a history view (see past days, not just today).
- Add daily calorie/macro goals with progress indicators.
- Add simple charts for macro breakdown.
- Fix anything annoying you found from real daily use in Phase 4.

**Outcome:** an app that feels complete and pleasant to use daily.

## Phase 6 — Publish as a portfolio piece
- Clean up the code and folder structure.
- Write a strong README: what it does, why you built it, what it's built with, screenshots, a link to the live app.
- Make sure the GitHub repo is public and looks professional.

**Outcome:** a link you can put directly into job applications for AI technician roles.

---

## Optional future upgrade
Groq's free tier is rate-limited (30 requests/minute, 6,000 tokens/minute, 14,400 requests/day) — far more than a personal food tracker needs, but worth knowing about if you ever add more users. If you ever want a second opinion or higher-quality nutrition estimates, you could add the Claude API as a fallback — that's billed separately from your Claude Premium subscription at a small pay-as-you-go rate (roughly $0.10-$0.30/month for daily personal 