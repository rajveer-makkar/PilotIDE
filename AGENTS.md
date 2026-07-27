<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# monorepo fact sheet (for agents)

## Package manager

- **npm** workspaces (`npm@11.17.0`), NOT pnpm. The README template mentions `pnpm dlx` — ignore it, use `npx`.
- All root scripts go through **turbo** (`turbo build`, `turbo dev`, `turbo lint`, `turbo format`, `turbo typecheck`).
- Per-package scripts also exist: `npm run dev` in `apps/web/`, etc.

## Layout

```
pilot-ide/
  apps/web/         — Next.js 16 app (React 19)
  packages/
    ui/             — @workspace/ui (shadcn components, styles)
    eslint-config/  — @workspace/eslint-config (flat config, v9)
    typescript-config/ — @workspace/typescript-config
```

- Internal imports use `@workspace/ui/*` paths (mapped via tsconfig `paths` and `package.json` `exports`).
- Next.js `transpilePackages: ["@workspace/ui"]` makes the UI package work at dev/build time.

## Tailwind CSS v4

- **No `tailwind.config.js`** exists. Everything uses v4 directives.
- `packages/ui/src/styles/globals.css` is the single global stylesheet using `@import "tailwindcss"`, `@theme`, `@custom-variant dark`, and `@source`.
- App imports it as `@workspace/ui/globals.css`.
- `@source` directives in globals.css tell Tailwind where to scan for class names.
- PostCSS config lives in `packages/ui/postcss.config.mjs` and is re-exported by `apps/web/postcss.config.mjs`.

## shadcn (radix-nova style)

- Component registry: `packages/ui/components.json` with `"style": "radix-nova"`.
- To add a component: `npx shadcn@latest add button -c packages/ui`
- Components use `data-slot`, `data-variant`, `data-size` attributes extensively.
- Style variant: `radix-nova` (newer shadcn style, not the classic default).

## Component conventions

- `function` keyword (not arrow functions) for all components.
- Props typed with `React.ComponentProps<"element">` or `React.ComponentProps<typeof Primitive.Root>`.
- Variant classes via `cva()` from `class-variance-authority`.
- `asChild` via `Slot.Root` from `radix-ui`.
- `cn()` from `@workspace/ui/lib/utils` (wraps `clsx` + `tailwind-merge`).
- Named exports, not default exports.
- Interactive components prefixed with `"use client"`.
- Import pattern: `@workspace/ui/components/button`, `@workspace/ui/lib/utils`, `@workspace/ui/globals.css`.

## Code style (enforced)

| Tool       | Config                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier   | no semi, double quotes, 2-space indent, trailing commas (es5), 80 width, `prettier-plugin-tailwindcss` for class sorting (`tailwindFunctions: ["cn", "cva"]`) |
| ESLint     | flat config (`eslint.config.js`, v9), per-package configs importing from `@workspace/eslint-config/{base,next-js,react-internal}`                             |
| TypeScript | strict mode, `NodeNext` module resolution (base), `Bundler` for Next.js packages                                                                              |

## Commands

```sh
npm run build       # turbo build
npm run dev         # turbo dev (runs all workspaces in dev mode)
npm run lint        # turbo lint
npm run format      # turbo format (prettier)
npm run typecheck   # turbo typecheck (tsc --noEmit)
```

- **No test scripts or test framework** exist in this repo. Verification is lint → typecheck → build.

## Key gotchas

- `.env*` files are gitignored but turbo `build` depends on them — agents should note they may be missing.
- shadcn `components.json` exists in both `apps/web/` (app-local aliases) and `packages/ui/` (canonical for the shared registry).
- UI package exports are explicit in `packages/ui/package.json` `exports` field — new files must be added there or they won't resolve.
