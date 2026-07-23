# Calibre — Scroll-Scrubbed Watch Assembly

A luxury, dark-themed React + TypeScript site where a mechanical watch
disassembles and reassembles as the user scrolls, built with Framer Motion,
served by a small Express/Node backend.

## What's actually in the box (read this first)

Your ZIP contained a **flattened 50-frame JPEG sequence** (1280×720,
`ezgif-frame-001.jpg` … `050.jpg`) — a rasterized clip of a watch exploding,
not separate transparent part layers (individual gears/hands/case as their
own sprites). Frame 50 was a 0‑byte corrupt file, so it's excluded; the
project ships with **49 usable frames**, renamed to the generic scheme you
asked for: `frame_1.jpg` … `frame_49.jpg` in `frontend/public/images/`.

That constraint shaped a few honest engineering decisions:

- **The disassemble/reassemble motion itself** is the frame sequence,
  scrubbed frame-by-frame against scroll position — canvas-based, à la
  Apple product pages, not CSS-animated. This is what makes it feel
  "scrubbed" rather than "played."
- **True per-gear 3D depth layering** isn't possible from a flattened
  sequence — there's nothing to separate into individual planes. Instead,
  the component builds a **real 3D depth system** (`transform-style:
  preserve-3d`, per-layer `translateZ`) around the watch stage using a ring
  of decorative machined arcs at different z-depths, so parallax, the
  camera dolly, and depth-of-field are all genuinely functioning — driven
  by scroll — rather than faked with a single flat layer. If you get a
  version of this asset with separated part layers (PNG sprites with alpha,
  or a real 3D/video-with-depth render), swap `DEPTH_PARTS` for real part
  sprites and the whole depth/parallax/DOF system carries over unchanged.
- **Frame direction**: I couldn't fully confirm from a static look whether
  `frame_1` is the assembled state or the exploded one. If the animation
  looks reversed once you scroll it, open `WatchAssembly.tsx` and flip
  `const REVERSE = false` to `true` — no need to rename files.

## Project structure

```
watch-assembly/
├── server.js                 # Express server (serves frontend/dist)
├── package.json              # root deps: express, compression
├── README.md
└── frontend/
    ├── public/images/        # frame_1.jpg … frame_49.jpg
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx            # page shell: nav, hero, WatchAssembly, closing, footer
    │   ├── App.css
    │   ├── WatchAssembly.tsx  # the scroll-scrubbed component
    │   ├── WatchAssembly.css
    │   └── index.css          # global dark theme, Helvetica stack
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig*.json
```

## Setup

Requires Node.js 18+.

```bash
# from the watch-assembly/ root
npm run setup        # installs root + frontend dependencies
```

## Local development (hot reload)

```bash
npm run dev:frontend  # Vite dev server → http://localhost:5173
```

Use this while iterating on the animation — it's much faster than
rebuilding for every tweak.

## Production build + serve via Express

```bash
npm run build   # builds frontend/dist via Vite
npm start        # Express serves frontend/dist → http://localhost:3000
```

`server.js` gzips everything, sets long-cache headers on hashed JS/CSS
bundles, and a shorter 7-day cache on the frame images (so you can swap
frames later without users being stuck on stale ones for a year).

## Using your own / real assets later

- **Swap the image sequence**: drop new files into
  `frontend/public/images/`, update `TOTAL_FRAMES` in `WatchAssembly.tsx`,
  and adjust `getFramePath()` if your naming differs.
- **Switch to a `<video>` scrub instead of frames**: replace the canvas
  drawing logic with `video.currentTime = progress * video.duration` on a
  `<video>` element with `preload="auto"` — the same `scrollYProgress`
  motion value drives it, everything else (camera, parallax, DOF, copy)
  stays as-is.
- **Real separated part layers**: if you get individual PNGs (mainspring,
  balance wheel, bridges, hands, case, crystal — each with alpha and its
  own natural z-order), replace `DEPTH_PARTS`/`DepthRing` with actual
  `<img>`/`<motion.img>` elements per part, each assigned a `z` and an
  explode-distance; the parallax/DOF/camera math is reusable directly.

## Key implementation notes

- **Scroll scrub**: `WatchAssembly` renders a tall (`500vh`) track with a
  `position: sticky` stage inside it. `useScroll({ target, offset: ['start
  start', 'end end'] })` gives a 0→1 progress across that track, mapped
  1:1 (no spring) to frame index — so it tracks the scrollbar exactly,
  including scrolling back up to reassemble.
- **Canvas over `<img>` swapping**: all 49 frames are preloaded, then
  drawn to a single `<canvas>` sized/cropped with cover-fit logic. This
  avoids 49 stacked DOM images and gives a much smoother scrub than
  toggling `src` or opacity-crossfading `<img>` tags.
- **Camera dolly**: the `.watch-camera` layer (which contains the canvas
  stage and the depth rings) gets `rotateX`/`rotateY`/`scale` driven by a
  *spring-smoothed* copy of scroll progress — smoothed because it's purely
  atmospheric and never needs to hit an exact frame.
  layers travel further per scroll unit than background ones (real
  parallax, not just opacity).
- **Depth of field**: `.watch-dof` is a masked `backdrop-filter: blur()`
  layer — a radial gradient mask keeps the exact center (the dial) always
  sharp, blurs the edges, and the blur strength itself increases mid-scroll
  (rack focus) and relaxes back down at both the fully-assembled and
  fully-exploded resting states.
- **Copy overlays**: three text blocks (`intro`/`mid`/`outro`) each have
  their own `useTransform` opacity/`y` windows over `scrollYProgress`, so
  they overlap and fade independently rather than hard-cutting.
- **Accessibility**: `prefers-reduced-motion` is respected globally
  (`index.css`); the HUD (progress rail/frame counter) hides on small
  screens rather than crowding the layout.
