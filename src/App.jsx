import React, { useState, useEffect, useRef } from "react";
import {
  Plus, X, MessageSquare, Calendar as CalIcon, ArrowRight, Download,
  Upload, Search, Trash2, Send, CornerUpLeft, LayoutGrid, List as ListIcon,
  Paperclip, Pencil, Check, BookOpen, Flag, ChevronDown, ChevronRight
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";

const BOARD_ID = "main";

// ---------- Brand tokens ----------
const CHARCOAL = "#2A3A3D";
const ORANGE = "#DD5F2A";
const BG = "#F4F3F1";
const CARD = "#FFFFFF";
const MUTED = "#6B7477";
const HAIR = "#E4E7E7";

const STATUSES = [
  { id: "todo",          label: "To Do",          color: "#8A9497" },
  { id: "inprogress",    label: "In Progress",    color: ORANGE },
  { id: "pending_nick",  label: "Pending · Nick", color: "#46626C" },
  { id: "pending_other", label: "Pending · Other",color: "#C98A1E" },
  { id: "missing",       label: "Missing Info",   color: "#BB4A2E" },
  { id: "done",          label: "Done",           color: "#3E8E5A" },
];
const S = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

const CATEGORIES = {
  calendar: { label: "Calendar",       color: "#46626C" },
  events:   { label: "Cigars & Events",color: ORANGE },
  research: { label: "Research",       color: "#6E8B3D" },
  admin:    { label: "Admin",          color: "#8A9497" },
  personal: { label: "Personal",       color: "#9B6B9E" },
  travel:   { label: "Travel",         color: "#2E8B8B" },
};
const ASSIGNEES = {
  Ashley: { label: "Ashley", color: ORANGE },
  Nick:   { label: "Nick",   color: CHARCOAL },
  Other:  { label: "Other",  color: "#8A9497" },
};
const PRIORITIES = {
  high: { label: "High", color: "#BB4A2E" },
  med:  { label: "Med",  color: "#C98A1E" },
  low:  { label: "Low",  color: "#8A9497" },
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Seed data (from Nick's ORGANIZE list) ----------
const SEED = [
  { title: "Cigar Dinner & Meadia Golf — Aug 27, 5:30pm", category: "events", assignee: "Ashley", status: "todo", priority: "high", due: "2026-08-27",
    notes: "Add to Nick's calendar, mark PRIVATE, and send the invite to Becky. Venue contact: 717-393-9761.", comments: [] },
  { title: "Send out Apollo training deck", category: "admin", assignee: "Ashley", status: "missing", priority: "med", due: "",
    notes: "Send the Apollo training PPT. Waiting on the recipient list and the final file (apollo-training-deck.pptx).",
    comments: [{ text: "Q for Nick: who receives this, and where's the current file?", author: "Ashley" }] },
  { title: "Confirm recurring check-ins are set", category: "calendar", assignee: "Ashley", status: "inprogress", priority: "med", due: "",
    notes: "Mon ~9:15–9:30 and Fri 12:30 between Nick and me. Send Nick the calendar invites to lock them in.", comments: [] },
  { title: "Confirm Nick is open Mon Sep 21, 9:30–11am", category: "calendar", assignee: "Ashley", status: "todo", priority: "med", due: "2026-09-21",
    notes: "For the Beka sales group. Verify no conflict, then confirm.", comments: [] },
  { title: "Pull Pax8 AI Bootcamp dates + location", category: "research", assignee: "Ashley", status: "todo", priority: "med", due: "",
    notes: "Get the full schedule of dates and the location. Source: Pax8 AI Bootcamp (attend.pax8.com, Aug 2026 event).", comments: [] },
  { title: "Move Houck Leadership Meeting to right after L10", category: "calendar", assignee: "Nick", status: "pending_nick", priority: "med", due: "",
    notes: "Adjust the recurring Houck Leadership Meeting to immediately after the weekly L10. Contact: Mike Signor <msignor@houcks.com>.",
    comments: [{ text: "Q for Nick: what time does the L10 wrap each week so I can slot this right after?", author: "Ashley" }] },
  { title: "Joe Seibert golf — September dates", category: "events", assignee: "Other", status: "pending_other", priority: "high", due: "2026-09-03",
    notes: "Reschedule golf. Joe Seibert — jseibert4222@gmail.com · 717-571-5834. (Consolidates the two Joe Seibert entries on Nick's list.)",
    comments: [{ text: "Sent Sep 3 (Thu) to the group on 8/14, plus a quick correction that Sep 3 is a Thursday. Awaiting their confirmation.", author: "Ashley" }] },
  { title: "Cigar Dinner @ Hamilton Club — Sept 15", category: "events", assignee: "Ashley", status: "missing", priority: "med", due: "2026-09-15",
    notes: "Book the room and invite Pat (AQ) and Chris Jaan.",
    comments: [{ text: "Q for Nick: contact details for Pat (AQ) and Chris Jaan?", author: "Ashley" }] },
  { title: "Send event details to guests — before Fri Aug 21", category: "events", assignee: "Ashley", status: "missing", priority: "high", due: "2026-08-21",
    notes: "Send details to: Scott Hess 717.572.3561 · Nicholas Paulukow · Stephen Saudarg 717.725.0433 · Andy Rummel (O2O).",
    comments: [{ text: "Q for Nick: which event are these guest details for? Time-sensitive — due before next Friday.", author: "Ashley" }] },
  { title: "Create VCIO services survey → send to Trever", category: "research", assignee: "Ashley", status: "missing", priority: "med", due: "",
    notes: "Build a survey from the source email on VCIO services and send it to Trever.",
    comments: [{ text: "Q for Nick: point me to the VCIO services email to build the survey from.", author: "Ashley" }] },
  { title: "Book VCIO meeting w/ Trever (Kinshimpt)", category: "calendar", assignee: "Ashley", status: "missing", priority: "med", due: "",
    notes: "Reschedule the VCIO meeting with Trever from Kinshimpt.",
    comments: [{ text: "Q for Nick: Trever's email / contact info?", author: "Ashley" }] },
  { title: "Monthly meeting w/ Sarah Hall + team", category: "calendar", assignee: "Ashley", status: "todo", priority: "med", due: "",
    notes: "Set up a recurring monthly meeting. Sarah Hall <sarah@juiceboxops.com>.", comments: [] },
  { title: "Cigars w/ Jeremy Blount — Hamilton Club", category: "events", assignee: "Ashley", status: "todo", priority: "low", due: "",
    notes: "Book cigars at the Hamilton Club. Jeremy Blount — blount24@gmail.com.",
    comments: [{ text: "https://bookings.cloud.microsoft/bookwithme/user/6ee8953234604c06a36d56b41b998632%40gcmbuilt.com/meetingtype/k5jixxYKZECf5oULo2r8dw2?anonymous&ismsaljsauthenabled=true", author: "Ashley" }] },
  { title: "Onsite lunch w/ Tim Haak — Affiliate program", category: "calendar", assignee: "Ashley", status: "pending_nick", priority: "med", due: "",
    notes: "Book an onsite lunch + chat about the Affiliate program at the O2O office. List note reads 'Miles 6' (likely a location).",
    comments: [{ text: "Q for Nick: is 'Miles' (Veth Group) a separate meeting, or is that THIS Tim Haak lunch? Want to confirm before sending anything.", author: "Ashley" }] },
  { title: "Find new Primary Care — Penn, Centerville PA", category: "personal", assignee: "Nick", status: "pending_nick", priority: "low", due: "",
    notes: "Penn/LG Health options near Centerville Rd, Lancaster (17603):\n1. Family Medicine Centerville (in-person) — 175 S Centerville Rd · 717-299-4644 · Mon–Thu 8–8, Fri 8–5, Sat 8–12\n2. Virtual Primary Care Centerville — same address · 717-627-7696 · Dr. Jiefu Yuan accepting new patients\nI'd recommend in-person for a primary-care home base. New-patient scheduling: pennmedicine.org/get-care.",
    comments: [{ text: "I need from you: in-person vs. virtual preference + your DOB/insurance to book (or you can self-schedule at pennmedicine.org/get-care).", author: "Ashley" }] },
  { title: "Dinner w/ Kevin Weaver", category: "events", assignee: "Ashley", status: "missing", priority: "low", due: "",
    notes: "Book dinner with Kevin Weaver.",
    comments: [{ text: "Q for Nick: Kevin's contact + any date preference?", author: "Ashley" }] },
  { title: "Cigars & Hamilton Club w/ Brett Jackson", category: "events", assignee: "Ashley", status: "missing", priority: "low", due: "",
    notes: "Book cigars at the Hamilton Club with Brett Jackson.",
    comments: [{ text: "Q for Nick: Brett Jackson's contact?", author: "Ashley" }] },
  { title: "Get Malta dates on the calendar", category: "travel", assignee: "Nick", status: "pending_nick", priority: "med", due: "",
    notes: "Add the Malta trip dates to the calendar.",
    comments: [{ text: "Q for Nick: what are the Malta dates?", author: "Ashley" }] },
  { title: "Miles / Veth Group — 30-min intro", category: "calendar", assignee: "Ashley", status: "pending_nick", priority: "low", due: "",
    notes: "Nick's verbal ask: 30-min meeting with Miles (Veth Group) in the next couple weeks, low priority. Existing email thread in Nick's inbox.",
    comments: [{ text: "Draft ready. Holding until the Miles vs. Tim-Haak question is resolved and times are chosen from the cleaned-up calendar.", author: "Ashley" }] },
  { title: "Beach house shared calendar", category: "personal", assignee: "Nick", status: "pending_nick", priority: "low", due: "",
    notes: "Emailed Nick the iCloud shared-calendar solution + setup steps so the family can track who's at the house.",
    comments: [{ text: "Draft sent. Google Calendar fallback ready if anyone isn't on iCloud.", author: "Ashley" }] },
].map((t) => ({ id: uid(), createdAt: Date.now(), ...t }));


// ---------- Reference: Nick's cadence (from the HAND OFF sheet) ----------
const REF_CHECKINS = [
  { label: "Monday check-in", detail: "~9:15–9:30 am · Nick ↔ Ashley" },
  { label: "Friday check-in", detail: "12:30 pm · Nick ↔ Ashley" },
];
const REF_MEETINGS = [
  { n: 1,  title: "Vistage", cadence: "Monthly" },
  { n: 2,  title: "Vistage Chair Meeting", cadence: "Recurring" },
  { n: 3,  title: "Evolve", cadence: "Quarterly", note: "3 days, with travel" },
  { n: 4,  title: "Employee stand-up", cadence: "Weekly · Mon 8am" },
  { n: 5,  title: "L10 — Monday Sales & Marketing", cadence: "Weekly · Mon", prep: "1 hr prep" },
  { n: 6,  title: "L10 — Tuesday management meeting", cadence: "Weekly · Tue", prep: "1 hr prep" },
  { n: 7,  title: "L10 — Houck", cadence: "Weekly · Wed", prep: "1 hr prep" },
  { n: 8,  title: "L10 — LearnQuest", cadence: "Weekly · Wed", prep: "1 hr prep" },
  { n: 9,  title: "L10 — Friday Executive leadership", cadence: "Weekly · Fri", prep: "Prep" },
  { n: 10, title: "Staff Meeting", cadence: "Monthly", prep: "Prep" },
  { n: 11, title: "Executive session", cadence: "Quarterly", note: "1 full day" },
  { n: 12, title: "Q4 full session", cadence: "Q4", note: "2 days" },
];

const isUrl = (s) => /^https?:\/\//i.test(s);
function linkify(text) {
  return String(text).split(/(https?:\/\/[^\s]+)/gi).map((part, i) =>
    isUrl(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="clink">{part}</a>
      : <span key={i}>{part}</span>
  );
}

function CommentBadge({ count, big }) {
  if (!count) return null;
  const z = big ? { pad: "4px 9px", font: 13, icon: 15 } : { pad: "3px 8px", font: 12.5, icon: 14 };
  return (
    <span title={count + " open note" + (count > 1 ? "s" : "")}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: ORANGE, color: "#fff",
        borderRadius: 20, padding: z.pad, fontSize: z.font, fontWeight: 800, lineHeight: 1,
        boxShadow: "0 1px 3px rgba(221,95,42,.4)" }}>
      <MessageSquare size={z.icon} strokeWidth={2.5} /> {count}
    </span>
  );
}

export default function CommandCenter() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("board");
  const [editingId, setEditingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [fAssignee, setFAssignee] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due");   // "task" | "owner" | "status" | "priority" | "due" | "added"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"
  const [doneCollapsed, setDoneCollapsed] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const fileRef = useRef(null);
  const [saveState, setSaveState] = useState("saved"); // "saved" | "saving" | "error"
  const saveTimer = useRef(null);

  // Load the board from Supabase (seed it on first run)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("boards").select("data").eq("id", BOARD_ID).maybeSingle();
        if (error) throw error;
        if (data && Array.isArray(data.data) && data.data.length) {
          setTasks(data.data);
        } else {
          setTasks(SEED);
          await supabase.from("boards").upsert({ id: BOARD_ID, data: SEED, updated_at: new Date().toISOString() });
        }
      } catch (e) {
        console.error("Load failed:", e);
        setTasks(SEED); // in-memory fallback so the app still works
        setSaveState("error");
      }
      setLoaded(true);
    })();
  }, []);

  // Save to Supabase — debounced, and never mid-drag
  useEffect(() => {
    if (!loaded || draggedId) return;
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from("boards").upsert({ id: BOARD_ID, data: tasks, updated_at: new Date().toISOString() });
        if (error) throw error;
        setSaveState("saved");
      } catch (e) {
        console.error("Save failed:", e);
        setSaveState("error");
      }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [tasks, loaded, draggedId]);

  const patch = (id, changes) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  const remove = (id) => { setTasks((ts) => ts.filter((t) => t.id !== id)); setEditingId(null); };
  const toggleUrgent = (id) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, urgent: !t.urgent } : t)));

  // Move dragged card to sit before/after a target card. adoptStatus=true also changes its column.
  const reorderTo = (dragId, targetId, after, adoptStatus) => {
    if (!dragId || dragId === targetId) return;
    setTasks((ts) => {
      const arr = [...ts];
      const from = arr.findIndex((t) => t.id === dragId);
      if (from < 0) return ts;
      const target = arr.find((t) => t.id === targetId);
      const [item] = arr.splice(from, 1);
      const moved = adoptStatus && target ? { ...item, status: target.status } : item;
      let to = arr.findIndex((t) => t.id === targetId);
      if (to < 0) to = arr.length; else to = after ? to + 1 : to;
      arr.splice(to, 0, moved);
      return arr;
    });
  };
  // Send dragged card to the end of a column (dropping on empty column space).
  const moveToEnd = (dragId, status) => {
    setTasks((ts) => {
      const arr = [...ts];
      const from = arr.findIndex((t) => t.id === dragId);
      if (from < 0) return ts;
      const [item] = arr.splice(from, 1);
      arr.push({ ...item, status });
      return arr;
    });
  };
  const addTask = (status = "todo") => {
    const t = { id: uid(), createdAt: Date.now(), title: "", notes: "", status,
      assignee: "Ashley", category: "calendar", priority: "med", due: "", urgent: false, comments: [] };
    setTasks((ts) => [t, ...ts]); setEditingId(t.id);
  };
  const passToNick = (id) => patch(id, { assignee: "Nick", status: "pending_nick" });
  const addComment = (id, text, attachment) => {
    if (!(text && text.trim()) && !attachment) return;
    setTasks((ts) => ts.map((t) => t.id === id
      ? { ...t, comments: [...(t.comments || []), { text: (text || "").trim(), attachment: attachment || null, author: "Ashley", ts: Date.now() }] } : t));
  };
  const updateComment = (id, idx, text) =>
    setTasks((ts) => ts.map((t) => t.id === id
      ? { ...t, comments: (t.comments || []).map((c, i) => (i === idx ? { ...c, text } : c)) } : t));
  const deleteComment = (id, idx) =>
    setTasks((ts) => ts.map((t) => t.id === id
      ? { ...t, comments: (t.comments || []).filter((_, i) => i !== idx) } : t));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "ea-command-center-backup.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (Array.isArray(d)) setTasks(d); } catch {} };
    r.readAsText(file); e.target.value = "";
  };

  const visible = tasks.filter((t) =>
    (fAssignee === "all" || t.assignee === fAssignee) &&
    (fCategory === "all" || t.category === fCategory) &&
    (search === "" || (t.title + " " + t.notes).toLowerCase().includes(search.toLowerCase())));

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const openQ = tasks.reduce((n, t) => n + (t.comments?.length || 0), 0);
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const editing = tasks.find((t) => t.id === editingId);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (t) => t.due && t.status !== "done" && new Date(t.due) < today;
  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const fmtStamp = (ms) => ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

  // Board column ordering: urgent first, then soonest due, then first created.
  const boardSort = (a, b) => {
    if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
    const ad = a.due ? new Date(a.due).getTime() : Infinity;
    const bd = b.due ? new Date(b.due).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (a.createdAt || 0) - (b.createdAt || 0);
  };

  // Sorted copy for List view. Empty due dates sort to the bottom.
  const STATUS_ORDER = STATUSES.reduce((m, s, i) => ((m[s.id] = i), m), {});
  const PRIO_ORDER = { high: 0, med: 1, low: 2 };
  const sortVal = (t) => {
    switch (sortBy) {
      case "task": return (t.title || "").toLowerCase();
      case "owner": return t.assignee || "";
      case "status": return STATUS_ORDER[t.status] ?? 99;
      case "priority": return PRIO_ORDER[t.priority] ?? 9;
      case "added": return t.createdAt || 0;
      case "due":
      default: return t.due ? new Date(t.due).getTime() : Infinity; // no due date -> bottom
    }
  };
  const visibleSorted = [...visible].sort((a, b) => {
    const av = sortVal(a), bv = sortVal(b);
    let cmp = av < bv ? -1 : av > bv ? 1 : 0;
    if (cmp === 0) { // secondary sort: oldest added first
      cmp = (a.createdAt || 0) - (b.createdAt || 0);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };
  const sortArrow = (col) => (sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: CHARCOAL }}>
      <style>{styleSheet}</style>

      {/* Header */}
      <div style={{ background: CHARCOAL, padding: "18px 22px 20px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>ONE</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: ORANGE }}>2</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>ONE</span>
              <span style={{ marginLeft: 12, fontSize: 11, letterSpacing: "3px", color: "#9DA6A8", textTransform: "uppercase", fontWeight: 600 }}>
                EA Command Center
              </span>
            </div>
            <div style={{ color: "#9DA6A8", fontSize: 12.5, marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>{tasks.length} tasks · {doneCount} done · <span style={{ color: ORANGE, fontWeight: 700 }}>{openQ} open notes</span></span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700,
                color: saveState === "error" ? "#E08A7A" : saveState === "saving" ? "#C9B27A" : "#7FB08A" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: saveState === "error" ? "#C0392B" : saveState === "saving" ? "#C98A1E" : "#3E8E5A" }} />
                {saveState === "error" ? "Save error — check connection" : saveState === "saving" ? "Saving…" : "Saved to cloud"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link to="/" className="ghost-btn" style={{ textDecoration: "none" }} title="Back to Launchpad">← Launchpad</Link>
            <div className="toggle">
              <button className={"tog " + (view === "board" ? "on" : "")} onClick={() => setView("board")}><LayoutGrid size={14} /> Board</button>
              <button className={"tog " + (view === "open" ? "on" : "")} onClick={() => setView("open")}><ListIcon size={14} /> Open Tasks</button>
              <button className={"tog " + (view === "completed" ? "on" : "")} onClick={() => setView("completed")}><Check size={14} /> Completed</button>
              <button className={"tog " + (view === "ref" ? "on" : "")} onClick={() => setView("ref")}><BookOpen size={14} /> Reference</button>
            </div>
            <button className="ghost-btn" onClick={exportJSON} title="Download a backup"><Download size={15} /></button>
            <button className="ghost-btn" onClick={() => fileRef.current?.click()} title="Restore from backup"><Upload size={15} /></button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
            <button className="add-btn" onClick={() => addTask("todo")}><Plus size={16} /> New task</button>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 5, background: "#3B4C4F", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: ORANGE, transition: "width .4s" }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, padding: "14px 22px 6px", flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-wrap">
          <Search size={14} color={MUTED} />
          <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
        </div>
        <Filter label="Owner" value={fAssignee} onChange={setFAssignee}
          options={[["all", "Everyone"], ...Object.keys(ASSIGNEES).map((k) => [k, ASSIGNEES[k].label])]} />
        <Filter label="Category" value={fCategory} onChange={setFCategory}
          options={[["all", "All"], ...Object.keys(CATEGORIES).map((k) => [k, CATEGORIES[k].label])]} />
        {(fAssignee !== "all" || fCategory !== "all" || search) && (
          <button className="clear-btn" onClick={() => { setFAssignee("all"); setFCategory("all"); setSearch(""); }}>Clear</button>
        )}
        {view === "board" && (
          <button className="collapse-all" onClick={() => setCardsCollapsed((v) => !v)} style={{ marginLeft: "auto" }}>
            {cardsCollapsed ? "⤢ Expand all" : "⤡ Collapse all"}
          </button>
        )}
      </div>

      {/* ---------- BOARD VIEW ---------- */}
      {view === "board" && (
        <div className="board">
          {STATUSES.map((col) => {
            const items = visible.filter((t) => t.status === col.id).sort(boardSort);
            return (
              <div key={col.id} className={"column" + (dragOverCol === col.id ? " over" : "")}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
                onDrop={() => { if (draggedId) patch(draggedId, { status: col.id }); setDraggedId(null); setDragOverCol(null); }}>
                <div className="col-head" style={col.id === "done" ? { background: "#BFDDC8" } : undefined}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: ".4px", textTransform: "uppercase" }}>{col.label}</span>
                    <span style={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>{items.length}</span>
                  </div>
                  {col.id === "done" ? (
                    <button className="col-add" onClick={() => setDoneCollapsed((v) => !v)} title={doneCollapsed ? "Show done" : "Hide done"}>
                      {doneCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </button>
                  ) : (
                    <button className="col-add" onClick={() => addTask(col.id)} title="Add here"><Plus size={14} /></button>
                  )}
                </div>
                {!(col.id === "done" && doneCollapsed) && (
                <div className="col-body">
                  {items.map((t) => (
                    <div key={t.id} className={"card" + (cardsCollapsed ? " collapsed" : "")} draggable
                      onDragStart={() => setDraggedId(t.id)} onDragEnd={() => setDraggedId(null)}
                      onClick={() => setEditingId(t.id)}
                      style={{
                        background: t.status === "done" ? "#CFE6D6" : CARD,
                        border: t.urgent ? "1.5px solid #C0392B" : `1px solid ${HAIR}`,
                        borderLeft: `3px solid ${CATEGORIES[t.category].color}`,
                        boxShadow: t.urgent
                          ? "0 0 0 2px rgba(192,57,43,.30), 0 1px 2px rgba(42,58,61,.05)"
                          : (t.comments?.length ? "0 0 0 1.5px rgba(221,95,42,.35), 0 1px 2px rgba(42,58,61,.05)" : "0 1px 2px rgba(42,58,61,.05)") }}>

                      {cardsCollapsed ? (
                        /* ---- Collapsed: name + due + urgent only ---- */
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {t.urgent && <Flag size={12} strokeWidth={2.6} color="#C0392B" style={{ flexShrink: 0 }} />}
                          <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{t.title || "Untitled task"}</span>
                          {t.due && (
                            <span style={{ fontSize: 11.5, fontWeight: isOverdue(t) ? 700 : 500, color: isOverdue(t) ? "#BB4A2E" : MUTED, whiteSpace: "nowrap", flexShrink: 0 }}>
                              {fmtDate(t.due)}
                            </span>
                          )}
                        </div>
                      ) : (
                        /* ---- Expanded: full card ---- */
                        <>
                          {t.comments?.length > 0 && (
                            <div style={{ position: "absolute", top: -9, right: -6 }}><CommentBadge count={t.comments.length} big /></div>
                          )}
                          {t.urgent && (
                            <span className="urgent-pill"><Flag size={11} strokeWidth={2.6} /> URGENT</span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35, paddingRight: t.comments?.length ? 34 : 0, display: "block", marginTop: t.urgent ? 6 : 0 }}>
                            {t.title || "Untitled task"}
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9, alignItems: "center" }}>
                            <span className="chip" style={{ color: CATEGORIES[t.category].color, borderColor: CATEGORIES[t.category].color + "44" }}>
                              {CATEGORIES[t.category].label}
                            </span>
                            <span className="pri-dot" style={{ background: PRIORITIES[t.priority].color }} title={PRIORITIES[t.priority].label + " priority"} />
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, fontSize: 11, color: MUTED }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3, color: isOverdue(t) ? "#BB4A2E" : MUTED, fontWeight: isOverdue(t) ? 700 : 500 }}>
                              <CalIcon size={11} /> Due {t.due ? fmtDate(t.due) : "—"}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              Added {fmtStamp(t.createdAt)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11, gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span className="avatar" style={{ background: ASSIGNEES[t.assignee].color }}>{t.assignee[0]}</span>
                              <button className={"flag-btn" + (t.urgent ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleUrgent(t.id); }}
                                title={t.urgent ? "Remove urgent" : "Mark urgent"}><Flag size={13} /></button>
                            </div>
                            <select className="card-status-sel" value={t.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { e.stopPropagation(); patch(t.id, { status: e.target.value }); }}
                              style={{ color: S(t.status).color, borderColor: S(t.status).color + "66", background: S(t.status).color + "12" }}>
                              {STATUSES.map((s) => <option key={s.id} value={s.id} style={{ color: CHARCOAL }}>{s.label}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && <div className="empty">Drop tasks here</div>}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- LIST VIEW (Open Tasks / Completed) ---------- */}
      {(view === "open" || view === "completed") && (
        <div style={{ padding: "10px 22px 44px" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" style={{ minWidth: 260 }} onClick={() => toggleSort("task")}>Task{sortArrow("task")}</th>
                  <th className="sortable" onClick={() => toggleSort("owner")}>Owner{sortArrow("owner")}</th>
                  <th className="sortable" style={{ minWidth: 150 }} onClick={() => toggleSort("status")}>Status{sortArrow("status")}</th>
                  <th className="sortable" onClick={() => toggleSort("priority")}>Priority{sortArrow("priority")}</th>
                  <th className="sortable" onClick={() => toggleSort("due")}>Due{sortArrow("due")}</th>
                  <th className="sortable" onClick={() => toggleSort("added")}>Added{sortArrow("added")}</th>
                  <th style={{ textAlign: "center" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {visibleSorted.filter((t) => (view === "completed" ? t.status === "done" : t.status !== "done")).map((t) => (
                  <tr key={t.id} draggable
                    onDragStart={() => setDraggedId(t.id)} onDragEnd={() => setDraggedId(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      reorderTo(draggedId, t.id, e.clientY - r.top > r.height / 2, false);
                    }}
                    onClick={() => setEditingId(t.id)}
                    style={t.urgent ? { background: "#FCF0EE" } : undefined}>
                    <td>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                        <span style={{ width: 4, alignSelf: "stretch", minHeight: 20, borderRadius: 3, background: t.urgent ? "#C0392B" : CATEGORIES[t.category].color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
                            {t.urgent && <span className="urgent-pill sm"><Flag size={10} strokeWidth={2.6} /> URGENT</span>}
                            {t.title || "Untitled task"}
                          </div>
                          <span className="chip" style={{ marginTop: 5, display: "inline-block", color: CATEGORIES[t.category].color, borderColor: CATEGORIES[t.category].color + "44" }}>
                            {CATEGORIES[t.category].label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className="cell-sel" value={t.assignee} onChange={(e) => patch(t.id, { assignee: e.target.value })}
                        style={{ color: ASSIGNEES[t.assignee].color, fontWeight: 600 }}>
                        {Object.keys(ASSIGNEES).map((k) => <option key={k} value={k}>{ASSIGNEES[k].label}</option>)}
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className="cell-sel status-sel" value={t.status} onChange={(e) => patch(t.id, { status: e.target.value })}
                        style={{ color: S(t.status).color, fontWeight: 700, borderColor: S(t.status).color + "55", background: S(t.status).color + "12" }}>
                        {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className="cell-sel" value={t.priority} onChange={(e) => patch(t.id, { priority: e.target.value })}
                        style={{ color: PRIORITIES[t.priority].color, fontWeight: 700 }}>
                        {Object.keys(PRIORITIES).map((k) => <option key={k} value={k}>{PRIORITIES[k].label}</option>)}
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="date" className="cell-sel" value={t.due || ""} onChange={(e) => patch(t.id, { due: e.target.value })}
                        style={{ color: isOverdue(t) ? "#BB4A2E" : (t.due ? CHARCOAL : MUTED), fontWeight: isOverdue(t) ? 700 : 500 }} />
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, color: MUTED, whiteSpace: "nowrap" }}>{fmtStamp(t.createdAt)}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {t.comments?.length ? <CommentBadge count={t.comments.length} big /> : <span style={{ color: "#C4CACB" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleSorted.filter((t) => (view === "completed" ? t.status === "done" : t.status !== "done")).length === 0 && (
              <div style={{ textAlign: "center", color: MUTED, padding: 30 }}>
                {view === "completed" ? "No completed tasks yet." : "No open tasks — nice work."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- REFERENCE VIEW ---------- */}
      {view === "ref" && (
        <div style={{ padding: "12px 22px 44px", maxWidth: 820 }}>
          <div className="ref-card">
            <div className="ref-head">Your check-ins with Nick</div>
            {REF_CHECKINS.map((c, i) => (
              <div key={i} className="ref-row">
                <span className="ref-title">{c.label}</span>
                <span style={{ color: MUTED, fontSize: 13 }}>{c.detail}</span>
              </div>
            ))}
          </div>

          <div className="ref-card">
            <div className="ref-head">Nick's recurring meetings</div>
            {REF_MEETINGS.map((m) => (
              <div key={m.n} className="ref-row">
                <span className="ref-num">{m.n}</span>
                <span className="ref-title" style={{ flex: 1 }}>
                  {m.title}
                  {m.note && <span style={{ color: MUTED, fontWeight: 400, fontSize: 12.5 }}> — {m.note}</span>}
                </span>
                {m.cadence && <span className="ref-chip cad">{m.cadence}</span>}
                {m.prep && <span className="ref-chip prep">{m.prep}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Detail editor ---------- */}
      {editing && (
        <div className="overlay" onClick={() => setEditingId(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <textarea className="title-input" value={editing.title} placeholder="Task title" rows={1}
                ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                onChange={(e) => { patch(editing.id, { title: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                autoFocus={!editing.title} />
              <button className="icon-btn" onClick={() => setEditingId(null)}><X size={18} /></button>
            </div>
            <div className="field-grid">
              <Field label="Status">
                <select className="sel" value={editing.status} onChange={(e) => patch(editing.id, { status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <select className="sel" value={editing.assignee} onChange={(e) => patch(editing.id, { assignee: e.target.value })}>
                  {Object.keys(ASSIGNEES).map((k) => <option key={k} value={k}>{ASSIGNEES[k].label}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className="sel" value={editing.category} onChange={(e) => patch(editing.id, { category: e.target.value })}>
                  {Object.keys(CATEGORIES).map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className="sel" value={editing.priority} onChange={(e) => patch(editing.id, { priority: e.target.value })}>
                  {Object.keys(PRIORITIES).map((k) => <option key={k} value={k}>{PRIORITIES[k].label}</option>)}
                </select>
              </Field>
              <Field label="Due date">
                <input type="date" className="sel" value={editing.due} onChange={(e) => patch(editing.id, { due: e.target.value })} />
              </Field>
            </div>
            <button className={"urgent-toggle" + (editing.urgent ? " on" : "")} onClick={() => toggleUrgent(editing.id)}>
              <Flag size={15} strokeWidth={2.4} /> {editing.urgent ? "Urgent — click to clear" : "Mark as urgent"}
            </button>
            <div style={{ marginTop: 14 }}>
              <label className="flabel">Notes</label>
              <textarea className="notes" value={editing.notes} placeholder="Details, context, links…"
                onChange={(e) => patch(editing.id, { notes: e.target.value })} />
            </div>
            {editing.assignee !== "Nick" && (
              <button className="pass-wide" onClick={() => passToNick(editing.id)}>
                <CornerUpLeft size={15} /> Pass this back to Nick
              </button>
            )}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <label className="flabel" style={{ margin: 0 }}>Comments & questions</label>
                <CommentBadge count={(editing.comments || []).length} />
              </div>
              <div className="comments">
                {(editing.comments || []).map((c, i) => (
                  <CommentItem key={i} c={c}
                    onSave={(text) => updateComment(editing.id, i, text)}
                    onDelete={() => deleteComment(editing.id, i)} />
                ))}
                {(editing.comments || []).length === 0 && <div style={{ fontSize: 12.5, color: MUTED, padding: "4px 2px" }}>No comments yet.</div>}
              </div>
              <CommentBox
                onSend={(text) => addComment(editing.id, text)}
                onAttach={(att) => addComment(editing.id, "", att)} />
            </div>
            <div className="sheet-foot">
              <button className="del-btn" onClick={() => remove(editing.id)}><Trash2 size={14} /> Delete task</button>
              <button className="done-btn" onClick={() => setEditingId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label className="flabel">{label}</label>{children}</div>);
}
function Filter({ label, value, onChange, options }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", color: MUTED, fontWeight: 600 }}>{label}</span>
    <select className="sel small" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select></div>);
}
function Attachment({ att }) {
  if (!att) return null;
  const isImg = att.type && att.type.startsWith("image/");
  if (isImg) {
    return (
      <a href={att.dataUrl} target="_blank" rel="noopener noreferrer" download={att.name} style={{ display: "block", marginTop: 6 }}>
        <img src={att.dataUrl} alt={att.name} style={{ maxWidth: "100%", maxHeight: 190, borderRadius: 8, border: "1px solid " + HAIR, display: "block" }} />
      </a>
    );
  }
  return (
    <a href={att.dataUrl} download={att.name} className="attach-chip">
      <Paperclip size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
    </a>
  );
}

function CommentItem({ c, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(c.text);
  return (
    <div className="comment">
      <span className="avatar sm" style={{ background: ASSIGNEES[c.author]?.color || ORANGE }}>{(c.author || "A")[0]}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea className="edit-area" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="mini save" onClick={() => { onSave(val); setEditing(false); }}><Check size={12} /> Save</button>
              <button className="mini" onClick={() => { setVal(c.text); setEditing(false); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {c.text && <div style={{ fontSize: 13, lineHeight: 1.4, overflowWrap: "anywhere", wordBreak: "break-word" }}>{linkify(c.text)}</div>}
            <Attachment att={c.attachment} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              {c.ts && <span style={{ fontSize: 10.5, color: MUTED }}>
                {new Date(c.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
              <span className="row-actions">
                {c.text != null && <button className="cbtn" onClick={() => setEditing(true)} title="Edit"><Pencil size={12} /></button>}
                <button className="cbtn del" onClick={onDelete} title="Delete"><Trash2 size={12} /></button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const MAX_ATTACH = 600 * 1024; // 600 KB per file (storage is text-only)

function CommentBox({ onSend, onAttach }) {
  const [v, setV] = useState("");
  const [warn, setWarn] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const takeFile = (file) => {
    if (!file) return;
    if (file.size > MAX_ATTACH) {
      setWarn(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — too large to store here. Keep files under 600 KB, or paste a link (SharePoint/Drive) instead.`);
      return;
    }
    setWarn("");
    const r = new FileReader();
    r.onload = () => onAttach({ name: file.name, type: file.type, size: file.size, dataUrl: r.result });
    r.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      takeFile(e.dataTransfer.files[0]);
    } else {
      const text = e.dataTransfer.getData("text");
      if (text) setV((p) => (p ? p + " " : "") + text);
    }
  };

  return (
    <div>
      {warn && (
        <div className="warn">{warn} <button onClick={() => setWarn("")}><X size={12} /></button></div>
      )}
      <div className={"drop-row" + (drag ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)} onDrop={onDrop}>
        <button className="attach-btn" onClick={() => fileRef.current?.click()} title="Attach a file"><Paperclip size={16} /></button>
        <input ref={fileRef} type="file" style={{ display: "none" }}
          onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input className="cinput" placeholder={drag ? "Drop it here…" : "Add a note, link, or drop a file…"} value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onSend(v); setV(""); } }} />
        <button className="csend" onClick={() => { onSend(v); setV(""); }}><Send size={15} /></button>
      </div>
    </div>
  );
}

const styleSheet = `
  * { box-sizing: border-box; }
  .add-btn { display:flex; align-items:center; gap:6px; background:${ORANGE}; color:#fff; border:none;
    padding:8px 14px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; }
  .add-btn:hover { filter:brightness(1.07); }
  .ghost-btn { display:flex; align-items:center; gap:5px; background:transparent; color:#C7CDCE;
    border:1px solid #47585B; padding:7px 9px; border-radius:8px; font-size:12.5px; cursor:pointer; }
  .ghost-btn:hover { background:#33454880; color:#fff; }
  .toggle { display:flex; background:#33454B; border-radius:8px; padding:3px; gap:3px; }
  .tog { display:flex; align-items:center; gap:5px; background:transparent; color:#B4BCBD; border:none;
    padding:6px 11px; border-radius:6px; font-size:12.5px; font-weight:600; cursor:pointer; }
  .tog.on { background:${ORANGE}; color:#fff; }
  .search-wrap { display:flex; align-items:center; gap:6px; background:#fff; border:1px solid ${HAIR}; border-radius:8px; padding:7px 11px; }
  .search-input { border:none; outline:none; font-size:13px; width:170px; color:${CHARCOAL}; background:transparent; }
  .sel { background:#fff; border:1px solid ${HAIR}; border-radius:8px; padding:8px 10px; font-size:13px; color:${CHARCOAL}; outline:none; cursor:pointer; font-family:inherit; }
  .sel:focus { border-color:${ORANGE}; }
  .sel.small { padding:6px 8px; font-size:12.5px; }
  .clear-btn { background:transparent; border:none; color:${ORANGE}; font-size:12.5px; cursor:pointer; font-weight:600; }

  .board { display:flex; gap:14px; padding:16px 22px 40px; overflow-x:auto; align-items:flex-start; background:#2A3A3D; min-height:calc(100vh - 150px); }
  .column { background:#ECEEED; border-radius:12px; min-width:270px; max-width:270px; flex-shrink:0; display:flex; flex-direction:column; max-height:calc(100vh - 210px); }
  .column.over { outline:2px dashed ${ORANGE}; outline-offset:-2px; background:#E8EAE9; }
  .col-head { display:flex; align-items:center; justify-content:space-between; padding:12px 13px 8px; }
  .col-add { background:transparent; border:none; color:${MUTED}; cursor:pointer; display:flex; padding:2px; border-radius:5px; }
  .col-add:hover { color:${ORANGE}; background:#fff; }
  .col-body { padding:8px 9px 10px; overflow-y:auto; display:flex; flex-direction:column; gap:13px; }

  .card { position:relative; background:${CARD}; border:1px solid ${HAIR}; border-radius:9px; padding:12px 12px 11px;
    cursor:grab; transition:box-shadow .15s, transform .1s; }
  .card:hover { transform:translateY(-1px); }
  .card:active { cursor:grabbing; }
  .card.collapsed { padding:9px 11px; }
  .card-status-sel { border:1.5px solid; border-radius:7px; padding:4px 6px; font-size:11.5px; font-weight:700;
    font-family:inherit; outline:none; cursor:pointer; max-width:130px; }
  .collapse-all { background:#fff; border:1px solid ${HAIR}; border-radius:8px; padding:7px 12px; font-size:12.5px;
    font-weight:600; color:${CHARCOAL}; cursor:pointer; }
  .collapse-all:hover { border-color:${ORANGE}; color:${ORANGE}; }
  .urgent-pill { display:inline-flex; align-items:center; gap:4px; background:#C0392B; color:#fff; font-size:10px;
    font-weight:800; letter-spacing:.5px; border-radius:5px; padding:3px 7px; }
  .urgent-pill.sm { padding:2px 6px; font-size:9.5px; flex-shrink:0; }
  .flag-btn { background:#F1F3F3; border:1px solid ${HAIR}; border-radius:6px; padding:4px; cursor:pointer; color:#98A0A1; display:flex; }
  .flag-btn:hover { color:#C0392B; border-color:#E7C4BB; }
  .flag-btn.on { background:#C0392B; color:#fff; border-color:#C0392B; }
  .urgent-toggle { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:2px;
    background:#fff; color:#C0392B; border:1.5px solid #E7C4BB; border-radius:9px; padding:10px; font-weight:700; font-size:13px; cursor:pointer; }
  .urgent-toggle:hover { background:#FCF0EE; }
  .urgent-toggle.on { background:#C0392B; color:#fff; border-color:#C0392B; }
  .chip { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; border:1px solid; border-radius:5px; padding:2px 6px; }
  .pri-dot { width:8px; height:8px; border-radius:50%; }
  .due { display:flex; align-items:center; gap:3px; font-size:11.5px; }
  .avatar { width:22px; height:22px; border-radius:50%; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .avatar.sm { width:20px; height:20px; font-size:10px; flex-shrink:0; }
  .pass-btn { display:flex; align-items:center; gap:3px; background:#F1EDE9; color:${CHARCOAL}; border:1px solid ${HAIR}; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:600; cursor:pointer; }
  .pass-btn:hover { background:${ORANGE}; color:#fff; border-color:${ORANGE}; }
  .empty { text-align:center; color:#A9B0B1; font-size:12px; padding:18px 0; border:1.5px dashed #D3D7D6; border-radius:8px; }

  .table-wrap { background:#fff; border:1px solid ${HAIR}; border-radius:12px; overflow-x:auto; box-shadow:0 1px 3px rgba(42,58,61,.05); }
  .tbl { width:100%; border-collapse:collapse; min-width:720px; }
  .tbl thead th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:${MUTED};
    font-weight:700; padding:12px 14px; border-bottom:2px solid ${HAIR}; background:#FAFAFA; white-space:nowrap; }
  .tbl thead th.sortable { cursor:pointer; user-select:none; }
  .tbl thead th.sortable:hover { color:${ORANGE}; background:#F3F4F4; }
  .tbl tbody tr { border-bottom:1px solid #EEF0F0; cursor:grab; transition:background .12s; }
  .tbl tbody tr:active { cursor:grabbing; }
  .tbl tbody tr:hover { background:#FBF6F3; }
  .tbl tbody td { padding:11px 14px; vertical-align:middle; }
  .cell-sel { border:1px solid ${HAIR}; border-radius:7px; padding:6px 8px; font-size:12.5px; font-family:inherit; outline:none; cursor:pointer; background:#fff; }
  .cell-sel:focus { border-color:${ORANGE}; }
  .status-sel { border-width:1.5px; }

  .overlay { position:fixed; inset:0; background:rgba(30,40,42,.45); display:flex; justify-content:center; align-items:flex-start; padding:32px 16px; z-index:50; overflow-y:auto; backdrop-filter:blur(2px); }
  .sheet { background:#fff; border-radius:14px; width:100%; max-width:560px; padding:20px 22px 18px; box-shadow:0 20px 60px rgba(0,0,0,.25); }
  .sheet-head { display:flex; gap:10px; align-items:flex-start; margin-bottom:16px; }
  .title-input { flex:1; border:none; outline:none; font-size:19px; font-weight:700; color:${CHARCOAL}; font-family:inherit; border-bottom:2px solid transparent; padding-bottom:4px; resize:none; line-height:1.3; overflow:hidden; min-height:28px; }
  .title-input:focus { border-bottom-color:${ORANGE}; }
  .icon-btn { background:#F1F3F3; border:none; border-radius:8px; padding:6px; cursor:pointer; color:${MUTED}; }
  .icon-btn:hover { background:#E4E7E7; }
  .field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:16px; }
  .flabel { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:${MUTED}; font-weight:700; }
  .notes { width:100%; min-height:70px; border:1px solid ${HAIR}; border-radius:9px; padding:10px 12px; font-size:13.5px; font-family:inherit; color:${CHARCOAL}; outline:none; resize:vertical; margin-top:5px; line-height:1.5; }
  .notes:focus { border-color:${ORANGE}; }
  .pass-wide { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; margin-top:14px; background:#F1EDE9; color:${CHARCOAL}; border:1px solid ${HAIR}; border-radius:9px; padding:10px; font-weight:600; font-size:13px; cursor:pointer; }
  .pass-wide:hover { background:${CHARCOAL}; color:#fff; border-color:${CHARCOAL}; }
  .comments { display:flex; flex-direction:column; gap:11px; margin-top:8px; }
  .comment { display:flex; gap:9px; align-items:flex-start; background:#F7F8F8; padding:9px 11px; border-radius:9px; }
  .comment .row-actions { display:flex; gap:4px; opacity:0; transition:opacity .12s; }
  .comment:hover .row-actions { opacity:1; }
  .cbtn { background:#fff; border:1px solid ${HAIR}; border-radius:6px; padding:3px 5px; cursor:pointer; color:${MUTED}; display:flex; align-items:center; }
  .cbtn:hover { color:${CHARCOAL}; border-color:#C9CFCF; }
  .cbtn.del:hover { color:#BB4A2E; border-color:#E7C4BB; }
  .mini { display:flex; align-items:center; gap:4px; background:#fff; border:1px solid ${HAIR}; border-radius:6px; padding:4px 9px; font-size:12px; cursor:pointer; color:${CHARCOAL}; font-weight:600; }
  .mini.save { background:${ORANGE}; color:#fff; border-color:${ORANGE}; }
  .edit-area { width:100%; min-height:52px; border:1px solid ${ORANGE}; border-radius:8px; padding:8px 10px; font-size:13px; font-family:inherit; outline:none; resize:vertical; line-height:1.4; color:${CHARCOAL}; }
  .attach-chip { display:inline-flex; align-items:center; gap:5px; max-width:100%; margin-top:6px; background:#fff; border:1px solid ${HAIR}; border-radius:7px; padding:5px 9px; font-size:12px; color:${CHARCOAL}; font-weight:600; text-decoration:none; }
  .attach-chip:hover { border-color:${ORANGE}; color:${ORANGE}; }
  .drop-row { display:flex; gap:8px; margin-top:8px; align-items:center; border:1.5px dashed transparent; border-radius:10px; padding:2px; transition:border-color .12s, background .12s; }
  .drop-row.over { border-color:${ORANGE}; background:#FBF1EC; }
  .attach-btn { background:#F1F3F3; border:1px solid ${HAIR}; border-radius:8px; padding:8px; cursor:pointer; color:${MUTED}; display:flex; align-items:center; }
  .attach-btn:hover { color:${ORANGE}; border-color:${ORANGE}; }
  .warn { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; background:#FBEEE9; border:1px solid #E7C4BB; color:#8A3A22; font-size:12px; line-height:1.4; padding:8px 10px; border-radius:8px; margin-top:8px; }
  .warn button { background:transparent; border:none; cursor:pointer; color:#8A3A22; flex-shrink:0; padding:0; }
  .clink { color:${ORANGE}; font-weight:600; text-decoration:underline; overflow-wrap:anywhere; word-break:break-word; }
  .clink:hover { color:${CHARCOAL}; }
  .ref-card { background:#fff; border:1px solid ${HAIR}; border-radius:12px; margin-bottom:16px; overflow:hidden; box-shadow:0 1px 3px rgba(42,58,61,.05); }
  .ref-head { background:${CHARCOAL}; color:#fff; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; padding:10px 15px; }
  .ref-row { display:flex; align-items:center; gap:11px; padding:11px 15px; border-bottom:1px solid #EEF0F0; flex-wrap:wrap; }
  .ref-row:last-child { border-bottom:none; }
  .ref-num { width:22px; height:22px; border-radius:6px; background:#F1F3F3; color:${MUTED}; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ref-title { font-size:13.5px; font-weight:600; color:${CHARCOAL}; }
  .ref-chip { font-size:11px; font-weight:700; border-radius:6px; padding:3px 8px; white-space:nowrap; }
  .ref-chip.cad { background:#EAF0F1; color:#46626C; }
  .ref-chip.prep { background:#FBEEE9; color:${ORANGE}; }
  .cinput { flex:1; border:1px solid ${HAIR}; border-radius:8px; padding:9px 11px; font-size:13px; font-family:inherit; outline:none; color:${CHARCOAL}; }
  .cinput:focus { border-color:${ORANGE}; }
  .csend { background:${CHARCOAL}; color:#fff; border:none; border-radius:8px; padding:0 12px; cursor:pointer; display:flex; align-items:center; }
  .csend:hover { background:${ORANGE}; }
  .sheet-foot { display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:14px; border-top:1px solid ${HAIR}; }
  .del-btn { display:flex; align-items:center; gap:6px; background:transparent; border:none; color:#BB4A2E; font-size:13px; cursor:pointer; font-weight:600; }
  .del-btn:hover { text-decoration:underline; }
  .done-btn { background:${ORANGE}; color:#fff; border:none; padding:9px 22px; border-radius:8px; font-weight:600; font-size:13.5px; cursor:pointer; }
  .done-btn:hover { filter:brightness(1.07); }
  .col-body::-webkit-scrollbar, .board::-webkit-scrollbar, .table-wrap::-webkit-scrollbar { height:8px; width:8px; }
  .col-body::-webkit-scrollbar-thumb, .board::-webkit-scrollbar-thumb, .table-wrap::-webkit-scrollbar-thumb { background:#C4CACB; border-radius:4px; }
`;
