# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit project named "spark-fe" using Svelte 5, TypeScript, and Vite. It's a modern web application frontend with a standard SvelteKit structure.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run preview` - Preview production build locally
- `npm run check` - Run TypeScript and Svelte type checking
- `npm run check:watch` - Run type checking in watch mode

Note: This project uses Bun as the package manager (evidenced by bun.lockb), so you can also use `bun` commands instead of `npm`.

## Project Structure

```
src/
├── routes/          # SvelteKit file-based routing
│   ├── +layout.svelte    # Root layout component
│   └── +page.svelte      # Homepage component
├── lib/             # Shared library code and components
│   ├── assets/      # Static assets (favicon, etc.)
│   └── index.ts     # Library exports
├── app.html         # HTML template
└── app.d.ts         # TypeScript app declarations
```

## Key Technologies

- **SvelteKit**: Full-stack web framework with file-based routing
- **Svelte 5**: Component framework with new runes syntax ($props, etc.)
- **TypeScript**: Strict typing enabled
- **Vite**: Build tool and dev server
- **adapter-auto**: Automatic deployment adapter

## Development Notes

- Uses Svelte 5 syntax with runes (`$props()`, `@render`, etc.)
- TypeScript configuration extends SvelteKit's generated config
- Path aliases handled by SvelteKit (`$lib` for src/lib)
- Favicon imported as ES module from `$lib/assets/favicon.svg`
- Engine strict mode enabled in .npmrc

## Type Checking

Always run `npm run check` before committing to ensure TypeScript and Svelte components are properly typed. The project has strict TypeScript settings enabled.