---
description: Run full build pipeline: type check, build, and optionally deploy to Cloudflare Pages
---

# Build & Deploy Command

Run the full build verification and deployment pipeline for this recipe-app project.

## Steps

1. **TypeScript type check**:
   ```bash
   cd d:/project/nianshu/recipe-app && npx tsc --noEmit 2>&1
   ```

2. **Production build**:
   ```bash
   cd "d:/project/nianshu/recipe-app" && npm run build 2>&1
   ```

3. **Deploy to Cloudflare Pages** (if requested):
   ```bash
   cd d:/project/nianshu/recipe-app && npx wrangler pages deploy dist --project-name recipe-app 2>&1
   ```

4. **Deploy Cloudflare Workers** (if requested):
   ```bash
   cd d:/project/nianshu/recipe-app/server && npx wrangler deploy 2>&1
   ```

## Usage

Run `$ARGUMENTS` to execute the pipeline. Valid modes:
- `build` — type check + build only (default)
- `deploy` — type check + build + deploy to Cloudflare Pages
- `full` — type check + build + deploy Pages + deploy Workers

## Notes

- This project uses Vite + React + TypeScript + Tailwind CSS
- Backend runs on Cloudflare Workers (in `server/` directory)
- Frontend deploys to Cloudflare Pages
- Build output goes to `dist/`
