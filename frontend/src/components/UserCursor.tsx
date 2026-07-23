import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    type SpringOptions,
} from "framer-motion"

type ClassNames = {
    root?: string
    cursor?: string
    arrow?: string
    label?: string
    labelText?: string
}

type Props = {
    name?: string
    arrow?: React.ReactNode | ((color: string) => React.ReactNode)
    label?: React.ReactNode
    color?: string
    textColor?: string
    size?: number
    labelTiltStrength?: number
    showLabel?: boolean
    offsetX?: number
    offsetY?: number
    labelOffsetUseDefault?: boolean
    labelOffsetX?: number
    labelOffsetY?: number
    pressScale?: number
    offset?: { x?: number; y?: number }
    labelOffset?: { x?: number; y?: number }
    classNames?: ClassNames
    style?: React.CSSProperties
}

const COMPONENT_DEFAULTS = {
    color: "#b89768",
    size: 28,
    pressScale: 0.92,
    offsetX: 0,
    offsetY: 0,
    showLabel: true,
    name: "CALIBRE 04",
    textColor: "#ffffff",
    labelTiltStrength: 25,
    labelOffsetUseDefault: true,
    labelOffsetX: 25,
    labelOffsetY: 12,
}

export default function UserCursor(props: Props) {
    const finalProps = { ...COMPONENT_DEFAULTS, ...props }
    const {
        name,
        arrow,
        label,
        color,
        textColor,
        size,
        labelTiltStrength,
        showLabel,
        offsetX,
        offsetY,
        labelOffsetX,
        labelOffsetY,
        labelOffsetUseDefault,
        pressScale,
        classNames,
        offset: offsetOverride,
        labelOffset: labelOffsetOverride,
        style,
    } = finalProps

    const hideNativeCursor = true
    const hideOnTouch = true
    const zIndex = 9999

    const [isTouchDevice, setIsTouchDevice] = useState(false)
    useEffect(() => {
        if (!hideOnTouch) {
            setIsTouchDevice(false)
            return
        }
        if (typeof window === "undefined" || !window.matchMedia) return
        const mql = window.matchMedia("(pointer: coarse)")
        const sync = () => setIsTouchDevice(!!mql.matches)
        sync()
        if (mql.addEventListener) {
            mql.addEventListener("change", sync)
            return () => mql.removeEventListener("change", sync)
        }
    }, [hideOnTouch])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [hovering, setHovering] = useState(true)
    const [pressed, setPressed] = useState(false)

    const arrowSpring = useMemo<SpringOptions>(
        () => ({ stiffness: 450, damping: 32, mass: 0.5 }),
        []
    )
    const labelSpringCfg = useMemo<SpringOptions>(
        () => ({ stiffness: 240, damping: 26, mass: 0.6 }),
        []
    )

    const resolvedOffset = useMemo(
        () => ({
            x: offsetOverride?.x ?? offsetX,
            y: offsetOverride?.y ?? offsetY,
        }),
        [offsetOverride?.x, offsetOverride?.y, offsetX, offsetY]
    )

    const resolvedLabelOffset = useMemo(() => {
        if (labelOffsetOverride) {
            return {
                x: labelOffsetOverride.x ?? size * 0.9,
                y: labelOffsetOverride.y ?? size * 0.2 + 6,
            }
        }
        if (labelOffsetUseDefault) {
            return { x: size * 0.9, y: size * 0.2 + 6 }
        }
        return { x: labelOffsetX, y: labelOffsetY }
    }, [
        labelOffsetOverride?.x,
        labelOffsetOverride?.y,
        labelOffsetUseDefault,
        labelOffsetX,
        labelOffsetY,
        size,
    ])

    const mouseX = useMotionValue(-9999)
    const mouseY = useMotionValue(-9999)

    const arrowX = useSpring(mouseX, arrowSpring)
    const arrowY = useSpring(mouseY, arrowSpring)
    const labelX = useSpring(mouseX, labelSpringCfg)
    const labelY = useSpring(mouseY, labelSpringCfg)

    const scaleMV = useMotionValue(1)
    useEffect(() => {
        const controls = animate(scaleMV, pressed ? pressScale : 1, {
            type: "spring",
            stiffness: 500,
            damping: 28,
            mass: 0.5,
        })
        return () => controls.stop()
    }, [pressed, pressScale, scaleMV])

    const labelTiltTarget = useMotionValue(0)
    const labelRotation = useSpring(labelTiltTarget, {
        stiffness: 220,
        damping: 24,
        mass: 0.6,
    })

    const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(null)

    useEffect(() => {
        if (isTouchDevice) return
        if (typeof window === "undefined") return

        const onMove = (e: MouseEvent) => {
            const x = e.clientX
            const y = e.clientY

            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const last = lastSampleRef.current
            let vx = 0
            let vy = 0
            if (last) {
                const dt = Math.max(1, now - last.t)
                vx = ((x - last.x) / dt) * 1000
                vy = ((y - last.y) / dt) * 1000
            }
            lastSampleRef.current = { x, y, t: now }

            mouseX.set(x + resolvedOffset.x)
            mouseY.set(y + resolvedOffset.y)

            const speed = Math.hypot(vx, vy)
            const norm = Math.min(1, speed / 1500)
            const sign = vx === 0 ? 0 : vx > 0 ? 1 : -1
            labelTiltTarget.set(sign * norm * labelTiltStrength)

            setHovering(true)
        }

        const onDown = () => setPressed(true)
        const onUp = () => setPressed(false)

        window.addEventListener("mousemove", onMove)
        window.addEventListener("mousedown", onDown)
        window.addEventListener("mouseup", onUp)

        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mousedown", onDown)
            window.removeEventListener("mouseup", onUp)
            setPressed(false)
        }
    }, [
        isTouchDevice,
        labelTiltStrength,
        resolvedOffset.x,
        resolvedOffset.y,
        mouseX,
        mouseY,
        labelTiltTarget,
    ])

    const visible = !isTouchDevice && hovering

    const labelTranslateX = useTransform(labelX, (v) => v + resolvedLabelOffset.x)
    const labelTranslateY = useTransform(labelY, (v) => v + resolvedLabelOffset.y)

    const arrowContent: React.ReactNode = useMemo(() => {
        if (typeof arrow === "function") {
            try {
                return (arrow as (c: string) => React.ReactNode)(color)
            } catch {
                return null
            }
        }
        if (arrow !== undefined && arrow !== null) return arrow as React.ReactNode
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", overflow: "visible" }}
            >
                <path
                    d="M5 3 L23 14 L14 16 L11 24 Z"
                    fill={color}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                />
            </svg>
        )
    }, [arrow, color, size])

    const labelContent: React.ReactNode = useMemo(() => {
        if (label !== undefined && label !== null) return label
        return (
            <div
                className={classNames?.labelText}
                style={{
                    color: textColor,
                    fontSize: Math.max(9, size * 0.42),
                    lineHeight: 1.1,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {name}
            </div>
        )
    }, [label, name, textColor, size, classNames?.labelText])

    if (isTouchDevice) return null

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex,
                cursor: hideNativeCursor ? "none" : undefined,
                ...style,
            }}
        >
            <CursorLayer
                layerStyle={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                visible={visible}
                arrowX={arrowX}
                arrowY={arrowY}
                labelX={labelTranslateX}
                labelY={labelTranslateY}
                labelRotation={labelRotation}
                scale={scaleMV}
                showLabel={showLabel}
                color={color}
                size={size}
                arrowContent={arrowContent}
                labelContent={labelContent}
                classNames={classNames}
            />
        </div>
    )
}

function CursorLayer(props: {
    layerStyle: React.CSSProperties
    visible: boolean
    arrowX: any
    arrowY: any
    labelX: any
    labelY: any
    labelRotation: any
    scale: any
    showLabel: boolean
    color: string
    size: number
    arrowContent: React.ReactNode
    labelContent: React.ReactNode
    classNames?: ClassNames
}) {
    const {
        layerStyle,
        visible,
        arrowX,
        arrowY,
        labelX,
        labelY,
        labelRotation,
        scale,
        showLabel,
        color,
        size,
        arrowContent,
        labelContent,
        classNames,
    } = props

    return (
        <div style={layerStyle}>
            {showLabel && (
                <motion.div
                    className={classNames?.label}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        x: labelX,
                        y: labelY,
                        rotate: labelRotation,
                        scale,
                        background: color,
                        borderRadius: 999,
                        padding: `${size * 0.18}px ${size * 0.42}px`,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)",
                        opacity: visible ? 1 : 0,
                        transformOrigin: "0% 50%",
                        transition: "opacity 140ms ease",
                        willChange: "transform, opacity",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    {labelContent}
                </motion.div>
            )}

            <motion.div
                className={classNames?.cursor}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    x: arrowX,
                    y: arrowY,
                    scale,
                    width: size,
                    height: size,
                    opacity: visible ? 1 : 0,
                    transformOrigin: "0% 0%",
                    transition: "opacity 140ms ease",
                    willChange: "transform, opacity",
                    pointerEvents: "none",
                }}
            >
                <div className={classNames?.arrow} style={{ width: size, height: size }}>
                    {arrowContent}
                </div>
            </motion.div>
        </div>
    )
}
