# Family Time

A website that recommends how and where families can spend time together.

## Stack
Next.js (App Router), TypeScript, Tailwind CSS, ESLint.

## Getting started
```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Structure
- `src/data/activities.ts` – activity catalogue (move to a database later)
- `src/lib/recommend.ts` – matching logic
- `src/lib/types.ts` – shared types
- `src/components/Recommender.tsx` – questionnaire and results UI

## Roadmap
- Location-aware suggestions (maps/events APIs)
- More filters (weather, accessibility, number of kids)
- Saved favourites and accounts
