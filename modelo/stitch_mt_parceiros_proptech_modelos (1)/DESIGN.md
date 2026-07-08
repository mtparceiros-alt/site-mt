# Design System Documentation: The Kinetic Gallery

## 1. Overview & Creative North Star
**The Creative North Star: "The Kinetic Gallery"**
This design system moves away from the stagnant, utility-heavy layouts of traditional Brazilian real estate. We are building "The Kinetic Gallery"—a digital experience that feels like a high-end architectural editorial. It is defined by breathing room, intentional asymmetry, and a sense of physical depth.

To break the "template" look, designers must embrace overlapping elements (e.g., an image bleeding into a text container) and aggressive typographic scales. We do not align everything to a rigid center; we use white space as a structural element to guide the eye through a premium tech journey.

---

## 2. Colors & Surface Architecture
Our palette transitions from a vibrant, tech-forward orange to a series of warm, sophisticated neutrals. 

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are prohibited for sectioning or containment. Boundaries must be defined solely through background color shifts. A `j-bg-surface-container-low` card sitting on a `j-bg-surface` background provides all the definition needed. 

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked physical layers. 
- **Base:** `j-bg-background` (#fff8f6)
- **Layer 1:** `j-bg-surface-container-low` (#fff1ed)
- **Layer 2 (Interactive/Focus):** `j-bg-surface-container` (#ffe9e3)
- **Elevated:** `j-bg-surface-container-highest` (#ffdbd0)

### The Glass & Gradient Rule
To move beyond "flat" design, use **Glassmorphism** for floating navigation or overlay cards. Use `backdrop-blur-xl` combined with a semi-transparent surface color (e.g., `j-bg-surface/80`). 
**Signature Texture:** Use a subtle linear gradient from `j-bg-primary` (#ac2d00) to `j-bg-primary-container` (#d43f0e) for primary CTAs to add "soul" and dimension.

---

## 3. Typography
We use a high-contrast pairing to balance tech-innovation with editorial authority.

*   **Headlines: Plus Jakarta Sans.** This is our "Architectural" voice. Use it for all `display` and `headline` tokens. It should feel bold, wide, and modern.
*   **Body: Inter.** This is our "Functional" voice. Highly legible, neutral, and premium. Use for all `title`, `body`, and `label` tokens.

**The Hierarchy of Intent:**
- **Display Large (56px):** Used for hero statements. Tighten letter-spacing (-0.02em) for a custom look.
- **Headline Medium (28px):** Used for section starts. 
- **Body Large (16px):** The standard for all readable content. Ensure a line height of at least 1.6 for an airy feel.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

### The Layering Principle
Instead of a shadow, place a `j-bg-surface-container-lowest` (#ffffff) card on a `j-bg-surface-container-low` (#fff1ed) background. This creates a soft, "natural lift."

### Ambient Shadows
When an element must float (e.g., a modal or a floating action button), use **Ambient Shadows**:
- **Blur:** 40px to 60px.
- **Opacity:** 4% to 8%.
- **Color:** Use a tinted version of `on-surface` (#2a1610) rather than pure black to mimic natural light.

### The "Ghost Border" Fallback
If accessibility requires a container edge, use a **Ghost Border**: `j-border-outline-variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** Gradient `primary` to `primary-container`. `j-rounded-xl`. High-contrast `on-primary` text.
- **Secondary:** `j-bg-surface-container-high` with `j-text-primary`. No border.
- **Tertiary:** Ghost style. No background. `j-text-primary` with a subtle underline transition on hover.

### Cards (The "Gallery" Item)
Cards must never have borders. Use `j-rounded-xl` or `j-rounded-2xl`. Imagery inside cards should have a subtle `scale-105` hover effect to reinforce the "Kinetic" theme.

### Input Fields
- **Background:** `j-bg-surface-container-low`.
- **Active State:** Change background to `j-bg-surface-lowest` and add a "Ghost Border" of `primary` at 20% opacity.
- **Labels:** Always use `j-label-md` in `j-text-secondary` (#5b4139).

### Interactive Chips
Use `j-bg-surface-container-highest` for unselected and `j-bg-primary` for selected. Rounded-full.

### Navigation (The Floating Bar)
Avoid top-fixed bars that span 100% width. Use a floating, centered navigation pill with `j-bg-surface/80` and `j-backdrop-blur-md`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical margins. For example, a headline might be offset further to the left than the body text below it to create an editorial feel.
- **Do** use `Material Symbols Outlined` with a light stroke weight (200-300) to maintain the premium tech aesthetic.
- **Do** use "Warm Off-White" (`j-bg-background`) for the majority of the canvas to avoid the coldness of pure #FFFFFF.

### Don’t:
- **Don’t** use 1px dividers to separate list items. Use vertical padding and tonal shifts instead.
- **Don’t** use standard "Drop Shadows" from a UI kit. They look cheap. Use our Ambient Shadow formula.
- **Don’t** crowd the interface. If you think there’s enough white space, add 16px more.
- **Don’t** use the Primary Orange for body text. It is for action and emphasis only. Use `j-text-on-surface` for readability.

---

## 7. Tailwind Configuration (j- Prefix)