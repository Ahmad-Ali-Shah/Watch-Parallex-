import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import WatchAssembly from './WatchAssembly';
import UserCursor from './components/UserCursor';
import JuiceEffect from './components/JuiceEffect';
import {
  Sliders,
  Layers,
  Compass,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import './App.css';

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <a href="#study" className="nav-mark" onClick={(e) => { e.preventDefault(); scrollToSection('study'); }}>
        <span className="nav-tick-dot" />
        CALIBRE 04
      </a>
      <nav className="nav-links">
        <a href="#study" onClick={(e) => { e.preventDefault(); scrollToSection('study'); }}>
          Study
        </a>
        <a href="#deconstruction" onClick={(e) => { e.preventDefault(); scrollToSection('deconstruction'); }}>
          Assembly
        </a>
        <a href="#specs" onClick={(e) => { e.preventDefault(); scrollToSection('specs'); }}>
          Specs
        </a>
        <a href="#acquire" onClick={(e) => { e.preventDefault(); scrollToSection('acquire'); }}>
          Acquire
        </a>
      </nav>
      <button 
        type="button" 
        className="nav-cta"
        onClick={() => scrollToSection('acquire')}
      >
        Reserve Ref. 04
      </button>
    </header>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.08], [0, -30]);

  const scrollToWatch = () => {
    const el = document.getElementById('deconstruction');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="study">
      <motion.div className="hero-inner" style={{ opacity: heroOpacity, y: heroY }}>
        <div className="hero-eyebrow">
          <Sparkles size={12} className="text-brass" />
          A Study in Precision — Reference 04
        </div>

        <div style={{ margin: '10px 0 20px', display: 'flex', justifyContent: 'center' }}>
          <JuiceEffect width={140} height={100} particleColor="#b89768" density={25} hoverEnabled={true} />
        </div>

        <h1 className="hero-title">
          The Architecture <span>of Time</span>.
          <br />
          Deconstructed by Scroll.
        </h1>

        <p className="hero-sub">
          Scroll through eighty-one frames of mechanical alignment — as two hundred components
          find their way back to a single, quiet certainty.
        </p>

        <div className="hero-metrics">
          <div className="metric-card">
            <div className="metric-val">200+</div>
            <div className="metric-lbl">Hand-Finished Parts</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">28,800</div>
            <div className="metric-lbl">Vibrations / Hour</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">Grade 5</div>
            <div className="metric-lbl">Titanium Case</div>
          </div>
          <div className="metric-card">
            <div className="metric-val">48 Hours</div>
            <div className="metric-lbl">Power Reserve</div>
          </div>
        </div>

        <div className="hero-scroll-cue" onClick={scrollToWatch}>
          <span>Scroll to Deconstruct</span>
          <div className="hero-scroll-line" />
        </div>
      </motion.div>
    </section>
  );
}

function SpecificationsSection() {
  const [activeTab, setActiveTab] = useState<'movement' | 'case' | 'dial' | 'strap'>('movement');

  return (
    <section className="specs-section" id="specs">
      <div className="specs-header">
        <div className="hero-eyebrow" style={{ marginBottom: 12 }}>
          <Cpu size={12} />
          Atelier Technical Specifications
        </div>
        <h2 className="specs-title">Craftsmanship in Every Component</h2>
      </div>

      <div className="specs-tabs">
        <button
          type="button"
          className={`spec-tab-btn ${activeTab === 'movement' ? 'active' : ''}`}
          onClick={() => setActiveTab('movement')}
        >
          01. Calibre Movement
        </button>
        <button
          type="button"
          className={`spec-tab-btn ${activeTab === 'case' ? 'active' : ''}`}
          onClick={() => setActiveTab('case')}
        >
          02. Case Architecture
        </button>
        <button
          type="button"
          className={`spec-tab-btn ${activeTab === 'dial' ? 'active' : ''}`}
          onClick={() => setActiveTab('dial')}
        >
          03. Dial & Optics
        </button>
        <button
          type="button"
          className={`spec-tab-btn ${activeTab === 'strap' ? 'active' : ''}`}
          onClick={() => setActiveTab('strap')}
        >
          04. Strap & Ergonomics
        </button>
      </div>

      <div className="specs-grid">
        {activeTab === 'movement' && (
          <>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Clock size={20} /></div>
              <div className="spec-card-title">Silicon Hairspring</div>
              <div className="spec-card-desc">Immune to magnetic fields and thermal expansion, ensuring unyielding chronometric precision.</div>
              <div className="spec-card-val">ANTIMAGNETIC ~ 15,000 GAUSS</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Layers size={20} /></div>
              <div className="spec-card-title">25 Synthetic Jewels</div>
              <div className="spec-card-desc">Precision-ground ruby bearings placed at high-friction gear pivots to eliminate mechanical wear.</div>
              <div className="spec-card-val">SYNTHETIC RUBY BEARING</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Sliders size={20} /></div>
              <div className="spec-card-title">COSC Chronometer Certified</div>
              <div className="spec-card-desc">Individually tested across 5 positions for 15 days to guarantee rate accuracy within -4/+6 seconds per day.</div>
              <div className="spec-card-val">COSC OFFICIALLY CERTIFIED</div>
            </div>
          </>
        )}

        {activeTab === 'case' && (
          <>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Shield size={20} /></div>
              <div className="spec-card-title">Grade 5 Titanium</div>
              <div className="spec-card-desc">Space-grade titanium alloy combining extreme tensile strength with ultra-lightweight wrist comfort.</div>
              <div className="spec-card-val">41MM DIAMETER / 11.2MM THICK</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Compass size={20} /></div>
              <div className="spec-card-title">Sapphire Crystal Box</div>
              <div className="spec-card-desc">Scratch-resistant double-domed sapphire glass treated with 7-layer anti-reflective coating inside & out.</div>
              <div className="spec-card-val">MOHS HARDNESS 9</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Shield size={20} /></div>
              <div className="spec-card-title">Sealed O-Ring Crown</div>
              <div className="spec-card-desc">Screw-down crown with dual fluorocarbon gaskets engineered for 50 meters of water pressure.</div>
              <div className="spec-card-val">5 ATM / 50 METERS WATERPROOF</div>
            </div>
          </>
        )}

        {activeTab === 'dial' && (
          <>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Sparkles size={20} /></div>
              <div className="spec-card-title">Satin-Brushed Dial</div>
              <div className="spec-card-desc">Micro-textured monochrome surface crafted to absorb harsh reflections while exuding subtle luxury depth.</div>
              <div className="spec-card-val">MONOCHROME FINISH</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Sliders size={20} /></div>
              <div className="spec-card-title">Diamond-Cut Hands</div>
              <div className="spec-card-desc">Faceted hour and minute hands polished by hand with mirror chamfered edges for legibility at any light angle.</div>
              <div className="spec-card-val">HAND-FINISHED CHAMFERS</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Clock size={20} /></div>
              <div className="spec-card-title">Super-LumiNova Indexing</div>
              <div className="spec-card-desc">Swiss Grade X1 photoluminescent pigment applied to markers for clear legibility in total darkness.</div>
              <div className="spec-card-val">SUPER-LUMINOVA X1</div>
            </div>
          </>
        )}

        {activeTab === 'strap' && (
          <>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Layers size={20} /></div>
              <div className="spec-card-title">Perforated Italian Leather</div>
              <div className="spec-card-desc">Hand-stitched full-grain calfskin leather treated for moisture resistance and maximum wrist breathability.</div>
              <div className="spec-card-val">20MM LUG WIDTH</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Shield size={20} /></div>
              <div className="spec-card-title">Quick-Release Spring Bars</div>
              <div className="spec-card-desc">Tool-free strap exchange mechanism allowing effortless switching between leather, rubber, and steel bands.</div>
              <div className="spec-card-val">TOOL-FREE SWAP</div>
            </div>
            <div className="spec-detail-card">
              <div className="spec-card-icon"><Sliders size={20} /></div>
              <div className="spec-card-title">Titanium Pin Buckle</div>
              <div className="spec-card-desc">Bead-blasted titanium buckle featuring laser-engraved Calibre atelier mark and micro-adjustments.</div>
              <div className="spec-card-val">LASER-ENGRAVED LOGO</div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Closing() {
  const [engraving, setEngraving] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="closing" id="acquire">
      <div className="closing-inner">
        <div className="hero-eyebrow">
          <Sparkles size={12} />
          Atelier Allocation — Reference 04
        </div>
        
        <h2 className="closing-title">
          Precision isn't the absence of complexity.
          <br />
          It's <span>complexity, resolved</span>.
        </h2>
        
        <p className="closing-sub">
          Calibre 04 is built in limited atelier production runs. Request your serial allocation number
          and reserve your bespoke horology piece today.
        </p>

        <form className="closing-form-card" onSubmit={handleSubmit}>
          {!submitted ? (
            <>
              <div className="form-group">
                <label htmlFor="engraving-input" className="form-label">Custom Dial Engraving (Optional)</label>
                <input 
                  id="engraving-input"
                  type="text" 
                  className="form-input"
                  placeholder="e.g. A. ALIBRE — 2026"
                  maxLength={24}
                  value={engraving}
                  onChange={(e) => setEngraving(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email-input" className="form-label">Collector Email Address</label>
                <input 
                  id="email-input"
                  type="email" 
                  className="form-input"
                  placeholder="collector@horology.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="closing-cta">
                Request Allocation Number
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <div className="closing-success">
              <CheckCircle2 size={22} />
              <div>
                <strong>Allocation Request Received!</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.85 }}>
                  Serial Ref: CAL-04-{Math.floor(100 + Math.random() * 900)} reserved for {email}.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-mark">CALIBRE 04</div>
      <div className="site-footer-meta">
        <span>Atelier Monochrome</span>
        <span>Est. High Precision</span>
        <span>&copy; {new Date().getFullYear()} All Rights Reserved</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <UserCursor name="CALIBRE 04" color="#b89768" textColor="#ffffff" size={28} />
      <Nav />
      <Hero />
      <div id="deconstruction">
        <WatchAssembly />
      </div>
      <SpecificationsSection />
      <Closing />
      <Footer />
    </div>
  );
}
