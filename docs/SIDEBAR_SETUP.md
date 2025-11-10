# Sidebar-07 Integration

## Overview

The Sidebar-07 component has been integrated into the Company OS dashboard layout with full responsive support and TweakCN theme tokens.

## File Structure

```
src/components/layout/sidebar/
├── sidebar.tsx              # Main sidebar component
├── sidebar-menu.tsx         # Menu components (Group, Menu, MenuItem, MenuButton)
├── sidebar-mobile.tsx        # Mobile sidebar with Sheet overlay
└── collapsible.tsx          # Collapsible component wrapper
```

## Features

### ✅ Desktop Sidebar

- Collapsible sidebar (64px collapsed, 256px expanded)
- Smooth transitions with `duration-300`
- Hover animations using `animate-fade-in`
- Active route highlighting
- Grouped navigation (Main, Modules, System)

### ✅ Mobile Sidebar

- Sheet component overlay for mobile
- Hidden on desktop (`md:hidden`)
- Trigger button in Topbar
- Full-width sidebar on mobile

### ✅ Navigation Structure

- **Main**: Dashboard, Tasks, Knowledge
- **Modules**: CRM, ATS, Operations, Import Ops
- **System**: Admin Access

### ✅ Theme Integration

- All classes use Tailwind tokens:
  - `bg-card`, `bg-background`
  - `text-foreground`, `text-muted-foreground`
  - `border-r`, `border-b`
  - `hover:bg-accent`, `hover:text-accent-foreground`
- No hard-coded colors

### ✅ Animations

- Collapse/expand: `transition-all duration-300`
- Hover states: `transition-all duration-200`
- Fade-in: `animate-fade-in` (from globals.css)

## Usage

### Dashboard Layout

```tsx
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} onCollapse={() => setIsCollapsed(!isCollapsed)} />
      </aside>
      {/* ... */}
    </div>
  )
}
```

### Mobile Sidebar

The mobile sidebar is automatically included in the Topbar component and only shows on mobile devices.

## Responsive Behavior

- **Desktop (md+)**: Fixed sidebar on left, collapsible
- **Mobile (<md)**: Hidden sidebar, Sheet overlay triggered from Topbar
- **Breakpoint**: `md` (768px)

## Dependencies

- `@radix-ui/react-collapsible` - For collapsible sections (future use)
- `@radix-ui/react-dialog` - For Sheet component
- `lucide-react` - Icons
- `next/link` - Navigation

## Customization

To add new navigation items, edit `src/components/layout/sidebar/sidebar.tsx`:

```tsx
const navigation = [
  {
    title: 'Your Group',
    items: [
      {
        title: 'Item Name',
        url: '/path',
        icon: YourIcon,
      },
    ],
  },
]
```

## Validation Checklist

✅ Sidebar-07 component created  
✅ Placed in `/src/components/layout/sidebar/`  
✅ Integrated with dashboard layout  
✅ Navigation links bound to modules  
✅ All classes use Tailwind tokens  
✅ Collapse toggle with animations  
✅ Responsive with Sheet for mobile  
✅ Hover states and transitions working
