import { useEffect, useId, useRef, useState } from "react"

function containRect(iW: number, iH: number, cW: number, cH: number) {
    const a = iW / iH,
        b = cW / cH
    return a > b
        ? {
              x: 0,
              y: Math.round((cH - cW / a) / 2),
              w: cW,
              h: Math.round(cW / a),
          }
        : {
              x: Math.round((cW - cH * a) / 2),
              y: 0,
              w: Math.round(cH * a),
              h: cH,
          }
}

export default function JuiceEffect(props: any) {
    const finalProps = { ...COMPONENT_DEFAULTS, ...props }
    const {
        imageConfig,
        colorMode,
        particleColor,
        particleSize,
        density,
        movementArea,
        speed,
        hoverEnabled,
        hoverRadius,
        width,
        height,
        style,
    } = finalProps

    const allowOffBounds = movementArea === "offbounds"

    const {
        image,
        mode = "fill",
        sizeUnit = "%",
        widthPx = 400,
        heightPx = 400,
        widthPct = 100,
        heightPct = 100,
        scale = 10,
    } = (imageConfig as any) || {}

    const [dims, setDims] = useState({ W: 0, H: 0 })
    const w = dims.W
    const h = dims.H

    const particleCount = Math.round(
        Math.max(0, Math.min(100, density ?? 0)) * 60
    )

    const gooStrength = 5
    const breakChance = 50

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const particlesRef = useRef<any[]>([])
    const mouseRef = useRef({
        x: -9999,
        y: -9999,
        prevX: -9999,
        prevY: -9999,
        speed: 0,
        active: false,
    })
    const rafRef = useRef<number | null>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)
    const [imgReady, setImgReady] = useState(false)
    const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "-")
    const filterId = `liquid-goo-${reactId}`

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            const W = Math.round(r.width)
            const H = Math.round(r.height)
            if (!W || !H) return
            setDims({ W, H })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (!image) {
            imageRef.current = null
            setImgReady(false)
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imageRef.current = img
            setImgReady(true)
        }
        img.onerror = () => {
            imageRef.current = null
            setImgReady(false)
        }
        img.src = image
    }, [image])

    const getImgRect = (img: HTMLImageElement) => {
        if (mode === "fit") {
            const base = containRect(
                img.naturalWidth || img.width,
                img.naturalHeight || img.height,
                w,
                h
            )
            const f = Math.max(1, Math.min(20, scale)) / 10
            const dw = base.w * f
            const dh = base.h * f
            return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
        }
        if (sizeUnit === "px") {
            const dw = Math.min(widthPx, w)
            const dh = Math.min(heightPx, h)
            return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
        }
        const dw = (w * widthPct) / 100
        const dh = (h * heightPct) / 100
        return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
    }

    const distRef = useRef<Float32Array | null>(null)

    useEffect(() => {
        if (!imgReady || !w || !h) {
            distRef.current = null
            return
        }
        const img = imageRef.current
        if (!img) {
            distRef.current = null
            return
        }
        const off = document.createElement("canvas")
        off.width = w
        off.height = h
        const oCtx = off.getContext("2d", { willReadFrequently: true })
        if (!oCtx) return
        const { dx, dy, dw, dh } = getImgRect(img)
        oCtx.drawImage(img, dx, dy, dw, dh)
        let data: Uint8ClampedArray
        try {
            data = oCtx.getImageData(0, 0, w, h).data
        } catch {
            distRef.current = null
            return
        }
        const ALPHA_THR = 50
        const dist = new Float32Array(w * h)
        const INF = 1e9
        for (let i = 0; i < w * h; i++) {
            dist[i] = data[i * 4 + 3] < ALPHA_THR ? 0 : INF
        }
        const D1 = 1
        const D2 = 1.4142
        for (let y = 1; y < h; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = y * w + x
                let v = dist[i]
                if (dist[i - w] + D1 < v) v = dist[i - w] + D1
                if (dist[i - 1] + D1 < v) v = dist[i - 1] + D1
                if (dist[i - w - 1] + D2 < v) v = dist[i - w - 1] + D2
                if (dist[i - w + 1] + D2 < v) v = dist[i - w + 1] + D2
                dist[i] = v
            }
        }
        for (let y = h - 2; y >= 0; y--) {
            for (let x = w - 2; x >= 1; x--) {
                const i = y * w + x
                let v = dist[i]
                if (dist[i + w] + D1 < v) v = dist[i + w] + D1
                if (dist[i + 1] + D1 < v) v = dist[i + 1] + D1
                if (dist[i + w + 1] + D2 < v) v = dist[i + w + 1] + D2
                if (dist[i + w - 1] + D2 < v) v = dist[i + w - 1] + D2
                dist[i] = v
            }
        }
        distRef.current = dist
    }, [
        imgReady,
        w,
        h,
        mode,
        sizeUnit,
        widthPx,
        heightPx,
        widthPct,
        heightPct,
        scale,
    ])

    const sampleSpawnX = (): number => {
        const img = imageRef.current
        if (!img) return Math.random() * w
        const rect = getImgRect(img)
        return rect.dx + Math.random() * rect.dw
    }

    const spawnAtBottom = (p: any) => {
        p.x = sampleSpawnX()
        p.y = h + Math.random() * (h * 0.15)
        p.vx = (Math.random() - 0.5) * 0.25
        p.vy = -(0.9 + Math.random() * 0.3)
        p.baseSize = 0.75 + Math.random() * 0.7
        p.jitterPhase = Math.random() * Math.PI * 2
        p.jitterAmp = 0.015 + Math.random() * 0.03
        p.direction = "up"
    }

    const spawnAtTop = (p: any) => {
        p.x = sampleSpawnX()
        p.y = -Math.random() * (h * 0.15)
        p.vx = (Math.random() - 0.5) * 0.25
        p.vy = 0.9 + Math.random() * 0.3
        p.baseSize = 0.75 + Math.random() * 0.7
        p.jitterPhase = Math.random() * Math.PI * 2
        p.jitterAmp = 0.015 + Math.random() * 0.03
        p.direction = "down"
    }

    useEffect(() => {
        if (!w || !h) return
        const list = []
        for (let i = 0; i < particleCount; i++) {
            const p: any = {
                shape: 0.85 + Math.random() * 0.3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
            }
            if (i % 2 === 0) spawnAtBottom(p)
            else spawnAtTop(p)
            p.y = Math.random() * h
            list.push(p)
        }
        particlesRef.current = list
    }, [particleCount, w, h, imgReady])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !w || !h) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const speedMul = 0.05 + Math.pow((speed - 1) / 9, 1.3) * 2.35
        let last = performance.now()

        const drawBlob = (cx: number, cy: number, baseR: number) => {
            ctx.beginPath()
            ctx.arc(cx, cy, baseR, 0, Math.PI * 2)
            ctx.fill()
        }

        let imgCache: HTMLCanvasElement | null = null
        let imgCacheKey = ""
        const ensureImgCache = (img: HTMLImageElement) => {
            const { dx, dy, dw, dh } = computeImgRect(img)
            const key = `${w}x${h}|${dx},${dy},${dw},${dh}|${img.src}`
            if (imgCache && imgCacheKey === key) return
            const c = document.createElement("canvas")
            c.width = w
            c.height = h
            const cctx = c.getContext("2d")
            if (!cctx) return
            cctx.drawImage(img, dx, dy, dw, dh)
            imgCache = c
            imgCacheKey = key
        }

        const computeImgRect = (img: HTMLImageElement) => {
            if (mode === "fit") {
                const base = containRect(
                    img.naturalWidth || img.width,
                    img.naturalHeight || img.height,
                    w,
                    h
                )
                const f = Math.max(1, Math.min(20, scale)) / 10
                const dw = base.w * f
                const dh = base.h * f
                return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
            }
            if (sizeUnit === "px") {
                const dw = Math.min(widthPx, w)
                const dh = Math.min(heightPx, h)
                return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
            }
            const dw = (w * widthPct) / 100
            const dh = (h * heightPct) / 100
            return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
        }

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            ctx.globalCompositeOperation = "source-over"
            ctx.clearRect(0, 0, w, h)

            const particles = particlesRef.current
            const mouse = mouseRef.current
            mouse.speed *= 0.88
            const breakProb = (breakChance / 100) * dt
            const hovering = hoverEnabled && mouse.active && hoverRadius > 0
            const spill: [number, number, number][] = []

            const useImage = colorMode !== "custom" && imageRef.current !== null
            ctx.fillStyle = useImage && !allowOffBounds ? "#000" : particleColor
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                if (p.direction === "down") {
                    if (p.vy > 1.6) p.vy = 1.6
                } else {
                    if (p.vy < -1.6) p.vy = -1.6
                }

                p.vx += Math.sin(p.jitterPhase + now * 0.0015) * p.jitterAmp
                p.vx *= 0.96

                if (Math.random() < breakProb) {
                    p.vx += (Math.random() - 0.5) * 1.8
                    p.vy += (Math.random() - 0.5) * 0.6
                }

                if (p.repX === undefined) p.repX = 0
                if (p.repY === undefined) p.repY = 0
                let inZone = false
                if (hovering) {
                    const dx = p.x - mouse.x
                    const dy = p.y - mouse.y
                    const distSq = dx * dx + dy * dy
                    const cutoff = hoverRadius
                    if (distSq > 0 && distSq < cutoff * cutoff) {
                        const dist = Math.sqrt(distSq)
                        const nx = dx / dist
                        const ny = dy / dist
                        const falloff = 1 - dist / cutoff
                        const push = falloff * mouse.speed * 0.05
                        p.repX += nx * push
                        p.repY += ny * push
                        const targetRepX = nx * (cutoff - dist)
                        const targetRepY = ny * (cutoff - dist)
                        p.repX += (targetRepX - p.repX) * 0.06
                        p.repY += (targetRepY - p.repY) * 0.06
                        inZone = true
                    }
                }
                if (!inZone) {
                    p.repX *= 0.97
                    p.repY *= 0.97
                }
                const hoverOX = p.repX
                const hoverOY = p.repY

                p.x += p.vx * speedMul * 60 * dt
                p.y += p.vy * speedMul * 60 * dt
                p.rotation += p.rotSpeed * speedMul

                const edgeBand = h * 0.15
                const distFromEdge = Math.min(p.y, h - p.y)
                const vertFactor =
                    distFromEdge >= edgeBand
                        ? 1
                        : Math.max(0.25, distFromEdge / edgeBand)
                const distMap = distRef.current
                let alphaFactor = 1
                if (distMap && !allowOffBounds) {
                    const ix = Math.max(0, Math.min(w - 1, Math.floor(p.x)))
                    const iy = Math.max(0, Math.min(h - 1, Math.floor(p.y)))
                    const d = distMap[iy * w + ix]
                    const band = particleSize * 1.5
                    alphaFactor = Math.max(0.25, Math.min(1, d / band))
                }
                const sizeFactor = Math.min(vertFactor, alphaFactor)

                const margin = particleSize * 2
                if (p.direction === "down") {
                    if (p.y > h + margin) spawnAtTop(p)
                } else {
                    if (p.y < -margin) spawnAtBottom(p)
                }
                if (p.x < -margin) p.x = w + margin
                if (p.x > w + margin) p.x = -margin

                const drawX = p.x + hoverOX
                const drawY = p.y + hoverOY
                drawBlob(drawX, drawY, particleSize * p.baseSize * sizeFactor)

                if (
                    hovering &&
                    !allowOffBounds &&
                    (hoverOX !== 0 || hoverOY !== 0)
                ) {
                    const dm = distRef.current
                    const ix = Math.max(0, Math.min(w - 1, Math.floor(p.x)))
                    const iy = Math.max(0, Math.min(h - 1, Math.floor(p.y)))
                    if (dm && dm[iy * w + ix] > 0) {
                        spill.push([
                            drawX,
                            drawY,
                            particleSize * p.baseSize * sizeFactor,
                        ])
                    }
                }
            }

            const img = imageRef.current
            if (img) {
                ensureImgCache(img)
                if (imgCache) {
                    if (useImage) {
                        ctx.globalCompositeOperation = allowOffBounds
                            ? "source-atop"
                            : "source-in"
                        ctx.drawImage(imgCache, 0, 0)
                    } else if (!allowOffBounds) {
                        ctx.globalCompositeOperation = "destination-in"
                        ctx.drawImage(imgCache, 0, 0)
                    }
                    ctx.globalCompositeOperation = "source-over"
                }
            }

            if (spill.length) {
                ctx.globalCompositeOperation = "source-over"
                ctx.fillStyle = particleColor
                for (let s = 0; s < spill.length; s++) {
                    const sp = spill[s]
                    ctx.beginPath()
                    ctx.arc(sp[0], sp[1], sp[2], 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        }
    }, [
        w,
        h,
        speed,
        colorMode,
        particleColor,
        particleSize,
        hoverEnabled,
        hoverRadius,
        breakChance,
        imgReady,
        mode,
        sizeUnit,
        widthPx,
        heightPx,
        widthPct,
        heightPct,
        scale,
        allowOffBounds,
    ])

    const filterActive = gooStrength > 0
    const blur = Math.max(
        0.3,
        Math.min(particleSize * 0.35, gooStrength * 0.35)
    )
    const matrix = `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7`

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width,
                height,
                overflow: "hidden",
                ...style,
            }}
            onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return
                const scaleX = rect.width > 0 ? w / rect.width : 1
                const scaleY = rect.height > 0 ? h / rect.height : 1
                const mx = (e.clientX - rect.left) * scaleX
                const my = (e.clientY - rect.top) * scaleY
                const m = mouseRef.current
                if (m.prevX > -9999) {
                    const ddx = mx - m.prevX
                    const ddy = my - m.prevY
                    m.speed = Math.sqrt(ddx * ddx + ddy * ddy)
                }
                m.prevX = mx
                m.prevY = my
                m.x = mx
                m.y = my
                m.active = true
            }}
            onMouseLeave={() => {
                const m = mouseRef.current
                m.active = false
                m.x = -9999
                m.y = -9999
                m.prevX = -9999
                m.prevY = -9999
                m.speed = 0
            }}
        >
            <svg
                aria-hidden
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                }}
            >
                <defs>
                    <filter id={filterId} colorInterpolationFilters="sRGB">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={blur}
                            result="blur"
                        />
                        <feColorMatrix in="blur" values={matrix} result="goo" />
                        <feComposite
                            in="SourceGraphic"
                            in2="goo"
                            operator="atop"
                        />
                    </filter>
                </defs>
            </svg>
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    filter: filterActive ? `url(#${filterId})` : "none",
                }}
            />
        </div>
    )
}

const COMPONENT_DEFAULTS = {
    imageConfig: {
        mode: "fill",
        sizeUnit: "%",
        widthPx: 400,
        heightPx: 400,
        widthPct: 100,
        heightPct: 100,
        scale: 10,
    },
    colorMode: "custom",
    particleColor: "#b89768",
    density: 35,
    particleSize: 12,
    movementArea: "inbounds",
    speed: 4,
    hoverEnabled: true,
    hoverRadius: 90,
}
