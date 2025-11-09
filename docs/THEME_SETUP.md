# Theme Setup - TweakCN Vercel Theme Integration

## Overview

The Company OS project uses the Vercel theme from TweakCN, integrated with Shadcn/ui and TailwindCSS.

## Folder Structure

```
src/
├── styles/
│   ├── globals.css           # Main Tailwind entry + imports
│   ├── tokens.css            # Token mapping (TweakCN → Shadcn)
│   ├── animations.css        # Optional motion effects
│   └── themes/
│        └── vercel.css       # Vercel theme tokens from TweakCN
├── components/
│   ├── ui/                   # Shadcn components (use tokens)
│   ├── layout/               # Sidebar, Topbar (use tokens)
│   └── theme-provider.tsx    # Theme context wrapper
└── app/
    ├── (dashboard)/layout.tsx
    └── layout.tsx            # Imports globals.css
```

## Token Mapping

The theme uses a two-layer token system:

1. **TweakCN Tokens** (`src/styles/themes/vercel.css`)
   - Raw theme variables: `--tweakcn-background`, `--tweakcn-primary`, etc.
   - Light and dark variants

2. **Shadcn/ui Tokens** (`src/styles/tokens.css`)
   - Mapped variables: `--background`, `--primary`, etc.
   - Maps TweakCN tokens to Shadcn/ui naming convention

## Theme Provider

The `ThemeProvider` uses `data-theme` attribute:
- `data-theme="light"` - Light mode
- `data-theme="dark"` - Dark mode
- `data-theme="system"` - Follows system preference

## Component Usage

All components automatically use tokens via Tailwind classes:

```tsx
// Button uses tokens
<Button className="bg-primary text-primary-foreground" />

// Card uses tokens
<Card className="bg-card border-border" />

// Sidebar uses tokens
<aside className="bg-card border-r" />
```

## Tailwind Config

The `tailwind.config.ts` supports both `class` and `data-theme` dark mode:
```ts
darkMode: ['class', '[data-theme="dark"]']
```

## Validation Checklist

✅ `/src/styles/tokens.css` exists and maps TweakCN vars  
✅ `ThemeProvider` uses `data-theme` attribute  
✅ `Sidebar` + `Topbar` use adaptive token classes  
✅ `tailwind.config.ts` recognizes `tokens.css` imports  
✅ No redundant `globals.css` token duplication  
✅ Components use CSS variables (not hard-coded colors)

## Theme Colors

### Light Mode
- Background: Pure white (`0 0% 100%`)
- Foreground: Near black (`0 0% 3.9%`)
- Primary: Dark gray (`0 0% 9%`)
- Border: Light gray (`0 0% 89.8%`)

### Dark Mode
- Background: Near black (`0 0% 3.9%`)
- Foreground: Near white (`0 0% 98%`)
- Primary: Near white (`0 0% 98%`)
- Border: Dark gray (`0 0% 14.9%`)

## Customization

To customize the theme:
1. Edit `src/styles/themes/vercel.css` for TweakCN tokens
2. The mapping in `src/styles/tokens.css` will automatically apply changes
3. All components will update via CSS variables

