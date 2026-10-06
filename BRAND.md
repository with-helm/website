# Brand

> Brand kit describing colors, typography, icons and buttons.
> Copied over from the Helm app repo's [`docs/BRAND.md`](https://github.com/with-helm/helm/blob/main/docs/BRAND.md)
> and pared down for the website. That doc is distilled from the Helm design system
> (`docs/refs/helm-design-system.pdf` in the app repo).

## Colors

| Color            | Hex code              | Role                                                                                     |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| Lime             | `#9EFF1F`             | Main CTAs and buttons                                                                    |
| Soft Lime        | `#C1FF72`             | Softer accent: selected states and other visual components                               |
| Cornflower Blue  | `#3D6FF5`             | Illustrations                                                                            |
| Orange           | `#FF914D`             | Badges, tags, progress, status, icons, highlighted words in headlines. Mostly static elements that need attention |
| Sunrise gradient | `#FF3131` → `#FF914D` | Feature banners only (left to right). Don't use it for small UI elements                 |
| White            | `#FFFFFF`             | Card surfaces                                                                            |
| Sand             | `#FAEDDB`             | Page background                                                                          |
| Shale            | `#292929`             | Text over light backgrounds; default icon color                                          |
| Black            | `#000000`             | Use sparingly, for maximum contrast against saturated colors (e.g. icons or small details on lime or orange) |

- Muted text: Shale at 70%. Borders and dividers: Shale at 10%.
- The design system PDF lists Lime as `#91EFF1F` (a typo); its swatch reads `#9EFF1F`. It also calls Sand "Cream" and Shale "Charcoal".

## Typography

| Typeface      | Use for                                               | Weights                   |
| ------------- | ----------------------------------------------------- | ------------------------- |
| Space Grotesk | Major headings, questions, other important UI moments | Bold 700, Medium 500      |
| Inter         | Body copy, button labels, input support text          | Regular 400, Light 300    |
| Space Mono    | Progress, step counters, micro-labels                 | Regular 400, +4% tracking |

All three are free on Google Fonts.

### Type scale

The design system's scale, used by the app.

| Style             | Typeface      | Size | Weight                     |
| ----------------- | ------------- | ---- | -------------------------- |
| H1                | Space Grotesk | 30   | Bold 700                   |
| H2                | Space Grotesk | 24   | Bold 700                   |
| H3                | Space Grotesk | 18   | Medium 500                 |
| Body              | Inter         | 16   | Regular 400                |
| Support / caption | Inter         | 14   | Light 300                  |
| Micro-label       | Space Mono    | 12   | Regular 400 (+4% tracking) |

### Website type scale

The website runs larger than the app's scale. Sizes are in px; ranges scale with the window width (CSS `clamp()`) and are defined in `styles.css`.

| Style                  | Typeface      | Size     | Weight                     | Line height |
| ---------------------- | ------------- | -------- | -------------------------- | ----------- |
| Home title             | Space Grotesk | 64–256   | Bold 700                   | 1           |
| Home subtitle          | Inter         | 20–32    | Regular 400                | 1.5         |
| Nav home link ("HELM") | Space Grotesk | 28       | Bold 700                   | 1.5         |
| Nav links              | Inter         | 18       | Regular 400                | 1.5         |
| Page H1                | Space Grotesk | 40       | Bold 700                   | 1.25        |
| Page H2                | Space Grotesk | 30       | Bold 700                   | 1.25        |
| Page body              | Inter         | 18       | Regular 400                | 1.6         |
| Micro-label            | Space Mono    | 14       | Regular 400 (+4% tracking) | 1.6         |

Page content sits in a column no wider than 65 characters.

## Icons

A quiet, functional icon system: **rounded, geometric and minimal**. Icons support the content without becoming the focus.

- **Family:** [Phosphor Icons](https://phosphoricons.com) via the web font package [`@phosphor-icons/web`](https://github.com/phosphor-icons/web). Don't mix icon families.
- **Weights:** outline icons use the **Bold** weight (`ph-bold`); active / selected icons use **Fill** (`ph-fill`). Phosphor's Regular weight draws 1.5 / 1.25 / 1 px strokes at 24 / 20 / 16 px, which is thinner than the stroke guidance below; Bold draws 2.25 / 1.9 / 1.5 px.
- **Size:** 16, 20 or 24 px, set with `font-size` (the icons are a font).
- **Color:** Shale `#292929` by default, set with `color`. Beside text, an icon uses the same color as the text.
- **Stroke guidance:** don't go below 1.5 px, or above 2.25 px unless the icon is extremely simple.
- **Don't:** let icons become the visual focus, use hand-drawn or decorative styles, change an icon's shape between states (only outline ↔ Fill), or use icons with too much internal detail.

Load only the weights you use:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2/src/bold/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2/src/fill/style.css" />

<i class="ph-bold ph-upload-simple" aria-hidden="true"></i>  <!-- outline -->
<i class="ph-fill ph-sailboat" aria-hidden="true"></i>       <!-- active -->
```

Mark decorative icons `aria-hidden="true"`; give icon-only buttons an `aria-label`.

## Buttons

### Primary button

| Property          | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Fill              | Lime `#9EFF1F`                                                |
| Label             | Shale `#292929`, Inter Regular 16 / 24                        |
| Icon (optional)   | 20 px Phosphor Bold, Shale, before the label                  |
| Corner radius     | Fully rounded (pill)                                          |
| Padding           | 20 px horizontal, 12 px vertical                              |
| Height            | 48 px (12 + 24 line height + 12)                              |
| Icon-to-label gap | 8 px                                                          |
| Alignment         | Icon and label centred in a row                               |
| Border / shadow   | None                                                          |
| Pressed           | 70% opacity                                                   |
| Disabled          | 40% opacity (default; the design system's disabled state is TBD) |

### Secondary button

The primary button with a white fill and a Shale outline. Everything not listed here matches the primary button.

| Property | Value                                              |
| -------- | -------------------------------------------------- |
| Fill     | White `#FFFFFF`                                    |
| Outline  | 1 px Shale `#292929`                               |
| Height   | 50 px (48 px plus the 1 px outline top and bottom) |
