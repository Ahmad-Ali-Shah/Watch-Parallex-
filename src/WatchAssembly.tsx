import './Watchassembly.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

/* -------------------------------------------------------------------------
 * Asset configuration
 * ------------------------------------------------------------------- */
const TOTAL_FRAMES = 81;
const REVERSE = false;

function getFramePath(frameNumber: number): string {
  return `/images/frame_${frameNumber}.jpg`;
}

function resolveFrameOrder(n: number): number {
  return REVERSE ? TOTAL_FRAMES - n + 1 : n;
}

/* -------------------------------------------------------------------------
 * Audio Synthesizer (Mechanical Watch Tick Sound via Web Audio API)
 * ------------------------------------------------------------------- */
class WatchSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.015);
    } catch {
      // Audio autoplay restrictions ignored safely
    }
  }
}

const soundEngine = new WatchSoundEngine();

/* -------------------------------------------------------------------------
 * Decorative 3D Depth Rings
 * ------------------------------------------------------------------- */
type DepthPart = {
  id: string;
  z: number;
  size: number;
  top: string;
  left: string;
  strokeWidth: number;
  dashed?: boolean;
};

const DEPTH_PARTS: DepthPart[] = [
  { id: 'ring-a', z: -0.9, size: 640, top: '16%', left: '6%', strokeWidth: 0.6 },
  { id: 'ring-b', z: -0.55, size: 360, top: '60%', left: '76%', strokeWidth: 0.8, dashed: true },
  { id: 'ring-c', z: -0.3, size: 220, top: '10%', left: '74%', strokeWidth: 1 },
  { id: 'ring-d', z: 0.35, size: 180, top: '72%', left: '12%', strokeWidth: 1.2, dashed: true },
  { id: 'ring-e', z: 0.7, size: 280, top: '12%', left: '18%', strokeWidth: 1.4 },
];

function DepthRing({ part, progress }: { part: DepthPart; progress: MotionValue<number> }) {
  const travel = 120 * part.z;
  const x = useTransform(progress, [0, 0.5, 1], [-travel, travel * 0.2, -travel]);
  const y = useTransform(progress, [0, 0.5, 1], [travel * 0.3, -travel * 0.1, travel * 0.3]);
  const rotate = useTransform(progress, [0, 1], [0, part.z > 0 ? 60 : -60]);
  const opacity = useTransform(
    progress,
    [0, 0.1, 0.5, 0.9, 1],
    [0, 0.4, 0.75, 0.4, 0]
  );

  return (
    <motion.svg
      className="depth-ring"
      style={{
        top: part.top,
        left: part.left,
        width: part.size,
        height: part.size,
        translateZ: part.z * 220,
        x,
        y,
        rotate,
        opacity,
      }}
      viewBox="0 0 100 100"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke={part.z > 0 ? 'var(--brass)' : 'var(--ink-faint)'}
        strokeWidth={part.strokeWidth}
        strokeDasharray={part.dashed ? '3 6' : undefined}
      />
    </motion.svg>
  );
}

/* -------------------------------------------------------------------------
 * Frame Preloader
 * ------------------------------------------------------------------- */
function useFramePreloader(totalFrames: number) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = new Array(totalFrames + 1);
    let loaded = 0;

    for (let n = 1; n <= totalFrames; n += 1) {
      const img = new Image();
      img.src = getFramePath(resolveFrameOrder(n));
      img.onload = img.onerror = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded === totalFrames) setIsReady(true);
      };
      images[n] = img;
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, [totalFrames]);

  return { images: imagesRef, loadedCount, isReady, progress: loadedCount / totalFrames };
}

/* -------------------------------------------------------------------------
 * Main Watch Assembly Component
 * ------------------------------------------------------------------- */
export default function WatchAssembly() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentDrawnFrame = useRef<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const autoPlayAnimRef = useRef<number | null>(null);

  // Mouse tilt interaction state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 12;
    const y = (clientY / innerHeight - 0.5) * -12;
    setMousePos({ x, y });
  };

  const { images, isReady, progress: loadProgress } = useFramePreloader(TOTAL_FRAMES);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Smooth responsive spring for silky frame scrubbing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 32,
    mass: 0.25,
  });

  const frameFloat = useTransform(smoothProgress, [0, 1], [1, TOTAL_FRAMES]);

  const cameraRotateY = useTransform(smoothProgress, [0, 0.5, 1], [-6 + mousePos.x, 6 + mousePos.x, -6 + mousePos.x]);
  const cameraRotateX = useTransform(smoothProgress, [0, 0.5, 1], [4 + mousePos.y, -4 + mousePos.y, 4 + mousePos.y]);
  const cameraScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.05, 1]);

  // Section text transitions
  const introOpacity = useTransform(scrollYProgress, [0, 0.14, 0.24], [1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.24], [0, -40]);

  const midOpacity = useTransform(scrollYProgress, [0.32, 0.44, 0.6, 0.72], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.32, 0.72], [30, -30]);

  const outroOpacity = useTransform(scrollYProgress, [0.82, 0.92, 1], [0, 1, 1]);
  const outroY = useTransform(scrollYProgress, [0.82, 1], [40, 0]);

  const railScaleY = scrollYProgress;

  const [currentFrameNum, setCurrentFrameNum] = useState(1);
  const [frameLabelText, setFrameLabelText] = useState('001 / 081');

  // Track phase based on current frame
  const currentPhase = useMemo(() => {
    if (currentFrameNum <= 20) return 1;
    if (currentFrameNum <= 45) return 2;
    if (currentFrameNum <= 65) return 3;
    return 4;
  }, [currentFrameNum]);

  useMotionValueEvent(frameFloat, 'change', (latest) => {
    const n = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(latest)));
    if (n !== currentFrameNum) {
      setCurrentFrameNum(n);
      setFrameLabelText(`${String(n).padStart(3, '0')} / ${String(TOTAL_FRAMES).padStart(3, '0')}`);
      soundEngine.playTick();
    }
  });

  /* --- Canvas Fit & Rendering ----------------------------------------- */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = stage.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    currentDrawnFrame.current = -1;
  }, []);

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  const drawFrame = useCallback((frameNumber: number) => {
    const canvas = canvasRef.current;
    const img = images.current[frameNumber];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    if (currentDrawnFrame.current === frameNumber) return;
    currentDrawnFrame.current = frameNumber;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let drawW = cw;
    let drawH = ch;

    if (imgRatio > canvasRatio) {
      drawH = ch * 0.88;
      drawW = drawH * imgRatio;
    } else {
      drawW = cw * 0.88;
      drawH = drawW / imgRatio;
    }

    const dx = (cw - drawW) / 2;
    const dy = (ch - drawH) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }, [images]);

  useMotionValueEvent(frameFloat, 'change', (latest) => {
    if (!isReady) return;
    const n = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(latest)));
    drawFrame(n);
  });

  useEffect(() => {
    if (isReady) drawFrame(1);
  }, [isReady, drawFrame]);

  // Auto Play scroll handler
  useEffect(() => {
    if (isPlaying) {
      const step = () => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const totalScroll = sectionRef.current.clientHeight - window.innerHeight;
        const currentScroll = -rect.top;
        
        if (currentScroll < totalScroll) {
          window.scrollBy({ top: 3.5, behavior: 'instant' });
          autoPlayAnimRef.current = requestAnimationFrame(step);
        } else {
          setIsPlaying(false);
        }
      };
      autoPlayAnimRef.current = requestAnimationFrame(step);
    } else if (autoPlayAnimRef.current) {
      cancelAnimationFrame(autoPlayAnimRef.current);
    }
    return () => {
      if (autoPlayAnimRef.current) cancelAnimationFrame(autoPlayAnimRef.current);
    };
  }, [isPlaying]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playTick();
  };

  const scrollToPhase = (phasePct: number) => {
    if (!sectionRef.current) return;
    const sectionTop = sectionRef.current.offsetTop;
    const sectionHeight = sectionRef.current.clientHeight - window.innerHeight;
    const targetY = sectionTop + sectionHeight * phasePct;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const resetToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadPercent = useMemo(() => Math.round(loadProgress * 100), [loadProgress]);

  return (
    <section 
      ref={sectionRef} 
      className="watch-scroll-track" 
      aria-label="Watch assembly sequence"
    >
      <div className="watch-stage" ref={stageRef} onMouseMove={handleMouseMove}>
        {/* Technical Grid & Optics Overlay */}
        <div className="watch-stage-grid" />
        <svg className="watch-optics-reticle" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="180" strokeWidth="0.75" fill="none" />
          <circle cx="200" cy="200" r="140" strokeWidth="0.5" fill="none" />
          <circle cx="200" cy="200" r="90" strokeWidth="0.5" fill="none" />
          <line x1="200" y1="10" x2="200" y2="390" strokeWidth="0.5" />
          <line x1="10" y1="200" x2="390" y2="200" strokeWidth="0.5" />
        </svg>

        {/* Full-Screen Preloader Overlay */}
        <AnimatePresence>
          {!isReady && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="watch-loader-fullscreen"
              role="status" 
              aria-live="polite"
            >
              <div className="watch-loader-brand">CALIBRE 04</div>
              <div className="watch-loader-sub">A STUDY IN PRECISION — DECONSTRUCTED BY SCROLL</div>
              <div className="watch-loader-bar">
                <div className="watch-loader-fill" style={{ width: `${loadPercent}%` }} />
              </div>
              <div className="watch-loader-pct">PRELOADING 81 HOROLOGY FRAMES • {loadPercent}%</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Perspective & Canvas */}
        <div className="watch-perspective">
          <motion.div
            className="watch-camera"
            style={{
              rotateX: cameraRotateX,
              rotateY: cameraRotateY,
              scale: cameraScale,
            }}
          >
            {DEPTH_PARTS.map((part) => (
              <DepthRing key={part.id} part={part} progress={smoothProgress} />
            ))}

            <div className="watch-canvas-wrap">
              <canvas ref={canvasRef} className="watch-canvas" />
            </div>
          </motion.div>
        </div>

        {/* Interactive Component Hotspots */}
        <div className="watch-hotspots">
          {currentPhase === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="watch-hotspot-item"
              style={{ top: '34%', left: '58%' }}
            >
              <div className="hotspot-ring">
                <div className="hotspot-dot" />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-tag">Phase 01 — Architecture</div>
                <div className="hotspot-title">Grade 5 Titanium Bezel</div>
                <div className="hotspot-desc">Exploded casing with double-domed anti-reflective sapphire.</div>
              </div>
            </motion.div>
          )}

          {currentPhase === 2 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="watch-hotspot-item"
              style={{ top: '46%', left: '22%' }}
            >
              <div className="hotspot-ring">
                <div className="hotspot-dot" />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-tag">Phase 02 — Escapement</div>
                <div className="hotspot-title">Silicon Balance Wheel</div>
                <div className="hotspot-desc">28,800 VPH high precision escapement with 25 synthetic ruby jewels.</div>
              </div>
            </motion.div>
          )}

          {currentPhase === 3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="watch-hotspot-item"
              style={{ top: '38%', left: '64%' }}
            >
              <div className="hotspot-ring">
                <div className="hotspot-dot" />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-tag">Phase 03 — Calibration</div>
                <div className="hotspot-title">Monochrome Satin Dial</div>
                <div className="hotspot-desc">Diamond-cut hands with Super-LumiNova hour markers.</div>
              </div>
            </motion.div>
          )}

          {currentPhase === 4 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="watch-hotspot-item"
              style={{ top: '56%', left: '62%' }}
            >
              <div className="hotspot-ring">
                <div className="hotspot-dot" />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-tag">Phase 04 — Master Assembly</div>
                <div className="hotspot-title">Unified Calibre Engine</div>
                <div className="hotspot-desc">COSC certified chronometer ready with 48h power reserve.</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Narrative Copy Overlays */}
        <div className="watch-copy-layer">
          <motion.div
            className="watch-copy watch-copy--intro"
            style={{ opacity: introOpacity, y: introY }}
          >
            <div className="watch-badge">
              <span className="watch-badge-dot" />
              Reference 04 — Deconstruction
            </div>
            <h2>
              Two hundred parts held in suspension
              <br />
              before they align into <span>a single heart</span>.
            </h2>
          </motion.div>

          <motion.div
            className="watch-copy watch-copy--mid"
            style={{ opacity: midOpacity, y: midY }}
          >
            <div className="watch-mid-card">
              <p>
                Eighty-one discrete frames of mechanical alignment — every gear,
                bridge, and jewel converging under zero-tolerance precision.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="watch-copy watch-copy--outro"
            style={{ opacity: outroOpacity, y: outroY }}
          >
            <div className="watch-outro-badge">
              <CheckCircle2 className="w-5 h-5 text-brass" style={{ color: 'var(--brass)' }} />
              From Scattered Brilliance to Unified Precision
            </div>
          </motion.div>
        </div>

        {/* Left Telemetry Phase Navigation Scrubber */}
        <div className="watch-hud-left">
          <div className="hud-phase-stepper">
            <button 
              type="button"
              className={`hud-phase-btn ${currentPhase === 1 ? 'active' : ''}`}
              onClick={() => scrollToPhase(0.05)}
            >
              <span className="hud-phase-num">01</span>
              <span className="hud-phase-name">Case & Crystal</span>
            </button>
            <button 
              type="button"
              className={`hud-phase-btn ${currentPhase === 2 ? 'active' : ''}`}
              onClick={() => scrollToPhase(0.35)}
            >
              <span className="hud-phase-num">02</span>
              <span className="hud-phase-name">Escapement</span>
            </button>
            <button 
              type="button"
              className={`hud-phase-btn ${currentPhase === 3 ? 'active' : ''}`}
              onClick={() => scrollToPhase(0.65)}
            >
              <span className="hud-phase-num">03</span>
              <span className="hud-phase-name">Dial & Hands</span>
            </button>
            <button 
              type="button"
              className={`hud-phase-btn ${currentPhase === 4 ? 'active' : ''}`}
              onClick={() => scrollToPhase(0.92)}
            >
              <span className="hud-phase-num">04</span>
              <span className="hud-phase-name">Unified Calibre</span>
            </button>
          </div>
        </div>

        {/* Right Frame Counter HUD Rail */}
        <div className="watch-hud-right">
          <div className="hud-frame-box">
            <span className="hud-frame-label">Frame</span>
            <span className="hud-frame-val">{frameLabelText}</span>
          </div>
          <div className="watch-hud-rail">
            <motion.div className="watch-hud-rail-fill" style={{ scaleY: railScaleY }} />
          </div>
        </div>

        {/* Bottom Interactive Control Dock */}
        <div className="watch-bottom-bar">
          <button 
            type="button" 
            className={`bar-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title="Auto Assembly Playback"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <div className="bar-divider" />

          <button 
            type="button" 
            className={`bar-btn ${soundOn ? 'active' : ''}`}
            onClick={toggleSound}
            title="Mechanical Sound Feedback"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundOn ? 'Sound On' : 'Mute'}</span>
          </button>

          <div className="bar-divider" />

          <button 
            type="button" 
            className="bar-btn"
            onClick={resetToTop}
            title="Reset to Top"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
}