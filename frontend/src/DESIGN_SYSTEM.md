# Professional Design System v2.0

## Overview
This document outlines the professional, modern minimal design system for the Financial Assistance application.

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#0066cc` - Main CTA and brand color
- **Primary Dark**: `#0052a3` - Hover state for primary
- **Primary Light**: `#e6f2ff` - Light backgrounds
- **Primary Lighter**: `#f0f8ff` - Very light backgrounds

### Semantic Colors
| Color | Code | Usage |
|-------|------|-------|
| Success | `#10b981` | Success states, confirmations |
| Warning | `#f59e0b` | Cautions, warnings |
| Danger | `#ef4444` | Errors, destructive actions |
| Info | `#3b82f6` | Information, alerts |

### Neutral Colors
| Color | Code | Usage |
|-------|------|-------|
| Text Primary | `#111827` | Main text |
| Text Secondary | `#374151` | Secondary text |
| Text Tertiary | `#6b7280` | Tertiary text |
| Text Muted | `#9ca3af` | Disabled/muted text |
| Border | `#e5e7eb` | Standard borders |
| Background Primary | `#ffffff` | Main background |
| Background Secondary | `#f9fafb` | Secondary background |
| Background Tertiary | `#f3f4f6` | Tertiary background |

---

## Typography

### Font Families
- **Primary**: Inter (UI, body text)
- **Mono**: Geist (Code, technical content)

### Font Sizes
```css
--font-size-xs: 0.75rem    (12px)
--font-size-sm: 0.875rem   (14px)
--font-size-base: 1rem     (16px)
--font-size-lg: 1.125rem   (18px)
--font-size-xl: 1.25rem    (20px)
--font-size-2xl: 1.5rem    (24px)
--font-size-3xl: 1.875rem  (30px)
--font-size-4xl: 2.25rem   (36px)
```

### Font Weights
- **Light**: 300 - Minimal emphasis
- **Normal**: 400 - Default text
- **Medium**: 500 - Slight emphasis
- **Semibold**: 600 - Emphasis
- **Bold**: 700 - Strong emphasis
- **Extrabold**: 800 - Maximum emphasis

### Line Heights
- **Tight**: 1.25 - Headings
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.625 - Comfortable reading
- **Loose**: 2 - Emphasis sections

---

## Spacing System

All spacing follows a consistent scale:
```css
--spacing-xs:   0.25rem  (4px)
--spacing-sm:   0.5rem   (8px)
--spacing-md:   1rem     (16px)
--spacing-lg:   1.5rem   (24px)
--spacing-xl:   2rem     (32px)
--spacing-2xl:  2.5rem   (40px)
--spacing-3xl:  3rem     (48px)
--spacing-4xl:  4rem     (64px)
```

### Usage Guidelines
- **Margins between sections**: `spacing-lg` to `spacing-2xl`
- **Padding inside cards**: `spacing-xl`
- **Gap between components**: `spacing-md` to `spacing-lg`
- **Small elements spacing**: `spacing-sm`

---

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| sm | 0.375rem (6px) | Small elements |
| md | 0.5rem (8px) | Buttons |
| lg | 0.75rem (12px) | Cards, inputs |
| xl | 1rem (16px) | Large cards |
| 2xl | 1.5rem (24px) | Extra large cards |
| full | 9999px | Pills, avatars |

---

## Shadow System

| Shadow | Usage |
|--------|-------|
| xs | Subtle elevation |
| sm | Default cards |
| md | Hovered cards |
| lg | Modals, dropdowns |
| xl | Prominent modals |
| 2xl | Maximum elevation |
| inner | Inset shadows |

---

## Components

### Buttons

#### Primary Button
```jsx
<button className="btn btn-primary">Action</button>
```
- Background: Primary Blue
- Color: White
- Use for: Primary calls-to-action

#### Secondary Button
```jsx
<button className="btn btn-secondary">Action</button>
```
- Background: Background Tertiary
- Color: Text Primary
- Use for: Secondary actions

#### Success Button
```jsx
<button className="btn btn-success">Confirm</button>
```
- Use for: Confirmations, positive actions

#### Danger Button
```jsx
<button className="btn btn-danger">Delete</button>
```
- Use for: Destructive actions, warnings

#### Ghost Button
```jsx
<button className="btn btn-ghost">Link</button>
```
- Use for: Tertiary actions, links

#### Button Sizes
- `btn-sm`: Small buttons
- `btn`: Default (Medium)
- `btn-lg`: Large buttons

### Cards

#### Basic Card
```jsx
<div className="card">
  <div className="card-header">
    <h3>Title</h3>
  </div>
  <div className="card-body">Content</div>
  <div className="card-footer">Footer</div>
</div>
```

#### Glass Card (Optional)
```jsx
<div className="glass-card">Content</div>
```

### Badges

```jsx
<span className="badge badge-primary">Status</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-danger">Danger</span>
```

### Alerts

```jsx
<div className="alert alert-primary">
  <Icon className="alert-icon" />
  <div>Message content</div>
  <button className="alert-close">&times;</button>
</div>
```

Available variants: `alert-primary`, `alert-success`, `alert-warning`, `alert-danger`, `alert-info`

### Forms

#### Input
```jsx
<div className="form-group">
  <label>Label</label>
  <input type="text" className="form-input" />
</div>
```

#### Textarea
```jsx
<div className="form-group">
  <label>Message</label>
  <textarea className="form-input"></textarea>
</div>
```

#### Select
```jsx
<div className="form-group">
  <label>Option</label>
  <select className="form-input">
    <option>Choose...</option>
  </select>
</div>
```

---

## Layout System

### Container
```jsx
<div className="container">
  <!-- Max width 1200px, centered -->
</div>
```

### Grid System

#### 12-Column Grid
```jsx
<div className="dashboard-grid">
  <div className="col-6">50%</div>
  <div className="col-6">50%</div>
</div>
```

#### Flex Grid
```jsx
<div className="grid-2"><!-- Auto 2-column --></div>
<div className="grid-3"><!-- Auto 3-column --></div>
<div className="grid-4"><!-- Auto 4-column --></div>
```

### Flexbox Utilities

```jsx
<div className="d-flex flex-between gap-md">
  <!-- Space-between layout -->
</div>

<div className="d-flex flex-col gap-lg">
  <!-- Vertical layout -->
</div>
```

---

## Utility Classes

### Spacing
- `.p-xs`, `.p-sm`, `.p-md`, `.p-lg`, `.p-xl` - Padding
- `.px-md`, `.py-lg` - Directional padding
- `.m-md`, `.mx-auto`, `.my-lg` - Margin
- `.mt-lg`, `.mb-md` - Directional margins

### Typography
- `.text-center`, `.text-right` - Text alignment
- `.text-sm`, `.text-lg`, `.text-2xl` - Font sizes
- `.font-light`, `.font-bold` - Font weights
- `.line-clamp-2` - Text overflow truncation

### Display
- `.d-flex`, `.d-grid`, `.d-none` - Display types
- `.flex-center`, `.flex-between` - Flex helpers
- `.w-full`, `.h-full` - Sizing

### Colors
- `.text-primary`, `.text-danger` - Text colors
- `.bg-primary`, `.bg-white` - Background colors
- `.text-muted` - Muted text

### Borders & Shadows
- `.border`, `.border-t`, `.border-b` - Borders
- `.rounded-lg`, `.rounded-xl` - Border radius
- `.shadow-sm`, `.shadow-lg` - Shadows

---

## Animations & Transitions

### Transitions
- `--transition-fast`: 150ms
- `--transition-base`: 250ms (default)
- `--transition-slow`: 350ms

### Animations
- `.animate-spin` - Loading spinner
- `.animate-pulse` - Pulsing effect
- `.animate-bounce` - Bouncing effect
- `.animate-slide-in` - Slide-in animation

---

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Media Query Examples
```css
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (max-width: 1024px) {
  /* Tablet styles */
}
```

---

## Accessibility

### WCAG 2.1 Compliance
- Color contrast ratio: ≥ 4.5:1 for normal text
- All interactive elements are keyboard accessible
- Focus states are clearly visible
- Icons have proper ARIA labels

### Best Practices
1. Always include alt text for images
2. Use semantic HTML (buttons, links, etc.)
3. Ensure focus indicators are visible
4. Test with keyboard navigation
5. Include ARIA labels when needed

---

## Dark Mode (Future)

Variables are prepared for dark mode support:
- Create dark mode CSS variables
- Use `prefers-color-scheme` media query
- Update all color values for dark backgrounds

---

## Component Examples

### Stat Card
```jsx
<div className="stat-card">
  <div className="stat-value">$12,500</div>
  <div className="stat-label">Total Balance</div>
  <div className="stat-change positive">↑ 5.2%</div>
</div>
```

### Navigation Item
```jsx
<a href="#" className="nav-item active">
  <Icon />
  <span>Dashboard</span>
</a>
```

### Chart Container
```jsx
<div className="chart-container">
  <!-- Chart content -->
</div>
```

---

## Design Principles

1. **Minimalism**: Clean, uncluttered interface
2. **Clarity**: Clear visual hierarchy
3. **Consistency**: Uniform design patterns
4. **Accessibility**: Inclusive for all users
5. **Performance**: Fast load times
6. **Responsiveness**: Works on all devices
7. **Professional**: Business-appropriate design

---

## Usage Guidelines

### When to Use Colors
- **Primary Blue**: CTAs, important highlights
- **Secondary**: Supporting actions
- **Success**: Positive outcomes, confirmations
- **Warning**: Cautions, pending states
- **Danger**: Errors, destructive actions

### When to Use Spacing
- Increase spacing between sections
- Decrease spacing within groups
- Use consistent spacing for alignment

### When to Use Typography
- Use larger fonts for hierarchy
- Use weights to emphasize
- Maintain readability (line height ≥ 1.5)

---

## Support & Documentation

For questions or updates to the design system, please refer to the main design documentation or contact the design team.
