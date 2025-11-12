# Cursor Prompt: Extend Module Selector with Vertical Modules

## Task
Extend the module selector in `src/components/ok-suite-module-selector.tsx` to add 9 new modules below the existing 7 modules, with a visual separator between the two groups. The SuperAdmin Control Panel should be highlighted as the most important module.

## Current Modules (Keep These)
- OK CRM, OK HR, OK Ops, OK Train, OK Books, OK Orders, OK Agents

## New Modules to Add (Below Separator)

### Vertical Modules (8 modules):
1. **OllDeals**
   - Description: "Deal Management & Negotiations"
   - Icon: `Briefcase` from lucide-react
   - Route: `/oll-deals`

2. **LegalNations Admin**
   - Description: "Legal Operations & Compliance"
   - Icon: `Scale` from lucide-react
   - Route: `/legal-nations`

3. **USDrop Admin**
   - Description: "USDrop Platform Administration"
   - Icon: `Shield` from lucide-react
   - Route: `/usdrop/admin`

4. **USDrop Free User**
   - Description: "USDrop Free Tier Access"
   - Icon: `User` from lucide-react
   - Route: `/usdrop/free`

5. **USDrop Pro User**
   - Description: "USDrop Pro Tier Access"
   - Icon: `Crown` from lucide-react
   - Route: `/usdrop/pro`

6. **Faire USA Order Management Admin**
   - Description: "Faire USA Order Administration"
   - Icon: `ShoppingBag` from lucide-react
   - Route: `/faire-usa/orders`

7. **Faire USA Products Portal**
   - Description: "Faire USA Product Management"
   - Icon: `Box` from lucide-react
   - Route: `/faire-usa/products`

8. **Dashboards & Reports**
   - Description: "Analytics, Insights & Reporting"
   - Icon: `BarChart3` from lucide-react
   - Route: `/dashboard/reports`

### SuperAdmin Module (1 module - HIGHLIGHTED):
9. **SuperAdmin Control Panel**
   - Description: "System Administration & Control"
   - Icon: `Lock` from lucide-react
   - Route: `/admin/control-panel`
   - **Special:** Add `ring-2 ring-[#4A9EFF] border-[#4A9EFF]/50` styling to make it stand out

## Implementation Requirements

1. **Add Separator:**
   - Insert a horizontal divider with label "Vertical Modules" between existing and new modules
   - Use: `<div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#2A2A2A]"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1A1A1A] px-2 text-white/40">Vertical Modules</span></div></div>`

2. **Update Module Array:**
   - Add all 9 modules to the `OK_MODULES` array
   - Use `groupLabel: "Verticals"` for modules 1-8
   - Use `groupLabel: "Administration"` for SuperAdmin module

3. **Grid Layout:**
   - Keep existing `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` layout
   - Grid will naturally extend to show all 16 modules

4. **SuperAdmin Highlighting:**
   - Add conditional styling when `module.id === 'superadmin'`:
   - `ring-2 ring-[#4A9EFF] border-[#4A9EFF]/50 bg-[#1F2A3A]/30`

5. **Update Group Mappings:**
   - Add "Verticals" and "Administration" to `groupDefaultRoutes`, `groupIcons`, and `groupDescriptions`

6. **Import Icons:**
   - Add: `Briefcase`, `Scale`, `Shield`, `User`, `Crown`, `ShoppingBag`, `Box`, `BarChart3`, `Lock` to lucide-react imports

## Design Consistency
- Maintain exact same card styling, colors, spacing, and responsive behavior
- Only difference: SuperAdmin module gets accent ring/border
- Separator should match dark theme (`border-[#2A2A2A]`, `text-white/40`)

## Testing
- Verify all 16 modules display correctly
- Check separator appears between groups
- Confirm SuperAdmin module is visually highlighted
- Test responsive layout (mobile, tablet, desktop)
- Verify module selection and navigation work

