# TerraSim Frontend Layout Guide

## Overall Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                            HEADER                                    │
│  TerraSim              Climate Risk Engine          [Status Indicator]│
│  (Dark Green: #4a7c5c - #5a8c6c)                                    │
├────────────────────────────┬──────────────────────────────────────────┤
│                            │                                          │
│   LEFT SIDEBAR             │         RIGHT RESULTS PANEL              │
│  (Beige: #f5f3f0)          │     (Farm Background - Blurred)         │
│                            │                                          │
│  ┌────────────────────┐   │   ┌─────────────────────────────────┐   │
│  │ Before you plant   │   │   │     RESULTS DISPLAY              │   │
│  │ • Education text   │   │   │   ✓ Success Rate: 75%           │   │
│  │ • 10k scenarios    │   │   │   ✓ Expected Yield: 5200 kg/ha  │   │
│  └────────────────────┘   │   │   ✓ Risk Level: Medium          │   │
│                            │   │                                  │   │
│  ┌────────────────────┐   │   │   Statistics:                    │   │
│  │ Where plant?       │   │   │   Min: 4100 | Med: 5200 | Max:  │   │
│  │ Lat: [40.7128]     │   │   │                                  │   │
│  │ Lon: [-74.0060]    │   │   │ "How often works?"               │   │
│  │ [Fetch Weather]    │   │   │ 10,000 stochastic futures       │   │
│  └────────────────────┘   │   │                                  │   │
│                            │   │ Simulation Summary:              │   │
│  ┌────────────────────┐   │   │ Crop: Wheat | Terrain: Plain    │   │
│  │ Land itself        │   │   │ Temp: 15°C | Rain: 650mm        │   │
│  │ Crop: [Select]     │   │   │                                  │   │
│  │ Terrain: [Select]  │   │   │ [Run Another Simulation]         │   │
│  │                    │   │   └─────────────────────────────────┘   │
│  │ Details shown when │   │                                          │
│  │ crop selected      │   │   Additional Details (scrollable):       │
│  │ • Temp ranges      │   │   • Simulation Summary                   │
│  │ • Rainfall needs   │   │   • Scenario Comparison                  │
│  │ • Season length    │   │   • Agricultural Confidence Index        │
│  │ • Ideal yield      │   │   • Risk Interpretation                  │
│  └────────────────────┘   │   • Decision Summary                      │
│                            │   • Yield Distribution Chart             │
│                            │   • Risk Breakdown Chart                 │
│                            │   • Practical Recommendations            │
│                            │                                          │
└────────────────────────────┴──────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌──────────────────────┐
│  AgriSimDashboard    │
│    (Main Container)  │
└──────────────────────┘
         │
    ┌────┴─────┬──────────────┐
    │           │              │
    ▼           ▼              ▼
  Header   LeftSidebar   RightResults
    │           │              │
    │      Manages:        Displays:
    │      • Location      • Results
    │      • Crop          • Charts
    │      • Terrain       • Statistics
    │                      • History

Results Flow:
User Input → Simulation → Results Display
   ↓            ↓            ↓
Location    Backend API   Visualization
Crop        Calculation   Summary Cards
Terrain     Data Return   Recommendations
```

## Color Usage

```
┌─────────────────────────────────────────┐
│ HEADER: Dark Green Gradient             │
│ ████████████████████████████████        │
│ #4a7c5c → #5a8c6c                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ LEFT SIDEBAR: Warm Beige Gradient       │
│ ████████████████████████████████        │
│ #f5f3f0 → #ede9e3                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ACCENTS & INDICATORS                    │
│ Success Rate: ████████ (Green #22c55e)  │
│ Expected Yield: ████████ (Green)        │
│ Risk Level: MEDIUM (Yellow #f59e0b)     │
│ Buttons: Dark Green #4a7c5c             │
└─────────────────────────────────────────┘
```

## Responsive Breakpoints

```
Mobile (< 768px):
┌─────────────────────┐
│      HEADER         │
├─────────────────────┤
│  LEFT SIDEBAR       │ (Stacked)
│  Scrollable content │
├─────────────────────┤
│  RIGHT RESULTS      │
│  Scrollable content │
└─────────────────────┘

Tablet/Desktop (≥ 768px):
┌──────────────────────────────────────┐
│            HEADER                    │
├──────────────┬──────────────────────┤
│     LEFT     │    RIGHT RESULTS     │
│   SIDEBAR    │    (side by side)    │
│              │                      │
│  Scrollable  │    Scrollable        │
└──────────────┴──────────────────────┘
```

## Typography Hierarchy

```
HEADER
TerraSim (36px, Bold, White)
Climate Risk Engine (14px, Regular, Light Gray)

LEFT SIDEBAR
Section Headers (28px, Serif, Dark Gray)
  "Before you plant"
  "Where are you planting?"
  "The land itself matters"

Labels (14px, Medium, Dark Gray)
  Latitude, Longitude, Select Crop, etc.

Descriptive Text (14px, Regular, Medium Gray)
  Educational content and explanations

RIGHT RESULTS
Results Heading (32px, Serif, Dark Gray)
  "Results"

Large Metrics (48px, Bold, Dark Gray)
  75% | 5200 | Medium

Metric Labels (14px, Regular, Medium Gray)
  success rate | kg/ha | risk level

Statistics (24px, Bold, Dark Gray)
  4100 | 5200 | 6800

Statistics Labels (12px, Uppercase, Light Gray)
  MINIMUM | MEDIAN | VARIANCE
```

## Key Features

✅ **Two-Column Layout**
   - Inputs on the left, results on the right
   - Prevents scrolling between sections on mobile

✅ **Green Accent Bars**
   - Visual indicators for metrics
   - Match the design mockup exactly
   - Add visual hierarchy

✅ **Blurred Background**
   - Farm/crop imagery in results panel
   - Creates depth and visual interest
   - Doesn't interfere with readability

✅ **Serif Fonts for Headers**
   - Professional, editorial feel
   - Matches your design aesthetic
   - Good readability

✅ **Responsive Design**
   - Works on all screen sizes
   - Mobile-first approach
   - Proper touch spacing

## Testing the Design

To verify the redesign matches your mockup:

1. **Check Header** - Should show "TerraSim" with green background
2. **Check Sidebar** - Should have beige background with three sections
3. **Check Results** - Should display large metrics with green bars
4. **Check Responsiveness** - Resize browser to see mobile layout
5. **Check Scrolling** - Content should scroll independently on each column

---

The frontend is now ready to showcase your beautiful design while maintaining full functionality with the backend!
