# Geist Font Setup Guide

## Current Status

The theme is configured to use **Geist** fonts, but currently falls back to **Inter** (which is very similar to Geist) until Geist font files are added.

## Why Inter is Showing

Geist is Vercel's proprietary font and is not available via Google Fonts. The current setup uses Inter as a temporary fallback because:
- Inter is very similar in appearance to Geist
- Inter is available via Google Fonts
- It provides a seamless experience until Geist fonts are added

## To Use Actual Geist Fonts

### Option 1: Download and Use Local Font Files (Recommended)

1. **Download Geist fonts:**
   ```bash
   # Clone the Geist font repository
   git clone https://github.com/vercel/geist-font.git
   ```

2. **Copy font files to your project:**
   - Copy `GeistVF.woff2` to `public/fonts/GeistVF.woff2`
   - Copy `GeistMonoVF.woff2` to `public/fonts/GeistMonoVF.woff2`

3. **Uncomment the @font-face rules in `src/styles/globals.css`:**
   ```css
   @font-face {
     font-family: 'Geist';
     src: url('/fonts/GeistVF.woff2') format('woff2');
     font-weight: 100 900;
     font-style: normal;
     font-display: swap;
   }

   @font-face {
     font-family: 'Geist Mono';
     src: url('/fonts/GeistMonoVF.woff2') format('woff2');
     font-weight: 100 900;
     font-style: normal;
     font-display: swap;
   }
   ```

4. **Remove the Inter import:**
   - Remove or comment out: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');`

### Option 2: Use npm Package (If Available)

```bash
npm install @vercel/geist-font
```

Then import in your layout or globals.css.

## Verification

After adding Geist fonts:
1. Check DevTools → Elements → Computed styles
2. Look for `font-family` - should show "Geist" instead of "Inter"
3. The font should match Vercel's design system

## Current Font Stack

The font stack is configured as:
```css
--font-sans: 'Inter', 'Geist', -apple-system, BlinkMacSystemFont, ...
```

This means:
- **Inter** loads first (currently active)
- **Geist** will be used when font files are added
- System fonts fallback if neither is available

## Notes

- Inter and Geist are visually very similar
- The current setup works perfectly for development
- For production, consider adding Geist fonts for brand consistency

