# ⌚ Calibre

### Scroll-Scrubbed Watch Assembly Experience

A luxury dark-themed **React + TypeScript** web experience where a mechanical watch smoothly disassembles and reassembles as you scroll.

Built with **Framer Motion** on the frontend and served through a lightweight **Express + Node.js** backend.

---

# Overview

The provided assets consisted of a **flattened 50-frame JPEG sequence** (`1280 × 720`) rather than separate transparent watch components.

Files ranged from:

```
ezgif-frame-001.jpg
```

to

```
ezgif-frame-050.jpg
```

However, **frame 50** was corrupted (0 bytes), so the project uses **49 working frames**.

These frames were renamed to:

```
frame_1.jpg
...
frame_49.jpg
```

and placed inside:

```
frontend/public/images/
```

---

# Engineering Decisions

Because the source assets were flattened image frames instead of separate watch parts, several implementation choices were made.

### Scroll Scrubbing

The assembly animation is driven directly by the frame sequence.

Instead of playing automatically, each frame is synchronized with the user's scroll position, creating an Apple-style scroll-controlled animation.

---

### 3D Depth

True 3D part separation wasn't possible because the source material contains only flattened images.

Instead, the project builds a real 3D scene using:

- `transform-style: preserve-3d`
- `translateZ()`
- layered decorative depth rings
- camera movement
- parallax
- depth-of-field

If transparent PNG layers or real 3D assets become available later, they can replace the placeholder depth system without changing the surrounding logic.

---

### Animation Direction

Depending on the original frame order, the animation may appear reversed.

If required, simply open:

```
WatchAssembly.tsx
```

and change

```ts
const REVERSE = false;
```

to

```ts
const REVERSE = true;
```

No file renaming is required.

---

# Project Structure

```text
watch-assembly/
│
├── server.js
├── package.json
├── README.md
│
└── frontend/
    ├── public/
    │   └── images/
    │       ├── frame_1.jpg
    │       ├── ...
    │       └── frame_49.jpg
    │
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── App.css
    │   ├── WatchAssembly.tsx
    │   ├── WatchAssembly.css
    │   └── index.css
    │
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig*.json
```

---

# Installation

Requires **Node.js 18+**

```bash
npm run setup
```

This installs dependencies for both the backend and frontend.

---

# Development

Start the Vite development server:

```bash
npm run dev:frontend
```

The application will be available at:

```
http://localhost:5173
```

This mode provides hot reloading and is recommended while developing the animation.

---

# Production

Build the frontend:

```bash
npm run build
```

Serve the production build:

```bash
npm start
```

The Express server hosts the application at:

```
http://localhost:3000
```

The backend also enables:

- Gzip compression
- Long-term caching for hashed assets
- Seven-day caching for image frames

---

# Using Your Own Assets

## Replace the Frame Sequence

Replace the images inside:

```
frontend/public/images/
```

Update:

```ts
TOTAL_FRAMES
```

inside `WatchAssembly.tsx`.

If the filenames differ, adjust:

```ts
getFramePath()
```

accordingly.

---

## Use a Video Instead

Instead of image frames, replace the canvas logic with:

```ts
video.currentTime = progress * video.duration
```

The existing scroll progress can drive video playback without changing the camera or animation logic.

---

## Use Real Watch Parts

If separate PNG assets become available (gears, hands, bridges, crystal, etc.), replace the placeholder depth system with individual layered images.

The existing camera movement, depth calculations, and parallax effects are already designed to support this.

---

# Implementation Details

### Scroll Scrubbing

A `500vh` scrolling container with a sticky viewport maps scroll progress directly to the frame sequence.

Scrolling forward disassembles the watch.

Scrolling backward reassembles it.

---

### Canvas Rendering

All 49 frames are preloaded and drawn onto a single `<canvas>`.

This approach provides significantly smoother playback than swapping `<img>` elements.

---

### Camera Motion

The watch stage responds to scroll using:

- Rotation
- Scale
- Camera dolly movement

These values are spring-smoothed to create more natural motion.

---

### Parallax

Foreground layers move faster than background layers, producing genuine depth instead of opacity-based illusions.

---

### Depth of Field

A masked `backdrop-filter: blur()` creates a realistic focus effect.

The center of the watch always remains sharp while the outer regions blur dynamically during scrolling.

---

### Content Transitions

Three independent text sections:

- Intro
- Middle
- Outro

fade and slide independently using Framer Motion transforms.

---

### Accessibility

The project respects:

- `prefers-reduced-motion`

For smaller screens, the HUD elements automatically hide to maintain a clean layout.
