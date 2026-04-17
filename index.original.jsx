import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg: #07080d;
  --surface: #0e1018;
  --surface2: #151822;
  --border: rgba(255,255,255,0.07);
  --accent: #6c63ff;
  --accent2: #00d4aa;
  --accent3: #ff6b6b;
  --gold: #f5c842;
  --text: #e8eaf0;
  --muted: #6b7280;
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
body { background:var(--bg); color:var(--text); font-family:var(--font-body); overflow-x:hidden; }

/* SCROLLBAR */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:var(--bg); }
::-webkit-scrollbar-thumb { background:var(--accent); border-radius:4px; }

/* NOISE OVERLAY */
.noise::before {
  content:''; position:fixed; inset:0; opacity:.03;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events:none; z-index:9999;
}

/* GRID BG */
.grid-bg {
  background-image: linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* GLOW */
.glow { box-shadow: 0 0 40px rgba(108,99,255,0.15), 0 0 80px rgba(108,99,255,0.05); }
.glow-teal { box-shadow: 0 0 40px rgba(0,212,170,0.12); }
.glow-gold { box-shadow: 0 0 30px rgba(245,200,66,0.15); }

/* NAV */
nav {
  position:fixed; top:0; left:0; right:0; z-index:100;
  padding:16px 40px; display:flex; align-items:center; justify-content:space-between;
  background:rgba(7,8,13,0.8); backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
}
.nav-logo { font-family:var(--font-display); font-weight:800; font-size:1.2rem;
  background:linear-gradient(135deg,#6c63ff,#00d4aa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.nav-links { display:flex; gap:8px; }
.nav-btn {
  padding:6px 16px; border-radius:8px; font-size:.8rem; cursor:pointer;
  font-family:var(--font-body); font-weight:500; border:none; transition:.2s;
  background:transparent; color:var(--muted);
}
.nav-btn:hover { color:var(--text); background:var(--surface2); }
.nav-btn.active { color:var(--accent); background:rgba(108,99,255,0.1); }
.nav-cta { background:var(--accent)!important; color:#fff!important; }

/* HERO */
.hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:100px 40px 60px; text-align:center; position:relative; overflow:hidden; }
.hero-orb {
  position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
}
.hero-orb-1 { width:500px; height:500px; background:rgba(108,99,255,0.15); top:-100px; left:-100px; }
.hero-orb-2 { width:400px; height:400px; background:rgba(0,212,170,0.08); bottom:-50px; right:-50px; }
.hero-badge {
  display:inline-flex; align-items:center; gap:8px; padding:6px 16px;
  border:1px solid rgba(108,99,255,0.4); border-radius:100px;
  font-size:.75rem; font-family:var(--font-mono); color:var(--accent); margin-bottom:32px;
  background:rgba(108,99,255,0.05);
}
.hero-badge span { width:6px; height:6px; background:var(--accent2); border-radius:50%;
  animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
h1.hero-title {
  font-family:var(--font-display); font-size:clamp(2.8rem,6vw,5.5rem); font-weight:800;
  line-height:1.05; letter-spacing:-2px; margin-bottom:24px;
}
.hero-title .line-accent { background:linear-gradient(90deg,#6c63ff,#00d4aa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.hero-sub { font-size:1.15rem; color:var(--muted); max-width:560px; line-height:1.7; margin-bottom:48px; }
.hero-actions { display:flex; gap:16px; flex-wrap:wrap; justify-content:center; }
.btn-primary {
  padding:14px 32px; background:var(--accent); color:#fff; border:none; border-radius:12px;
  font-family:var(--font-body); font-weight:600; font-size:1rem; cursor:pointer; transition:.2s;
}
.btn-primary:hover { background:#5b52e8; transform:translateY(-1px); }
.btn-ghost {
  padding:14px 32px; background:transparent; color:var(--text); border:1px solid var(--border);
  border-radius:12px; font-family:var(--font-body); font-weight:500; cursor:pointer; transition:.2s;
}
.btn-ghost:hover { border-color:var(--accent); color:var(--accent); }
.hero-stats { display:flex; gap:48px; margin-top:64px; flex-wrap:wrap; justify-content:center; }
.hero-stat { text-align:center; }
.hero-stat strong { font-family:var(--font-display); font-size:2rem; font-weight:800;
  background:linear-gradient(135deg,#fff,#6c63ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.hero-stat p { font-size:.8rem; color:var(--muted); margin-top:4px; }

/* FEATURES STRIP */
.features-strip { padding:80px 40px; max-width:1100px; margin:0 auto; }
.section-label { font-family:var(--font-mono); font-size:.72rem; color:var(--accent2); letter-spacing:3px;
  text-transform:uppercase; margin-bottom:12px; }
.section-title { font-family:var(--font-display); font-size:clamp(1.8rem,3.5vw,3rem); font-weight:800;
  margin-bottom:48px; letter-spacing:-1px; }
.features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; }
.feature-card {
  background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px;
  transition:.3s; cursor:default; position:relative; overflow:hidden;
}
.feature-card::before { content:''; position:absolute; inset:0; opacity:0; transition:.3s;
  background:linear-gradient(135deg,rgba(108,99,255,0.05),transparent); }
.feature-card:hover { border-color:rgba(108,99,255,0.3); transform:translateY(-2px); }
.feature-card:hover::before { opacity:1; }
.feature-icon { font-size:2rem; margin-bottom:16px; }
.feature-card h3 { font-family:var(--font-display); font-weight:700; font-size:1.05rem; margin-bottom:8px; }
.feature-card p { font-size:.85rem; color:var(--muted); line-height:1.6; }

/* ASSESSMENT */
.page { max-width:860px; margin:0 auto; padding:100px 40px 80px; min-height:100vh; }
.page-header { margin-bottom:48px; }
.progress-bar { height:4px; background:var(--surface2); border-radius:4px; overflow:hidden; margin-bottom:32px; }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:4px; transition:.4s; }
.q-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:40px; }
.q-number { font-family:var(--font-mono); font-size:.75rem; color:var(--accent2); margin-bottom:16px; }
.q-text { font-family:var(--font-display); font-size:1.4rem; font-weight:700; margin-bottom:32px; line-height:1.4; }
.q-options { display:flex; flex-direction:column; gap:12px; }
.q-option {
  padding:16px 20px; background:var(--surface2); border:1px solid var(--border);
  border-radius:12px; cursor:pointer; transition:.2s; font-size:.95rem; text-align:left;
  font-family:var(--font-body); color:var(--text);
}
.q-option:hover { border-color:var(--accent); background:rgba(108,99,255,0.08); }
.q-option.selected { border-color:var(--accent); background:rgba(108,99,255,0.12); color:var(--accent); }
.q-option.correct { border-color:var(--accent2); background:rgba(0,212,170,0.1); }
.q-nav { display:flex; justify-content:space-between; align-items:center; margin-top:32px; }

/* DASHBOARD */
.dashboard { max-width:1100px; margin:0 auto; padding:100px 40px 80px; }
.dash-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; margin-top:32px; }
.career-cards { display:flex; flex-direction:column; gap:16px; }
.career-card {
  background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px;
  display:flex; gap:20px; align-items:flex-start; transition:.3s; cursor:pointer;
}
.career-card:hover { border-color:rgba(108,99,255,0.3); }
.career-card.top { border-color:rgba(245,200,66,0.4); background:rgba(245,200,66,0.03); }
.career-rank { font-family:var(--font-mono); font-size:.7rem; color:var(--muted); }
.career-info { flex:1; }
.career-info h3 { font-family:var(--font-display); font-weight:700; font-size:1.1rem; margin-bottom:6px; }
.career-info p { font-size:.85rem; color:var(--muted); line-height:1.5; }
.career-tags { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.tag { padding:4px 10px; border-radius:6px; font-size:.72rem; font-family:var(--font-mono); }
.tag-purple { background:rgba(108,99,255,0.15); color:var(--accent); }
.tag-teal { background:rgba(0,212,170,0.12); color:var(--accent2); }
.tag-gold { background:rgba(245,200,66,0.12); color:var(--gold); }
.tag-red { background:rgba(255,107,107,0.12); color:var(--accent3); }
.match-score { font-family:var(--font-display); font-weight:800; font-size:2rem;
  background:linear-gradient(135deg,var(--accent),var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.side-panel { display:flex; flex-direction:column; gap:16px; }
.panel-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px; }
.panel-card h4 { font-family:var(--font-display); font-weight:700; font-size:.95rem; margin-bottom:16px; color:var(--muted); letter-spacing:.5px; }
.skill-bar-wrap { margin-bottom:12px; }
.skill-bar-label { display:flex; justify-content:space-between; font-size:.8rem; margin-bottom:6px; }
.skill-bar { height:6px; background:var(--surface2); border-radius:4px; overflow:hidden; }
.skill-fill { height:100%; border-radius:4px; transition:.8s; }

/* COMPARISON */
.compare-page { max-width:1100px; margin:0 auto; padding:100px 40px 80px; }
.compare-selector { display:flex; gap:12px; margin-bottom:32px; flex-wrap:wrap; }
.career-pill {
  padding:8px 18px; border:1px solid var(--border); border-radius:100px; cursor:pointer;
  font-size:.85rem; background:var(--surface); transition:.2s;
}
.career-pill:hover { border-color:var(--accent); color:var(--accent); }
.career-pill.selected { border-color:var(--accent); background:rgba(108,99,255,0.1); color:var(--accent); }
.compare-table { background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden; }
.compare-head { display:grid; border-bottom:1px solid var(--border); }
.compare-cell { padding:20px 24px; font-size:.9rem; }
.compare-cell.header { font-family:var(--font-display); font-weight:700; font-size:1rem; }
.compare-row { display:grid; border-bottom:1px solid var(--border); transition:.2s; }
.compare-row:last-child { border-bottom:none; }
.compare-row:hover { background:var(--surface2); }
.compare-label { font-size:.82rem; color:var(--muted); font-family:var(--font-mono); padding:16px 24px;
  display:flex; align-items:center; }
.meter { display:flex; align-items:center; gap:10px; }
.meter-bar { flex:1; height:6px; background:var(--surface2); border-radius:4px; overflow:hidden; max-width:120px; }
.meter-fill { height:100%; border-radius:4px; }

/* ROADMAP */
.roadmap-page { max-width:860px; margin:0 auto; padding:100px 40px 80px; }
.timeline { position:relative; margin-top:32px; }
.timeline::before { content:''; position:absolute; left:24px; top:0; bottom:0; width:2px;
  background:linear-gradient(to bottom,var(--accent),var(--accent2),transparent); }
.timeline-item { display:flex; gap:24px; margin-bottom:32px; position:relative; }
.timeline-dot { width:50px; height:50px; border-radius:50%; border:2px solid var(--border);
  background:var(--surface); display:flex; align-items:center; justify-content:center;
  flex-shrink:0; font-family:var(--font-mono); font-size:.75rem; z-index:1;
  position:relative; transition:.3s; }
.timeline-dot.active { border-color:var(--accent); background:rgba(108,99,255,0.15); color:var(--accent); }
.timeline-dot.done { border-color:var(--accent2); background:rgba(0,212,170,0.1); color:var(--accent2); }
.timeline-content { flex:1; background:var(--surface); border:1px solid var(--border);
  border-radius:16px; padding:24px; transition:.3s; }
.timeline-content:hover { border-color:rgba(108,99,255,0.25); }
.timeline-phase { font-family:var(--font-mono); font-size:.7rem; color:var(--accent2); margin-bottom:4px; }
.timeline-content h3 { font-family:var(--font-display); font-weight:700; font-size:1rem; margin-bottom:8px; }
.timeline-content p { font-size:.85rem; color:var(--muted); line-height:1.6; }
.resource-chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.chip { padding:4px 10px; background:var(--surface2); border:1px solid var(--border);
  border-radius:6px; font-size:.72rem; font-family:var(--font-mono); color:var(--muted); }

/* WHATIF */
.whatif-page { max-width:1000px; margin:0 auto; padding:100px 40px 80px; }
.slider-group { margin-bottom:24px; }
.slider-label { display:flex; justify-content:space-between; margin-bottom:10px; font-size:.9rem; }
.slider-label span { color:var(--accent); font-family:var(--font-mono); font-weight:600; }
input[type=range] {
  width:100%; -webkit-appearance:none; height:4px; border-radius:4px;
  background:linear-gradient(90deg, var(--accent) var(--val,50%), var(--surface2) var(--val,50%));
  outline:none; cursor:pointer;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
  background:var(--accent); cursor:pointer; border:2px solid var(--bg);
  box-shadow:0 0 10px rgba(108,99,255,0.5);
}
.whatif-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:32px; }
.whatif-result-card {
  background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px;
  transition:.4s; position:relative; overflow:hidden;
}
.whatif-result-card.highlight { border-color:rgba(0,212,170,0.4); }
.rank-badge { position:absolute; top:16px; right:16px; padding:4px 10px;
  background:rgba(245,200,66,0.15); border:1px solid rgba(245,200,66,0.3);
  border-radius:100px; font-size:.7rem; font-family:var(--font-mono); color:var(--gold); }

/* CHAT */
.chat-page { max-width:800px; margin:0 auto; padding:100px 40px 80px; }
.chat-window {
  background:var(--surface); border:1px solid var(--border); border-radius:20px;
  height:520px; display:flex; flex-direction:column; overflow:hidden;
}
.chat-header { padding:20px 24px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:12px; }
.chat-avatar { width:36px; height:36px; border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex; align-items:center; justify-content:center; font-size:1rem; }
.chat-header-info h4 { font-family:var(--font-display); font-weight:700; font-size:.95rem; }
.chat-header-info p { font-size:.75rem; color:var(--accent2); }
.chat-status { width:8px; height:8px; background:var(--accent2); border-radius:50%;
  animation:pulse 2s infinite; margin-left:auto; }
.chat-messages { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:14px; }
.msg { max-width:75%; display:flex; flex-direction:column; gap:4px; }
.msg.user { align-self:flex-end; align-items:flex-end; }
.msg.ai { align-self:flex-start; }
.msg-bubble {
  padding:12px 16px; border-radius:16px; font-size:.88rem; line-height:1.6;
}
.msg.user .msg-bubble { background:var(--accent); color:#fff; border-bottom-right-radius:4px; }
.msg.ai .msg-bubble { background:var(--surface2); border:1px solid var(--border); border-bottom-left-radius:4px; }
.msg-time { font-size:.68rem; color:var(--muted); font-family:var(--font-mono); }
.chat-input-area { padding:16px 20px; border-top:1px solid var(--border); display:flex; gap:12px; }
.chat-input {
  flex:1; background:var(--surface2); border:1px solid var(--border); border-radius:12px;
  padding:12px 16px; color:var(--text); font-family:var(--font-body); font-size:.9rem; outline:none;
}
.chat-input:focus { border-color:var(--accent); }
.chat-send {
  width:44px; height:44px; background:var(--accent); border:none; border-radius:12px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:.2s; color:#fff; font-size:1.1rem;
}
.chat-send:hover { background:#5b52e8; transform:scale(1.05); }
.chat-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }
.typing-indicator { display:flex; gap:4px; padding:12px 16px; }
.typing-dot { width:6px; height:6px; background:var(--muted); border-radius:50%;
  animation:typingBounce .8s infinite; }
.typing-dot:nth-child(2) { animation-delay:.1s; }
.typing-dot:nth-child(3) { animation-delay:.2s; }
@keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
.quick-prompts { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.quick-prompt {
  padding:7px 14px; background:var(--surface); border:1px solid var(--border);
  border-radius:100px; font-size:.78rem; cursor:pointer; transition:.2s;
}
.quick-prompt:hover { border-color:var(--accent); color:var(--accent); }

/* TRENDS */
.trends-page { max-width:1000px; margin:0 auto; padding:100px 40px 80px; }
.trends-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:40px; }
.trend-card {
  background:var(--surface); border:1px solid var(--border); border-radius:16px;
  padding:24px; text-align:center; transition:.3s;
}
.trend-card:hover { transform:translateY(-3px); }
.trend-icon { font-size:2.2rem; margin-bottom:12px; }
.trend-name { font-family:var(--font-display); font-weight:700; font-size:.95rem; margin-bottom:8px; }
.trend-growth { font-family:var(--font-mono); font-size:1.5rem; font-weight:700; }
.trend-growth.up { color:var(--accent2); }
.trend-growth.mid { color:var(--gold); }
.trend-label { font-size:.75rem; color:var(--muted); margin-top:4px; }
.bar-chart { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px; }
.bar-chart h4 { font-family:var(--font-display); font-weight:700; margin-bottom:24px; }
.bar-row { display:flex; align-items:center; gap:16px; margin-bottom:16px; }
.bar-name { font-size:.82rem; color:var(--muted); width:140px; flex-shrink:0; font-family:var(--font-mono); }
.bar-outer { flex:1; height:10px; background:var(--surface2); border-radius:5px; overflow:hidden; }
.bar-inner { height:100%; border-radius:5px; transition:1.2s; }
.bar-val { font-size:.8rem; font-family:var(--font-mono); color:var(--text); width:36px; text-align:right; }

/* JOURNEYS */
.journeys-page { max-width:1000px; margin:0 auto; padding:100px 40px 80px; }
.journey-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; }
.journey-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden; transition:.3s; }
.journey-card:hover { border-color:rgba(108,99,255,0.3); transform:translateY(-3px); }
.journey-header { padding:24px; background:linear-gradient(135deg,var(--surface2),var(--surface));
  border-bottom:1px solid var(--border); display:flex; gap:16px; align-items:center; }
.journey-avatar { width:52px; height:52px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-size:1.5rem;
  background:linear-gradient(135deg,rgba(108,99,255,0.2),rgba(0,212,170,0.2)); flex-shrink:0; }
.journey-name { font-family:var(--font-display); font-weight:700; }
.journey-role { font-size:.8rem; color:var(--accent2); }
.journey-body { padding:24px; }
.journey-body p { font-size:.88rem; color:var(--muted); line-height:1.65; margin-bottom:16px; }
.journey-milestones { display:flex; flex-direction:column; gap:8px; }
.milestone { display:flex; gap:10px; align-items:flex-start; font-size:.82rem; }
.milestone::before { content:'→'; color:var(--accent); flex-shrink:0; font-family:var(--font-mono); margin-top:1px; }

/* COLLEGE REC */
.college-page { max-width:1000px; margin:0 auto; padding:100px 40px 80px; }
.college-filter { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px; margin-bottom:32px; }
.filter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; margin-top:16px; }
.filter-group label { font-size:.8rem; color:var(--muted); font-family:var(--font-mono); display:block; margin-bottom:8px; }
.filter-select {
  width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text);
  padding:10px 14px; border-radius:10px; font-family:var(--font-body); outline:none; font-size:.9rem;
}
.filter-select:focus { border-color:var(--accent); }
.college-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
.college-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px; transition:.3s; }
.college-card:hover { border-color:rgba(108,99,255,0.3); }
.college-name { font-family:var(--font-display); font-weight:700; font-size:1rem; margin-bottom:6px; }
.college-location { font-size:.8rem; color:var(--muted); margin-bottom:16px; font-family:var(--font-mono); }
.college-meta { display:flex; flex-direction:column; gap:8px; }
.college-meta-row { display:flex; justify-content:space-between; font-size:.83rem; }
.college-meta-row span:first-child { color:var(--muted); }
.college-meta-row strong { color:var(--text); font-weight:500; }

/* UTILS */
.spinner { width:24px; height:24px; border:2px solid var(--border); border-top-color:var(--accent);
  border-radius:50%; animation:spin 0.6s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
.flex { display:flex; }
.items-center { align-items:center; }
.gap-2 { gap:8px; }
.gap-3 { gap:12px; }
.text-muted { color:var(--muted); }
.text-accent { color:var(--accent); }
.text-teal { color:var(--accent2); }
.text-gold { color:var(--gold); }
.mt-2 { margin-top:8px; }
.mt-4 { margin-top:16px; }
.mb-4 { margin-bottom:16px; }
.fade-in { animation:fadeIn .4s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

/* RESPONSIVE */
@media(max-width:768px) {
  nav { padding:14px 20px; }
  .nav-links { display:none; }
  .page, .dashboard, .compare-page, .roadmap-page, .whatif-page, .chat-page,
  .trends-page, .journeys-page, .college-page { padding:80px 20px 60px; }
  .dash-grid { grid-template-columns:1fr; }
  .whatif-grid { grid-template-columns:1fr; }
  h1.hero-title { font-size:2.4rem; letter-spacing:-1px; }
}
`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id:1, text:"How do you prefer to solve problems?", options:["Through logical analysis and code","Through design and visual thinking","Through talking to people and leading","Through research and writing"] },
  { id:2, text:"What excites you most about your future work?", options:["Building systems that scale globally","Creating beautiful user experiences","Making a social impact","Discovering new scientific knowledge"] },
  { id:3, text:"How comfortable are you with risk and uncertainty?", options:["I thrive in high-risk, high-reward environments","I prefer calculated risks with clear plans","I like stable environments with steady growth","I'm okay with moderate uncertainty if there's structure"] },
  { id:4, text:"Which of these would you spend a weekend doing?", options:["Building a side project or app","Sketching UI designs or art","Organizing a community event","Reading a research paper or book"] },
  { id:5, text:"What's your relationship with math?", options:["I genuinely enjoy complex mathematics","I can handle it when needed, not my passion","I prefer applied math over pure theory","I'd rather avoid heavy math entirely"] },
  { id:6, text:"How do you prefer to work?", options:["Solo deep-focus work","Small collaborative teams","Large team environments","Mix of remote and in-person freelance"] },
  { id:7, text:"What matters most in your career?", options:["Salary & financial growth","Creativity & self-expression","Work-life balance","Societal or environmental impact"] },
  { id:8, text:"Which industry fascinates you the most?", options:["Technology & AI","Healthcare & Biotech","Finance & Fintech","Media, Arts & Entertainment"] },
  { id:9, text:"What's your ideal learning environment?", options:["Self-taught through projects & docs","Structured courses & certifications","Mentorship and on-the-job learning","Academic research & degrees"] },
  { id:10, text:"Where do you see yourself in 10 years?", options:["Leading a tech startup as CTO/CEO","Running a design studio","Managing large teams at a corporation","Contributing to academic or government research"] },
];

const CAREERS = [
  { id:"ai-ml", name:"AI/ML Engineer", icon:"🤖", match:94, salary:"$130k–$200k", growth:"Very High", difficulty:"Hard",
    demand:97, skills:["Python","TensorFlow","Math","Statistics","Cloud"],
    desc:"Design and train machine learning models that power intelligent systems.",
    tags:["tech","ai","future"], color:"#6c63ff" },
  { id:"fullstack", name:"Full Stack Developer", icon:"💻", match:89, salary:"$95k–$160k", growth:"High", difficulty:"Medium",
    demand:88, skills:["React","Node.js","SQL","Docker","APIs"],
    desc:"Build end-to-end web applications from UI to infrastructure.",
    tags:["tech","web","versatile"], color:"#00d4aa" },
  { id:"data-sci", name:"Data Scientist", icon:"📊", match:85, salary:"$110k–$175k", growth:"High", difficulty:"Hard",
    demand:90, skills:["Python","Statistics","SQL","Visualization","ML"],
    desc:"Extract insights from data to guide business strategy and innovation.",
    tags:["data","analytics","ai"], color:"#f5c842" },
  { id:"ux-design", name:"UX/Product Designer", icon:"🎨", match:78, salary:"$85k–$145k", growth:"Medium-High", difficulty:"Medium",
    demand:75, skills:["Figma","Research","Prototyping","Psychology","Storytelling"],
    desc:"Craft user experiences that feel intuitive, beautiful, and impactful.",
    tags:["design","creative","user"], color:"#ff6b6b" },
  { id:"cybersec", name:"Cybersecurity Analyst", icon:"🛡️", match:82, salary:"$100k–$170k", growth:"Very High", difficulty:"Hard",
    demand:95, skills:["Networking","Pentesting","SIEM","Cloud Security","Python"],
    desc:"Protect organizations from digital threats and data breaches.",
    tags:["security","tech","critical"], color:"#a78bfa" },
  { id:"product-mgr", name:"Product Manager", icon:"🚀", match:74, salary:"$110k–$180k", growth:"High", difficulty:"Medium",
    demand:80, skills:["Strategy","Roadmapping","Data","Communication","Empathy"],
    desc:"Bridge business, design, and engineering to ship products users love.",
    tags:["leadership","strategy","impact"], color:"#fb923c" },
  { id:"blockchain", name:"Blockchain Developer", icon:"⛓️", match:71, salary:"$120k–$200k", growth:"Very High", difficulty:"Very Hard",
    demand:82, skills:["Solidity","Web3.js","Cryptography","Rust","DeFi"],
    desc:"Build decentralized applications and smart contracts on blockchain networks.",
    tags:["crypto","web3","emerging"], color:"#34d399" },
  { id:"bioinformatics", name:"Bioinformatics Engineer", icon:"🧬", match:66, salary:"$90k–$155k", growth:"High", difficulty:"Very Hard",
    demand:78, skills:["Python","R","Biology","Statistics","Genomics"],
    desc:"Analyze biological data to drive breakthroughs in medicine and genomics.",
    tags:["biotech","research","science"], color:"#f472b6" },
];

const ROADMAPS = {
  "ai-ml": {
    career:"AI/ML Engineer",
    phases:[
      { phase:"Phase 1", title:"Foundations", months:"Months 1–3", status:"done",
        desc:"Master Python fundamentals, linear algebra, calculus, and probability theory. Complete NumPy, Pandas, and Matplotlib.",
        resources:["CS50 Python","Khan Academy Math","Fast.ai Intro"] },
      { phase:"Phase 2", title:"Core Machine Learning", months:"Months 4–6", status:"active",
        desc:"Study supervised/unsupervised learning. Implement models from scratch. Complete Andrew Ng's ML Specialization.",
        resources:["Coursera ML Spec","Scikit-learn Docs","Kaggle Competitions"] },
      { phase:"Phase 3", title:"Deep Learning & NLP", months:"Months 7–10", status:"",
        desc:"Deep neural networks, CNNs, RNNs, Transformers. Build NLP pipelines and image classifiers.",
        resources:["Deep Learning.AI","Hugging Face Course","PyTorch Tutorials"] },
      { phase:"Phase 4", title:"MLOps & Deployment", months:"Months 11–13", status:"",
        desc:"Learn model deployment, CI/CD pipelines for ML, Docker, and cloud platforms (AWS SageMaker / GCP Vertex AI).",
        resources:["MLflow","Docker Docs","AWS Free Tier"] },
      { phase:"Phase 5", title:"Specialization & Portfolio", months:"Months 14–18", status:"",
        desc:"Choose your lane: Computer Vision, NLP, RL, or Generative AI. Build 3 portfolio projects. Contribute to open-source.",
        resources:["arXiv Papers","GitHub","Hugging Face Hub"] },
    ]
  },
  "fullstack": {
    career:"Full Stack Developer",
    phases:[
      { phase:"Phase 1", title:"HTML/CSS/JS Basics", months:"Months 1–2", status:"done",
        desc:"Build 5 static websites. Learn responsive design, Flexbox, Grid, and JavaScript ES6+.",
        resources:["The Odin Project","MDN Web Docs","CSS Tricks"] },
      { phase:"Phase 2", title:"React & Frontend", months:"Months 3–5", status:"active",
        desc:"Master React, state management, hooks, and component architecture. Build dynamic SPAs.",
        resources:["React Docs","Scrimba React","Frontend Masters"] },
      { phase:"Phase 3", title:"Backend & APIs", months:"Months 6–8", status:"",
        desc:"Node.js, Express, REST APIs, authentication with JWT, and SQL/NoSQL databases.",
        resources:["Node.js Docs","MongoDB University","Postman Academy"] },
      { phase:"Phase 4", title:"DevOps & Cloud", months:"Months 9–11", status:"",
        desc:"Deploy apps on Vercel, AWS, or GCP. Learn Docker, CI/CD pipelines, and web security basics.",
        resources:["AWS Free Tier","GitHub Actions","Docker Docs"] },
      { phase:"Phase 5", title:"Full Stack Projects", months:"Months 12–15", status:"",
        desc:"Build 3 full-stack projects: SaaS app, real-time app with WebSockets, and a mobile-first PWA.",
        resources:["Socket.io","Stripe Docs","PWA Guide"] },
    ]
  }
};

const TRENDS_DATA = [
  { name:"Artificial Intelligence", icon:"🤖", growth:"+42%", type:"up", jobs:850000 },
  { name:"Cybersecurity", icon:"🛡️", growth:"+31%", type:"up", jobs:560000 },
  { name:"Cloud Computing", icon:"☁️", growth:"+28%", type:"up", jobs:720000 },
  { name:"Data Science", icon:"📊", growth:"+25%", type:"up", jobs:640000 },
  { name:"Blockchain", icon:"⛓️", growth:"+38%", type:"up", jobs:290000 },
  { name:"UX Design", icon:"🎨", growth:"+18%", type:"mid", jobs:380000 },
  { name:"Bioinformatics", icon:"🧬", growth:"+22%", type:"up", jobs:180000 },
  { name:"AR/VR Dev", icon:"🥽", growth:"+45%", type:"up", jobs:220000 },
];

const JOURNEYS = [
  { name:"Aisha Raza", avatar:"👩‍💻", role:"AI Engineer @ Google", from:"Mechanical Engg Graduate",
    story:"I spent 2 years in mechanical engineering before discovering AI. I self-taught Python, completed 3 Coursera specializations, built a portfolio of 5 ML projects, and landed my dream job through GitHub networking.",
    milestones:["Switched field at 22 after failing at a startup","Completed Andrew Ng's ML course in 6 weeks","First internship at a local AI startup","Published open-source sentiment analysis tool","Hired by Google via LinkedIn cold outreach"] },
  { name:"Marcus Chen", avatar:"👨‍🎨", role:"Senior Product Designer @ Stripe",
    from:"Self-taught Designer", story:"No design degree. Just passion. I taught myself Figma, built a Behance portfolio of passion projects, and applied relentlessly. Stripe hired me for my unique perspective as a 'user first' thinker.",
    milestones:["Started with YouTube tutorials on UX principles","Redesigned 3 popular apps as case studies","Landed first freelance project via Twitter","Joined a Series A startup as lead designer","Promoted to Senior Designer in 18 months at Stripe"] },
  { name:"Priya Nair", avatar:"👩‍🔬", role:"Cybersecurity Analyst @ HSBC",
    from:"Computer Science Student", story:"I earned two CompTIA certs (Security+ and CySA+) during final year of college, participated in 12 CTF competitions, and joined HSBC's graduate security program straight from campus.",
    milestones:["Discovered cybersecurity through a university CTF event","Earned CompTIA Security+ in semester 6","Built a home lab with Kali Linux and practice targets","Won regional CTF competition","Joined HSBC's security graduate intake program"] },
];

const COLLEGES_DB = [
  { name:"MIT", location:"Cambridge, USA", cutoff:"Top 1%", fees:"$57k/yr", programs:["CS","AI","Data Sci"], mode:"On-campus", type:"research" },
  { name:"IIT Bombay", location:"Mumbai, India", cutoff:"JEE Top 0.1%", fees:"₹2.5L/yr", programs:["CS","AI","Cyber"], mode:"On-campus", type:"research" },
  { name:"Georgia Tech", location:"Atlanta, USA", cutoff:"Top 5%", fees:"$13k/yr (in-state)", programs:["CS","Cybersec","ML"], mode:"On-campus / Online", type:"engineering" },
  { name:"Coursera / DeepLearning.AI", location:"Online", cutoff:"None", fees:"$49/mo", programs:["AI","ML","Data Sci"], mode:"Online", type:"online" },
  { name:"University of Edinburgh", location:"Scotland, UK", cutoff:"Top 10%", fees:"£9.25k/yr", programs:["CS","AI","Robotics"], mode:"On-campus", type:"research" },
  { name:"upGrad + BITS Pilani", location:"India (Online)", cutoff:"Graduation required", fees:"₹3.5L total", programs:["Data Sci","ML","FullStack"], mode:"Online", type:"online" },
  { name:"Carnegie Mellon", location:"Pittsburgh, USA", cutoff:"Top 2%", fees:"$58k/yr", programs:["CS","ML","HCI"], mode:"On-campus", type:"research" },
  { name:"Udacity Nanodegrees", location:"Online", cutoff:"None", fees:"$249/mo", programs:["AI","Cloud","Self-Driving"], mode:"Online", type:"online" },
];

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
async function askClaude(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      system:`You are NexusAI — an elite AI career mentor for students and professionals.
You give sharp, personalized, and actionable career guidance.
Keep responses concise (3–5 sentences), conversational, and empowering.
Focus on concrete next steps and honest insights. No fluff. Use emojis sparingly.
You specialize in: tech careers, skill development, career transitions, roadmaps, and job market trends.`,
      messages
    })
  });
  const data = await res.json();
  return data.content?.find(b=>b.type==="text")?.text || "I couldn't process that. Please try again.";
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function SkillBar({ label, value, color="#6c63ff" }) {
  const [w, setW] = useState(0);
  useEffect(()=>{ const t = setTimeout(()=>setW(value),300); return()=>clearTimeout(t); },[value]);
  return (
    <div className="skill-bar-wrap">
      <div className="skill-bar-label">
        <span style={{fontSize:".82rem",color:"var(--muted)"}}>{label}</span>
        <span style={{fontSize:".78rem",fontFamily:"var(--font-mono)",color}}>{value}%</span>
      </div>
      <div className="skill-bar">
        <div className="skill-fill" style={{width:`${w}%`,background:`linear-gradient(90deg,${color},${color}88)`}} />
      </div>
    </div>
  );
}

function MeterCell({ value, max=100, color }) {
  return (
    <div className="meter">
      <div className="meter-bar">
        <div className="meter-fill" style={{width:`${(value/max)*100}%`,background:color||"var(--accent)"}} />
      </div>
      <span style={{fontSize:".78rem",fontFamily:"var(--font-mono)",color:color||"var(--accent)"}}>{value}</span>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function LandingPage({ onNavigate }) {
  return (
    <div>
      <div className="hero grid-bg">
        <div className="hero-orb hero-orb-1"/>
        <div className="hero-orb hero-orb-2"/>
        <div className="hero-badge"><span/> AI-Powered Career Intelligence Platform</div>
        <h1 className="hero-title">
          Discover Your <br/>
          <span className="line-accent">Ideal Career Path</span><br/>
          With AI Precision
        </h1>
        <p className="hero-sub">
          Stop guessing. NexusAI maps your personality, skills, and ambitions to careers that actually fit — then builds you a personalized roadmap to get there.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={()=>onNavigate("assessment")}>🚀 Start Your Journey</button>
          <button className="btn-ghost" onClick={()=>onNavigate("chat")}>💬 Chat with AI Mentor</button>
        </div>
        <div className="hero-stats">
          {[["50K+","Students Guided"],["94%","Match Accuracy"],["200+","Career Paths"],["8","Analysis Modules"]].map(([v,l])=>(
            <div key={l} className="hero-stat"><strong>{v}</strong><p>{l}</p></div>
          ))}
        </div>
      </div>

      <div className="features-strip">
        <div className="section-label">Platform Features</div>
        <h2 className="section-title">Everything you need to<br/>make the right call</h2>
        <div className="features-grid">
          {[
            ["🧠","Deep Personality Mapping","MBTI-inspired AI analysis maps your traits, risk appetite, and learning style to career families with 94% accuracy."],
            ["⚖️","Career Comparison Engine","Compare up to 4 careers side-by-side — salary, demand, difficulty, growth trajectory, and required skill overlap."],
            ["🗺️","Dynamic Roadmap Generator","Get a month-by-month learning plan with courses, projects, tools, and milestones tailored to your chosen path."],
            ["🎲","What-If Simulator","Slide your preferences in real-time and watch your career recommendations update instantly."],
            ["🤖","AI Chat Mentor","Have a real conversation with NexusAI — ask anything from interview prep to salary negotiation tips."],
            ["📈","Job Market Trends","Live-updated demand graphs, growth projections, and emerging roles across every major tech sector."],
            ["👥","Real Career Journeys","Curated case studies of real students who made successful transitions — with honest timelines and lessons."],
            ["🎓","College & Course Finder","Filter by rank, budget, location, and field to find the perfect educational institution or online program."],
          ].map(([icon,title,desc])=>(
            <div key={title} className="feature-card">
              <div className="feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssessmentPage({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  const select = (opt) => {
    const newAnswers = { ...answers, [q.id]: opt };
    setAnswers(newAnswers);
    if (current < QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 280);
    } else {
      setTimeout(() => onComplete(newAnswers), 300);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="section-label">Personality & Career Assessment</div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.8rem",fontWeight:800,letterSpacing:"-1px"}}>
          Question {current + 1} of {QUESTIONS.length}
        </h2>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
      <div className="q-card fade-in" key={current}>
        <div className="q-number">Q{String(current+1).padStart(2,"0")} / {QUESTIONS.length}</div>
        <div className="q-text">{q.text}</div>
        <div className="q-options">
          {q.options.map((opt, i) => (
            <button key={i} className={`q-option${answers[q.id]===opt?" selected":""}`} onClick={()=>select(opt)}>
              <span style={{fontFamily:"var(--font-mono)",color:"var(--accent)",marginRight:12,fontSize:".78rem"}}>
                {String.fromCharCode(65+i)}.
              </span>{opt}
            </button>
          ))}
        </div>
        <div className="q-nav">
          <button className="btn-ghost" style={{padding:"10px 20px",fontSize:".85rem"}}
            disabled={current===0} onClick={()=>setCurrent(c=>c-1)}>← Back</button>
          <span style={{fontSize:".8rem",color:"var(--muted)",fontFamily:"var(--font-mono)"}}>
            {Object.keys(answers).length} answered
          </span>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ answers, onNavigate }) {
  const sorted = [...CAREERS].sort((a,b)=>b.match-a.match);
  const top = sorted[0];

  return (
    <div className="dashboard fade-in">
      <div className="section-label">Your Personalized Results</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Career Intelligence Report
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:8}}>
        Based on your assessment, here are your top career matches ranked by compatibility.
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:32}}>
        {["Builder 🔨","Analytical 🧪","Risk-Taker ⚡","Self-Learner 📚"].map(t=>(
          <span key={t} className="tag tag-purple" style={{padding:"6px 14px",fontSize:".8rem"}}>{t}</span>
        ))}
      </div>
      <div className="dash-grid">
        <div className="career-cards">
          {sorted.map((c,i)=>(
            <div key={c.id} className={`career-card${i===0?" top":""} fade-in`}
              style={{animationDelay:`${i*0.07}s`}}
              onClick={()=>onNavigate("roadmap",c.id)}>
              <div>
                <div className="career-rank">#{i+1}</div>
                <div style={{fontSize:"2rem",margin:"4px 0"}}>{c.icon}</div>
                <div className="match-score">{c.match}%</div>
                <div style={{fontSize:".72rem",color:"var(--muted)",fontFamily:"var(--font-mono)"}}>MATCH</div>
              </div>
              <div className="career-info">
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                <div className="career-tags">
                  <span className="tag tag-teal">{c.salary}</span>
                  <span className="tag tag-purple">{c.growth} Growth</span>
                  <span className="tag tag-gold">{c.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="side-panel">
          <div className="panel-card">
            <h4>Your Skill Profile</h4>
            <SkillBar label="Problem Solving" value={88} color="#6c63ff"/>
            <SkillBar label="Technical Aptitude" value={82} color="#00d4aa"/>
            <SkillBar label="Creative Thinking" value={71} color="#f5c842"/>
            <SkillBar label="Leadership" value={64} color="#fb923c"/>
            <SkillBar label="Communication" value={76} color="#a78bfa"/>
          </div>
          <div className="panel-card glow">
            <h4>⭐ Top Match</h4>
            <div style={{fontSize:"2.5rem",margin:"8px 0"}}>{top.icon}</div>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"1.1rem"}}>{top.name}</div>
            <div style={{fontSize:".82rem",color:"var(--muted)",margin:"8px 0 16px",lineHeight:1.5}}>{top.desc}</div>
            <button className="btn-primary" style={{width:"100%",padding:"12px"}}
              onClick={()=>onNavigate("roadmap","ai-ml")}>
              View My Roadmap →
            </button>
          </div>
          <div className="panel-card">
            <h4>Quick Actions</h4>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["⚖️","Compare Careers","compare"],["💬","Ask AI Mentor","chat"],["📈","Job Trends","trends"],["🎓","Find Courses","college"]].map(([ico,lbl,page])=>(
                <button key={page} className="btn-ghost" style={{width:"100%",padding:"10px 14px",textAlign:"left",fontSize:".85rem",display:"flex",gap:8,alignItems:"center"}}
                  onClick={()=>onNavigate(page)}>{ico} {lbl}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonPage() {
  const [selected, setSelected] = useState(["ai-ml","fullstack","cybersec"]);
  const toggle = id => {
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : s.length<4 ? [...s,id] : s);
  };
  const cols = CAREERS.filter(c=>selected.includes(c.id));
  const gridCols = `200px ${cols.map(()=>"1fr").join(" ")}`;

  const difficultyScore = d => ({Easy:30,"Medium":60,Hard:80,"Very Hard":95}[d]||50);

  return (
    <div className="compare-page fade-in">
      <div className="section-label">Career Comparison Engine</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:16}}>
        Compare Careers Side-by-Side
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:24}}>Select up to 4 careers to compare</p>
      <div className="compare-selector">
        {CAREERS.map(c=>(
          <button key={c.id} className={`career-pill${selected.includes(c.id)?" selected":""}`} onClick={()=>toggle(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      {cols.length > 0 && (
        <div className="compare-table fade-in">
          <div className="compare-head" style={{gridTemplateColumns:gridCols}}>
            <div className="compare-cell" style={{color:"var(--muted)",fontSize:".75rem",fontFamily:"var(--font-mono)"}}>METRIC</div>
            {cols.map(c=>(
              <div key={c.id} className="compare-cell header">
                <div style={{fontSize:"1.8rem",marginBottom:6}}>{c.icon}</div>
                <div>{c.name}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:".72rem",color:c.color,marginTop:4}}>{c.match}% match</div>
              </div>
            ))}
          </div>
          {[
            { label:"💰 Salary Range", render:c=><span style={{fontFamily:"var(--font-mono)",fontSize:".82rem",color:"var(--accent2)"}}>{c.salary}</span> },
            { label:"📈 Growth", render:c=><span style={{fontSize:".85rem"}}>{c.growth}</span> },
            { label:"🎯 Demand Score", render:c=><MeterCell value={c.demand} color={c.color}/> },
            { label:"💪 Difficulty", render:c=><MeterCell value={difficultyScore(c.difficulty)} color="var(--accent3)"/> },
            { label:"🛠️ Key Skills", render:c=>(
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {c.skills.slice(0,3).map(s=><span key={s} className="chip">{s}</span>)}
              </div>
            )},
            { label:"🔮 Future Demand", render:c=>(
              <span style={{color:c.demand>85?"var(--accent2)":"var(--gold)",fontFamily:"var(--font-mono)",fontSize:".8rem"}}>
                {c.demand>90?"🔥 Critical":c.demand>80?"📈 Growing":"🔄 Stable"}
              </span>
            )},
          ].map(row=>(
            <div key={row.label} className="compare-row" style={{gridTemplateColumns:gridCols}}>
              <div className="compare-label">{row.label}</div>
              {cols.map(c=><div key={c.id} className="compare-cell">{row.render(c)}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapPage({ careerId }) {
  const roadmap = ROADMAPS[careerId] || ROADMAPS["ai-ml"];
  return (
    <div className="roadmap-page fade-in">
      <div className="section-label">Dynamic Roadmap Generator</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Your Path to {roadmap.career}
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:8}}>
        A structured, phase-by-phase learning journey built for your goals.
      </p>
      <div style={{display:"flex",gap:12,marginBottom:40,flexWrap:"wrap"}}>
        {[["⏱️","12–18 Months"],["📚","5 Phases"],["🎯","Project-Based"],["✅","Milestone Tracked"]].map(([ico,lbl])=>(
          <span key={lbl} className="tag tag-teal" style={{padding:"6px 12px",fontSize:".8rem"}}>{ico} {lbl}</span>
        ))}
      </div>
      <div className="timeline">
        {roadmap.phases.map((p,i)=>(
          <div key={i} className="timeline-item fade-in" style={{animationDelay:`${i*0.1}s`}}>
            <div className={`timeline-dot${p.status==="active"?" active":p.status==="done"?" done":""}`}>
              {p.status==="done"?"✓":p.status==="active"?"▶":`0${i+1}`}
            </div>
            <div className="timeline-content">
              <div className="timeline-phase">{p.phase} · {p.months}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="resource-chips">
                {p.resources.map(r=><span key={r} className="chip">📎 {r}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIfPage() {
  const [salaryW, setSalaryW] = useState(70);
  const [codingW, setCodingW] = useState(80);
  const [remoteW, setRemoteW] = useState(60);
  const [creativityW, setCreativityW] = useState(50);

  const scored = CAREERS.map(c=>{
    let score = c.match;
    if(salaryW>70 && c.salary.includes("$1")) score += 8;
    if(codingW>70 && c.skills.includes("Python")) score += 12;
    if(remoteW>70) score += 5;
    if(creativityW>60 && c.id==="ux-design") score += 15;
    if(codingW<30 && c.id==="ai-ml") score -= 20;
    return {...c, simScore:Math.min(99,Math.max(30,score))};
  }).sort((a,b)=>b.simScore-a.simScore);

  const SliderControl = ({label,value,onChange,color}) => (
    <div className="slider-group">
      <div className="slider-label">
        <span style={{color:"var(--muted)"}}>{label}</span>
        <span style={{color}}>{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        style={{"--val":`${value}%`}}
        onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );

  return (
    <div className="whatif-page fade-in">
      <div className="section-label">What-If Simulator</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Explore "What If" Scenarios
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:32}}>
        Adjust your preferences below and watch your career recommendations update in real-time.
      </p>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:28,marginBottom:32}}>
        <h4 style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:24,fontSize:"1rem"}}>⚙️ Adjust Your Preferences</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:24}}>
          <SliderControl label="💰 Salary Priority" value={salaryW} onChange={setSalaryW} color="var(--gold)"/>
          <SliderControl label="💻 Coding Interest" value={codingW} onChange={setCodingW} color="var(--accent)"/>
          <SliderControl label="🏠 Remote Preference" value={remoteW} onChange={setRemoteW} color="var(--accent2)"/>
          <SliderControl label="🎨 Creativity Weight" value={creativityW} onChange={setCreativityW} color="var(--accent3)"/>
        </div>
      </div>
      <div className="whatif-grid">
        {scored.slice(0,6).map((c,i)=>(
          <div key={c.id} className={`whatif-result-card fade-in${i<2?" highlight":""}`}
            style={{animationDelay:`${i*0.06}s`,borderColor:i===0?"rgba(0,212,170,0.5)":undefined}}>
            {i===0 && <div className="rank-badge">🏆 #1 Pick</div>}
            {i===1 && <div className="rank-badge">#2 Pick</div>}
            <div style={{fontSize:"2rem",marginBottom:8}}>{c.icon}</div>
            <div style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:6}}>{c.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:"1.4rem",fontWeight:800,
                color:i===0?"var(--accent2)":"var(--accent)"}}>{c.simScore}%</div>
              <div style={{fontSize:".72rem",color:"var(--muted)"}}>sim score</div>
            </div>
            <div style={{fontSize:".8rem",color:"var(--muted)"}}>{c.salary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPage() {
  const [messages, setMessages] = useState([
    { role:"ai", text:"👋 Hey! I'm **NexusAI**, your personal career mentor. I can help with career choices, learning roadmaps, interview prep, salary negotiation, skill gaps — anything career-related. What's on your mind?", time:"Just now" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const now = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  const send = async (text) => {
    const msg = text || input.trim();
    if(!msg || loading) return;
    setInput("");
    const userMsg = { role:"user", text:msg, time:now() };
    setMessages(m=>[...m,userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m=>({ role:m.role==="ai"?"assistant":"user", content:m.text }));
      history.push({ role:"user", content:msg });
      const reply = await askClaude(history);
      setMessages(m=>[...m,{ role:"ai", text:reply, time:now() }]);
    } catch {
      setMessages(m=>[...m,{ role:"ai", text:"Connection issue. Please try again.", time:now() }]);
    }
    setLoading(false);
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const QUICK = ["What career suits a coder who loves math?","How do I transition into AI/ML?","What skills should I learn in 2025?","How much does a data scientist earn?"];

  const renderText = t => t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");

  return (
    <div className="chat-page fade-in">
      <div className="section-label">AI Career Mentor</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Chat with NexusAI
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:20}}>
        Powered by Claude — your always-on, judgment-free career mentor.
      </p>
      <div className="quick-prompts">
        {QUICK.map(q=>(
          <button key={q} className="quick-prompt" onClick={()=>send(q)}>{q}</button>
        ))}
      </div>
      <div className="chat-window glow">
        <div className="chat-header">
          <div className="chat-avatar">🤖</div>
          <div className="chat-header-info">
            <h4>NexusAI Mentor</h4>
            <p>● Online — responds instantly</p>
          </div>
          <div className="chat-status"/>
        </div>
        <div className="chat-messages">
          {messages.map((m,i)=>(
            <div key={i} className={`msg ${m.role==="ai"?"ai":"user"} fade-in`}>
              <div className="msg-bubble" dangerouslySetInnerHTML={{__html:renderText(m.text)}}/>
              <div className="msg-time">{m.time}</div>
            </div>
          ))}
          {loading && (
            <div className="msg ai">
              <div className="msg-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-input-area">
          <input className="chat-input" placeholder="Ask anything about your career..."
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}/>
          <button className="chat-send" disabled={!input.trim()||loading} onClick={()=>send()}>
            {loading ? <div className="spinner" style={{width:18,height:18}}/> : "↑"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendsPage() {
  const [animated, setAnimated] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setAnimated(true),400); return()=>clearTimeout(t); },[]);
  const barData = [
    { name:"AI Engineer",val:97,color:"#6c63ff"},
    { name:"Cybersecurity",val:95,color:"#00d4aa"},
    { name:"Data Scientist",val:90,color:"#f5c842"},
    { name:"Cloud Architect",val:88,color:"#a78bfa"},
    { name:"Full Stack Dev",val:85,color:"#fb923c"},
    { name:"Blockchain Dev",val:82,color:"#34d399"},
    { name:"DevOps Eng",val:80,color:"#60a5fa"},
    { name:"UX Designer",val:75,color:"#f472b6"},
  ];
  return (
    <div className="trends-page fade-in">
      <div className="section-label">Future Job Market Intelligence</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        2025–2030 Tech Career Trends
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:32}}>
        Real-time demand signals and projected growth across top tech disciplines.
      </p>
      <div className="trends-grid">
        {TRENDS_DATA.map((t,i)=>(
          <div key={t.name} className="trend-card fade-in" style={{animationDelay:`${i*0.06}s`}}>
            <div className="trend-icon">{t.icon}</div>
            <div className="trend-name">{t.name}</div>
            <div className={`trend-growth ${t.type}`}>{t.growth}</div>
            <div className="trend-label">YoY Job Growth</div>
            <div style={{fontSize:".75rem",color:"var(--muted)",marginTop:8,fontFamily:"var(--font-mono)"}}>
              {(t.jobs/1000).toFixed(0)}K open roles
            </div>
          </div>
        ))}
      </div>
      <div className="bar-chart">
        <h4 style={{fontFamily:"var(--font-display)",fontWeight:700}}>📊 2025 Demand Score Ranking</h4>
        {barData.map(b=>(
          <div key={b.name} className="bar-row">
            <div className="bar-name">{b.name}</div>
            <div className="bar-outer">
              <div className="bar-inner" style={{width:animated?`${b.val}%`:"0%",background:b.color}}/>
            </div>
            <div className="bar-val" style={{color:b.color}}>{b.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneysPage() {
  return (
    <div className="journeys-page fade-in">
      <div className="section-label">Real-Life Career Journeys</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Stories That Inspire Action
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:32}}>
        Real students and professionals who found their path — with honest timelines.
      </p>
      <div className="journey-cards">
        {JOURNEYS.map((j,i)=>(
          <div key={j.name} className="journey-card fade-in" style={{animationDelay:`${i*0.1}s`}}>
            <div className="journey-header">
              <div className="journey-avatar">{j.avatar}</div>
              <div>
                <div className="journey-name">{j.name}</div>
                <div className="journey-role">{j.role}</div>
                <div style={{fontSize:".75rem",color:"var(--muted)",marginTop:4}}>Previously: {j.from}</div>
              </div>
            </div>
            <div className="journey-body">
              <p>{j.story}</p>
              <div style={{fontFamily:"var(--font-mono)",fontSize:".72rem",color:"var(--accent2)",marginBottom:10}}>KEY MILESTONES</div>
              <div className="journey-milestones">
                {j.milestones.map(m=><div key={m} className="milestone">{m}</div>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollegePage() {
  const [type, setType] = useState("all");
  const [budget, setBudget] = useState("all");
  const filtered = COLLEGES_DB.filter(c=>{
    if(type!=="all" && c.type!==type) return false;
    if(budget==="low" && !c.fees.includes("₹") && !c.fees.includes("/mo")) return false;
    if(budget==="high" && !c.fees.includes("$5")) return false;
    return true;
  });
  return (
    <div className="college-page fade-in">
      <div className="section-label">College & Course Finder</div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",marginBottom:8}}>
        Find Your Learning Institution
      </h2>
      <p style={{color:"var(--muted)",fontSize:".9rem",marginBottom:24}}>
        Filter by type, budget, and region to find the right fit.
      </p>
      <div className="college-filter">
        <div style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:4}}>🔍 Filter Options</div>
        <div className="filter-grid">
          <div className="filter-group">
            <label>Institution Type</label>
            <select className="filter-select" value={type} onChange={e=>setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="research">Research Universities</option>
              <option value="engineering">Engineering Schools</option>
              <option value="online">Online Platforms</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Budget Range</label>
            <select className="filter-select" value={budget} onChange={e=>setBudget(e.target.value)}>
              <option value="all">Any Budget</option>
              <option value="low">Low Cost / India</option>
              <option value="high">Premium</option>
            </select>
          </div>
        </div>
      </div>
      <div className="college-cards">
        {filtered.map((c,i)=>(
          <div key={c.name} className="college-card fade-in" style={{animationDelay:`${i*0.07}s`}}>
            <div className="college-name">{c.name}</div>
            <div className="college-location">📍 {c.location}</div>
            <div className="college-meta">
              <div className="college-meta-row"><span>Eligibility</span><strong>{c.cutoff}</strong></div>
              <div className="college-meta-row"><span>Fees</span><strong style={{color:"var(--accent2)"}}>{c.fees}</strong></div>
              <div className="college-meta-row"><span>Mode</span><strong>{c.mode}</strong></div>
              <div className="college-meta-row">
                <span>Programs</span>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {c.programs.map(p=><span key={p} className="chip" style={{fontSize:".68rem"}}>{p}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [subData, setSubData] = useState(null);
  const [assessed, setAssessed] = useState(false);

  const navigate = (p, data=null) => {
    setPage(p);
    if(data) setSubData(data);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const handleAssessmentComplete = (answers) => {
    setAssessed(true);
    navigate("dashboard");
  };

  const NAV_ITEMS = [
    {key:"home",label:"Home"},
    {key:"assessment",label:"Assessment"},
    {key:"dashboard",label:"Results"},
    {key:"compare",label:"Compare"},
    {key:"roadmap",label:"Roadmap"},
    {key:"whatif",label:"What-If"},
    {key:"trends",label:"Trends"},
    {key:"journeys",label:"Journeys"},
    {key:"college",label:"Colleges"},
  ];

  return (
    <>
      <style>{FONTS + CSS}</style>
      <div className="noise">
        <nav>
          <div className="nav-logo">⬡ NexusAI</div>
          <div className="nav-links">
            {NAV_ITEMS.map(n=>(
              <button key={n.key} className={`nav-btn${page===n.key?" active":""}`}
                onClick={()=>navigate(n.key)}>{n.label}</button>
            ))}
          </div>
          <button className="nav-btn nav-cta" onClick={()=>navigate("chat")}>💬 AI Mentor</button>
        </nav>

        {page==="home" && <LandingPage onNavigate={navigate}/>}
        {page==="assessment" && <AssessmentPage onComplete={handleAssessmentComplete}/>}
        {page==="dashboard" && <DashboardPage answers={subData} onNavigate={navigate}/>}
        {page==="compare" && <ComparisonPage/>}
        {page==="roadmap" && <RoadmapPage careerId={subData||"ai-ml"}/>}
        {page==="whatif" && <WhatIfPage/>}
        {page==="chat" && <ChatPage/>}
        {page==="trends" && <TrendsPage/>}
        {page==="journeys" && <JourneysPage/>}
        {page==="college" && <CollegePage/>}
      </div>
    </>
  );
}
