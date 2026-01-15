# TerraSim Frontend - Visual Preview

## What You're Getting

Your TerraSim frontend has been completely redesigned based on your mockup image to create a modern, professional agricultural simulation platform.

## Layout Preview

### Desktop View (≥768px)

```
╔═══════════════════════════════════════════════════════════════════════╗
║  TerraSim                Climate Risk Engine    [Connection Status]   ║
║  ═══════════════════════════════════════════════════════════════════ ║
║  
║  ┌──────────────────────────────┬────────────────────────────────────┐
║  │                              │                                    │
║  │      LEFT SIDEBAR            │     RIGHT RESULTS PANEL            │
║  │   (Warm Beige Background)    │   (Farm Background - Blurred)      │
║  │                              │                                    │
║  │ Before you plant             │              RESULTS               │
║  │                              │                                    │
║  │ We run 10,000 randomized     │  ██████ 0%                        │
║  │ climate scenarios for your   │         success rate              │
║  │ chosen location and crop...  │                                    │
║  │                              │  ██████ --                        │
║  │ [Divider line]               │         kg/ha expected yield       │
║  │                              │                                    │
║  │ Where are you planting?      │  ██████ --                        │
║  │                              │                                    │
║  │ Latitude:                    │  MINIMUM: --    MEDIAN: --        │
║  │ [__________ e.g., 40.7128]   │  VARIANCE: --                     │
║  │                              │                                    │
║  │ Longitude:                   │  How often does this actually work?│
║  │ [__________ e.g., -74.0060]  │                                    │
║  │                              │  10,000 stochastic futures, sampled│
║  │ [Fetch Weather Data]         │  independently                     │
║  │                              │                                    │
║  │ [Divider line]               │  Simulation Summary:               │
║  │                              │  Crop: Wheat | Terrain: Plain     │
║  │ The land itself matters      │  Temp: 15°C | Rainfall: 650mm     │
║  │                              │                                    │
║  │ Select Crop:                 │  [Run Another Simulation]          │
║  │ [Select dropdown]            │                                    │
║  │                              │  ─────────────────────────────────│
║  │ Terrain Type:                │                                    │
║  │ [Select dropdown]            │  [Additional details below...]     │
║  │                              │  • Yield Distribution Chart        │
║  │ When crop selected:          │  • Risk Breakdown Chart            │
║  │ • Temp: X°C - Y°C            │  • Recommendations                 │
║  │ • Rainfall: X - Y mm/yr      │  • Analysis & Factors              │
║  │ • Season: X days             │                                    │
║  │ • Ideal yield: X kg/ha       │                                    │
║  │                              │                                    │
║  └──────────────────────────────┴────────────────────────────────────┘
║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Mobile View (<768px)

```
╔═══════════════════════════════════╗
║  TerraSim Climate Risk Engine     ║
║  ════════════════════════════════ ║
║
║  LEFT SIDEBAR (Stacked)           ║
║  ─────────────────────────────    ║
║  Before you plant                 ║
║  Where are you planting?          ║
║  [Form fields...]                 ║
║  The land itself matters          ║
║  [Selection fields...]            ║
║  ════════════════════════════════ ║
║
║  RIGHT RESULTS (Stacked)          ║
║  ─────────────────────────────    ║
║  RESULTS                          ║
║  ──────────────────────────────── ║
║  ██████ 0%                        ║
║         success rate              ║
║                                   ║
║  ██████ --                        ║
║         kg/ha expected yield      ║
║                                   ║
║  ██████ --                        ║
║         risk level                ║
║  ════════════════════════════════ ║
║
╚═══════════════════════════════════╝
```

## Color Scheme

### Header
- **Background**: Dark Green Gradient
  - From: `#4a7c5c`
  - To: `#5a8c6c`
- **Text**: White (`#ffffff`)
- **Subtitle**: Light Gray (`#e5e7eb`)

### Left Sidebar
- **Background**: Warm Beige Gradient
  - From: `#f5f3f0`
  - To: `#ede9e3`
- **Text**: Dark Gray (`#1f2937`)
- **Labels**: Medium Gray (`#6b7280`)
- **Dividers**: Light Gray (`#d1d5db`)

### Right Results
- **Background**: Blurred farm image with overlay
- **Text**: Dark Gray (`#1f2937`)
- **Accent Bars**: Green (`#4a7c5c`)
- **Success Indicator**: Bright Green (`#22c55e`)

### Buttons
- **Default**: Dark Green (`#4a7c5c`)
- **Hover**: Darker Green (`#3a6c4c`)
- **Disabled**: Gray (`#9ca3af`)

## Typography

### Headings (Serif - Georgia/Garamond)
- **Main Title**: 36px, Bold, White (Header)
- **Subtitle**: 14px, Regular, Light Gray
- **Section Headers**: 28px, Bold, Dark Gray
- **Results Title**: 32px, Bold, Dark Gray

### Body Text (Sans-serif)
- **Labels**: 14px, Medium, Dark Gray
- **Description**: 14px, Regular, Medium Gray
- **Large Metrics**: 48px, Bold, Dark Gray
- **Medium Metrics**: 24px, Bold, Dark Gray
- **Statistics**: 16px, Regular, Medium Gray

## Key Design Elements

### Success Rate Display
```
██████ 75%
success rate
```
- Green bar indicator
- Large percentage
- Clear label below

### Expected Yield Display
```
██████ 5200
kg/ha expected yield
```
- Green bar indicator
- Large number
- Unit clarification

### Risk Level Display
```
██████ Medium
risk level
```
- Green bar indicator
- Clear status text
- Color-coded (green/yellow/red)

### Statistics Row
```
MINIMUM     MEDIAN      VARIANCE
  4100       5200        6800
```
- Uppercase labels
- Bold numbers
- Three-column layout
- Centered alignment

## Interactions & States

### Button States
- **Default**: Green background, white text
- **Hover**: Darker green, subtle shadow lift
- **Active**: Slight scale down animation
- **Disabled**: Gray, no hover effect

### Form Inputs
- **Focused**: Blue ring outline, blue top border
- **Filled**: Normal gray borders
- **Error**: Red borders, error message

### Loading State
- Spinner animation in button
- Progress indicator at bottom-right
- Activity messages cycling
- Scenario count updates

### Results Display
- Smooth fade-in animation
- Chart animations on load
- Hover effects on metrics
- Expandable sections

## Responsive Features

### Tablet Breakpoint (md: 768px)
- Sidebar width: 24rem (384px)
- Right panel: flexible width
- Side-by-side layout
- Independent scrolling

### Mobile Breakpoint (<768px)
- Full-width stacked layout
- Touch-friendly spacing
- Larger tap targets (48px+)
- Optimized form fields
- Readable text sizes

## Accessibility Features

✅ Semantic HTML structure
✅ ARIA labels for interactive elements
✅ Proper heading hierarchy
✅ Color contrast compliance
✅ Keyboard navigation support
✅ Focus indicators
✅ Alt text for images
✅ Error messages associated with inputs
✅ Status updates with aria-live regions
✅ Screen reader support

## Animation & Transitions

- **Smooth Page Transitions**: 300ms ease-out
- **Hover Effects**: 150ms ease
- **Loading Spinner**: Continuous rotation
- **Progress Bar**: Smooth width transition
- **Chart Renders**: Fade in over 500ms
- **Button Clicks**: Scale effect (95% → 100%)
- **Modal Overlays**: Fade in (0 → 100%)

## Performance Optimizations

- Component splitting for better code organization
- Lazy loading of chart components
- Efficient state updates with React hooks
- Debounced input handling
- Optimized image backgrounds (SVG/blurred)
- CSS-based animations (hardware accelerated)
- Proper cleanup of intervals and timeouts
- Minimal re-renders with proper dependency arrays

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | Latest | ✅ Full |
| Edge | Latest | ✅ Full |
| Mobile Chrome | Latest | ✅ Full |
| Mobile Safari | Latest | ✅ Full |
| Samsung Browser | Latest | ✅ Full |

## Dark Mode (Future Enhancement)

The design is optimized for light mode. Dark mode support can be added by:
1. Creating a dark theme variant
2. Using CSS custom properties for colors
3. Detecting system preference with `prefers-color-scheme`
4. Providing manual toggle in header

## Customization Options

The design can be easily customized by modifying:

1. **Colors**: Update hex values in component files
2. **Fonts**: Change font-family in Tailwind config
3. **Spacing**: Adjust padding/margin Tailwind classes
4. **Borders**: Modify border-radius and border-width
5. **Shadows**: Update shadow definitions
6. **Animations**: Change transition durations
7. **Layout**: Adjust breakpoints and grid sizes

## Screenshot Descriptions

### Header Section
Dark green professional header with white "TerraSim" branding and gray "Climate Risk Engine" subtitle. Connection status indicator on the right side.

### Left Sidebar
Warm beige gradient background containing three main sections with serif headings: "Before you plant" (educational), "Where are you planting?" (location inputs), and "The land itself matters" (crop/terrain selection). Each section separated by subtle divider lines.

### Right Results Panel
Blurred farm background with results overlay showing:
- Three key metrics with green bar indicators
- Large percentage and yield values
- Statistics row with minimum, median, variance
- Explanatory text about simulation scope
- Call-to-action button to run another simulation

### Empty State
Clean placeholder text when no results are displayed: "Ready to analyze - Fill in the details and run a simulation to see results"

### Loading State
Progress indicator at bottom-right corner showing scenario count and percentage complete. Main panel shows "Running simulation..." message.

### Results Detail
Scrollable area below key metrics showing detailed analysis including yield distribution charts, risk breakdown visualizations, and practical recommendations.

---

**The design successfully balances aesthetics with functionality, creating a professional platform for agricultural risk analysis.**
