# Vercel import — fix “No Next.js detected” / only see ai-service

## Do not deploy `apps/ai-service`

That folder is **Python (FastAPI)**. It is not the website. If Vercel created a project for it, delete that project.

## Option A — Root Directory `apps/web` (recommended)

1. [vercel.com/new](https://vercel.com/new) → **Import** `propertycitycomng-dotcom/landshoppers`.
2. On **Configure Project**, find **Root Directory** → click **Edit**.
3. If the list only shows **ai-service**, ignore the list. In the path field, **type manually**:

   ```
   apps/web
   ```

4. Confirm **Framework Preset** = **Next.js**.
5. Enable **Include source files outside of the Root Directory in the Build Step** (monorepo).
6. Deploy.

## Option B — Root Directory = repository root

If you cannot set `apps/web`:

1. **Root Directory** = empty (repo root `.`).
2. Root `vercel.json` and root `package.json` include Next.js for framework detection.
3. Build output: `apps/web/.next`.

## After deploy

- Site: `https://<project>.vercel.app`
- API health: `https://<project>.vercel.app/api/health`

Set env vars from [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## Still stuck?

Use Vercel CLI from your machine:

```bash
cd apps/web
npx vercel link
npx vercel env pull
npx vercel --prod
```

When prompted for scope/settings, link to the monorepo and set root to `apps/web`.
