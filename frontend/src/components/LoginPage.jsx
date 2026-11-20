import React, { useEffect, useState } from 'react';
import BrandMark from './BrandMark';

const HERO_SLIDES = [
  {
    eyebrow: '01 / SPRINT COMMAND',
    title: 'See the whole sprint in one clear view.',
    description: 'Bring delivery signals, story progress, and team focus into a single living workspace.',
    metric: '82%',
    metricLabel: 'sprint health',
    bars: [48, 73, 58, 88, 66]
  },
  {
    eyebrow: '02 / MOMENTUM BUILDER',
    title: 'Turn priorities into forward motion.',
    description: 'Move from planning to delivery with a visual flow that keeps the next step obvious.',
    metric: '+24%',
    metricLabel: 'team velocity',
    bars: [38, 55, 68, 76, 94]
  },
  {
    eyebrow: '03 / TEAM SIGNAL',
    title: 'Make every handoff feel connected.',
    description: 'Keep stories, tasks, and people aligned as work moves through every stage.',
    metric: '4 stages',
    metricLabel: 'one shared flow',
    bars: [72, 52, 83, 61, 91]
  }
];

export default function LoginPage({ onLogin, onRegister, demoUsers }) {
  const [isRegister, setIsRegister] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slidesPaused, setSlidesPaused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const activeHeroSlide = HERO_SLIDES[activeSlide];

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (slidesPaused || isRegister || prefersReducedMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 8500);

    return () => window.clearInterval(timer);
  }, [isRegister, slidesPaused]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await onRegister({ name, email, password, role });
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setError('');
    setLoading(true);
    try {
      await onLogin(user.email, 'password123');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Background glow effects */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <div className="login-container">
        {/* Left hero brand column */}
        <div
          className="login-hero"
          onMouseEnter={() => setSlidesPaused(true)}
          onMouseLeave={() => setSlidesPaused(false)}
          onFocusCapture={() => setSlidesPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setSlidesPaused(false);
          }}
        >
          <div className="login-hero-header">
            <div className="logo-badge-lg"><BrandMark /></div>
            <h1 className="hero-brand-name">ApexAgile Pro</h1>
          </div>

          <h2 className="hero-headline">
            Agile Project Management, <br />
            <span className="gradient-text">Engineered for Velocity.</span>
          </h2>

          <p className="hero-subtext">
            A connected command center for planning, delivery, and team momentum.
          </p>

          <section className="hero-feature-slide" aria-label="ApexAgile feature highlights">
            <div className="hero-slide-copy" key={activeSlide}>
              <span className="hero-slide-eyebrow">{activeHeroSlide.eyebrow}</span>
              <h3>{activeHeroSlide.title}</h3>
              <p>{activeHeroSlide.description}</p>
            </div>
            <div className="hero-slide-visual" data-slide={activeSlide} aria-hidden="true">
              <div className="hero-visual-orbit hero-visual-orbit-one" />
              <div className="hero-visual-orbit hero-visual-orbit-two" />
              <div className="hero-visual-panel">
                <div className="hero-visual-panel-top">
                  <BrandMark />
                  <span>{activeHeroSlide.metricLabel}</span>
                  <strong>{activeHeroSlide.metric}</strong>
                </div>
                <div className="hero-visual-bars">
                  {activeHeroSlide.bars.map((height, index) => (
                    <span key={index} style={{ '--bar-height': `${height}%`, '--bar-index': index }} />
                  ))}
                </div>
                <div className="hero-visual-panel-foot">
                  <span>BACKLOG</span><i /><span>IN FLIGHT</span><i /><span>SHIPPED</span>
                </div>
              </div>
              <span className="hero-visual-float hero-visual-float-one">+18.6%</span>
              <span className="hero-visual-float hero-visual-float-two">LIVE</span>
            </div>
          </section>

          <div className="hero-slide-controls" role="group" aria-label="Feature slides">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.eyebrow}
                type="button"
                aria-pressed={activeSlide === index}
                aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                className={`hero-slide-dot ${activeSlide === index ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
            <span className="hero-slide-count">{String(activeSlide + 1).padStart(2, '0')} / 03</span>
            <button
              type="button"
              className="hero-slide-next"
              aria-label="Next feature slide"
              onClick={() => setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)}
            >
              →
            </button>
          </div>

          <div className="hero-badge-pill">
            <span>🚀 Production-Grade Agile PMS</span>
            <span>•</span>
            <span>Small Team Edition</span>
          </div>
        </div>

        {/* Right authentication form column */}
        <div className="login-card-wrapper">
          <div className="login-card">
            <div className="card-tab-switcher">
              <button
                type="button"
                className={`card-tab ${!isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(false); setError(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`card-tab ${isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(true); setError(''); }}
              >
                Create Account
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                {isRegister ? 'Join Your Agile Workspace' : 'Welcome Back'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                {isRegister ? 'Register your profile to access projects and boards' : 'Select a team role below for 1-click test drive'}
              </p>
            </div>

            {error && (
              <div className="login-error-alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Quick Demo Login Pills */}
            {!isRegister && demoUsers && demoUsers.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  ⚡ Quick Demo Login (Click to Enter)
                </div>
                <div className="demo-users-grid">
                  {demoUsers.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="demo-user-pill"
                      disabled={loading}
                      onClick={() => handleQuickLogin(u)}
                    >
                      <div className="avatar-circle-sm" style={{ backgroundColor: u.avatar_color }}>
                        {u.name.charAt(0)}
                      </div>
                      <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-sub)' }}>
                          {u.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="divider-text">
              <span>OR ENTER CREDENTIALS</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label">FULL NAME</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@sprintsync.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {isRegister && (
                <div className="form-group">
                  <label className="form-label">TEAM ROLE</label>
                  <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="PRODUCT_OWNER">Product Owner</option>
                    <option value="SCRUM_MASTER">Scrum Master</option>
                    <option value="DEVELOPER">Software Developer</option>
                    <option value="QA_ENGINEER">QA Automation Engineer</option>
                    <option value="DESIGNER">UI/UX Product Designer</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">PASSWORD</label>
                  {!isRegister && (
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Demo accounts use password123</span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 8 : undefined}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-live="polite"
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '14px', marginTop: '6px', fontWeight: 700 }}
              >
                {loading ? 'Authenticating...' : isRegister ? 'Create Account & Enter' : 'Sign In to Workspace ➔'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
