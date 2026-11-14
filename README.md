# Family Time

A website that recommends how and where families in Bosnia and Herzegovina can spend time together, in Bosnian (at `/`) and English (at `/en`).

## Features
- Activity list with search, filters, favourites and shareable links
- Starting point (browser location or a town) with road distances and driving times
- Current weather, a weekend forecast with suggestions, and a zoomable map
- Visitor reviews, approved by the owner on the admin page before they show
- Top destinations ranked by approved reviews

## Stack
Next.js (App Router), TypeScript, Tailwind CSS, ESLint. Reviews are stored in a SQLite file using the SQLite built into Node, so a recent Node version is needed.

## Getting started
```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

Copy `.env.example` to `.env.local` and fill it in; the admin page at `/admin` stays off until `ADMIN_PASSWORD` is set.

- `npm run db:check` – checks the reviews database
- `npm run db:demo` – adds made-up reviews for testing (`-- --remove` takes them out again)
- `scripts/serve.cmd` – updates, builds and runs the production site on a Windows PC (port 4000)

## Structure
- `src/app/[lang]/` – pages: home, `top`, `credits`, `admin`
- `src/app/api/reviews/` – approved reviews and average ratings for the pages
- `src/components/` – UI; `Recommender.tsx` is the home page
- `src/data/` – activity catalogue (`activities.ts`, English texts in `activities.en.ts`), cities and map outlines
- `src/i18n/` – texts in both languages
- `src/lib/` – matching, distances, forecast, reviews, database and admin login
- `src/proxy.ts` – serves Bosnian pages from the root address
- `data/family-time.db` – the reviews database (not in git; back it up)

## External services
Open-Meteo (weather), the OSRM demo server (road distances) and Google Maps links (directions).

## Roadmap
- More filters (accessibility, number of kids)
- Accounts, so favourites follow a family between devices
