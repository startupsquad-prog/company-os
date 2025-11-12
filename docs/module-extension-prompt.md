# Module Selector Extension - Implementation Prompt

## Objective
Extend the OKSuite module selector in `src/components/ok-suite-module-selector.tsx` to include additional vertical-specific modules below the existing ones, with a visual separator between the two groups. Maintain the same UI design and brand consistency.

## Current Structure
- **Existing Modules (7):** OK CRM, OK HR, OK Ops, OK Train, OK Books, OK Orders, OK Agents
- **Grid Layout:** 3 columns on large screens (`lg:grid-cols-3`)
- **Location:** Left section of the PopoverContent

## New Modules to Add

### Group 1: Vertical-Specific Modules (8 modules)
1. **OllDeals**
   - **Name:** "OllDeals"
   - **Description:** "Deal Management & Negotiations"
   - **Icon:** `Briefcase` or `Handshake` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/oll-deals` (or `/verticals/oll-deals`)

2. **LegalNations Admin**
   - **Name:** "LegalNations Admin"
   - **Description:** "Legal Operations & Compliance"
   - **Icon:** `Scale` or `FileCheck` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/legal-nations` (or `/verticals/legal-nations`)

3. **USDrop Admin**
   - **Name:** "USDrop Admin"
   - **Description:** "USDrop Platform Administration"
   - **Icon:** `Settings2` or `Shield` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/usdrop/admin` (or `/verticals/usdrop/admin`)

4. **USDrop Free User**
   - **Name:** "USDrop Free"
   - **Description:** "USDrop Free Tier Access"
   - **Icon:** `User` or `Gift` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/usdrop/free` (or `/verticals/usdrop/free`)

5. **USDrop Pro User**
   - **Name:** "USDrop Pro"
   - **Description:** "USDrop Pro Tier Access"
   - **Icon:** `Crown` or `Star` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/usdrop/pro` (or `/verticals/usdrop/pro`)

6. **Faire USA Order Management Admin**
   - **Name:** "Faire USA Orders"
   - **Description:** "Faire USA Order Administration"
   - **Icon:** `ShoppingBag` or `Package` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/faire-usa/orders` (or `/verticals/faire-usa/orders`)

7. **Faire USA Products Portal**
   - **Name:** "Faire USA Products"
   - **Description:** "Faire USA Product Management"
   - **Icon:** `Box` or `Grid3x3` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/faire-usa/products` (or `/verticals/faire-usa/products`)

8. **Dashboards & Reports**
   - **Name:** "Dashboards & Reports"
   - **Description:** "Analytics, Insights & Reporting"
   - **Icon:** `BarChart3` or `TrendingUp` (from lucide-react)
   - **Group Label:** "Verticals"
   - **Default Route:** `/dashboard/reports` (or `/reports`)

### Group 2: SuperAdmin (1 module - HIGHLIGHTED)
9. **SuperAdmin Control Panel**
   - **Name:** "SuperAdmin Control Panel"
   - **Description:** "System Administration & Control"
   - **Icon:** `Shield` or `Lock` (from lucide-react)
   - **Group Label:** "Administration"
   - **Default Route:** `/admin/control-panel` (or `/superadmin`)
   - **Special Styling:** Highlighted with accent border/background (see implementation details)

## Implementation Plan

### Step 1: Update Module Definitions
- Add all 9 new modules to the `OK_MODULES` array in `ok-suite-module-selector.tsx`
- Import required icons from `lucide-react`
- Ensure each module has: `id`, `name`, `description`, `icon`, `groupLabel`, `defaultRoute`

### Step 2: Add Separator
- Insert a visual separator between existing modules and new modules
- Use a horizontal divider with text label: "Vertical Modules" or "Additional Modules"
- Style: `border-t border-[#2A2A2A] mt-4 mb-4` with optional label

### Step 3: Update Grid Layout
- Keep existing 3-column grid (`lg:grid-cols-3`)
- The grid should naturally extend to accommodate all modules
- Total modules after extension: 16 (7 existing + 9 new)

### Step 4: Highlight SuperAdmin Control Panel
- Add special styling to SuperAdmin Control Panel module card:
  - Accent border: `border-[#4A9EFF]` or `border-yellow-500`
  - Optional: Subtle background gradient or glow effect
  - Add a badge or indicator: "Admin" or "Priority"
  - Use `ring-2 ring-[#4A9EFF]` or similar for emphasis

### Step 5: Update Group Mappings
- Add "Verticals" to `groupDefaultRoutes` mapping
- Add "Administration" to `groupDefaultRoutes` mapping
- Add icons for new groups in `groupIcons` mapping
- Add descriptions for new groups in `groupDescriptions` mapping

### Step 6: Update Navigation Groups
- Ensure `app-sidebar.tsx` has corresponding navigation groups for "Verticals" and "Administration" if needed
- Or handle these modules within existing groups

## UI Structure (Visual Layout)

```
┌─────────────────────────────────────────────────┐
│  [OKSuite Card - All Modules]                    │
├─────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ OK CRM  │ │ OK HR   │ │ OK Ops  │  ← Existing
│  └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │OK Train │ │OK Books │ │OK Orders│  ← Existing
│  └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐                                    │
│  │OK Agents│                                    │  ← Existing
│  └─────────┘                                    │
├─────────────────────────────────────────────────┤
│  ──── Vertical Modules ────  (SEPARATOR)        │
├─────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │OllDeals │ │LegalNat │ │USDropAdm│  ← New
│  └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │USDropFr │ │USDropPro│ │FaireOrd │  ← New
│  └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐                      │
│  │FaireProd│ │Dash&Rep │                      │  ← New
│  └─────────┘ └─────────┘                      │
│  ┌─────────────────────────────────────────┐   │
│  │ ⭐ SuperAdmin Control Panel ⭐          │   │  ← Highlighted
│  │   (with accent border/glow)             │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Code Structure Changes

### 1. Icon Imports
Add to imports from `lucide-react`:
```typescript
import {
  // ... existing imports
  Briefcase,      // or Handshake for OllDeals
  Scale,          // or FileCheck for LegalNations
  Settings2,      // or Shield for USDrop Admin
  User,           // or Gift for USDrop Free
  Crown,          // or Star for USDrop Pro
  ShoppingBag,    // or Package for Faire Orders
  Box,            // or Grid3x3 for Faire Products
  BarChart3,      // or TrendingUp for Dashboards
  Shield,         // or Lock for SuperAdmin
} from 'lucide-react'
```

### 2. Module Array Extension
Add after existing `OK_MODULES`:
```typescript
const VERTICAL_MODULES: Module[] = [
  // ... 8 vertical modules
]

const ADMIN_MODULES: Module[] = [
  // ... 1 SuperAdmin module (highlighted)
]

// Combine all modules
const ALL_MODULES = [...OK_MODULES, ...VERTICAL_MODULES, ...ADMIN_MODULES]
```

### 3. Separator Component
Add between module groups:
```tsx
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-[#2A2A2A]"></span>
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-[#1A1A1A] px-2 text-white/40">Vertical Modules</span>
  </div>
</div>
```

### 4. SuperAdmin Highlighting
Special card styling:
```tsx
className={cn(
  'cursor-pointer transition-all hover:bg-[#252525] border-[#2A2A2A] bg-[#1F1F1F]',
  isSelected && 'bg-[#2A2A2A] border-[#3A3A3A]',
  module.id === 'superadmin' && 'ring-2 ring-[#4A9EFF] border-[#4A9EFF]/50 bg-[#1F2A3A]/30' // Highlight
)}
```

## Testing Checklist
- [ ] All 9 new modules appear in the grid
- [ ] Separator is visible between existing and new modules
- [ ] SuperAdmin Control Panel has highlighted styling
- [ ] Grid layout remains responsive (3 columns on lg, 2 on md, 1 on sm)
- [ ] Module selection works correctly
- [ ] Navigation to default routes works
- [ ] Hover states and selection states work
- [ ] Mobile responsiveness maintained
- [ ] No layout overflow or breaking

## Design Consistency
- Maintain same card styling: `bg-[#1F1F1F]`, `border-[#2A2A2A]`, `hover:bg-[#252525]`
- Keep same icon container: `bg-white/10`, rounded-lg
- Preserve text colors: `text-white`, `text-white/60`
- Use same spacing: `gap-2.5 sm:gap-3`, `p-2.5 sm:p-3`
- Maintain responsive breakpoints: `sm:`, `lg:`

## Notes
- The grid will naturally extend to show all modules (16 total)
- The separator provides visual grouping without breaking the grid
- SuperAdmin Control Panel should stand out but not be overwhelming
- All routes should be placeholder routes that can be implemented later
- Consider adding role-based visibility for certain modules (e.g., SuperAdmin only visible to superadmins)

