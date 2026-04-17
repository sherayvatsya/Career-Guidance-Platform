import { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import { QUESTIONS, CAREERS, ROADMAPS, TRENDS_DATA, JOURNEYS, COLLEGES_DB } from "./data";
import { askClaude } from "./api";

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

// â”€â”€â”€ PAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          Stop guessing. NexusAI maps your personality, skills, and ambitions to careers that actually fit â€” then builds you a personalized roadmap to get there.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={()=>onNavigate("assessment")}>ðŸš€ Start Your Journey</button>
          <button className="btn-ghost" onClick={()=>onNavigate("chat")}>ðŸ’¬ Chat with AI Mentor</button>
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
            ["ðŸ§ ","Deep Personality Mapping","MBTI-inspired AI analysis maps your traits, risk appetite, and learning style to career families with 94% accuracy."],
            ["âš–ï¸","Career Comparison Engine","Compare up to 4 careers side-by-side â€” salary, demand, difficulty, growth trajectory, and required skill overlap."],
            ["ðŸ—ºï¸","Dynamic Roadmap Generator","Get a month-by-month learning plan with courses, projects, tools, and milestones tailored to your chosen path."],
            ["ðŸŽ²","What-If Simulator","Slide your preferences in real-time and watch your career recommendations update instantly."],
            ["ðŸ¤–","AI Chat Mentor","Have a real conversation with NexusAI â€” ask anything from interview prep to salary negotiation tips."],
            ["ðŸ“ˆ","Job Market Trends","Live-updated demand graphs, growth projections, and emerging roles across every major tech sector."],
            ["ðŸ‘¥","Real Career Journeys","Curated case studies of real students who made successful transitions â€” with honest timelines and lessons."],
            ["ðŸŽ“","College & Course Finder","Filter by rank, budget, location, and field to find the perfect educational institution or online program."],
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
            disabled={current===0} onClick={()=>setCurrent(c=>c-1)}>â† Back</button>
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
        {["Builder ðŸ”¨","Analytical ðŸ§ª","Risk-Taker âš¡","Self-Learner ðŸ“š"].map(t=>(
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
            <h4>â­ Top Match</h4>
            <div style={{fontSize:"2.5rem",margin:"8px 0"}}>{top.icon}</div>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"1.1rem"}}>{top.name}</div>
            <div style={{fontSize:".82rem",color:"var(--muted)",margin:"8px 0 16px",lineHeight:1.5}}>{top.desc}</div>
            <button className="btn-primary" style={{width:"100%",padding:"12px"}}
              onClick={()=>onNavigate("roadmap","ai-ml")}>
              View My Roadmap â†’
            </button>
          </div>
          <div className="panel-card">
            <h4>Quick Actions</h4>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["âš–ï¸","Compare Careers","compare"],["ðŸ’¬","Ask AI Mentor","chat"],["ðŸ“ˆ","Job Trends","trends"],["ðŸŽ“","Find Courses","college"]].map(([ico,lbl,page])=>(
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
            { label:"ðŸ’° Salary Range", render:c=><span style={{fontFamily:"var(--font-mono)",fontSize:".82rem",color:"var(--accent2)"}}>{c.salary}</span> },
            { label:"ðŸ“ˆ Growth", render:c=><span style={{fontSize:".85rem"}}>{c.growth}</span> },
            { label:"ðŸŽ¯ Demand Score", render:c=><MeterCell value={c.demand} color={c.color}/> },
            { label:"ðŸ’ª Difficulty", render:c=><MeterCell value={difficultyScore(c.difficulty)} color="var(--accent3)"/> },
            { label:"ðŸ› ï¸ Key Skills", render:c=>(
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {c.skills.slice(0,3).map(s=><span key={s} className="chip">{s}</span>)}
              </div>
            )},
            { label:"ðŸ”® Future Demand", render:c=>(
              <span style={{color:c.demand>85?"var(--accent2)":"var(--gold)",fontFamily:"var(--font-mono)",fontSize:".8rem"}}>
                {c.demand>90?"ðŸ”¥ Critical":c.demand>80?"ðŸ“ˆ Growing":"ðŸ”„ Stable"}
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
        {[["â±ï¸","12â€“18 Months"],["ðŸ“š","5 Phases"],["ðŸŽ¯","Project-Based"],["âœ…","Milestone Tracked"]].map(([ico,lbl])=>(
          <span key={lbl} className="tag tag-teal" style={{padding:"6px 12px",fontSize:".8rem"}}>{ico} {lbl}</span>
        ))}
      </div>
      <div className="timeline">
        {roadmap.phases.map((p,i)=>(
          <div key={i} className="timeline-item fade-in" style={{animationDelay:`${i*0.1}s`}}>
            <div className={`timeline-dot${p.status==="active"?" active":p.status==="done"?" done":""}`}>
              {p.status==="done"?"âœ“":p.status==="active"?"â–¶":`0${i+1}`}
            </div>
            <div className="timeline-content">
              <div className="timeline-phase">{p.phase} Â· {p.months}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="resource-chips">
                {p.resources.map(r=><span key={r} className="chip">ðŸ“Ž {r}</span>)}
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
        <h4 style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:24,fontSize:"1rem"}}>âš™ï¸ Adjust Your Preferences</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:24}}>
          <SliderControl label="ðŸ’° Salary Priority" value={salaryW} onChange={setSalaryW} color="var(--gold)"/>
          <SliderControl label="ðŸ’» Coding Interest" value={codingW} onChange={setCodingW} color="var(--accent)"/>
          <SliderControl label="ðŸ  Remote Preference" value={remoteW} onChange={setRemoteW} color="var(--accent2)"/>
          <SliderControl label="ðŸŽ¨ Creativity Weight" value={creativityW} onChange={setCreativityW} color="var(--accent3)"/>
        </div>
      </div>
      <div className="whatif-grid">
        {scored.slice(0,6).map((c,i)=>(
          <div key={c.id} className={`whatif-result-card fade-in${i<2?" highlight":""}`}
            style={{animationDelay:`${i*0.06}s`,borderColor:i===0?"rgba(0,212,170,0.5)":undefined}}>
            {i===0 && <div className="rank-badge">ðŸ† #1 Pick</div>}
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
    { role:"ai", text:"ðŸ‘‹ Hey! I'm **NexusAI**, your personal career mentor. I can help with career choices, learning roadmaps, interview prep, salary negotiation, skill gaps â€” anything career-related. What's on your mind?", time:"Just now" }
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
        Powered by Claude â€” your always-on, judgment-free career mentor.
      </p>
      <div className="quick-prompts">
        {QUICK.map(q=>(
          <button key={q} className="quick-prompt" onClick={()=>send(q)}>{q}</button>
        ))}
      </div>
      <div className="chat-window glow">
        <div className="chat-header">
          <div className="chat-avatar">ðŸ¤–</div>
          <div className="chat-header-info">
            <h4>NexusAI Mentor</h4>
            <p>â— Online â€” responds instantly</p>
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
            {loading ? <div className="spinner" style={{width:18,height:18}}/> : "â†‘"}
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
        2025â€“2030 Tech Career Trends
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
        <h4 style={{fontFamily:"var(--font-display)",fontWeight:700}}>ðŸ“Š 2025 Demand Score Ranking</h4>
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
        Real students and professionals who found their path â€” with honest timelines.
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
    if(budget==="low" && !c.fees.includes("â‚¹") && !c.fees.includes("/mo")) return false;
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
        <div style={{fontFamily:"var(--font-display)",fontWeight:700,marginBottom:4}}>ðŸ” Filter Options</div>
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
            <div className="college-location">ðŸ“ {c.location}</div>
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

// â”€â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    <>      <div className="noise">
        <nav>
          <div className="nav-logo">â¬¡ NexusAI</div>
          <div className="nav-links">
            {NAV_ITEMS.map(n=>(
              <button key={n.key} className={`nav-btn${page===n.key?" active":""}`}
                onClick={()=>navigate(n.key)}>{n.label}</button>
            ))}
          </div>
          <button className="nav-btn nav-cta" onClick={()=>navigate("chat")}>ðŸ’¬ AI Mentor</button>
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


