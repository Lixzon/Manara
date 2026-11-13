# Manāra

Manāra (مَنَارَة) brings Furqan's Quran reader and Mishka's daily spiritual
journey together in one web application. The two experiences have distinct
navigation and share one app shell and deployment.

## Run and verify

```powershell
npm ci
npm run dev
```

Run the web checks and create a production build with:

```powershell
npm run verify:web
npm run web:build
```

The root workspace also contains the previous Mishkah Expo source. Run
`npm run verify:mobile` to type-check and test that source; it is retained in
this repository but is not a second production deployment.

## Deploy Manāra

Deploy this repository from its root directory on Vercel. The root
[`vercel.json`](./vercel.json) configures the web build and `Furqan/dist` output.
Add any required `VITE_` environment variables in the hosting provider; see
the [Supabase setup](./Furqan/SUPABASE_SETUP.md).

## Repository layout

- `Furqan/` contains the unified Vite web app and its Quran and Mishka sections.
- `Mishkah/` preserves the previous Expo/native Mishkah source.
- The root `package.json` and `package-lock.json` are the shared npm workspace
  manifests.

The original Furqan and Mishkah repositories are left unchanged.
