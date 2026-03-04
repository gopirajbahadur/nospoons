import { useState, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  Mic, MicOff, Volume2, Sun, Moon, Home, TrendingUp,
  Settings, Plus, ChevronLeft, Clock, ThumbsUp, ThumbsDown,
  Minus, Star, ArrowRight, Check, Lock, User, LogOut,
  Trash2, Shield
} from "lucide-react";

/* ── colour-blind safe palette ── */
const CB = ["#0077BB", "#EE7733", "#009988", "#CC3311", "#33BBEE", "#AA3377"];

/* ── illness templates ── */
const ILLNESS_TEMPLATES = [
  { id: "migraine", label: "Migraine", icon: "🧠", defaultTrack: ["pain", "sleep", "mood", "meds"], defaultTriggers: ["Stress", "Poor Sleep", "Bright Light", "Loud Noise", "Weather Change", "Hormonal", "Dehydration", "Skipped Meal", "Alcohol", "Screen Time", "Caffeine Withdrawal"] },
  { id: "fibromyalgia", label: "Fibromyalgia", icon: "💪", defaultTrack: ["pain", "energy", "sleep", "mood"], defaultTriggers: ["Stress", "Poor Sleep", "Weather Change", "Overexertion", "Cold Temperature", "Emotional Distress", "Inactivity"] },
  { id: "arthritis", label: "Arthritis", icon: "🦴", defaultTrack: ["pain", "mood", "meds"], defaultTriggers: ["Weather Change", "Cold/Damp", "Overuse of Joint", "Stress", "Inactivity", "High-Inflammation Food"] },
  { id: "cfs", label: "Chronic Fatigue", icon: "🔋", defaultTrack: ["energy", "sleep", "mood"], defaultTriggers: ["Overexertion", "Poor Sleep", "Stress", "Infection/Illness", "Emotional Distress", "Too Much Activity"] },
  { id: "ibs", label: "IBS", icon: "🫄", defaultTrack: ["pain", "diet", "bowel", "mood"], defaultTriggers: ["Dairy", "Gluten", "High-FODMAP Food", "Stress", "Caffeine", "Fatty/Fried Food", "Alcohol", "Artificial Sweetener", "Large Meal", "Anxiety"] },
  { id: "anxiety", label: "Anxiety / Depression", icon: "🌊", defaultTrack: ["mood", "sleep", "energy"], defaultTriggers: ["Poor Sleep", "Social Situation", "Work Stress", "News/Media", "Isolation", "Caffeine", "Lack of Exercise", "Conflict"] },
];

const DEFAULT_REMEDIES = {
  migraine: [{ name: "Migraine hat / ice cap" }, { name: "Dark room rest" }, { name: "Cold compress on neck" }, { name: "Hydrate (32oz water)" }, { name: "Peppermint oil on temples" }, { name: "Caffeine (small amount)" }, { name: "Pressure on temples" }, { name: "Neck stretches" }],
  fibromyalgia: [{ name: "Warm bath or shower" }, { name: "Gentle stretching" }, { name: "Pacing activities" }, { name: "Heat pad on sore area" }, { name: "Magnesium supplement" }, { name: "Restorative yoga" }, { name: "Light walk (10 min)" }],
  arthritis: [{ name: "Warm compress" }, { name: "Gentle range-of-motion exercise" }, { name: "Epsom salt soak" }, { name: "Turmeric / anti-inflammatory tea" }, { name: "Rest the affected joint" }, { name: "Paraffin wax treatment" }, { name: "Compression wrap" }],
  cfs: [{ name: "Lie down with eyes closed (10 min)" }, { name: "Pacing — break tasks into chunks" }, { name: "Cold water on face and wrists" }, { name: "B12-rich snack" }, { name: "Reduce sensory stimulation" }, { name: "Gentle breathing exercise" }, { name: "Cancel non-essential plans" }],
  ibs: [{ name: "Peppermint tea" }, { name: "Heat pad on abdomen" }, { name: "Eat a low-FODMAP snack" }, { name: "Deep belly breathing" }, { name: "Gentle walk" }, { name: "Avoid trigger foods today" }, { name: "Probiotics" }, { name: "Warm water with lemon" }],
  anxiety: [{ name: "Box breathing (4-4-4-4)" }, { name: "Grounding exercise (5-4-3-2-1)" }, { name: "Walk outside (10 min)" }, { name: "Journal for 5 minutes" }, { name: "Cold water on face" }, { name: "Progressive muscle relaxation" }, { name: "Call a trusted person" }, { name: "Limit caffeine today" }],
};

const TRACK_OPTS = [
  { id: "pain", label: "Pain Level", icon: "📊" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "sleep", label: "Sleep", icon: "🌙" },
  { id: "mood", label: "Mood", icon: "😊" },
  { id: "meds", label: "Medications", icon: "💊" },
  { id: "diet", label: "Diet", icon: "🍽️" },
  { id: "bowel", label: "Bowel Movements", icon: "🚻" },
];

const BOWEL_TYPES = [
  { id: 1, label: "Type 1", desc: "Hard lumps" },
  { id: 2, label: "Type 2", desc: "Lumpy, sausage-shaped" },
  { id: 3, label: "Type 3", desc: "Sausage with cracks" },
  { id: 4, label: "Type 4", desc: "Smooth & soft" },
  { id: 5, label: "Type 5", desc: "Soft blobs" },
  { id: 6, label: "Type 6", desc: "Mushy, fluffy" },
  { id: 7, label: "Type 7", desc: "Watery, liquid" },
];

/* ── helpers ── */
const toDay = (d) => new Date(d).toISOString().slice(0, 10);
const today = () => toDay(new Date());

const hashPin = (p) => {
  let h = 0;
  const s = p + "nospoons-salt-2026";
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return "h" + Math.abs(h).toString(36);
};

/* ── localStorage persistence ── */
const saveData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Save failed:", e);
  }
};

const loadData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const deleteData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Delete failed:", e);
  }
};

/* ═══════════════════════════════════════════ */
/*                  APP                        */
/* ═══════════════════════════════════════════ */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showProfileCreate, setShowProfileCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [unlockingId, setUnlockingId] = useState(null);

  // Profile data
  const [userName, setUserName] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [selIllnesses, setSelIllnesses] = useState([]);
  const [selTracking, setSelTracking] = useState([]);
  const [customIllness, setCustomIllness] = useState("");
  const [showCustomIllness, setShowCustomIllness] = useState(false);
  const [allIllnesses, setAllIllnesses] = useState([...ILLNESS_TEMPLATES]);
  const [remedyDB, setRemedyDB] = useState({ ...DEFAULT_REMEDIES });
  const [customTriggers, setCustomTriggers] = useState([]);

  // UI state
  const [screen, setScreen] = useState("home");
  const [activeIllness, setActiveIllness] = useState(null);
  const [dark, setDark] = useState(false);
  const [textSize, setTextSize] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  // Flow state
  const [flowStep, setFlowStep] = useState(null);
  const [severity, setSeverity] = useState(0);
  const [selTriggers, setSelTriggers] = useState([]);
  const [showAddTrigger, setShowAddTrigger] = useState(false);
  const [newTrigger, setNewTrigger] = useState("");
  const [trackNote, setTrackNote] = useState("");
  const [dietNote, setDietNote] = useState("");
  const [bowelType, setBowelType] = useState(0);
  const [wellEnergy, setWellEnergy] = useState(0);
  const [wellMood, setWellMood] = useState(0);
  const [wellSleep, setWellSleep] = useState(0);

  // Persisted data (starts empty — no mock data)
  const [actionLog, setActionLog] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [entries, setEntries] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [tryingRemedy, setTryingRemedy] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState("week");
  const [addingCondition, setAddingCondition] = useState(false);

  const pk = activeProfileId ? `ns-${activeProfileId}` : "ns-none";

  /* ── load profiles on mount ── */
  useEffect(() => {
    const p = loadData("ns-profiles", []);
    setProfiles(p);
    if (p.length === 1 && !p[0].pin) {
      setActiveProfileId(p[0].id);
    }
    setLoaded(true);
  }, []);

  /* ── load profile data when switching ── */
  useEffect(() => {
    if (!activeProfileId) return;
    const prof = loadData(`${pk}-profile`, null);
    if (prof) {
      setUserName(prof.userName || "");
      setSetupDone(prof.setupDone || false);
      setSelIllnesses(prof.selIllnesses || []);
      setSelTracking(prof.selTracking || []);
      setCustomTriggers(prof.customTriggers || []);
      if (prof.allIllnesses?.length) setAllIllnesses(prof.allIllnesses);
      if (prof.remedyDB) setRemedyDB((p) => ({ ...DEFAULT_REMEDIES, ...prof.remedyDB }));
    } else {
      setUserName("");
      setSetupDone(false);
      setSelIllnesses([]);
      setSelTracking([]);
      setCustomTriggers([]);
      setAllIllnesses([...ILLNESS_TEMPLATES]);
      setRemedyDB({ ...DEFAULT_REMEDIES });
    }
    const dat = loadData(`${pk}-data`, null);
    if (dat) {
      setActionLog(dat.actionLog || []);
      setCheckins(dat.checkins || []);
      setEntries(dat.entries || []);
      setWellness(dat.wellness || []);
    } else {
      setActionLog([]);
      setCheckins([]);
      setEntries([]);
      setWellness([]);
    }
    const prf = loadData(`${pk}-prefs`, null);
    if (prf) {
      if (prf.dark !== undefined) setDark(prf.dark);
      if (prf.textSize !== undefined) setTextSize(prf.textSize);
      if (prf.reducedMotion !== undefined) setReducedMotion(prf.reducedMotion);
    }
  }, [activeProfileId]);

  /* ── persist profile ── */
  useEffect(() => {
    if (!loaded || !activeProfileId || !setupDone) return;
    saveData(`${pk}-profile`, { userName, setupDone, selIllnesses, selTracking, customTriggers, allIllnesses, remedyDB });
  }, [userName, setupDone, selIllnesses, selTracking, customTriggers, allIllnesses, remedyDB, loaded, activeProfileId]);

  /* ── persist data ── */
  useEffect(() => {
    if (!loaded || !activeProfileId) return;
    saveData(`${pk}-data`, { actionLog, checkins, entries, wellness });
  }, [actionLog, checkins, entries, wellness, loaded, activeProfileId]);

  /* ── persist prefs ── */
  useEffect(() => {
    if (!loaded || !activeProfileId) return;
    saveData(`${pk}-prefs`, { dark, textSize, reducedMotion });
  }, [dark, textSize, reducedMotion, loaded, activeProfileId]);

  /* ── theme ── */
  const sizes = [0.85, 1, 1.18, 1.38];
  const fs = sizes[textSize];
  const bg = dark ? "#1a1a2e" : "#F0F4F8";
  const card = dark ? "#16213e" : "#FFFFFF";
  const t1 = dark ? "#E8E8E8" : "#1a1a2e";
  const t2 = dark ? "#A0A0B8" : "#5A6B7F";
  const acc = "#0077BB";
  const acc2 = "#009988";
  const brd = dark ? "#2a2a4a" : "#E2E8F0";
  const red = "#CC3311";
  const orn = "#EE7733";

  /* ── utility functions ── */
  const computeDefaults = (ids) => {
    const s = new Set();
    ids.forEach((id) => {
      const il = [...ILLNESS_TEMPLATES, ...allIllnesses].find((x) => x.id === id);
      if (il?.defaultTrack) il.defaultTrack.forEach((t) => s.add(t));
    });
    return [...s];
  };

  const getTriggersForIllness = (id) => {
    const il = allIllnesses.find((x) => x.id === id);
    return [...new Set([...(il?.defaultTriggers || ["Stress", "Poor Sleep", "Weather"]), ...customTriggers])];
  };

  const calcStreak = (illnessId) => {
    const relevant = checkins
      .filter((c) => c.illness === illnessId)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!relevant.length) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 90; i++) {
      const dayStr = toDay(d);
      const ci = relevant.find((c) => c.date === dayStr);
      if (ci) {
        if (ci.hadIt) break;
        streak++;
      } else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const alreadyCheckedIn = (illnessId) =>
    checkins.some((c) => c.illness === illnessId && c.date === today());

  const getStats = (illness, name) => {
    const r = actionLog.filter((a) => a.illness === illness && a.remedy === name);
    const h = r.filter((a) => a.result === "helped").length;
    return { total: r.length, helped: h, rate: r.length ? Math.round((h / r.length) * 100) : null };
  };

  const getSorted = (illness) => {
    const rem = remedyDB[illness] || [];
    return [...rem].sort((a, b) => {
      const sa = getStats(illness, a.name);
      const sb = getStats(illness, b.name);
      if (sa.total > 0 && sb.total === 0) return -1;
      if (sb.total > 0 && sa.total === 0) return 1;
      return (sb.rate || 0) - (sa.rate || 0);
    });
  };

  const logAction = (illness, remedy, result) => {
    const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setActionLog((p) => [{ id: Date.now(), illness, remedy, date: d, result }, ...p]);
    setTryingRemedy(null);
  };

  const buildWellnessChart = (days) => {
    const d = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - i);
      const dayStr = toDay(dt);
      const dayLabel = days <= 7 ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()] : "" + (dt.getMonth() + 1) + "/" + dt.getDate();
      const well = wellness.find((w) => toDay(w.date) === dayStr);
      d.push({ day: dayLabel, energy: well ? well.energy : null, mood: well ? well.mood : null, sleep: well ? well.sleep : null });
    }
    return d;
  };

  const buildChartData = (illnessId, days) => {
    const d = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - i);
      const dayStr = toDay(dt);
      const dayLabel = days <= 7 ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()] : "" + (dt.getMonth() + 1) + "/" + dt.getDate();
      const ent = entries.find((e) => e.illness === illnessId && toDay(e.date) === dayStr);
      d.push({ day: dayLabel, severity: ent ? ent.severity : null });
    }
    return d;
  };

  const hasAnyData = (data, keys) => data.some((d) => keys.some((k) => d[k] !== null));

  const resetFlow = () => {
    setFlowStep(null); setSeverity(0); setSelTriggers([]); setTrackNote("");
    setDietNote(""); setBowelType(0); setShowAddTrigger(false); setNewTrigger("");
    setWellEnergy(0); setWellMood(0); setWellSleep(0);
  };
  const goHome = () => { resetFlow(); setActiveIllness(null); setScreen("home"); };

  /* ── speech ── */
  const speak = useCallback((t) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.rate = 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const startListen = useCallback((cb) => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e) => { cb(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  }, []);

  /* ── shared components ── */
  const TTS = ({ t, label }) => (
    <button
      onClick={() => speaking ? (window.speechSynthesis.cancel(), setSpeaking(false)) : speak(t)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: acc, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      aria-label={`Read ${label} aloud`}
    >
      <Volume2 size={20 * fs} color={speaking ? orn : acc} />
    </button>
  );

  const RemindLater = ({ label }) => (
    <button onClick={goHome} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: `${14 * fs}px`, background: "transparent", border: `1px solid ${brd}`, borderRadius: 14, color: t2, fontSize: 14 * fs, fontWeight: 500, cursor: "pointer", marginTop: 8, minHeight: 48 }}>
      <Clock size={16 * fs} /> {label || "Not now, remind me later"}
    </button>
  );

  const BackBtn = ({ onClick, label }) => (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: acc, fontSize: 14 * fs, fontWeight: 600, cursor: "pointer", padding: "8px 0", marginBottom: 8, minHeight: 44 }} aria-label={label || "Go back"}>
      <ChevronLeft size={18 * fs} /> Back
    </button>
  );

  const BigBtn = ({ onClick, children, color, outline, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: `${18 * fs}px`, borderRadius: 16, border: outline ? `2px solid ${color || acc}` : "none", background: disabled ? brd : outline ? "transparent" : color || acc, color: disabled ? t2 : outline ? (color || acc) : "#fff", fontSize: 18 * fs, fontWeight: 700, cursor: disabled ? "default" : "pointer", marginBottom: 10, textAlign: "center", minHeight: 56, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );

  const containerStyle = {
    width: "100%", maxWidth: 390, margin: "0 auto", background: bg, minHeight: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: t1, fontSize: 16 * fs, display: "flex", flexDirection: "column",
  };

  /* ── loading ── */
  if (!loaded) return (
    <div style={containerStyle}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 48 }}>🥄</div>
        <p style={{ fontSize: 16, color: "#5A6B7F", fontWeight: 600 }}>Loading No Spoons...</p>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════ */
  /*             PROFILE PICKER                  */
  /* ═══════════════════════════════════════════ */
  if (!activeProfileId) {
    const createProfile = () => {
      if (!newProfileName.trim()) return;
      const id = Date.now().toString(36);
      const np = { id, name: newProfileName.trim(), pin: newProfilePin ? hashPin(newProfilePin) : null, createdAt: new Date().toISOString() };
      const updated = [...profiles, np];
      setProfiles(updated);
      saveData("ns-profiles", updated);
      setActiveProfileId(id);
      setUserName(newProfileName.trim());
      setNewProfileName(""); setNewProfilePin(""); setShowProfileCreate(false);
    };

    const tryUnlock = (prof) => {
      if (!prof.pin) { setActiveProfileId(prof.id); return; }
      if (hashPin(pinInput) === prof.pin) { setActiveProfileId(prof.id); setPinInput(""); setPinError(false); }
      else { setPinError(true); setPinInput(""); }
    };

    const unlocking = profiles.find((p) => p.id === unlockingId);

    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🥄</div>
            <h1 style={{ fontSize: 26 * fs, fontWeight: 800, margin: "0 0 4px", color: t1 }}>No Spoons</h1>
            <p style={{ fontSize: 14, color: t2 }}>Your chronic illness companion</p>
          </div>

          {unlocking ? (
            <div>
              <BackBtn onClick={() => { setUnlockingId(null); setPinInput(""); setPinError(false); }} />
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}><Lock size={36} color={acc} /></div>
                <h2 style={{ fontSize: 18 * fs, fontWeight: 700, margin: "0 0 4px" }}>Welcome back, {unlocking.name}</h2>
                <p style={{ fontSize: 13, color: t2 }}>Enter your 4-digit PIN</p>
              </div>
              <input type="password" inputMode="numeric" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))} placeholder="● ● ● ●" style={{ width: "100%", padding: 16, borderRadius: 14, border: `2px solid ${pinError ? red : brd}`, fontSize: 28, textAlign: "center", letterSpacing: 12, background: card, color: t1, fontFamily: "inherit", boxSizing: "border-box" }} autoFocus aria-label="PIN" />
              {pinError && <p style={{ color: red, fontSize: 13, textAlign: "center", marginTop: 6, fontWeight: 600 }}>Incorrect PIN. Try again.</p>}
              <div style={{ marginTop: 16 }}><BigBtn onClick={() => tryUnlock(unlocking)} disabled={pinInput.length < 4}>Unlock</BigBtn></div>
            </div>
          ) : showProfileCreate ? (
            <div>
              <BackBtn onClick={() => setShowProfileCreate(false)} />
              <h2 style={{ fontSize: 20 * fs, fontWeight: 700, margin: "0 0 16px" }}>Create Profile</h2>
              <label style={{ fontSize: 13 * fs, fontWeight: 600, color: t2, display: "block", marginBottom: 4 }}>Your name</label>
              <input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder="First name" style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid ${brd}`, fontSize: 17, background: card, color: t1, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }} autoFocus aria-label="Name" />
              <label style={{ fontSize: 13 * fs, fontWeight: 600, color: t2, display: "block", marginBottom: 4 }}>PIN (optional — for privacy)</label>
              <input type="password" inputMode="numeric" maxLength={4} value={newProfilePin} onChange={(e) => setNewProfilePin(e.target.value.replace(/\D/g, ""))} placeholder="4 digits (optional)" style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid ${brd}`, fontSize: 17, background: card, color: t1, fontFamily: "inherit", boxSizing: "border-box", letterSpacing: 6, marginBottom: 20 }} aria-label="PIN" />
              <BigBtn onClick={createProfile} disabled={!newProfileName.trim()}>Create Profile</BigBtn>
            </div>
          ) : (
            <div>
              {profiles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {profiles.map((p) => (
                    <button key={p.id} onClick={() => p.pin ? setUnlockingId(p.id) : setActiveProfileId(p.id)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: `${18 * fs}px`, borderRadius: 16, border: `1px solid ${brd}`, background: card, cursor: "pointer", marginBottom: 8, textAlign: "left", minHeight: 64 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: acc + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={22} color={acc} /></div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 17 * fs, fontWeight: 700, color: t1 }}>{p.name}</div><div style={{ fontSize: 12, color: t2 }}>Tap to open</div></div>
                      {p.pin && <Lock size={16} color={t2} />}
                      <ArrowRight size={18} color={t2} />
                    </button>
                  ))}
                </div>
              )}
              {profiles.length < 5 && (<BigBtn onClick={() => setShowProfileCreate(true)} outline>{profiles.length === 0 ? "Create Your Profile" : "Add Another Profile"}</BigBtn>)}
              {profiles.length >= 5 && <p style={{ fontSize: 13, color: t2, textAlign: "center" }}>Maximum 5 profiles reached.</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ */
  /*              SETUP FLOW                     */
  /* ═══════════════════════════════════════════ */
  if (!setupDone && !addingCondition) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
          {setupStep === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🥄</div>
              <h1 style={{ fontSize: 24 * fs, fontWeight: 800, margin: "0 0 4px" }}>Hi{userName ? `, ${userName}` : ""}!</h1>
              <p style={{ fontSize: 15 * fs, color: t2, margin: "0 0 32px", lineHeight: 1.5 }}>Let's set up No Spoons for you. It only takes a moment.</p>
              <BigBtn onClick={() => setSetupStep(1)}>Get Started</BigBtn>
            </div>
          )}
          {setupStep === 1 && (
            <div>
              <BackBtn onClick={() => setSetupStep(0)} />
              <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 6px" }}>What do you live with?</h1>
              <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 20px" }}>Select all that apply.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto", paddingBottom: 8 }}>
                {allIllnesses.map((il) => {
                  const sel = selIllnesses.includes(il.id);
                  return (
                    <button key={il.id} onClick={() => { const next = sel ? selIllnesses.filter((x) => x !== il.id) : [...selIllnesses, il.id]; setSelIllnesses(next); setSelTracking(computeDefaults(next)); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: `${16 * fs}px`, borderRadius: 16, border: `2px solid ${sel ? acc : brd}`, background: sel ? acc + "12" : "transparent", cursor: "pointer", textAlign: "left", minHeight: 56 }} aria-pressed={sel}>
                      <span style={{ fontSize: 28 * fs }}>{il.icon}</span>
                      <span style={{ fontSize: 17 * fs, fontWeight: sel ? 700 : 500, color: sel ? acc : t1 }}>{sel ? "✓ " : ""}{il.label}</span>
                    </button>
                  );
                })}
                {showCustomIllness ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={customIllness} onChange={(e) => setCustomIllness(e.target.value)} placeholder="Condition name..." style={{ flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${brd}`, fontSize: 16, background: card, color: t1, fontFamily: "inherit" }} autoFocus />
                    <button onClick={() => { if (customIllness.trim()) { const id = "custom_" + Date.now().toString(36); const ni = { id, label: customIllness.trim(), icon: "🏥", defaultTrack: ["pain", "mood"], defaultTriggers: ["Stress", "Poor Sleep", "Weather"] }; setAllIllnesses((p) => [...p, ni]); setRemedyDB((p) => ({ ...p, [id]: [{ name: "Rest" }, { name: "Deep breathing" }, { name: "Warm compress" }, { name: "Hydrate" }] })); const next = [...selIllnesses, id]; setSelIllnesses(next); setSelTracking(computeDefaults(next)); setCustomIllness(""); setShowCustomIllness(false); } }} style={{ padding: "14px 18px", borderRadius: 14, background: acc, color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Add</button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustomIllness(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, border: `2px dashed ${brd}`, background: "transparent", cursor: "pointer", color: t2, fontSize: 16, minHeight: 56 }}><Plus size={24} /> Add custom condition</button>
                )}
              </div>
              {selIllnesses.length > 0 && <div style={{ marginTop: 16 }}><BigBtn onClick={() => setSetupStep(2)}>Next →</BigBtn></div>}
            </div>
          )}
          {setupStep === 2 && (
            <div>
              <BackBtn onClick={() => setSetupStep(1)} />
              <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 6px" }}>What do you want to track?</h1>
              <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 20px" }}>Pre-selected based on your conditions.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TRACK_OPTS.map((opt) => {
                  const sel = selTracking.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => setSelTracking((p) => sel ? p.filter((x) => x !== opt.id) : [...p, opt.id])} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, border: `2px solid ${sel ? acc : brd}`, background: sel ? acc + "12" : "transparent", cursor: "pointer", textAlign: "left", minHeight: 52 }} aria-pressed={sel}>
                      <span style={{ fontSize: 24 }}>{opt.icon}</span>
                      <span style={{ fontSize: 16 * fs, fontWeight: sel ? 700 : 500, color: sel ? acc : t1 }}>{sel ? "✓ " : ""}{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}><BigBtn onClick={() => setSetupStep(3)}>Next →</BigBtn></div>
            </div>
          )}
          {setupStep === 3 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 4px" }}>You're all set, {userName}!</h1>
              <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 16px" }}>Change anytime in Settings.</p>
              <div style={{ background: card, borderRadius: 16, padding: 16, border: `1px solid ${brd}`, textAlign: "left", marginBottom: 24 }}>
                <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 8px", fontWeight: 600 }}>Conditions:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{selIllnesses.map((id) => { const il = allIllnesses.find((x) => x.id === id); return il ? <span key={id} style={{ padding: "4px 10px", borderRadius: 10, background: acc + "15", color: acc, fontSize: 13, fontWeight: 600 }}>{il.icon} {il.label}</span> : null; })}</div>
                <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 6px", fontWeight: 600 }}>Tracking:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{selTracking.map((id) => { const o = TRACK_OPTS.find((x) => x.id === id); return o ? <span key={id} style={{ padding: "4px 10px", borderRadius: 10, background: acc2 + "15", color: acc2, fontSize: 13, fontWeight: 600 }}>{o.icon} {o.label}</span> : null; })}</div>
              </div>
              <BigBtn onClick={() => setSetupDone(true)}>Let's Go 🥄</BigBtn>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            {[0, 1, 2, 3].map((i) => (<div key={i} style={{ width: i === setupStep ? 24 : 8, height: 8, borderRadius: 4, background: i === setupStep ? acc : brd }} />))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ */
  /*           ADD CONDITION OVERLAY              */
  /* ═══════════════════════════════════════════ */
  if (addingCondition) {
    const available = allIllnesses.filter((il) => !selIllnesses.includes(il.id));
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, padding: 24 }}>
          <BackBtn onClick={() => { setAddingCondition(false); setShowCustomIllness(false); setCustomIllness(""); }} />
          <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 16px" }}>Add Condition</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {available.map((il) => (
              <button key={il.id} onClick={() => { const next = [...selIllnesses, il.id]; setSelIllnesses(next); setSelTracking(computeDefaults(next)); setAddingCondition(false); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, border: `1px solid ${brd}`, background: card, cursor: "pointer", minHeight: 56 }}>
                <span style={{ fontSize: 28 }}>{il.icon}</span><span style={{ fontSize: 17 * fs, fontWeight: 500, color: t1 }}>{il.label}</span>
              </button>
            ))}
            {showCustomIllness ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={customIllness} onChange={(e) => setCustomIllness(e.target.value)} placeholder="Condition name..." style={{ flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${brd}`, fontSize: 16, background: card, color: t1, fontFamily: "inherit" }} autoFocus />
                <button onClick={() => { if (customIllness.trim()) { const id = "custom_" + Date.now().toString(36); const ni = { id, label: customIllness.trim(), icon: "🏥", defaultTrack: ["pain", "mood"], defaultTriggers: ["Stress", "Poor Sleep", "Weather"] }; setAllIllnesses((p) => [...p, ni]); setRemedyDB((p) => ({ ...p, [id]: [{ name: "Rest" }, { name: "Deep breathing" }, { name: "Warm compress" }, { name: "Hydrate" }] })); setSelIllnesses((p) => [...p, id]); setCustomIllness(""); setShowCustomIllness(false); setAddingCondition(false); } }} style={{ padding: "14px 18px", borderRadius: 14, background: acc, color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Add</button>
              </div>
            ) : (
              <button onClick={() => setShowCustomIllness(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, border: `2px dashed ${brd}`, background: "transparent", cursor: "pointer", color: t2, fontSize: 16, minHeight: 56 }}><Plus size={24} /> Add custom condition</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ */
  /*             ILLNESS FLOW                    */
  /* ═══════════════════════════════════════════ */
  const activeIl = allIllnesses.find((x) => x.id === activeIllness);
  const triggersForActive = activeIllness ? getTriggersForIllness(activeIllness) : [];
  const showDiet = selTracking.includes("diet");
  const showBowel = selTracking.includes("bowel");
  const trackWellness = selTracking.some((t) => ["energy", "mood", "sleep"].includes(t));

  const IllnessFlow = () => {
    if (!activeIl) return null;
    const already = alreadyCheckedIn(activeIllness);
    const streak = calcStreak(activeIllness);

    if (flowStep === "question") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => { resetFlow(); setActiveIllness(null); setScreen("home"); }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>{activeIl.icon}</div>
          {already ? (<>
            <h1 style={{ fontSize: 20 * fs, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.4 }}>Already checked in today</h1>
            <p style={{ fontSize: 15 * fs, color: t2, margin: "0 0 24px" }}>🔥 {streak} day streak</p>
            <BigBtn onClick={() => setFlowStep("remedies")}>💡 View Remedies</BigBtn>
            <BigBtn onClick={goHome} outline>Back to Home</BigBtn>
          </>) : (<>
            <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 36px", lineHeight: 1.4 }}>Are you experiencing<br />{activeIl.label.toLowerCase()} right now?</h1>
            <BigBtn onClick={() => { setCheckins((p) => [...p, { date: today(), illness: activeIllness, hadIt: true }]); setFlowStep("yes_options"); }}>Yes</BigBtn>
            <BigBtn onClick={() => { setCheckins((p) => [...p, { date: today(), illness: activeIllness, hadIt: false }]); setFlowStep("no"); }} outline>No</BigBtn>
          </>)}
        </div>
      </div>
    );

    if (flowStep === "no") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔥</div>
        <h1 style={{ fontSize: 52 * fs, fontWeight: 800, color: acc, margin: "0 0 4px" }}>{calcStreak(activeIllness)}</h1>
        <p style={{ fontSize: 18 * fs, fontWeight: 600, color: t1, margin: "0 0 40px" }}>{activeIl.label}-free days</p>
        <BigBtn onClick={goHome} outline>Back to Home</BigBtn>
        <button onClick={() => { setCheckins((p) => p.filter((c) => !(c.illness === activeIllness && c.date === today()))); setFlowStep("question"); }} style={{ background: "none", border: "none", color: t2, fontSize: 13 * fs, cursor: "pointer", marginTop: 4, padding: 8, minHeight: 44 }}>Undo — that was a mistake</button>
      </div>
    );

    if (flowStep === "yes_options") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep("question")} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: 20 * fs, fontWeight: 700, margin: "0 0 24px", textAlign: "center" }}>What would you like to do?</h2>
          <button onClick={() => setFlowStep("track_a")} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: `${20 * fs}px`, borderRadius: 16, border: `1px solid ${brd}`, background: card, cursor: "pointer", marginBottom: 10, textAlign: "left", minHeight: 72 }}>
            <span style={{ fontSize: 28 }}>📝</span>
            <div><div style={{ fontSize: 17 * fs, fontWeight: 700, color: t1 }}>Track it</div><div style={{ fontSize: 13 * fs, color: t2 }}>Log severity, triggers & notes</div></div>
          </button>
          <button onClick={() => setFlowStep("remedies")} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: `${20 * fs}px`, borderRadius: 16, border: `1px solid ${brd}`, background: card, cursor: "pointer", marginBottom: 10, textAlign: "left", minHeight: 72 }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <div><div style={{ fontSize: 17 * fs, fontWeight: 700, color: t1 }}>Show me remedies</div><div style={{ fontSize: 13 * fs, color: t2 }}>Based on what works for you</div></div>
          </button>
          <RemindLater />
        </div>
      </div>
    );

    if (flowStep === "track_a") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep("yes_options")} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px", textAlign: "center" }}>How bad is it?</h1>
          <p style={{ fontSize: 14 * fs, color: t2, textAlign: "center", margin: "0 0 24px" }}>1 = mild · 10 = worst ever</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => { const sel = severity === n; const c = n <= 3 ? acc2 : n <= 6 ? orn : red; return (<button key={n} onClick={() => setSeverity(n)} style={{ aspectRatio: "1", borderRadius: 14, border: `2px solid ${sel ? c : brd}`, background: sel ? c + "18" : "transparent", color: sel ? c : t2, fontSize: 20 * fs, fontWeight: sel ? 800 : 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48 }} aria-pressed={sel}>{n}</button>); })}
          </div>
          {severity > 0 && <BigBtn onClick={() => setFlowStep("track_b")}>Next →</BigBtn>}
          <RemindLater />
        </div>
      </div>
    );

    if (flowStep === "track_b") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep("track_a")} />
        <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px" }}>Any known triggers?</h1>
        <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 16px" }}>Select all that apply, or add your own.</p>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {triggersForActive.map((tr) => { const sel = selTriggers.includes(tr); return (<button key={tr} onClick={() => setSelTriggers((p) => sel ? p.filter((x) => x !== tr) : [...p, tr])} style={{ padding: `${10 * fs}px ${16 * fs}px`, borderRadius: 20, border: `2px solid ${sel ? acc : brd}`, background: sel ? acc + "12" : "transparent", color: sel ? acc : t1, fontSize: 14 * fs, fontWeight: sel ? 700 : 500, cursor: "pointer", minHeight: 44 }} aria-pressed={sel}>{sel ? "✓ " : ""}{tr}</button>); })}
          </div>
          {showAddTrigger ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)} placeholder="New trigger..." style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${brd}`, fontSize: 15, background: card, color: t1, fontFamily: "inherit" }} autoFocus />
              <button onClick={() => { if (newTrigger.trim()) { setCustomTriggers((p) => [...p, newTrigger.trim()]); setSelTriggers((p) => [...p, newTrigger.trim()]); setNewTrigger(""); setShowAddTrigger(false); } }} style={{ padding: "12px 16px", borderRadius: 12, background: acc, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Add</button>
            </div>
          ) : (
            <button onClick={() => setShowAddTrigger(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 20, border: `2px dashed ${brd}`, background: "transparent", color: t2, fontSize: 14, cursor: "pointer", marginBottom: 12, minHeight: 44 }}><Plus size={16} /> Add new trigger</button>
          )}
        </div>
        <BigBtn onClick={() => setFlowStep(showDiet ? "track_diet" : showBowel ? "track_bowel" : trackWellness ? "track_wellness" : "track_c")}>Next →</BigBtn>
        <RemindLater />
      </div>
    );

    if (flowStep === "track_diet") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep("track_b")} />
        <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px" }}>What have you eaten today?</h1>
        <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 16px" }}>Meals, snacks, drinks.</p>
        <div style={{ position: "relative", flex: 1 }}>
          <textarea value={dietNote} onChange={(e) => setDietNote(e.target.value)} placeholder="e.g., oatmeal for breakfast, coffee..." style={{ width: "100%", height: "100%", minHeight: 120 * fs, borderRadius: 14, border: `1px solid ${brd}`, padding: 14, paddingRight: 50, fontSize: 15, background: card, color: t1, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <button onClick={() => startListen((t) => setDietNote((p) => p + " " + t))} style={{ position: "absolute", right: 10, top: 10, background: listening ? red + "18" : acc + "12", border: `1px solid ${listening ? red : acc}`, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{listening ? <MicOff size={18} color={red} /> : <Mic size={18} color={acc} />}</button>
        </div>
        <div style={{ marginTop: 12 }}><BigBtn onClick={() => setFlowStep(showBowel ? "track_bowel" : trackWellness ? "track_wellness" : "track_c")}>Next →</BigBtn><RemindLater /></div>
      </div>
    );

    if (flowStep === "track_bowel") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep(showDiet ? "track_diet" : "track_b")} />
        <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px" }}>Bowel Movement</h1>
        <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 16px" }}>Bristol Stool Scale</p>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {BOWEL_TYPES.map((bt) => { const sel = bowelType === bt.id; const c = bt.id <= 2 ? orn : bt.id <= 5 ? acc2 : red; return (
            <button key={bt.id} onClick={() => setBowelType(bt.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, borderRadius: 12, border: `2px solid ${sel ? c : brd}`, background: sel ? c + "12" : "transparent", cursor: "pointer", marginBottom: 8, textAlign: "left", minHeight: 48 }} aria-pressed={sel}>
              <span style={{ fontSize: 16 * fs, fontWeight: 700, color: sel ? c : t2, minWidth: 55 }}>{bt.label}</span>
              <span style={{ fontSize: 14 * fs, color: sel ? c : t1, fontWeight: sel ? 600 : 400 }}>{bt.desc}</span>
              {sel && <Check size={18} color={c} style={{ marginLeft: "auto" }} />}
            </button>
          ); })}
        </div>
        <BigBtn onClick={() => setFlowStep(trackWellness ? "track_wellness" : "track_c")}>{bowelType > 0 ? "Next →" : "Skip →"}</BigBtn>
        <RemindLater />
      </div>
    );

    if (flowStep === "track_wellness") {
      if (wellness.some((w) => toDay(w.date) === today())) {
        setTimeout(() => setFlowStep("track_c"), 0);
        return (<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: t2, fontSize: 14 * fs }}>Loading...</p></div>);
      }
      const Dots = ({ val, setVal, label, lo, hi }) => (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14 * fs, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 14 * fs, fontWeight: 700, color: val ? acc : t2 }}>{val || "—"}/10</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => { const sel = val === n; return (
              <button key={n} onClick={() => setVal(n)} style={{ flex: 1, height: 36 * fs, borderRadius: 8, border: `1px solid ${sel ? acc : brd}`, background: sel ? acc + "18" : "transparent", color: sel ? acc : t2, fontSize: 11 * fs, fontWeight: sel ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</button>
            ); })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: 10 * fs, color: t2 }}>{lo}</span>
            <span style={{ fontSize: 10 * fs, color: t2 }}>{hi}</span>
          </div>
        </div>
      );
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
          <BackBtn onClick={() => setFlowStep(showBowel ? "track_bowel" : showDiet ? "track_diet" : "track_b")} />
          <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px" }}>Quick wellness check</h1>
          <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 20px" }}>How are you feeling overall?</p>
          {selTracking.includes("energy") && <Dots val={wellEnergy} setVal={setWellEnergy} label="⚡ Energy" lo="Exhausted" hi="Energized" />}
          {selTracking.includes("mood") && <Dots val={wellMood} setVal={setWellMood} label="😊 Mood" lo="Very low" hi="Great" />}
          {selTracking.includes("sleep") && <Dots val={wellSleep} setVal={setWellSleep} label="🌙 Sleep quality" lo="Terrible" hi="Excellent" />}
          <div style={{ marginTop: "auto" }}><BigBtn onClick={() => setFlowStep("track_c")}>Next →</BigBtn><RemindLater /></div>
        </div>
      );
    }

    if (flowStep === "track_c") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <BackBtn onClick={() => setFlowStep(trackWellness ? "track_wellness" : showBowel ? "track_bowel" : showDiet ? "track_diet" : "track_b")} />
        <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 8px" }}>Anything else?</h1>
        <p style={{ fontSize: 14 * fs, color: t2, margin: "0 0 16px" }}>Optional — or skip ahead.</p>
        <div style={{ position: "relative", flex: 1 }}>
          <textarea value={trackNote} onChange={(e) => setTrackNote(e.target.value)} placeholder="How you're feeling..." style={{ width: "100%", height: "100%", minHeight: 120 * fs, borderRadius: 14, border: `1px solid ${brd}`, padding: 14, paddingRight: 50, fontSize: 15, background: card, color: t1, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <button onClick={() => startListen((t) => setTrackNote((p) => p + " " + t))} style={{ position: "absolute", right: 10, top: 10, background: listening ? red + "18" : acc + "12", border: `1px solid ${listening ? red : acc}`, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{listening ? <MicOff size={18} color={red} /> : <Mic size={18} color={acc} />}</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <BigBtn onClick={() => {
            setEntries((p) => [{ id: Date.now(), illness: activeIllness, severity, triggers: [...selTriggers], note: trackNote, diet: dietNote, bowel: bowelType, date: new Date().toISOString() }, ...p]);
            if (wellEnergy || wellMood || wellSleep) {
              const todayW = wellness.find((w) => toDay(w.date) === today());
              if (!todayW) setWellness((p) => [{ date: new Date().toISOString(), energy: wellEnergy, mood: wellMood, sleep: wellSleep }, ...p]);
              else setWellness((p) => p.map((w) => toDay(w.date) === today() ? { ...w, energy: wellEnergy || w.energy, mood: wellMood || w.mood, sleep: wellSleep || w.sleep } : w));
            }
            setFlowStep("track_d");
          }}>Log It ✓</BigBtn>
          <RemindLater />
        </div>
      </div>
    );

    if (flowStep === "track_d") {
      const parts = [`Severity: ${severity}/10`];
      if (selTriggers.length) parts.push(`Triggers: ${selTriggers.join(", ")}`);
      if (dietNote) parts.push(`Diet: ${dietNote.trim()}`);
      if (bowelType) parts.push(`Bowel: Type ${bowelType}`);
      if (wellEnergy) parts.push(`Energy: ${wellEnergy}/10`);
      if (wellMood) parts.push(`Mood: ${wellMood}/10`);
      if (wellSleep) parts.push(`Sleep: ${wellSleep}/10`);
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22 * fs, fontWeight: 700, margin: "0 0 12px" }}>Logged</h1>
          <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${brd}`, textAlign: "left", marginBottom: 24 }}>
            {parts.map((p, i) => <p key={i} style={{ fontSize: 14 * fs, color: t2, margin: "4px 0" }}>{p}</p>)}
            {trackNote && <p style={{ fontSize: 13 * fs, color: t2, fontStyle: "italic", margin: "4px 0" }}>"{trackNote.trim()}"</p>}
          </div>
          <BigBtn onClick={() => setFlowStep("remedies")}>💡 View Remedies</BigBtn>
          <BigBtn onClick={goHome} outline>Back to Home</BigBtn>
        </div>
      );
    }

    if (flowStep === "remedies") {
      const sorted = getSorted(activeIllness);
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, overflowY: "auto", paddingBottom: 24 }}>
          <BackBtn onClick={() => setFlowStep("yes_options")} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 20 * fs, fontWeight: 700, margin: 0 }}>Remedies</h1>
            <TTS t={`Remedies for ${activeIl.label}: ${sorted.map((r) => { const s = getStats(activeIllness, r.name); return r.name + (s.total > 0 ? `, ${s.rate}% success` : ""); }).join(". ")}`} label="remedies" />
          </div>
          {sorted.length === 0 ? <p style={{ fontSize: 14 * fs, color: t2 }}>No remedies available yet.</p> : sorted.map((r, i) => {
            const st = getStats(activeIllness, r.name);
            const isTrying = tryingRemedy === r.name;
            return (
              <div key={i} style={{ background: card, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${brd}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16 * fs, fontWeight: 600, color: t1 }}>{r.name}</div>
                    {st.total > 0 ? (<div style={{ fontSize: 12 * fs, color: st.rate >= 60 ? acc2 : st.rate >= 30 ? orn : red, fontWeight: 600, marginTop: 3 }}>● {st.rate}% success ({st.helped}/{st.total})</div>) : (<div style={{ fontSize: 12 * fs, color: t2, marginTop: 3 }}>○ Not tried yet</div>)}
                  </div>
                  {!isTrying && <button onClick={() => setTryingRemedy(r.name)} style={{ padding: "8px 16px", borderRadius: 10, background: acc, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>Try This</button>}
                </div>
                {isTrying && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${brd}` }}>
                    <p style={{ fontSize: 13 * fs, fontWeight: 600, margin: "0 0 8px" }}>How did it go?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[{ r: "helped", l: "Helped", c: acc2, I: ThumbsUp }, { r: "somewhat", l: "Somewhat", c: orn, I: Minus }, { r: "didnt_help", l: "Didn't help", c: red, I: ThumbsDown }].map((o) => (
                        <button key={o.r} onClick={() => logAction(activeIllness, r.name, o.r)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${o.c}`, background: o.c + "12", color: o.c, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 56 }}><o.I size={18} />{o.l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <RemindLater label="Back to Home" />
        </div>
      );
    }
    return null;
  };

  /* ═══════════════════════════════════════════ */
  /*                REPORTS                       */
  /* ═══════════════════════════════════════════ */
  const Reports = () => {
    const days = trendPeriod === "week" ? 7 : 28;
    const wellData = buildWellnessChart(days);
    const hasWell = hasAnyData(wellData, ["energy", "mood", "sleep"]);

    return (
      <div style={{ flex: 1, padding: 16, overflowY: "auto", paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h1 style={{ fontSize: 20 * fs, fontWeight: 700, margin: 0 }}>Reports</h1>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }} role="tablist">
          {["week", "month"].map((p) => (<button key={p} onClick={() => setTrendPeriod(p)} style={{ flex: 1, padding: 8, borderRadius: 10, border: `1px solid ${p === trendPeriod ? acc : brd}`, background: p === trendPeriod ? acc + "15" : "transparent", color: p === trendPeriod ? acc : t2, fontSize: 14 * fs, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", minHeight: 44 }} role="tab" aria-selected={p === trendPeriod}>{p}</button>))}
        </div>

        {selIllnesses.map((ilId) => {
          const il = allIllnesses.find((x) => x.id === ilId); if (!il) return null;
          const chartData = buildChartData(ilId, days);
          const hasSev = hasAnyData(chartData, ["severity"]);
          return (
            <div key={ilId} style={{ background: card, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${brd}` }}>
              <h3 style={{ fontSize: 13 * fs, fontWeight: 600, margin: "0 0 8px", color: t2 }}>{il.icon} {il.label} — Severity</h3>
              {hasSev ? (
                <ResponsiveContainer width="100%" height={140 * fs}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 9 * fs, fill: t2 }} interval={days > 7 ? 4 : 0} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 9 * fs, fill: t2 }} width={20} />
                    <Tooltip contentStyle={{ fontSize: 11 * fs, borderRadius: 8, background: card, border: `1px solid ${brd}` }} />
                    <Line type="monotone" dataKey="severity" stroke={CB[3]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls name="Severity" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ fontSize: 13 * fs, color: t2, textAlign: "center", padding: "20px 0" }}>No data yet. Start tracking to see trends.</p>
              )}
            </div>
          );
        })}

        {trackWellness && (
          <div style={{ background: card, borderRadius: 14, padding: 12, marginBottom: 12, border: `1px solid ${brd}` }}>
            <h3 style={{ fontSize: 13 * fs, fontWeight: 600, margin: "0 0 8px", color: t2 }}>Wellness</h3>
            {hasWell ? (
              <ResponsiveContainer width="100%" height={140 * fs}>
                <LineChart data={wellData}>
                  <XAxis dataKey="day" tick={{ fontSize: 9 * fs, fill: t2 }} interval={days > 7 ? 4 : 0} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 9 * fs, fill: t2 }} width={20} />
                  <Tooltip contentStyle={{ fontSize: 11 * fs, borderRadius: 8, background: card, border: `1px solid ${brd}` }} />
                  <Legend wrapperStyle={{ fontSize: 10 * fs }} />
                  {selTracking.includes("energy") && <Line type="monotone" dataKey="energy" stroke={CB[0]} strokeWidth={2} dot={{ r: 2 }} connectNulls name="Energy ⚡" />}
                  {selTracking.includes("mood") && <Line type="monotone" dataKey="mood" stroke={CB[2]} strokeWidth={2} dot={{ r: 2 }} connectNulls name="Mood ☺" strokeDasharray="6 3" />}
                  {selTracking.includes("sleep") && <Line type="monotone" dataKey="sleep" stroke={CB[5]} strokeWidth={2} dot={{ r: 2 }} connectNulls name="Sleep ☾" strokeDasharray="4 4" />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: 13 * fs, color: t2, textAlign: "center", padding: "20px 0" }}>No wellness data yet.</p>
            )}
          </div>
        )}

        <div style={{ background: card, borderRadius: 14, padding: 14, marginBottom: 12, border: `1px solid ${brd}` }}>
          <h3 style={{ fontSize: 14 * fs, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}><Star size={16 * fs} color={orn} /> Top Remedies</h3>
          {actionLog.filter((a) => a.result === "helped").length === 0 ? (
            <p style={{ fontSize: 13 * fs, color: t2 }}>Try some remedies to see what works best for you.</p>
          ) : selIllnesses.map((ilId) => {
            const il = allIllnesses.find((x) => x.id === ilId);
            const helped = actionLog.filter((a) => a.illness === ilId && a.result === "helped");
            if (!helped.length || !il) return null;
            const counts = {};
            helped.forEach((a) => { counts[a.remedy] = (counts[a.remedy] || 0) + 1; });
            const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            const st = getStats(ilId, best[0]);
            return (
              <div key={ilId} style={{ padding: "8px 0", borderBottom: `1px solid ${brd}` }}>
                <div style={{ fontSize: 12 * fs, color: t2, fontWeight: 600 }}>{il.icon} {il.label}</div>
                <div style={{ fontSize: 14 * fs, fontWeight: 600, color: t1 }}>{best[0]}</div>
                <div style={{ fontSize: 11 * fs, color: acc2 }}>✓ {st.helped}/{st.total} ({st.rate}%)</div>
              </div>
            );
          })}
        </div>

        {entries.length > 0 && (
          <div style={{ background: card, borderRadius: 14, padding: 14, marginBottom: 12, border: `1px solid ${brd}` }}>
            <h3 style={{ fontSize: 14 * fs, fontWeight: 700, margin: "0 0 10px" }}>Recent Entries</h3>
            {entries.slice(0, 8).map((e) => {
              const il = allIllnesses.find((x) => x.id === e.illness);
              return (
                <div key={e.id} style={{ padding: "6px 0", borderBottom: `1px solid ${brd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13 * fs, fontWeight: 600 }}>{il?.icon} {il?.label} — {e.severity}/10</span>
                    <span style={{ fontSize: 11 * fs, color: t2 }}>{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  {e.triggers?.length > 0 && <div style={{ fontSize: 11 * fs, color: t2 }}>{e.triggers.join(", ")}</div>}
                </div>
              );
            })}
          </div>
        )}

        {entries.length === 0 && actionLog.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 15 * fs, color: t2 }}>No data yet.</p>
            <p style={{ fontSize: 13 * fs, color: t2 }}>Start checking in to see your trends here.</p>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════ */
  /*               SETTINGS                      */
  /* ═══════════════════════════════════════════ */
  const SettingsView = () => {
    const prof = profiles.find((p) => p.id === activeProfileId);
    return (
      <div style={{ flex: 1, padding: 16, overflowY: "auto", paddingBottom: 80 }}>
        <h1 style={{ fontSize: 20 * fs, fontWeight: 700, margin: "0 0 16px" }}>Settings</h1>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: 0 }}>Profile: {userName}</h3>
            <button onClick={() => { setActiveProfileId(null); resetFlow(); setScreen("home"); setSetupDone(false); setSetupStep(0); setSelIllnesses([]); setSelTracking([]); setEntries([]); setActionLog([]); setCheckins([]); setWellness([]); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: acc, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 36 }}><LogOut size={14} />Switch</button>
          </div>
          {prof?.pin && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}><Shield size={14} color={acc2} /><span style={{ fontSize: 12, color: acc2, fontWeight: 600 }}>PIN protected</span></div>}
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}` }}>
          <h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: "0 0 10px" }}>Text Size</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {["S", "M", "L", "XL"].map((l, i) => (<button key={l} onClick={() => setTextSize(i)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${i === textSize ? acc : brd}`, background: i === textSize ? acc + "15" : "transparent", color: i === textSize ? acc : t2, fontSize: [13, 15, 18, 21][i], fontWeight: i === textSize ? 700 : 500, cursor: "pointer", minHeight: 44 }} aria-pressed={i === textSize}>{l}</button>))}
          </div>
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: 0 }}>Dark Mode</h3></div>
          <button onClick={() => setDark(!dark)} style={{ width: 52, height: 30, borderRadius: 15, background: dark ? acc : brd, border: "none", cursor: "pointer", position: "relative", minWidth: 52 }} aria-pressed={dark} role="switch">
            <div style={{ width: 24, height: 24, borderRadius: 12, background: "#fff", position: "absolute", top: 3, left: dark ? 25 : 3, transition: reducedMotion ? "none" : "left 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>{dark ? <Moon size={13} color={acc} /> : <Sun size={13} color={orn} />}</div>
          </button>
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: 0 }}>Reduced Motion</h3></div>
          <button onClick={() => setReducedMotion(!reducedMotion)} style={{ width: 52, height: 30, borderRadius: 15, background: reducedMotion ? acc : brd, border: "none", cursor: "pointer", position: "relative", minWidth: 52 }} aria-pressed={reducedMotion} role="switch">
            <div style={{ width: 24, height: 24, borderRadius: 12, background: "#fff", position: "absolute", top: 3, left: reducedMotion ? 25 : 3 }} />
          </button>
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}` }}>
          <h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: "0 0 8px" }}>Voice</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => speak("Voice is working.")} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${acc}`, background: acc + "12", color: acc, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44 }}><Volume2 size={16} />Test Speech</button>
            <button onClick={() => startListen(() => {})} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${acc2}`, background: acc2 + "12", color: acc2, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44 }}><Mic size={16} />Test Mic</button>
          </div>
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${brd}` }}>
          <h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: "0 0 8px" }}>My Conditions</h3>
          {selIllnesses.map((id) => {
            const il = allIllnesses.find((x) => x.id === id);
            return il ? (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${brd}` }}>
                <span style={{ fontSize: 15 * fs }}>{il.icon} {il.label}</span>
                <button onClick={() => setSelIllnesses((p) => p.filter((x) => x !== id))} style={{ background: red + "12", border: "none", borderRadius: 8, padding: "4px 10px", color: red, fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 36 }}>Remove</button>
              </div>
            ) : null;
          })}
          <button onClick={() => setAddingCondition(true)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, background: "none", border: "none", color: acc, fontSize: 14 * fs, fontWeight: 600, cursor: "pointer", minHeight: 44 }}><Plus size={16} />Add condition</button>
        </div>

        <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${brd}` }}>
          <h3 style={{ fontSize: 14 * fs, fontWeight: 600, margin: "0 0 8px", color: red }}>Danger Zone</h3>
          <button onClick={() => {
            if (window.confirm("Delete ALL your data? This cannot be undone.")) {
              deleteData(`${pk}-profile`);
              deleteData(`${pk}-data`);
              deleteData(`${pk}-prefs`);
              const up = profiles.filter((p) => p.id !== activeProfileId);
              setProfiles(up);
              saveData("ns-profiles", up);
              setActiveProfileId(null);
              setSetupDone(false); setSetupStep(0);
              setSelIllnesses([]); setSelTracking([]);
              setEntries([]); setActionLog([]);
              setCheckins([]); setWellness([]);
            }
          }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${red}`, background: red + "12", color: red, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={14} />Delete My Profile & Data</button>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════ */
  /*                 HOME                         */
  /* ═══════════════════════════════════════════ */
  const HomeScreen = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 24 }}>🥄</span>
            <h1 style={{ fontSize: 20 * fs, fontWeight: 700, margin: 0 }}>No Spoons</h1>
          </div>
          <p style={{ fontSize: 16 * fs, color: t1, margin: "8px 0 0", fontWeight: 600 }}>{greeting}, {userName}</p>
          <p style={{ fontSize: 13 * fs, color: t2, margin: "2px 0 0" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          {selIllnesses.map((id) => {
            const il = allIllnesses.find((x) => x.id === id);
            if (!il) return null;
            const already = alreadyCheckedIn(id);
            const streak = calcStreak(id);
            return (
              <button key={id} onClick={() => { setActiveIllness(id); setFlowStep("question"); setScreen("illness"); }} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: `${22 * fs}px ${20 * fs}px`, borderRadius: 18, border: `1px solid ${already ? acc2 : brd}`, background: card, cursor: "pointer", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", minHeight: 80 }} aria-label={il.label}>
                <span style={{ fontSize: 36 * fs }}>{il.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 19 * fs, fontWeight: 700, color: t1 }}>{il.label}</div>
                  <div style={{ fontSize: 13 * fs, color: t2, marginTop: 2 }}>
                    {already ? <span style={{ color: acc2 }}>✓ Checked in</span> : <span>Tap to check in</span>}
                    {streak > 0 && <span> · 🔥 {streak}d streak</span>}
                  </div>
                </div>
                <ArrowRight size={20 * fs} color={t2} />
              </button>
            );
          })}
          <button onClick={() => setAddingCondition(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: 18, borderRadius: 18, border: `2px dashed ${brd}`, background: "transparent", cursor: "pointer", color: t2, fontSize: 16 * fs, fontWeight: 500, minHeight: 64 }}>
            <Plus size={20} /> Add condition
          </button>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════ */
  /*               ROOT RENDER                    */
  /* ═══════════════════════════════════════════ */
  return (
    <div style={containerStyle}>
      <div style={{ height: 44, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 12 * fs, fontWeight: 600, color: t2 }}>No Spoons</span>
      </div>
      {screen === "illness" ? <IllnessFlow /> : screen === "reports" ? <Reports /> : screen === "settings" ? <SettingsView /> : <HomeScreen />}
      {screen !== "illness" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 390, background: card, borderTop: `1px solid ${brd}`, display: "flex", padding: "6px 0 22px", zIndex: 100 }} role="tablist">
          {[{ s: "home", icon: Home, l: "Home" }, { s: "reports", icon: TrendingUp, l: "Reports" }, { s: "settings", icon: Settings, l: "Settings" }].map((n) => (
            <button key={n.s} onClick={() => setScreen(n.s)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: screen === n.s ? acc : t2, minHeight: 44 }} role="tab" aria-selected={screen === n.s}>
              <n.icon size={22 * fs} /><span style={{ fontSize: 10 * fs, fontWeight: screen === n.s ? 700 : 400 }}>{n.l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
