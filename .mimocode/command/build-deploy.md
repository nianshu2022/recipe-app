---
description: Run full build pipeline: lint, type check, build, and optionally deploy to Cloudflare Pages
---

# Build & Deploy Command

Run the full build verification and deployment pipeline for this recipe-app project.

## Steps

1. **ESLint lint check**:
   ```bash
   cd d:/project/nianshu/recipe-app && npm run lint 2>&1
   ```

2. **TypeScript type check**:
   ```bash
   cd d:/project/nianshu/recipe-app && npx tsc --noEmit 2>&1
   ```

3. **Production build**:
   ```bash
   cd "d:/project/nianshu/recipe-app" && npm run build 2>&1
   ```

4. **Deploy to Cloudflare Pages** (if requested):
   ```bash
   cd d:/project/nianshu/recipe-app && npx wrangler pages deploy dist --project-name recipe-app 2>&1
   ```

5. **Deploy Cloudflare Workers** (if requested):
   ```bash
   cd d:/project/nianshu/recipe-app/server && npx wrangler deploy 2>&1
   ```

## Usage

Run `$ARGUMENTS` to execute the pipeline. Valid modes:
- `check` — lint + type check only (no build, no deploy)
- `build` — lint + type check + build (default)
- `deploy` — lint + type check + build + deploy to Cloudflare Pages
- `full` — lint + type check + build + deploy Pages + deploy Workers

## Notes

- This project uses Vite + React + TypeScript + Tailwind CSS
- Backend runs on Cloudflare Workers (in `server/` directory)
- Frontend deploys to Cloudflare Pages
- Build output goes to `dist/`
