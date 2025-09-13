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

## Design System & Theming

The project uses a comprehensive design system defined in `src/lib/styles/theme.css` that provides consistent styling across all pages.

### Theme Structure

**Global CSS Variables:**
- Colors: Primary gradient (`--primary-gradient`), text hierarchy, success/error states
- Spacing: Consistent spacing scale from `--spacing-xs` to `--spacing-3xl`
- Typography: Font sizes, weights, and families
- Layout: Container max-widths, border radius, shadows
- Transitions: Consistent animation durations

**Component Classes:**
- `.card`, `.card-header`, `.card-body`, `.card-footer` - Card-based layouts
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-error`, `.btn-neutral` - Button variants
- `.form-group`, `.form-label`, `.form-input`, `.form-textarea` - Form components
- `.alert`, `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info` - Alert/notification system
- `.loading`, `.spinner` - Loading states
- `.empty-state`, `.empty-state-icon`, `.empty-state-title` - Empty state messaging
- `.page-title`, `.page-subtitle` - Page headers
- Utility classes for layout, spacing, and text alignment

### Visual Identity

- **Primary Colors**: Purple-blue gradient (`#667eea` to `#764ba2`)
- **Background**: Light gray (`#f8fafc`) with white surface cards
- **Text Hierarchy**: From dark primary to light muted grays
- **Success**: Green (`#10b981`) / **Error**: Red (`#dc2626`) / **Warning**: Amber (`#f59e0b`)
- **Typography**: System font stack with monospace for code
- **Layout**: Card-based design with consistent spacing and shadows

### Page Structure

All pages follow a consistent structure:
- Content wrapped in `.content-container` or `.container`
- Page headers use `.page-title` and `.page-subtitle`
- Forms use card layouts with proper form components
- Consistent button styling and states
- Responsive design with mobile-first approach

### Usage Guidelines

1. **Always use theme CSS variables** instead of hardcoded values
2. **Prefer existing component classes** over custom styles
3. **Follow the card-based layout pattern** for content organization
4. **Use consistent spacing utilities** for margins and gaps
5. **Maintain the visual hierarchy** with proper text and color usage

The theme system is imported globally in `src/routes/+layout.svelte` and available throughout the application.