# Internal Design Notes

## Direction

- Tone: modern enterprise payroll platform
- Personality: premium, operational, trustworthy, finance-safe
- Layout: dark navigation shell with bright, spacious working surfaces
- Density: readable first, compact second

## Core Colors

- Primary navy: `#0B1F3A`
- Secondary navy: `#112B4E`
- Accent blue: `#2563EB`
- Soft background: `#F6F9FC`
- Card white: `#FFFFFF`
- Border: `#D9E2EC`
- Text primary: `#0F172A`
- Text secondary: `#475569`
- Success: `#16A34A`
- Warning: `#D97706`
- Danger: `#DC2626`

These are implemented primarily through CSS variables in [globals.css](/D:/Projects/payroll-frontend/src/app/globals.css).

## Spacing

- Base scale: `8px`
- Page sections: `24px` to `28px`
- Card padding: `20px` to `28px`
- Tight metadata gaps: `8px`
- Section gaps: `16px` to `24px`

## Typography

- Font family: `Public Sans` via app font setup
- Page title: `32px` to `34px`
- Section title: `18px` to `20px`
- KPI values: `24px` to `40px` depending on emphasis
- Eyebrow labels: `11px`, uppercase, tracked
- Body copy: `14px` to `16px`

## Card Styles

- Standard card: soft border, white surface, restrained shadow
- Primary KPI card: white-to-soft-blue surface with stronger emphasis
- Dark hero card: navy gradient for high-priority command surfaces
- Soft semantic card: tinted variants for success and warning summary states

Reusable references:

- [metric-card.tsx](/D:/Projects/payroll-frontend/src/components/ui/metric-card.tsx)
- [section-card.tsx](/D:/Projects/payroll-frontend/src/components/ui/section-card.tsx)

## Table Styles

- Rounded shell with quiet border and low-contrast header background
- Uppercase header labels with strong tracking
- Stronger first-column identity content
- Hover state stays soft; avoid consumer-style animation
- Actions should remain subtle and compact

Reusable references:

- [data-table.tsx](/D:/Projects/payroll-frontend/src/components/ui/data-table.tsx)
- [employee-table.tsx](/D:/Projects/payroll-frontend/src/components/employees/employee-table.tsx)

## Badge Variants

- Neutral: muted slate
- Info: soft blue
- Success: soft green
- Warning: soft amber
- Danger: soft rose

Badges should stay small, uppercase, and semantic.

## Filter Toolbar Pattern

- Eyebrow
- Short title
- One-sentence description
- Optional status/action chips on the right
- Filter controls below in one row when space allows

Reusable reference:

- [filter-toolbar.tsx](/D:/Projects/payroll-frontend/src/components/ui/filter-toolbar.tsx)

## Page Header Pattern

- Eyebrow + optional meta badge
- Large page title
- Short operational description
- Right-side action block for role, period, or direct actions

Reusable reference:

- [page-header.tsx](/D:/Projects/payroll-frontend/src/components/shared/page-header.tsx)
