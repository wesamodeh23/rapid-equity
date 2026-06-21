<<<<<<< HEAD
# Rapid Equity — Trading & Research Terminal (prototype)

Getting started

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

Notes
- The app uses a mock Databento adapter by default to allow offline testing. Configure a real Databento API key in Settings to enable a real adapter implementation later.
- This scaffold includes core modules, domain models, a risk engine skeleton, and UI pages for the phases described in the spec.

Securing API keys

- Never commit API keys into the repository. Do not paste keys into chat or issue trackers.
- For local development prefer environment variables (Vite: `VITE_DATABENTO_API_KEY`) or the in-app Settings which stores keys in your browser's `localStorage` only on your machine.
- Add a `.env.local` file to your machine (not committed) with values like:

```bash
# .env.local (DO NOT COMMIT)
VITE_DATABENTO_API_KEY=your_databento_key_here
VITE_FRED_KEY=your_fred_key_here
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
```

- Ensure `.env.local` is in `.gitignore`. If you've pasted keys publicly (for example in chat), rotate/revoke them immediately and issue new keys from the provider.

How the app uses keys

- The Settings page allows you to paste API keys into the browser; these are saved only to `localStorage` on your machine and are never written into the repo. For production use, store keys in a secure server-side vault and never expose them to client-side code.

Connecting Databento (local)

1. Add your Databento API key to the Settings page in the running app (it will be saved to `localStorage`).
2. Alternatively, for local development create a `.env.local` file with `VITE_DATABENTO_API_KEY=...` and restart the dev server.
3. The Real Databento adapter is scaffolded at `src/providers/databento/RealDatabentoAdapter.ts`. Update this file with the exact Databento HTTP/websocket endpoints per Databento's docs if you want direct live/historical integration.

Commands

Install dependencies and start dev server:

```bash
npm install
npm run dev
```

Run TypeScript type check:

```bash
npm run type-check
```

Run unit tests (Vitest):

```bash
npm test
# or for an interactive watch:
npx vitest
```


=======
# Rapid Equity
>>>>>>> main
