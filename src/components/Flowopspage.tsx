"use client";

import { useEffect, useRef } from "react";

export default function FlowOpsPage() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    document.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      cursor.style.left = mx + "px";
      cursor.style.top = my + "px";
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const targets = document.querySelectorAll(
      "a, button, .int-chip, .feature-card, .price-card, .metric-card",
    );
    const expand = () => {
      cursor.classList.add("expand");
      ring.classList.add("expand");
    };
    const shrink = () => {
      cursor.classList.remove("expand");
      ring.classList.remove("expand");
    };
    targets.forEach((el) => {
      el.addEventListener("mouseenter", expand);
      el.addEventListener("mouseleave", shrink);
    });

    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = Number(el.dataset.delay ?? 0);
            setTimeout(() => el.classList.add("visible"), delay);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll<HTMLElement>(".reveal").forEach((el, i) => {
      el.dataset.delay = String((i % 3) * 80);
      observer.observe(el);
    });

    // Counter animation
    const animateCounter = (
      el: Element,
      target: number,
      suffix: string,
      duration = 1800,
    ) => {
      let start: number | null = null;
      const numEl = el.querySelector(".stat-num") as HTMLElement;
      if (!numEl) return;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = parseFloat((target * ease).toFixed(target < 10 ? 1 : 0));
        numEl.innerHTML = val + '<span class="unit">' + suffix + "</span>";
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const statsData: [number, string][] = [
      [99, ".98%"],
      [14, "ms"],
      [40, "k+"],
      [2.1, "B"],
    ];
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".stat-item").forEach((item, i) => {
              setTimeout(
                () => animateCounter(item, statsData[i][0], statsData[i][1]),
                i * 150,
              );
            });
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    const statsGrid = document.querySelector(".stats-grid");
    if (statsGrid) statsObserver.observe(statsGrid);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      statsObserver.disconnect();
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", expand);
        el.removeEventListener("mouseleave", shrink);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #060a10;
          --bg2: #0b1120;
          --bg3: #0f1825;
          --cyan: #00e5ff;
          --cyan2: #00b8d9;
          --green: #00ff94;
          --orange: #ff6b35;
          --red: #ff3d57;
          --text: #e2eaf5;
          --muted: #637089;
          --border: rgba(0,229,255,0.12);
          --border2: rgba(255,255,255,0.06);
          --font-mono: ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace;
          --font-display: system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-display);
          overflow-x: hidden;
          cursor: none;
        }

        /* CURSOR */
        .cursor {
          position: fixed; width: 8px; height: 8px;
          background: var(--cyan); border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transform: translate(-50%, -50%);
          transition: width 0.2s, height 0.2s, opacity 0.2s;
          mix-blend-mode: screen;
        }
        .cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1px solid rgba(0,229,255,0.4); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s, opacity 0.2s;
        }
        .cursor.expand { width: 16px; height: 16px; }
        .cursor-ring.expand { width: 56px; height: 56px; border-color: rgba(0,229,255,0.2); }

        /* GRID BACKGROUND */
        .grid-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .grid-bg::after {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,255,148,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 60%, rgba(255,107,53,0.03) 0%, transparent 60%);
        }

        .scanlines {
          position: fixed; inset: 0; z-index: 200;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px);
          pointer-events: none;
        }

        /* NAV */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid var(--border2);
          background: rgba(6,10,16,0.8);
          backdrop-filter: blur(24px);
          animation: slideDown 0.6s ease both;
        }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: none; opacity: 1; } }

        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-mono); font-size: 18px; font-weight: 700;
          color: var(--cyan); letter-spacing: -0.5px; text-decoration: none;
        }
        .nav-logo .bracket { color: var(--muted); }
        .logo-dot {
          width: 8px; height: 8px; background: var(--cyan); border-radius: 50%;
          box-shadow: 0 0 12px var(--cyan); animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
        .nav-links a {
          font-family: var(--font-mono); font-size: 13px; color: var(--muted);
          text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s; position: relative;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 1px; background: var(--cyan); transform: scaleX(0);
          transition: transform 0.2s; transform-origin: left;
        }
        .nav-links a:hover { color: var(--text); }
        .nav-links a:hover::after { transform: scaleX(1); }

        .nav-cta { display: flex; align-items: center; gap: 12px; }
        .btn-ghost {
          font-family: var(--font-mono); font-size: 13px; color: var(--muted);
          background: none; border: none; cursor: none; padding: 8px 16px; transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--text); }
        .btn-primary {
          font-family: var(--font-mono); font-size: 13px; font-weight: 500;
          color: var(--bg); background: var(--cyan); border: none; cursor: none;
          padding: 10px 22px; border-radius: 2px;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s; letter-spacing: 0.05em;
        }
        .btn-primary:hover { background: #33ecff; box-shadow: 0 0 24px rgba(0,229,255,0.4); transform: translateY(-1px); }

        section { position: relative; z-index: 1; }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 120px 48px 80px; text-align: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px; font-weight: 500;
          color: var(--cyan); background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.2);
          padding: 6px 14px; border-radius: 2px; letter-spacing: 0.1em;
          margin-bottom: 32px; animation: fadeUp 0.8s 0.2s both;
        }
        .badge-dot { width: 5px; height: 5px; background: var(--green); border-radius: 50%; box-shadow: 0 0 8px var(--green); animation: pulse 1.5s infinite; }
        .hero h1 {
          font-size: clamp(52px, 8vw, 96px); font-weight: 800; line-height: 0.95;
          letter-spacing: -0.04em; margin-bottom: 28px; animation: fadeUp 0.8s 0.3s both;
        }
        .hero h1 .line2 {
          display: block;
          background: linear-gradient(135deg, var(--cyan) 0%, var(--green) 50%, var(--cyan) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: fadeUp 0.8s 0.3s both, shimmer 4s linear 1s infinite;
        }
        @keyframes shimmer { to { background-position: 200% center; } }
        .hero-sub {
          font-family: var(--font-mono); font-size: 15px; color: var(--muted);
          max-width: 560px; line-height: 1.8; margin: 0 auto 48px; animation: fadeUp 0.8s 0.45s both;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;
          margin-bottom: 72px; animation: fadeUp 0.8s 0.55s both;
        }
        .btn-hero {
          font-family: var(--font-mono); font-size: 14px; font-weight: 700;
          color: var(--bg); background: var(--cyan); border: none; cursor: none;
          padding: 16px 36px; border-radius: 2px; letter-spacing: 0.08em;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .btn-hero::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
          transform: translateX(-100%); transition: transform 0.5s;
        }
        .btn-hero:hover { box-shadow: 0 0 40px rgba(0,229,255,0.5); transform: translateY(-2px); }
        .btn-hero:hover::before { transform: translateX(100%); }
        .btn-outline {
          font-family: var(--font-mono); font-size: 14px; color: var(--text);
          background: none; border: 1px solid var(--border); cursor: none;
          padding: 15px 32px; border-radius: 2px; letter-spacing: 0.05em;
          transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .btn-outline:hover { border-color: var(--cyan); color: var(--cyan); background: rgba(0,229,255,0.05); }
        .btn-outline svg { width: 16px; height: 16px; }

        @keyframes fadeUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: none; } }

        /* TERMINAL */
        .terminal {
          width: 100%; max-width: 720px; margin: 0 auto;
          border-radius: 8px; overflow: hidden; border: 1px solid var(--border);
          box-shadow: 0 0 80px rgba(0,229,255,0.08), 0 40px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.8s 0.7s both; background: var(--bg2);
        }
        .terminal-header {
          display: flex; align-items: center; gap: 8px; padding: 14px 20px;
          background: var(--bg3); border-bottom: 1px solid var(--border2);
        }
        .terminal-dot { width: 12px; height: 12px; border-radius: 50%; }
        .terminal-dot.red { background: var(--red); }
        .terminal-dot.yellow { background: #ffd60a; }
        .terminal-dot.green { background: var(--green); }
        .terminal-title { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin-left: auto; margin-right: auto; }
        .terminal-body { padding: 24px 28px; font-family: var(--font-mono); font-size: 13px; line-height: 1.9; }
        .t-line { display: flex; gap: 12px; align-items: flex-start; }
        .t-prompt { color: var(--green); flex-shrink: 0; }
        .t-cmd { color: var(--text); }
        .t-cmd .flag { color: var(--cyan); }
        .t-cmd .arg { color: var(--orange); }
        .t-output { color: var(--muted); }
        .t-success { color: var(--green); }
        .t-warn { color: #ffd60a; }
        .t-cursor { display: inline-block; width: 8px; height: 14px; background: var(--cyan); vertical-align: middle; animation: blink 1s step-end infinite; margin-left: 2px; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* STATS */
        .stats {
          padding: 64px 48px; border-top: 1px solid var(--border2);
          border-bottom: 1px solid var(--border2); background: var(--bg2); position: relative; z-index: 1;
        }
        .stats-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { padding: 24px 40px; border-right: 1px solid var(--border2); text-align: center; }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-family: var(--font-mono); font-size: 42px; font-weight: 700; color: var(--cyan); letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
        .stat-num .unit { font-size: 24px; color: var(--cyan2); }
        .stat-label { font-family: var(--font-mono); font-size: 11px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }

        /* FEATURES */
        .features { padding: 120px 48px; }
        .section-header { text-align: center; margin-bottom: 80px; }
        .section-tag { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; }
        .section-title { font-size: clamp(32px, 4vw, 52px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
        .section-title span { color: var(--cyan); }
        .section-desc { font-family: var(--font-mono); font-size: 14px; color: var(--muted); max-width: 480px; margin: 16px auto 0; line-height: 1.8; }

        .features-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
          background: var(--border2); border: 1px solid var(--border2);
        }
        .feature-card { background: var(--bg); padding: 48px 40px; transition: background 0.3s; position: relative; overflow: hidden; }
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 1px; background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          transform: scaleX(0); transition: transform 0.4s;
        }
        .feature-card:hover { background: var(--bg2); }
        .feature-card:hover::before { transform: scaleX(1); }
        .feature-icon {
          width: 48px; height: 48px; margin-bottom: 24px;
          background: rgba(0,229,255,0.08); border: 1px solid var(--border);
          border-radius: 4px; display: flex; align-items: center; justify-content: center;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover .feature-icon { background: rgba(0,229,255,0.15); box-shadow: 0 0 20px rgba(0,229,255,0.2); }
        .feature-icon svg { width: 22px; height: 22px; color: var(--cyan); }
        .feature-num { font-family: var(--font-mono); font-size: 11px; color: var(--muted); letter-spacing: 0.1em; margin-bottom: 12px; }
        .feature-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.02em; }
        .feature-desc { font-family: var(--font-mono); font-size: 13px; color: var(--muted); line-height: 1.8; }

        /* PIPELINE */
        .pipeline { padding: 100px 48px; background: var(--bg2); border-top: 1px solid var(--border2); }
        .pipeline-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .pipeline-track { display: flex; flex-direction: column; }
        .pipeline-step { display: flex; align-items: stretch; position: relative; }
        .step-connector { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
        .step-dot {
          width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--cyan);
          background: var(--bg); flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; transition: background 0.3s, box-shadow 0.3s;
        }
        .step-dot.done { background: var(--green); border-color: var(--green); box-shadow: 0 0 12px rgba(0,255,148,0.4); }
        .step-dot.running { border-color: var(--orange); animation: pulse 1s infinite; }
        .step-line { flex: 1; width: 2px; background: linear-gradient(to bottom, var(--cyan), rgba(0,229,255,0.1)); margin: 4px 0; min-height: 32px; }
        .pipeline-step:last-child .step-line { display: none; }
        .step-card {
          flex: 1; margin-bottom: 12px; margin-left: 16px;
          background: var(--bg); border: 1px solid var(--border2);
          border-radius: 4px; padding: 16px 20px; transition: border-color 0.3s, background 0.3s;
        }
        .step-card:hover { border-color: var(--border); background: var(--bg3); }
        .step-card.active-card { border-color: rgba(0,229,255,0.3); }
        .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .step-name { font-size: 14px; font-weight: 600; }
        .step-badge { font-family: var(--font-mono); font-size: 10px; padding: 2px 8px; border-radius: 2px; }
        .badge-success { color: var(--green); background: rgba(0,255,148,0.1); border: 1px solid rgba(0,255,148,0.2); }
        .badge-running { color: var(--orange); background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.2); animation: pulse 1s infinite; }
        .badge-pending { color: var(--muted); background: rgba(99,112,137,0.1); border: 1px solid rgba(99,112,137,0.2); }
        .step-meta { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
        .step-progress { margin-top: 10px; height: 2px; background: var(--bg3); border-radius: 1px; overflow: hidden; }
        .progress-bar { height: 100%; background: var(--orange); border-radius: 1px; animation: progress-run 2s ease-in-out infinite; }
        @keyframes progress-run { 0%{width:10%} 50%{width:70%} 100%{width:85%} }

        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 32px; }
        .metric-card { background: var(--bg3); border: 1px solid var(--border2); border-radius: 4px; padding: 20px; transition: border-color 0.3s; }
        .metric-card:hover { border-color: var(--border); }
        .metric-label { font-family: var(--font-mono); font-size: 11px; color: var(--muted); letter-spacing: 0.08em; margin-bottom: 8px; }
        .metric-val { font-family: var(--font-mono); font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 4px; }
        .metric-val .metric-unit { font-size: 14px; color: var(--muted); }
        .metric-trend { font-family: var(--font-mono); font-size: 11px; }
        .trend-up { color: var(--green); }

        /* INTEGRATIONS */
        .integrations { padding: 100px 48px; }
        .integration-inner { max-width: 1100px; margin: 0 auto; }
        .int-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 56px; }
        .int-chip {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--font-mono); font-size: 13px; color: var(--muted);
          background: var(--bg2); border: 1px solid var(--border2);
          padding: 12px 20px; border-radius: 4px; transition: all 0.2s; cursor: none;
        }
        .int-chip:hover { border-color: var(--border); color: var(--text); background: var(--bg3); transform: translateY(-2px); }
        .int-icon { font-size: 18px; }

        /* PRICING */
        .pricing { padding: 100px 48px; background: var(--bg2); border-top: 1px solid var(--border2); }
        .pricing-grid {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
          background: var(--border2); border: 1px solid var(--border2);
        }
        .price-card { background: var(--bg); padding: 40px 36px; position: relative; transition: background 0.3s; }
        .price-card.featured { background: var(--bg2); border-top: 2px solid var(--cyan); }
        .featured-label {
          position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          font-family: var(--font-mono); font-size: 10px; color: var(--bg);
          background: var(--cyan); padding: 3px 12px; letter-spacing: 0.1em;
        }
        .plan-name { font-family: var(--font-mono); font-size: 12px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .plan-price { font-family: var(--font-mono); font-size: 48px; font-weight: 700; color: var(--text); line-height: 1; }
        .plan-price .price-curr { font-size: 20px; color: var(--muted); vertical-align: top; margin-top: 8px; display: inline-block; }
        .plan-price .price-period { font-size: 14px; color: var(--muted); }
        .plan-desc { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin: 12px 0 28px; line-height: 1.7; }
        .plan-features { list-style: none; margin-bottom: 32px; }
        .plan-features li {
          font-family: var(--font-mono); font-size: 12px; color: var(--muted);
          padding: 8px 0; border-bottom: 1px solid var(--border2);
          display: flex; align-items: center; gap: 10px;
        }
        .plan-features li::before { content: '✓'; color: var(--green); font-size: 12px; }
        .plan-features li.disabled::before { content: '×'; color: var(--muted); }
        .plan-features li.disabled { color: rgba(99,112,137,0.5); }
        .btn-plan {
          width: 100%; padding: 12px; font-family: var(--font-mono); font-size: 13px;
          font-weight: 500; letter-spacing: 0.08em; border-radius: 2px; cursor: none;
          transition: all 0.2s; border: 1px solid var(--border); color: var(--text); background: none;
        }
        .btn-plan:hover { border-color: var(--cyan); color: var(--cyan); }
        .btn-plan.featured-btn { background: var(--cyan); color: var(--bg); border-color: var(--cyan); }
        .btn-plan.featured-btn:hover { background: #33ecff; box-shadow: 0 0 24px rgba(0,229,255,0.4); }

        /* CTA */
        .cta-section { padding: 120px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-section::before {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 600px; height: 600px;
          background: radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-section h2 { font-size: clamp(36px, 5vw, 64px); font-weight: 800; letter-spacing: -0.04em; margin-bottom: 20px; }
        .cta-section p { font-family: var(--font-mono); font-size: 14px; color: var(--muted); margin-bottom: 40px; }
        .cta-input-group {
          display: flex; max-width: 440px; margin: 0 auto;
          border: 1px solid var(--border); border-radius: 2px; overflow: hidden; transition: border-color 0.3s;
        }
        .cta-input-group:focus-within { border-color: var(--cyan); box-shadow: 0 0 20px rgba(0,229,255,0.1); }
        .cta-input {
          flex: 1; background: var(--bg2); border: none; color: var(--text);
          font-family: var(--font-mono); font-size: 13px; padding: 14px 20px; outline: none;
        }
        .cta-input::placeholder { color: var(--muted); }
        .btn-cta {
          font-family: var(--font-mono); font-size: 13px; font-weight: 700;
          background: var(--cyan); color: var(--bg); border: none; cursor: none;
          padding: 14px 24px; letter-spacing: 0.08em; transition: background 0.2s; white-space: nowrap;
        }
        .btn-cta:hover { background: #33ecff; }

        /* FOOTER */
        footer { padding: 60px 48px 40px; border-top: 1px solid var(--border2); background: var(--bg); position: relative; z-index: 1; }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
        .footer-brand p { font-family: var(--font-mono); font-size: 12px; color: var(--muted); line-height: 1.8; margin-top: 16px; max-width: 260px; }
        .footer-col-title { font-family: var(--font-mono); font-size: 11px; color: var(--text); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--cyan); }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; border-top: 1px solid var(--border2); }
        .footer-copy { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
        .footer-status { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--green); }
        .status-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite; }

        /* SCROLL REVEAL */
        .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s, transform 0.7s; }
        .reveal.visible { opacity: 1; transform: none; }

        @media (max-width: 900px) {
          nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hero { padding: 100px 24px 60px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: 1fr; }
          .pipeline-inner { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
      `}</style>

      {/* Cursor */}
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* Backgrounds */}
      <div className="grid-bg" />
      <div className="scanlines" />

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">
          <div className="logo-dot" />
          <span>
            <span className="bracket">[</span>FlowOps
            <span className="bracket">]</span>
          </span>
        </a>
        <ul className="nav-links">
          {["Features", "Pipeline", "Integrations", "Pricing", "Docs"].map(
            (l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`}>{l}</a>
              </li>
            ),
          )}
        </ul>
        <div className="nav-cta">
          <button className="btn-ghost">Sign in</button>
          <button className="btn-primary">Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <div className="badge-dot" />
          v2.4.0 — Now with AI-driven anomaly detection
        </div>
        <h1>
          Toch Ratana.
          <br />
          <span className="line2">Break fdsgdfgdfgdfgdfgdfgdf.</span>
        </h1>
        <p className="hero-sub">
          The DevOps platform that unifies CI/CD pipelines,
          <br />
          infrastructure monitoring, and incident response
          <br />
          in a single terminal-natfdsfsdfsdfsdfsdfsdfve interface.
        </p>
        <div className="hero-actions">
          <button className="btn-hero">$ get started —free</button>
          <button className="btn-outline">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" />
            </svg>
            Watch demo
          </button>
        </div>
        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="terminal-title">
              flowops — production pipeline
            </span>
          </div>
          <div className="terminal-body">
            <div className="t-line">
              <span className="t-prompt">❯</span>
              <span className="t-cmd">
                flowops deploy <span className="flag">--env</span>{" "}
                <span className="arg">production</span>{" "}
                <span className="flag">--strategy</span>{" "}
                <span className="arg">canary</span>
              </span>
            </div>
            <div className="t-line">
              <span className="t-output">
                {"  "}Initializing deployment pipeline...
              </span>
            </div>
            <div className="t-line">
              <span className="t-output">
                {"  "}Running pre-flight checks ████████████ 100%
              </span>
            </div>
            <div className="t-line">
              <span className="t-output">
                {"  "}Building Docker image (sha256:a3f1e2...)
              </span>
            </div>
            <div className="t-line">
              <span className="t-success">
                {"  "}✓ Tests passed — 847 specs, 0 failures (12.4s)
              </span>
            </div>
            <div className="t-line">
              <span className="t-success">
                {"  "}✓ Security scan — 0 critical CVEs found
              </span>
            </div>
            <div className="t-line">
              <span className="t-warn">
                {"  "}⚑ Canary: routing 5% traffic to v2.4.0
              </span>
            </div>
            <div className="t-line">
              <span className="t-success">
                {"  "}✓ Canary healthy — P99 latency: 42ms
              </span>
            </div>
            <div className="t-line">
              <span className="t-prompt">❯</span>
              <span className="t-cmd">
                flowops rollout <span className="flag">--promote</span>{" "}
                <span className="arg">100%</span>
              </span>
              <span className="t-cursor" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats">
        <div className="stats-grid">
          {[
            { num: "99", unit: ".98%", label: "Uptime SLA" },
            { num: "14", unit: "ms", label: "Avg deploy time" },
            { num: "40", unit: "k+", label: "Engineering teams" },
            { num: "2.1", unit: "B", label: "Deployments / year" },
          ].map((s) => (
            <div key={s.label} className="stat-item reveal">
              <div className="stat-num">
                {s.num}
                <span className="unit">{s.unit}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <h1>this is my new </h1>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-header reveal">
          <div className="section-tag">// Core capabilities</div>
          <h2 className="section-title">
            Everything your team needs
            <br />
            <span>to ship with confidence</span>
          </h2>
          <p className="section-desc">
            From commit to production. Automated, observed, and resilient by
            default.
          </p>
        </div>
        <div className="features-grid">
          {[
            {
              num: "01",
              title: "Unified CI/CD Engine",
              desc: "Build, test, and deploy from a single declarative YAML. Supports parallel matrix builds with intelligent caching across 200+ runners.",
              icon: (
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              ),
            },
            {
              num: "02",
              title: "Real-time Observability",
              desc: "Unified metrics, logs, and traces in one pane. Auto-instrument your stack with zero-config APM and distributed tracing.",
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
            },
            {
              num: "03",
              title: "Policy-as-Code Security",
              desc: "Enforce compliance gates, secret scanning, and SBOM generation at every stage. SOC2, ISO27001, and FedRAMP ready.",
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            },
            {
              num: "04",
              title: "Infrastructure as Code",
              desc: "Drift detection, plan previews, and automated cost estimation for Terraform, Pulumi, and CloudFormation workspaces.",
              icon: (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </>
              ),
            },
            {
              num: "05",
              title: "AI Incident Response",
              desc: "GPT-powered runbooks that auto-diagnose anomalies, suggest rollbacks, and draft post-mortems from your telemetry data.",
              icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
            },
            {
              num: "06",
              title: "Multi-cloud Orchestration",
              desc: "Manage AWS, GCP, Azure, and on-prem environments from a unified control plane. No vendor lock-in, ever.",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </>
              ),
            },
          ].map((f) => (
            <div key={f.num} className="feature-card reveal">
              <div className="feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {f.icon}
                </svg>
              </div>
              <div className="feature-num">{f.num}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section className="pipeline" id="pipeline">
        <div className="pipeline-inner">
          <div className="pipeline-content reveal">
            <div className="section-tag">// Live pipeline</div>
            <h2 className="section-title" style={{ fontSize: 42 }}>
              Watch your code
              <br />
              <span>move to production</span>
            </h2>
            <p
              className="section-desc"
              style={{
                margin: "16px 0 0",
                textAlign: "left",
                maxWidth: "none",
              }}
            >
              Every pipeline step is observable in real-time. Built-in
              approvals, rollback triggers, and canary analysis included.
            </p>
            <div className="metrics-grid">
              {[
                {
                  label: "DEPLOY FREQ",
                  val: "24",
                  unit: "/day",
                  trend: "↑ 12% vs last week",
                },
                {
                  label: "LEAD TIME",
                  val: "4.2",
                  unit: "min",
                  trend: "↑ 38% faster",
                },
                {
                  label: "MTTR",
                  val: "6",
                  unit: "min",
                  trend: "↓ 61% reduction",
                },
                {
                  label: "CHANGE FAIL %",
                  val: "0.4",
                  unit: "%",
                  trend: "↓ 82% better",
                },
              ].map((m) => (
                <div key={m.label} className="metric-card">
                  <div className="metric-label">{m.label}</div>
                  <div className="metric-val">
                    {m.val}
                    <span className="metric-unit">{m.unit}</span>
                  </div>
                  <div className="metric-trend trend-up">{m.trend}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pipeline-visual reveal">
            <div className="pipeline-track">
              {[
                {
                  dot: "done",
                  name: "Source & Lint",
                  badge: "PASSED",
                  badgeCls: "badge-success",
                  meta: "2 mins ago · 4.1s",
                },
                {
                  dot: "done",
                  name: "Unit Tests",
                  badge: "847 / 847",
                  badgeCls: "badge-success",
                  meta: "2 mins ago · 12.4s",
                },
                {
                  dot: "done",
                  name: "Build & Containerize",
                  badge: "PASSED",
                  badgeCls: "badge-success",
                  meta: "1 min ago · 34s",
                },
                {
                  dot: "running",
                  name: "Canary Deploy",
                  badge: "RUNNING",
                  badgeCls: "badge-running",
                  meta: "5% traffic routed · 48s elapsed",
                  running: true,
                },
                {
                  dot: "",
                  name: "Full Rollout",
                  badge: "PENDING",
                  badgeCls: "badge-pending",
                  meta: "Awaiting canary analysis",
                },
                {
                  dot: "",
                  name: "Smoke Tests",
                  badge: "PENDING",
                  badgeCls: "badge-pending",
                  meta: "Production verification",
                  last: true,
                },
              ].map((step, i) => (
                <div key={i} className="pipeline-step">
                  <div className="step-connector">
                    <div className={`step-dot ${step.dot}`} />
                    {!step.last && <div className="step-line" />}
                  </div>
                  <div
                    className={`step-card ${step.running ? "active-card" : ""}`}
                  >
                    <div className="step-header">
                      <span className="step-name">{step.name}</span>
                      <span className={`step-badge ${step.badgeCls}`}>
                        {step.badge}
                      </span>
                    </div>
                    <div className="step-meta">{step.meta}</div>
                    {step.running && (
                      <div className="step-progress">
                        <div className="progress-bar" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="integrations" id="integrations">
        <div className="integration-inner">
          <div className="section-header reveal">
            <div className="section-tag">// Integrations</div>
            <h2 className="section-title">
              Plays well with
              <br />
              <span>your entire stack</span>
            </h2>
            <p className="section-desc">
              200+ native integrations. Connect in minutes, not months.
            </p>
          </div>
          <div className="int-row reveal">
            {[
              ["⬡", "Kubernetes"],
              ["▲", "AWS"],
              ["◈", "GitHub"],
              ["◆", "GitLab"],
              ["🐳", "Docker"],
              ["◉", "Terraform"],
              ["☁", "GCP"],
              ["◈", "Azure"],
              ["📊", "Datadog"],
              ["🔔", "PagerDuty"],
              ["💬", "Slack"],
              ["⚡", "Prometheus"],
              ["📈", "Grafana"],
              ["🔑", "Vault"],
              ["⚙", "ArgoCD"],
              ["🌊", "Istio"],
            ].map(([icon, name]) => (
              <div key={name} className="int-chip">
                <span className="int-icon">{icon}</span>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div
          className="section-header reveal"
          style={{ maxWidth: 1000, margin: "0 auto 60px" }}
        >
          <div className="section-tag">// Pricing</div>
          <h2 className="section-title">
            Transparent pricing,
            <br />
            <span>no surprises</span>
          </h2>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="plan-name">Starter</div>
            <div className="plan-price">
              <span className="price-curr">$</span>0
              <span className="price-period">/mo</span>
            </div>
            <p className="plan-desc">
              Perfect for indie devs and
              <br />
              small open-source projects.
            </p>
            <ul className="plan-features">
              <li>3 pipelines</li>
              <li>2,000 build minutes/mo</li>
              <li>1 environment</li>
              <li>Community support</li>
              <li className="disabled">AI incident response</li>
              <li className="disabled">SSO / SAML</li>
              <li className="disabled">Custom runners</li>
            </ul>
            <button className="btn-plan">Start free</button>
          </div>
          <div className="price-card featured">
            <div className="featured-label">MOST POPULAR</div>
            <div className="plan-name">Pro</div>
            <div className="plan-price">
              <span className="price-curr">$</span>49
              <span className="price-period">/mo</span>
            </div>
            <p className="plan-desc">
              For growing teams that need
              <br />
              reliability at scale.
            </p>
            <ul className="plan-features">
              <li>Unlimited pipelines</li>
              <li>40,000 build minutes/mo</li>
              <li>10 environments</li>
              <li>Priority support</li>
              <li>AI incident response</li>
              <li>SSO / SAML</li>
              <li className="disabled">Custom runners</li>
            </ul>
            <button className="btn-plan featured-btn">Get started</button>
          </div>
          <div className="price-card">
            <div className="plan-name">Enterprise</div>
            <div className="plan-price" style={{ fontSize: 36, paddingTop: 6 }}>
              Custom
            </div>
            <p className="plan-desc">
              For orgs that need dedicated
              <br />
              infrastructure and compliance.
            </p>
            <ul className="plan-features">
              <li>Unlimited everything</li>
              <li>Dedicated runners</li>
              <li>On-prem deployment</li>
              <li>24/7 white-glove support</li>
              <li>AI incident response</li>
              <li>SSO / SAML</li>
              <li>Custom SLAs</li>
            </ul>
            <button className="btn-plan">Contact sales</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="reveal">
          <div className="section-tag" style={{ marginBottom: 16 }}>
            // Get started today
          </div>
          <h2>
            Ready to <span style={{ color: "var(--cyan)" }}>ship faster?</span>
          </h2>
          <p>Join 40,000+ teams already deploying with confidence.</p>
          <div className="cta-input-group">
            <input
              className="cta-input"
              type="email"
              placeholder="you@yourcompany.com"
            />
            <button className="btn-cta">→ Deploy now</button>
          </div>
          <p
            style={{
              marginTop: 16,
              fontSize: 11,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            No credit card required · Free forever plan · Cancel anytime
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#" className="nav-logo">
                <div className="logo-dot" />
                <span>
                  <span className="bracket">[</span>FlowOps
                  <span className="bracket">]</span>
                </span>
              </a>
              <p>
                The DevOps intelligence platform built for engineers who care
                about reliability, speed, and sleep.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  "Features",
                  "Pricing",
                  "Changelog",
                  "Roadmap",
                  "Status",
                ],
              },
              {
                title: "Developers",
                links: [
                  "Documentation",
                  "API Reference",
                  "CLI Guide",
                  "Integrations",
                  "Open source",
                ],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Security", "Contact"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">
              © 2026 FlowOps Inc. — Built with ♥ for DevOps engineers.
            </div>
            <div className="footer-status">
              <div className="status-dot" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
