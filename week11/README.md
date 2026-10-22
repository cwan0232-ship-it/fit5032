# Week 11 - Deployment with Cloudflare Pages

NoMash Library (Week 10 app) deployed to Cloudflare Pages in two ways:

- **From Git:** Cloudflare Pages project `cw-library-git` builds this folder (`week11`) from the GitHub repository on every push to `main`.
- **From the IDE with C3:** this project was created with `npm create cloudflare@latest -- cw-library --framework=vue --platform=pages` and is deployed with `npm run deploy`.

## Run locally

```sh
npm install
npm run dev
```

The Firebase and OpenWeather settings go in `.env.local` (see `.env.example`). On Cloudflare they are set as build environment variables in the project settings, so the project has no `wrangler.jsonc` (a Wrangler file would override the dashboard settings).

## Deploy from the IDE

```sh
npm run deploy
```
