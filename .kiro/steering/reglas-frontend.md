---
inclusion: fileMatch
fileMatchPattern: ['vinculo-frontend/**/*.ts', 'vinculo-frontend/**/*.tsx', 'vinculo-frontend/**/*.css', 'vinculo-frontend/**/*.json']
---

# Frontend Rules — VÍNCULO Portal (React 18 + TypeScript + Vite)

## Architecture Overview

- React 18 with functional components and hooks
- React Router v6 with lazy loading
- Vite as build tool with proxy for development
- Backend communication through Vite proxy (dev) or direct URL (prod)
- JWT Authentication with context provider

## Project Structure

```
vinculo-frontend/src/
├── components/         # Shared UI components (Layout, BolivarLogo)
├── lib/                # API client, auth context, utilities
├── pages/              # Route-level page components
├── index.css           # Global styles + SB Design System import
├── main.tsx            # App entry point + SB Web Components import
├── App.tsx             # Router configuration
├── sb-ui.d.ts          # TypeScript declarations for SB Web Components
└── vite-env.d.ts       # Vite environment types
```

## Design System: @seguros-bolivar/ui-bundle

The `@seguros-bolivar/ui-bundle` library is the primary design system.

### Brand & Theme Configuration

- Brand: `seguros-bolivar`
- Theme: `light`
- CSS: `@seguros-bolivar/ui-bundle/dist/sb-ui-seguros-bolivar-light.css`
- JS: `@seguros-bolivar/ui-bundle/dist/sb-ui-components.min.js`
- HTML: `<html data-brand="seguros-bolivar" data-theme="light">`

### Token Priority

1. Use `--sb-ui-*` CSS custom properties (always with fallback values)
2. Never hardcode hex/rgba values directly in component styles

### Key Tokens

| Token | Fallback | Purpose |
|-------|----------|---------|
| `--sb-ui-color-primary-base` | `#05A660` | Primary green |
| `--sb-ui-color-primary-D200` | `#026B41` | Hover states, dark headers |
| `--sb-ui-color-primary-L400` | `#f2f9f6` | Light backgrounds |
| `--sb-ui-color-secondary-base` | `#FFE16F` | CTA buttons, accents |
| `--sb-ui-color-feedback-error-base` | `#dc3545` | Errors |
| `--sb-ui-color-feedback-warning-base` | `#ffc100` | Warnings |
| `--sb-ui-color-feedback-success-base` | `#28a745` | Success |
| `--sb-ui-color-feedback-info-base` | `#007eff` | Info |
| `--sb-ui-color-grayscale-D400` | `#282828` | Primary text |
| `--sb-ui-color-grayscale-D200` | `#5B5B5B` | Secondary text |
| `--sb-ui-color-grayscale-L200` | `#E1E1E1` | Borders, dividers |
| `--sb-ui-color-grayscale-L300` | `#f5f5f5` | Page backgrounds |
| `--sb-ui-color-grayscale-white` | `#FFFFFF` | Card backgrounds |

### Bundle Components (CSS classes)

`sb-ui-button`, `sb-ui-card`, `sb-ui-input`, `sb-ui-badge`, `sb-ui-table`, `sb-ui-accordion`, `sb-ui-avatar`, `sb-ui-checkbox`, `sb-ui-chip`, `sb-ui-file-upload`, `sb-ui-menu`, `sb-ui-radio`, `sb-ui-select`, `sb-ui-spinner`, `sb-ui-tabs`, `sb-ui-tag`, `sb-ui-textarea`, `sb-ui-toggle`, `sb-ui-breadcrumb`, `sb-ui-grid`, `sb-ui-container`

### Web Components

`<sb-ui-datepicker>`, `<sb-ui-modal>`, `<sb-ui-dropdown>`, `<sb-ui-toast>`, `<sb-ui-stepper>`

### Icons

Font Awesome 6 (bundled in the CSS). Use `<i className="fa-solid fa-icon-name">`.

## CSS Conventions

- Border radius: `50px` for buttons (pill shape), `16px` for main cards, `8px` for minor cards
- Transitions: `transition: all 0.2s ease` as default; never exceed 300ms
- Z-index scale: dropdown(100), sticky(200), modal(300), toast(400), tooltip(500)
- Spacing base unit: 4px (all spacing values are multiples of 4 or 8)

## Prohibited Patterns

- Hardcoding color/shadow/font values instead of using `--sb-ui-*` tokens
- Using colors from Material or Bootstrap
- Business logic in the Frontend (always delegate to Backend)
- Direct database connections from Frontend
- API keys or credentials in source code
- Storing tokens in `localStorage` (use `httpOnly cookies` in production)
- Using `any` type in TypeScript without justification
