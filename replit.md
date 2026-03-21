# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Website**: React + Vite (dark purple Arabic RTL theme)
- **Mobile App**: Expo SDK 54 with expo-router tabs
- **Arabic Font**: Mestika typeface (Regular, Medium, SemiBold, Bold, ExtraBold, Black, Light) for all Arabic text in mobile app; Inter kept for English app names and numbers

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080)
│   ├── store-website/      # React website at "/" - Arabic RTL, dark purple theme
│   ├── plus-app/           # Expo mobile app at "/plus-app/"
│   └── mockup-sandbox/     # Component preview server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **categories**: id (serial PK), name, slug, description, icon, sortOrder
- **apps**: id (serial PK), name, description, version, size, iconUrl, downloadUrl, categoryId, isFeatured, isHot, type (tweaked/modded/hacked), createdAt
- **plans**: id (serial PK), name, slug, price, duration, features, excludedFeatures, isPopular, sortOrder
- **subscriptions**: id (serial PK), email, planId, udid, status, expiresAt, createdAt

Seeded with 20 sample apps, 8 categories, 2 plans.

## API Routes

All routes prefixed with `/api`:
- `GET /api/apps` - List apps (filter by category, type, search)
- `GET /api/apps/featured` - Featured apps
- `GET /api/apps/hot` - Hot/trending apps
- `GET /api/categories` - List categories
- `GET /api/subscriptions/plans` - Subscription plans
- `POST /api/subscriptions/activate` - Activate subscription
- `POST /api/admin/login` - Admin login (admin/admin123)
- `GET /api/admin/stats` - Dashboard stats
- CRUD: `POST/PUT/DELETE /api/admin/apps`, `POST/PUT/DELETE /api/admin/categories`

## Mobile App (plus-app)

5 tabs: PLUS+ (home), TV, SMM, Numbers, Search
- Uses Apple Liquid Glass tab bar (NativeTabs) on iOS 26+, BlurView fallback for older
- Home tab has category pills, featured carousel, trending/most-downloaded/recently-added sections
- Search is a separate tab with category browsing and app search

### Theme & Localization System
- **SettingsContext** (`contexts/SettingsContext.tsx`): Manages language (AR/EN), theme mode (light/dark/system)
- **Colors**: Light mode (white bg, dark text) and Dark mode (#2B283B bg, white text, #9FBCFF secondary)
- **Translations**: Full AR/EN in `constants/translations.ts` with `t(key)` helper
- **Font**: Arabic text → Mestika-{weight} via `fontAr()`, English → Inter
- **Persistence**: AsyncStorage keys `@mismari_language`, `@mismari_theme`
- **SettingsPanel**: Accessible from Account panel → Settings, with language & appearance togglers
- All screens use `useSettings()` hook for dynamic colors, translations, and font selection

## Website (store-website)

Arabic RTL React site with dark purple theme:
- Hero section, app listings with filters, subscription plans
- Admin dashboard at /admin with stats, app/category management
- Admin credentials: env vars ADMIN_USERNAME/ADMIN_PASSWORD (default: admin/admin123)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling handled by esbuild/tsx/vite
- **Project references** — package A depends on B → A's tsconfig lists B in references

## Root Scripts

- `pnpm run build` — typecheck + recursive build
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server with routes in `src/routes/`.

### `artifacts/store-website` (`@workspace/store-website`)
React + Vite website with Arabic RTL support, dark purple theme, admin dashboard.

### `artifacts/plus-app` (`@workspace/plus-app`)
Expo SDK 54 mobile app with 5 tabs, Apple Liquid Glass support, dark theme.

### `lib/db` (`@workspace/db`)
Drizzle ORM with PostgreSQL. Schema: categories, apps, plans, subscriptions.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec + Orval codegen config.

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas from OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks and fetch client.

### `scripts` (`@workspace/scripts`)
Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
