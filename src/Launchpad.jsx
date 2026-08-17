import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

// Render markdown -> HTML, and auto-link bare URLs not already in a md link.
function mdToHtml(text) {
  const raw = String(text || "");
  const linked = raw.replace(/(^|[^\](])((?:https?:\/\/)[^\s)]+)/g, (m, pre, url) => `${pre}[${url}](${url})`);
  return marked.parse(linked);
}

/* ---------- helpers ---------- */
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const uid = () => String(Date.now()) + Math.random().toString(16).slice(2, 6);

const TAGS = ["Onboarding", "Client", "Process", "Question", "Win"];

/* Seed recordings (kept as first entries). */
const SEED_RECS = [
  {
    id: "rec-0803", title: "Onboarding — Systems & Access Setup", rec_date: "2026-08-03",
    link: "https://app.fyxer.com/call-recordings/8c3588a7-a0c6-4882-9f64-3bbc517a5e33:040000008200E00074C5B7101A82E0080000000080361E7CBE1EDD0100000000000000001000000081049DF12E7D2F40984F6FC556549B22",
    notes:
"Attendees: Becky Paulukow, Kevin Baker\n\nSUMMARY\nKickoff and access setup. Kevin (service team) handled Microsoft sign-in, Authenticator MFA, password reset, and delegate access to Nick's Outlook mail and calendar; VPN and mapped drives to be finished in a follow-up session. Becky walked through ConnectWise and Bloom.\n\nKEY TAKEAWAYS\n- Your core role: scheduling and inbox point person for Nick, with full delegate access. Nick wants all scheduling funneled through you.\n- Scheduling flow: everything starts in ConnectWise, which syncs to Outlook and Teams.\n- ConnectWise colors: orange = manual one-off; blue = ticket (usually recurring); green = activity synced from an Outlook invite.\n- Two views: My Calendar (just Nick) and Dispatch Portal (finding open overlap).\n- Bloom/EOS: weekly L10s each have a scorecard; weeks run Saturday–Friday.\n- Comms: Teams chat for quick hits, email for anything needing thought.\n\nACTION ITEMS\n- Log into One2One Teams; add Becky and Nick; install Teams mobile.\n- Watch ConnectWise training videos, then the EOS deck.\n- Schedule VPN + mapped-drives session with Kevin.\n- Ask Kevin how to get your AI notetaker into Teams meetings.\n- With Nick: confirm prospect scheduling and clean up his calendar.",
  },
  {
    id: "rec-0804", title: "Nick — First 1:1 (en route to airport)", rec_date: "2026-08-04",
    link: "",
    notes:
"Attendees: Nick, Ashley\n\nSUMMARY\nFirst 1:1 with Nick, by phone while he drove to the airport. High-level orientation and priority-setting. Nick moves fast, wants you to own the to-do list, build systems for supreme clarity, and push back when he over-commits.\n\nKEY TAKEAWAYS\n- Top two priorities: (1) calendar cleanup & management, (2) email/inbox management & scheduling.\n- ConnectWise: client work is a ticket that creates a synced calendar item. Focus training on calendar/scheduling modules.\n- Fyxer.ai already runs his inbox, auto-sorting mail. You need your own Fyxer access.\n- He's email-driven: emails himself reminders. Goal is for you to own the to-dos.\n- The 'open items' email: split into Nick items and EA items. Write clarifying questions.\n- OneNote: his processes and phased training plan live there.\n- Question routing: operational/procedural/systems/access → Becky's team. Nick OOO but reachable.\n\nACTION ITEMS\n- Prioritize training: EOS, ConnectWise calendar/scheduling, Teams.\n- Study the accountability chart in Bloom.\n- Work the 'open items' email; write clarifying questions.\n- Get your own Fyxer access.\n- Decide quick-capture system (likely Teams chat) and confirm with Nick.\n- Draft a team intro email (later).",
  },
];

export default function Launchpad() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  /* ---------- Reference (collapsed by default) ---------- */
  const [refOpen, setRefOpen] = useState(false);
  const [docTab, setDocTab] = useState("guidebook");
  const [expanded, setExpanded] = useState(false);
  const DOCS = {
    guidebook: {
      label: "Client Guidebook",
      frame: "https://docs.google.com/spreadsheets/d/1aVwIk4_kCFxhx0xQ8uNzLTV3g-UC8iEKX-DR5AY5rbs/preview?gid=519508036&widget=true&headers=false#gid=519508036",
      open: "https://docs.google.com/spreadsheets/d/1aVwIk4_kCFxhx0xQ8uNzLTV3g-UC8iEKX-DR5AY5rbs/edit?gid=519508036#gid=519508036",
    },
    weekly: {
      label: "Weekly Outcomes & Priorities",
      frame: "https://docs.google.com/document/d/1tMFYdE6TEAI67004T9s2ZczlCZexf-9K3TK0n_eQyrY/preview",
      open: "https://docs.google.com/document/d/1tMFYdE6TEAI67004T9s2ZczlCZexf-9K3TK0n_eQyrY/edit?tab=t.0",
    },
  };

  /* ---------- Call Recordings (Supabase) ---------- */
  const [recs, setRecs] = useState([]);
  const [recsLoaded, setRecsLoaded] = useState(false);
  const [activeRec, setActiveRec] = useState(null);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recForm, setRecForm] = useState({ title: "", rec_date: "", link: "", notes: "" });

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("recordings").select("*").order("rec_date", { ascending: true });
        if (error) throw error;
        if (data && data.length) {
          setRecs(data);
          setActiveRec(data[0].id);
        } else {
          // seed
          for (const r of SEED_RECS) {
            await supabase.from("recordings").upsert(r);
          }
          setRecs(SEED_RECS);
          setActiveRec(SEED_RECS[0].id);
        }
      } catch (e) {
        console.error("Recordings load failed:", e);
        setRecs(SEED_RECS);
        setActiveRec(SEED_RECS[0].id);
      }
      setRecsLoaded(true);
    })();
  }, []);

  const addRecording = async () => {
    if (!recForm.title.trim()) return;
    const rec = { id: uid(), title: recForm.title.trim(), rec_date: recForm.rec_date || "", link: recForm.link.trim(), notes: recForm.notes.trim() };
    setRecs((r) => [...r, rec]);
    setActiveRec(rec.id);
    setRecForm({ title: "", rec_date: "", link: "", notes: "" });
    setShowRecForm(false);
    try { await supabase.from("recordings").upsert(rec); } catch (e) { console.error(e); }
  };
  const deleteRecording = async (id) => {
    setRecs((r) => {
      const next = r.filter((x) => x.id !== id);
      setActiveRec((cur) => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
    try { await supabase.from("recordings").delete().eq("id", id); } catch (e) { console.error(e); }
  };

  const fmtRecDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return DAYS[dt.getDay()].slice(0, 3) + " " + MONTHS[dt.getMonth()].slice(0, 3) + " " + dt.getDate();
  };
  const shortRecDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    return MONTHS[dt.getMonth()].slice(0, 3) + " " + dt.getDate();
  };

  /* ---------- Field Notes (Supabase) ---------- */
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [search, setSearch] = useState("");
  const noteRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("field_notes").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setNotes(data || []);
      } catch (e) { console.error("Notes load failed:", e); }
    })();
  }, []);

  const addNote = async () => {
    const text = noteText.trim();
    if (!text) { noteRef.current?.focus(); return; }
    const note = { id: uid(), text, tag: activeTag, created_at: new Date().toISOString() };
    setNotes((n) => [note, ...n]);
    setNoteText(""); setActiveTag(null);
    try { await supabase.from("field_notes").insert(note); } catch (e) { console.error(e); }
  };
  const deleteNote = async (id) => {
    setNotes((n) => n.filter((x) => x.id !== id));
    try { await supabase.from("field_notes").delete().eq("id", id); } catch (e) { console.error(e); }
  };

  const stamp = (iso) => {
    const d = new Date(iso);
    let h = d.getHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    let m = d.getMinutes(); if (m < 10) m = "0" + m;
    return MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate() + " · " + h + ":" + m + " " + ap;
  };
  const filteredNotes = notes.filter((e) => {
    if (filterTag && e.tag !== filterTag) return false;
    if (search && (e.text || "").toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
    return true;
  });

  const copyAll = () => {
    const text = notes.map((e) => stamp(e.created_at) + (e.tag ? " [" + e.tag + "]" : "") + "\n" + e.text).join("\n\n");
    if (text && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  const activeRecObj = recs.find((r) => r.id === activeRec);

  return (
    <div className="lp-root">
      <style>{LP_CSS}</style>
      <div className="lp-topbar" />
      <div className="lp-wrap">
        {/* Masthead */}
        <header className="lp-mast">
          <div className="lp-lockup">
            <div className="lp-logo">
              <span className="lp-word l">ONE</span>
              <span className="lp-mark"><span>2</span></span>
              <span className="lp-word r">ONE</span>
              <span className="lp-sub l">BEYOND</span>
              <span className="lp-sub r">TECHNOLOGY</span>
            </div>
            <p className="lp-tagline">IT Solutions for Growing Businesses</p>
          </div>
          <div className="lp-today">
            <div className="lp-day">{DAYS[now.getDay()]}</div>
            <div className="lp-date">{MONTHS[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear()}</div>
            <Link to="/board" className="lp-btn lp-small" style={{ marginTop: 12, display: "inline-block" }}>Open Command Center →</Link>
          </div>
        </header>

        {/* Shortcuts */}
        <div className="lp-band"><h2>Shortcuts</h2><span className="lp-rule" /><span className="lp-note">Press 1–4</span></div>
        <div className="lp-grid apps">
          <Shortcut href="https://teams.microsoft.com/" name="Teams" meta="Open in browser" kk="1"
            glyph={<path d="M3 5h13v11H8l-5 4V5z" />} extra={<path d="M19 9h2v9l-3-2h-6" />} />
          <Shortcut href="https://outlook.office.com/mail/" name="Outlook" meta="Mail on the web" kk="2"
            glyph={<><rect x="2" y="5" width="20" height="14" /><path d="M2 6l10 7 10-7" /></>} />
          <Shortcut href="https://portal.one2oneinc.com/" name="ConnectWise" meta="Tickets & clients" kk="3"
            glyph={<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></>} />
          <Shortcut href="https://static.bloomgrowth.com/" name="Bloom" meta="Scorecard & L10" kk="4"
            glyph={<><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20V7" /></>} />
        </div>

        {/* Call Recordings */}
        <div className="lp-band">
          <h2>Call Recordings</h2><span className="lp-rule" />
          <span className="lp-note">{recs.length} {recs.length === 1 ? "call" : "calls"}</span>
        </div>
        <section className="lp-rec-workspace">
          <div className="lp-tabs">
            {recs.map((r) => (
              <button key={r.id} className={"lp-rectab" + (activeRec === r.id ? " on" : "")} onClick={() => setActiveRec(r.id)}>
                <span className="lp-rectab-date">{shortRecDate(r.rec_date)}</span>
                <span className="lp-rectab-label">{r.title.length > 22 ? r.title.slice(0, 22) + "…" : r.title}</span>
              </button>
            ))}
            <span className="lp-tabfill" />
            <button className="lp-btn lp-small" onClick={() => setShowRecForm((v) => !v)}>{showRecForm ? "Close" : "+ Add recording"}</button>
          </div>

          {showRecForm && (
            <div className="lp-rec-form">
              <div className="lp-form-row">
                <input className="lp-input" placeholder="Call title (e.g. Nick — Weekly 1:1)" value={recForm.title}
                  onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} />
                <input className="lp-input lp-date" type="date" value={recForm.rec_date}
                  onChange={(e) => setRecForm({ ...recForm, rec_date: e.target.value })} />
              </div>
              <input className="lp-input" placeholder="Replay / share link (https://…)" value={recForm.link}
                onChange={(e) => setRecForm({ ...recForm, link: e.target.value })} />
              <textarea className="lp-textarea" placeholder="Paste notes, summary, takeaways, action items… any links become clickable."
                value={recForm.notes} onChange={(e) => setRecForm({ ...recForm, notes: e.target.value })} />
              <div className="lp-form-actions">
                <button className="lp-btn" onClick={addRecording}>Save recording</button>
                <button className="lp-btn lp-ghost" onClick={() => { setShowRecForm(false); setRecForm({ title: "", rec_date: "", link: "", notes: "" }); }}>Cancel</button>
              </div>
            </div>
          )}

          {activeRecObj && (
            <article className="lp-rec-card">
              <header className="lp-rec-head">
                <div>
                  <h3>{activeRecObj.title}</h3>
                  <p className="lp-rec-sub"><span className="lp-rec-date">{fmtRecDate(activeRecObj.rec_date) || "No date"}</span></p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {activeRecObj.link
                    ? <a className="lp-btn lp-small lp-watch" href={activeRecObj.link} target="_blank" rel="noopener noreferrer"><span className="lp-tri" /> Watch replay</a>
                    : <span className="lp-btn lp-small lp-watch lp-needs">No replay link</span>}
                  <button className="lp-kill" onClick={() => deleteRecording(activeRecObj.id)} title="Delete recording">Delete</button>
                </div>
              </header>
              <div className="lp-rec-notes lp-md" dangerouslySetInnerHTML={{ __html: mdToHtml(activeRecObj.notes) }} />
            </article>
          )}
          {recsLoaded && recs.length === 0 && <p className="lp-empty">No recordings yet. Add your first with “+ Add recording”.</p>}
        </section>

        {/* Field Notes */}
        <div className="lp-band">
          <h2>Field notes</h2><span className="lp-rule" />
          <span className="lp-note">{notes.length} {notes.length === 1 ? "entry" : "entries"}</span>
        </div>
        <section className="lp-notes">
          <textarea ref={noteRef} className="lp-textarea" placeholder="What did you learn, get handed, or need to ask about? Ctrl+Enter to save."
            value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); addNote(); } }} />
          <div className="lp-tagrow">
            {TAGS.map((t) => (
              <button key={t} className={"lp-chip" + (activeTag === t ? " on" : "")} onClick={() => setActiveTag(activeTag === t ? null : t)}>{t}</button>
            ))}
          </div>
          <div className="lp-actions">
            <button className="lp-btn" onClick={addNote}>Save note</button>
            <span className="lp-hint">Ctrl + Enter</span>
            <span style={{ flex: 1 }} />
            <button className="lp-btn lp-ghost" onClick={copyAll}>Copy all notes</button>
          </div>
          <div className="lp-filters">
            <input className="lp-search" type="search" placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="lp-tagrow" style={{ margin: 0 }}>
              <button className={"lp-chip" + (filterTag === null ? " on" : "")} onClick={() => setFilterTag(null)}>All</button>
              {TAGS.map((t) => (
                <button key={t} className={"lp-chip" + (filterTag === t ? " on" : "")} onClick={() => setFilterTag(t)}>{t}</button>
              ))}
            </div>
          </div>
          <ul className="lp-log">
            {filteredNotes.map((e) => (
              <li key={e.id}>
                <div className="lp-stamp">{stamp(e.created_at)}{e.tag && <div className="lp-tag">{e.tag}</div>}</div>
                <div className="lp-entry-text lp-md" dangerouslySetInnerHTML={{ __html: mdToHtml(e.text) }} />
                <button className="lp-kill" onClick={() => deleteNote(e.id)}>Delete</button>
              </li>
            ))}
          </ul>
          {filteredNotes.length === 0 && (
            <p className="lp-empty">{notes.length === 0 ? "No notes yet. First one can be whatever you just figured out." : "Nothing matches that filter."}</p>
          )}
        </section>

        {/* Reference (collapsed by default) */}
        <div className="lp-band lp-band-btn" onClick={() => setRefOpen((v) => !v)} role="button">
          <h2>Reference {refOpen ? "▲" : "▼"}</h2><span className="lp-rule" />
          <span className="lp-note">{"Week of " + MONTHS[monday.getMonth()].slice(0, 3) + " " + monday.getDate()}</span>
        </div>
        {refOpen && (
          <section className={"lp-workspace" + (expanded ? " lp-expanded" : "")}>
            <div className="lp-tabs">
              {Object.keys(DOCS).map((k) => (
                <button key={k} className={"lp-tab" + (docTab === k ? " on" : "")} onClick={() => setDocTab(k)}>{DOCS[k].label}</button>
              ))}
              <span className="lp-tabfill" />
              <button className="lp-btn lp-ghost lp-small" onClick={() => setExpanded((v) => !v)}>{expanded ? "Collapse" : "Expand"}</button>
              <a className="lp-btn lp-small" href={DOCS[docTab].open} target="_blank" rel="noopener noreferrer">Open to edit</a>
            </div>
            <div className="lp-frame-wrap">
              <iframe title={DOCS[docTab].label} src={DOCS[docTab].frame} loading="lazy" />
            </div>
            <p className="lp-frame-note">Embedded view is read-only — Google blocks editing inside a frame. Use <strong>Open to edit</strong> when you need to change something.</p>
          </section>
        )}

        <footer className="lp-footer">
          <span>One2One — personal launchpad</span>
          <span>Notes & recordings saved to the cloud</span>
        </footer>
      </div>
    </div>
  );
}

function Shortcut({ href, name, meta, kk, glyph, extra }) {
  return (
    <div className="lp-slot">
      <a className="lp-tile" href={href} target="_blank" rel="noopener noreferrer">
        <span className="lp-glyph"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">{glyph}{extra}</svg></span>
        <span className="lp-name">{name}</span>
        <span className="lp-meta">{meta}</span>
        <span className="lp-key">{kk}</span>
      </a>
    </div>
  );
}

const LP_CSS = `
  .lp-root{
    --slate-950:#16201F; --slate-900:#1D2A2C; --slate-800:#2C3B3E; --slate-700:#37494D;
    --slate-600:#485E62; --orange:#E97B26; --brick:#C33B1F; --white:#FFFFFF; --muted:#9DB0B2;
    --chamfer:14px; --lift:7px;
    --display:"Archivo Black","Arial Black",Impact,sans-serif;
    --cond:"Barlow Condensed","Arial Narrow",sans-serif;
    --body:"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif;
    background:var(--slate-900); color:var(--white); font-family:var(--body); min-height:100vh;
  }
  .lp-root *{box-sizing:border-box}
  .lp-topbar{height:14px;background:var(--brick)}
  .lp-wrap{max-width:1120px;margin:0 auto;padding:0 24px 80px}
  .lp-mast{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:36px 0 22px;border-bottom:2px solid var(--slate-700)}
  .lp-lockup{display:flex;flex-direction:column;gap:6px}
  .lp-logo{display:grid;grid-template-columns:auto auto auto;grid-template-rows:auto auto;align-items:center;column-gap:8px}
  .lp-word{font-family:var(--display);font-size:44px;line-height:.86;letter-spacing:-.5px;color:var(--white)}
  .lp-word.l{grid-column:1;grid-row:1;justify-self:end}
  .lp-word.r{grid-column:3;grid-row:1;justify-self:start}
  .lp-sub{font-family:var(--display);font-size:19px;line-height:1;letter-spacing:.5px;color:var(--orange);margin-top:4px}
  .lp-sub.l{grid-column:1;grid-row:2;justify-self:end}
  .lp-sub.r{grid-column:3;grid-row:2;justify-self:start}
  .lp-mark{grid-column:2;grid-row:1 / span 2;position:relative;width:78px;height:88px;display:grid;place-items:center;background:var(--orange);
    clip-path:polygon(20px 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%,0 20px)}
  .lp-mark span{position:relative;font-family:var(--display);font-size:56px;line-height:1;color:var(--slate-800);text-shadow:2px 2px 0 rgba(0,0,0,.18)}
  .lp-tagline{font-family:var(--cond);font-style:italic;font-weight:700;font-size:17px;letter-spacing:1.6px;color:var(--white);border-top:2px solid var(--orange);padding-top:6px;max-width:430px;margin:0}
  .lp-today{text-align:right;padding-bottom:6px}
  .lp-day{font-family:var(--cond);font-weight:700;font-size:30px;letter-spacing:.5px;text-transform:uppercase;line-height:1}
  .lp-date{font-family:var(--cond);font-weight:500;font-size:17px;letter-spacing:2.4px;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .lp-band{display:flex;align-items:center;gap:14px;margin:44px 0 18px}
  .lp-band h2{margin:0;font-family:var(--cond);font-weight:700;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:var(--orange);white-space:nowrap}
  .lp-band .lp-rule{height:2px;background:var(--slate-700);flex:1}
  .lp-band .lp-note{font-family:var(--cond);font-size:15px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);white-space:nowrap}
  .lp-band-btn{cursor:pointer;user-select:none}
  .lp-band-btn:hover h2{color:var(--white)}
  .lp-grid{display:grid;gap:22px}
  .lp-grid.apps{grid-template-columns:repeat(4,1fr)}
  .lp-slot{position:relative}
  .lp-slot::before{content:"";position:absolute;left:var(--lift);top:var(--lift);right:calc(-1 * var(--lift));bottom:calc(-1 * var(--lift));background:var(--brick);
    clip-path:polygon(var(--chamfer) 0,100% 0,100% calc(100% - var(--chamfer)),calc(100% - var(--chamfer)) 100%,0 100%,0 var(--chamfer))}
  .lp-tile{position:relative;display:flex;flex-direction:column;background:var(--slate-800);border-top:3px solid var(--orange);padding:20px;min-height:158px;text-decoration:none;color:var(--white);
    clip-path:polygon(var(--chamfer) 0,100% 0,100% calc(100% - var(--chamfer)),calc(100% - var(--chamfer)) 100%,0 100%,0 var(--chamfer));transition:transform .12s,background .12s}
  .lp-tile:hover{background:var(--slate-700);transform:translate(3px,3px)}
  .lp-glyph{color:var(--orange);margin-bottom:auto}
  .lp-name{font-family:var(--display);font-size:23px;line-height:1.05;letter-spacing:-.3px;margin-top:16px}
  .lp-meta{font-family:var(--cond);font-size:15px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-top:5px}
  .lp-key{position:absolute;top:14px;right:14px;font-family:var(--cond);font-weight:700;font-size:13px;letter-spacing:1px;color:var(--muted);border:2px solid var(--slate-600);padding:1px 7px;min-width:26px;text-align:center}
  .lp-tabs{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}
  .lp-tabfill{flex:1;min-width:0}
  .lp-tab{background:var(--slate-800);border:none;border-top:3px solid var(--slate-600);color:var(--muted);font-family:var(--cond);font-weight:700;font-size:17px;letter-spacing:2px;text-transform:uppercase;padding:11px 18px;cursor:pointer;
    clip-path:polygon(var(--chamfer) 0,100% 0,100% 100%,0 100%,0 var(--chamfer));transition:color .12s,background .12s,border-color .12s}
  .lp-tab:hover{color:var(--white);background:var(--slate-700)}
  .lp-tab.on{background:var(--slate-800);color:var(--white);border-top-color:var(--orange)}
  .lp-rectab{display:flex;flex-direction:column;gap:2px;background:var(--slate-800);border:none;border-top:3px solid var(--slate-600);color:var(--muted);text-align:left;cursor:pointer;padding:10px 20px;
    clip-path:polygon(var(--chamfer) 0,100% 0,100% 100%,0 100%,0 var(--chamfer));transition:color .12s,background .12s,border-color .12s}
  .lp-rectab:hover{background:var(--slate-700);color:var(--white)}
  .lp-rectab.on{color:var(--white);border-top-color:var(--orange)}
  .lp-rectab-date{font-family:var(--display);font-size:16px;line-height:1}
  .lp-rectab-label{font-family:var(--cond);font-size:14px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}
  .lp-rectab.on .lp-rectab-label{color:var(--orange)}
  .lp-rec-card{background:var(--slate-800);border:2px solid var(--slate-700);border-top:none;padding:24px}
  .lp-rec-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;padding-bottom:18px;margin-bottom:20px;border-bottom:2px solid var(--slate-700)}
  .lp-rec-head h3{margin:0;font-family:var(--display);font-size:23px;line-height:1.1}
  .lp-rec-sub{margin:6px 0 0;font-family:var(--cond);font-size:16px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}
  .lp-rec-date{color:var(--orange);font-weight:700}
  .lp-rec-notes{white-space:pre-wrap;word-break:break-word;color:#D5E0E1;line-height:1.6;max-width:80ch}
  .lp-watch{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
  .lp-watch.lp-needs{background:var(--slate-700);color:var(--muted);box-shadow:none;border:2px dashed var(--slate-600);cursor:default}
  .lp-tri{width:0;height:0;border-style:solid;border-width:6px 0 6px 10px;border-color:transparent transparent transparent currentColor}
  .lp-rec-form{background:var(--slate-800);border:2px solid var(--slate-700);border-top:none;padding:18px;display:flex;flex-direction:column;gap:12px}
  .lp-form-row{display:flex;gap:12px;flex-wrap:wrap}
  .lp-form-row .lp-input{flex:1;min-width:200px}
  .lp-form-row .lp-date{flex:0 0 190px}
  .lp-form-actions{display:flex;gap:12px}
  .lp-input{background:var(--slate-900);border:2px solid var(--slate-700);color:var(--white);padding:10px 12px;font-size:15px;font-family:var(--body)}
  .lp-input:focus{border-color:var(--orange);outline:none}
  .lp-textarea{width:100%;min-height:110px;resize:vertical;background:var(--slate-900);border:2px solid var(--slate-700);color:var(--white);padding:12px 14px;font-size:16px;line-height:1.5;font-family:var(--body)}
  .lp-textarea:focus{border-color:var(--orange);outline:none}
  .lp-textarea::placeholder,.lp-input::placeholder{color:#7C9092}
  .lp-notes{position:relative;background:var(--slate-800);border-top:3px solid var(--orange);padding:22px;
    clip-path:polygon(var(--chamfer) 0,100% 0,100% calc(100% - var(--chamfer)),calc(100% - var(--chamfer)) 100%,0 100%,0 var(--chamfer))}
  .lp-tagrow{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
  .lp-chip{font-family:var(--cond);font-weight:600;font-size:14px;letter-spacing:1.6px;text-transform:uppercase;background:transparent;border:2px solid var(--slate-600);color:var(--muted);padding:4px 12px;cursor:pointer;transition:all .12s}
  .lp-chip:hover{border-color:var(--orange);color:var(--white)}
  .lp-chip.on{background:var(--orange);border-color:var(--orange);color:var(--slate-950)}
  .lp-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .lp-btn{font-family:var(--cond);font-weight:700;font-size:16px;letter-spacing:2px;text-transform:uppercase;background:var(--orange);color:var(--slate-950);border:none;padding:9px 20px;cursor:pointer;box-shadow:4px 4px 0 var(--brick);transition:transform .1s,box-shadow .1s;text-decoration:none;display:inline-block}
  .lp-btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--brick)}
  .lp-btn.lp-ghost{background:transparent;color:var(--muted);box-shadow:none;border:2px solid var(--slate-600)}
  .lp-btn.lp-ghost:hover{color:var(--white);border-color:var(--orange);transform:none}
  .lp-btn.lp-small{font-size:14px;letter-spacing:1.6px;padding:7px 14px}
  .lp-hint{font-family:var(--cond);font-size:15px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}
  .lp-filters{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:30px 0 16px;padding-top:22px;border-top:2px solid var(--slate-700)}
  .lp-search{flex:1;min-width:180px;background:var(--slate-900);border:2px solid var(--slate-700);color:var(--white);padding:8px 12px;font-size:15px;font-family:var(--body)}
  .lp-search:focus{border-color:var(--orange);outline:none}
  .lp-log{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
  .lp-log li{display:grid;grid-template-columns:132px 1fr auto;gap:16px;align-items:start;padding:14px 0;border-bottom:1px solid var(--slate-700)}
  .lp-stamp{font-family:var(--cond);font-size:15px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);padding-top:2px}
  .lp-tag{display:inline-block;margin-top:4px;font-weight:700;color:var(--orange);letter-spacing:2px;font-size:13px}
  .lp-entry-text{white-space:pre-wrap;word-break:break-word}
  .lp-kill{background:none;border:none;color:var(--slate-600);cursor:pointer;font-family:var(--cond);font-size:15px;letter-spacing:1.5px;text-transform:uppercase;padding:2px 4px}
  .lp-kill:hover{color:var(--brick)}
  .lp-empty{padding:26px 0 8px;color:var(--muted);font-family:var(--cond);font-size:18px;letter-spacing:1.2px;text-transform:uppercase}
  .lp-link{color:var(--orange);font-weight:600;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word}
  .lp-link:hover{color:var(--white)}
  .lp-md{color:#D5E0E1;line-height:1.6;word-break:break-word}
  .lp-md h1,.lp-md h2,.lp-md h3,.lp-md h4{font-family:var(--cond);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--orange);margin:18px 0 8px;line-height:1.2}
  .lp-md h1{font-size:19px}
  .lp-md h2{font-size:17px}
  .lp-md h3,.lp-md h4{font-size:15px;letter-spacing:2px}
  .lp-md :first-child{margin-top:0}
  .lp-md p{margin:0 0 10px}
  .lp-md strong{color:var(--white);font-weight:700}
  .lp-md em{color:#E8EFF0}
  .lp-md a{color:var(--orange);font-weight:600;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word}
  .lp-md a:hover{color:var(--white)}
  .lp-md ul,.lp-md ol{margin:0 0 12px;padding-left:4px;list-style:none;display:flex;flex-direction:column;gap:8px}
  .lp-md ul li{position:relative;padding-left:22px;line-height:1.5}
  .lp-md ul li::before{content:"";position:absolute;left:0;top:8px;width:8px;height:8px;background:var(--orange);clip-path:polygon(0 0,100% 0,100% 100%)}
  .lp-md ol{counter-reset:mdli}
  .lp-md ol li{position:relative;padding-left:26px;counter-increment:mdli}
  .lp-md ol li::before{content:counter(mdli);position:absolute;left:0;top:0;color:var(--orange);font-family:var(--cond);font-weight:700}
  .lp-md code{background:var(--slate-900);border:1px solid var(--slate-700);padding:1px 5px;font-size:.9em;border-radius:3px}
  .lp-md blockquote{margin:0 0 12px;padding:4px 0 4px 14px;border-left:3px solid var(--orange);color:var(--muted)}
  .lp-md hr{border:none;border-top:2px solid var(--slate-700);margin:16px 0}
  .lp-md table{border-collapse:collapse;width:100%;margin:0 0 14px;font-size:14px}
  .lp-md th,.lp-md td{border:1px solid var(--slate-700);padding:8px 11px;text-align:left;vertical-align:top}
  .lp-md th{background:var(--slate-900);color:var(--orange);font-family:var(--cond);font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:13px}
  .lp-md tr:nth-child(even) td{background:rgba(255,255,255,.02)}
  .lp-md pre{background:var(--slate-900);border:1px solid var(--slate-700);padding:12px;overflow-x:auto;margin:0 0 12px}
  .lp-md pre code{border:none;background:none;padding:0}
  .lp-workspace{position:relative}
  .lp-frame-wrap{background:var(--slate-800);border:2px solid var(--slate-700);border-top:none;padding:10px;height:74vh;min-height:420px}
  .lp-frame-wrap iframe{width:100%;height:100%;border:none;background:var(--slate-900);display:block}
  .lp-frame-note{font-family:var(--cond);font-size:15px;letter-spacing:1.1px;color:var(--muted);margin:10px 0 0;max-width:78ch}
  .lp-frame-note strong{color:var(--orange);font-weight:600}
  .lp-expanded{position:fixed;inset:0;z-index:60;background:var(--slate-900);padding:16px 20px 20px;overflow:auto}
  .lp-expanded .lp-frame-wrap{height:calc(100vh - 132px)}
  .lp-footer{margin-top:56px;padding-top:18px;border-top:2px solid var(--slate-700);font-family:var(--cond);font-size:14px;letter-spacing:2px;text-transform:uppercase;color:var(--slate-600);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
  @media (max-width:900px){.lp-grid.apps{grid-template-columns:repeat(2,1fr)}.lp-word{font-size:36px}.lp-mark{width:64px;height:74px}.lp-mark span{font-size:46px}}
  @media (max-width:620px){.lp-wrap{padding:0 16px 60px}.lp-grid.apps{grid-template-columns:1fr}.lp-today{text-align:left}.lp-log li{grid-template-columns:1fr auto}.lp-stamp{grid-column:1 / -1}.lp-key{display:none}}
`;
