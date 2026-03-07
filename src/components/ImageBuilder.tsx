"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = "info" | "cmd" | "ok" | "warn" | "err" | "dim";

interface LogLine {
  id: number;
  time: string;
  step: string;
  text: string;
  level: LogLevel;
}

interface BuildArg {
  id: number;
  key: string;
  value: string;
}

interface PipelineStep {
  id: number;
  name: string;
  status: "done" | "running" | "waiting";
  duration?: string;
}

interface RecentImage {
  id: number;
  emoji: string;
  name: string;
  branch: string;
  base: string;
  badgeType: "cyan" | "green" | "amber" | "red";
  badgeText: string;
}

type BuildStatus = "idle" | "building" | "success" | "failed";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_IMAGES: RecentImage[] = [
  { id: 1, emoji: "🐳", name: "api-gateway",    branch: "main",        base: "node:20-alpine",  badgeType: "cyan",  badgeText: "latest" },
  { id: 2, emoji: "⚙️", name: "worker-service", branch: "dev",         base: "python:3.12",     badgeType: "green", badgeText: "✓"      },
  { id: 3, emoji: "🔧", name: "db-migrator",    branch: "release",     base: "postgres:16",     badgeType: "amber", badgeText: "!"      },
  { id: 4, emoji: "📦", name: "frontend-app",   branch: "feat/v3",     base: "nginx:alpine",    badgeType: "red",   badgeText: "✗"      },
];

const INITIAL_STEPS: PipelineStep[] = [
  { id: 1, name: "Pull base image",       status: "done",    duration: "0.8s" },
  { id: 2, name: "Install dependencies",  status: "done",    duration: "5.4s" },
  { id: 3, name: "Compile source",        status: "done",    duration: "2.1s" },
  { id: 4, name: "Push to registry",      status: "running"                   },
  { id: 5, name: "Vulnerability scan",    status: "waiting"                   },
];

const SEED_LOGS: Omit<LogLine, "id">[] = [
  { time: "12:04:01", step: "#0", level: "dim",  text: "BuildKit v0.14.1 initialized"                        },
  { time: "12:04:01", step: "#1", level: "dim",  text: "loading build definition from Dockerfile"            },
  { time: "12:04:01", step: "#2", level: "cmd",  text: "FROM node:20-alpine AS base"                         },
  { time: "12:04:02", step: "#2", level: "ok",   text: "✓ CACHED node:20-alpine (local)"                     },
  { time: "12:04:02", step: "#3", level: "cmd",  text: "WORKDIR /app"                                        },
  { time: "12:04:02", step: "#4", level: "cmd",  text: "COPY package*.json ./"                               },
  { time: "12:04:03", step: "#5", level: "cmd",  text: "RUN npm ci --only=production"                        },
  { time: "12:04:04", step: "#5", level: "warn", text: "npm warn deprecated inflight@1.0.6"                  },
  { time: "12:04:09", step: "#5", level: "ok",   text: "added 312 packages in 5.4s"                          },
  { time: "12:04:09", step: "#6", level: "cmd",  text: "COPY . ."                                            },
  { time: "12:04:10", step: "#7", level: "cmd",  text: "RUN npm run build"                                   },
  { time: "12:04:11", step: "#7", level: "info", text: "→ Building for production..."                        },
  { time: "12:04:12", step: "#7", level: "info", text: "→ Bundling with esbuild..."                          },
  { time: "12:04:13", step: "#7", level: "info", text: "  dist/index.js   238kb"                             },
  { time: "12:04:13", step: "#7", level: "ok",   text: "✓ Build complete"                                    },
  { time: "12:04:14", step: "#8", level: "cmd",  text: "EXPOSE 3000"                                         },
  { time: "12:04:14", step: "#8", level: "cmd",  text: 'CMD ["node", "dist/index.js"]'                       },
  { time: "12:04:14", step: "#9", level: "info", text: "writing image sha256:a3f9..."                        },
  { time: "12:04:14", step: "#9", level: "info", text: "pushing to ghcr.io/myorg/api-gateway:v2.1.0"         },
];

const PUSH_LOGS: Omit<LogLine, "id">[] = [
  { time: "", step: "#9",  level: "info", text: "→ Uploading layer sha256:c4f2... (1/4)" },
  { time: "", step: "#9",  level: "info", text: "→ Uploading layer sha256:77ab... (2/4)" },
  { time: "", step: "#9",  level: "info", text: "→ Uploading layer sha256:d11e... (3/4)" },
  { time: "", step: "#9",  level: "info", text: "→ Uploading layer sha256:a3f9... (4/4)" },
  { time: "", step: "#9",  level: "ok",   text: "✓ Pushed to ghcr.io/myorg/api-gateway:v2.1.0" },
  { time: "", step: "#9",  level: "ok",   text: "✓ Pushed tag: latest" },
  { time: "", step: "#9",  level: "ok",   text: "✓ Pushed tag: stable" },
  { time: "", step: "#10", level: "cmd",  text: "Running Trivy vulnerability scan..." },
  { time: "", step: "#10", level: "ok",   text: "✓ No HIGH/CRITICAL vulnerabilities found" },
  { time: "", step: "#11", level: "ok",   text: "✓ BUILD SUCCESSFUL  — Total: 24.2s  Image: 142MB" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _lid = 100;
const uid = () => ++_lid;

function nowTime() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function fmtTimer(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({ type, text }: { type: RecentImage["badgeType"]; text: string }) => {
  const map: Record<string, string> = {
    cyan:  "bg-cyan-500/20  text-cyan-400  border border-cyan-500/40",
    green: "bg-green-500/20 text-green-400 border border-green-500/40",
    amber: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    red:   "bg-red-500/20   text-red-400   border border-red-500/40",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${map[type]}`}>
      {text}
    </span>
  );
};

const Toggle = ({ defaultOn = false }: { defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-[22px] rounded-full relative transition-all duration-200 shrink-0 ${
        on ? "bg-cyan-400 shadow-[0_0_10px_rgba(0,212,255,.35)]" : "bg-[#252a3a]"
      }`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          on ? "translate-x-[21px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
};

const StepIcon = ({ status }: { status: PipelineStep["status"] }) => {
  if (status === "done")
    return (
      <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400 shrink-0">
        ✓
      </span>
    );
  if (status === "running")
    return (
      <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400 animate-pulse shrink-0">
        ●
      </span>
    );
  return (
    <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-[#4a5568] bg-transparent border border-[#252a3a] shrink-0">
      ○
    </span>
  );
};

const LogRow = ({ line, isLast }: { line: LogLine; isLast: boolean }) => {
  const color: Record<LogLevel, string> = {
    info: "text-slate-200",
    cmd:  "text-cyan-400",
    ok:   "text-green-400",
    warn: "text-amber-400",
    err:  "text-red-400",
    dim:  "text-slate-500",
  };
  return (
    <div className="flex gap-2.5 mb-0.5 animate-[fadeUp_.2s_ease]">
      <span className="text-slate-600 shrink-0 w-14">{line.time || nowTime()}</span>
      <span className="text-slate-500 shrink-0 w-5">{line.step}</span>
      <span className={`flex-1 break-all ${color[line.level]}`}>
        {line.text}
        {isLast && line.level !== "ok" && (
          <span className="inline-block w-[7px] h-3 bg-cyan-400 ml-1 animate-[blink_.7s_steps(1)_infinite] rounded-[1px] align-middle" />
        )}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageBuilder() {
  // Config state
  const [imageName,   setImageName]   = useState("api-gateway");
  const [tag,         setTag]         = useState("v2.1.0");
  const [dockerfile,  setDockerfile]  = useState("./Dockerfile");
  const [context,     setContext]     = useState(".");
  const [baseImage,   setBaseImage]   = useState("node:20-alpine");
  const [platform,    setPlatform]    = useState("linux/amd64");
  const [target,      setTarget]      = useState("production");
  const [registry,    setRegistry]    = useState("ghcr.io/myorg");
  const [credential,  setCredential]  = useState("GHCR_TOKEN");

  const [tags,     setTags]     = useState(["latest", "v2.1.0", "stable"]);
  const [tagInput, setTagInput] = useState("");

  const [buildArgs, setBuildArgs] = useState<BuildArg[]>([
    { id: 1, key: "NODE_ENV", value: "production" },
    { id: 2, key: "PORT",     value: "3000"       },
  ]);

  // Build state
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("building");
  const [logs,        setLogs]        = useState<LogLine[]>(
    SEED_LOGS.map((l) => ({ ...l, id: uid() }))
  );
  const [steps,       setSteps]       = useState<PipelineStep[]>(INITIAL_STEPS);
  const [progress,    setProgress]    = useState(62);
  const [elapsed,     setElapsed]     = useState(14);
  const [activeImage, setActiveImage] = useState(1);
  const [activeTab,   setActiveTab]   = useState("Configuration");

  const logRef      = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildDone   = useRef(false);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Simulate push logs on mount
  useEffect(() => {
    PUSH_LOGS.forEach((l, i) => {
      setTimeout(() => {
        if (buildDone.current) return;
        const pct = Math.min(62 + Math.round(((i + 1) / PUSH_LOGS.length) * 38), 100);
        setProgress(pct);
        setLogs((prev) => [...prev, { ...l, id: uid(), time: nowTime() }]);

        if (i === PUSH_LOGS.length - 1) {
          buildDone.current = true;
          setBuildStatus("success");
          setProgress(100);
          setSteps((prev) =>
            prev.map((s) =>
              s.status === "running" ? { ...s, status: "done", duration: "3.2s" } :
              s.status === "waiting" ? { ...s, status: "done", duration: "1.8s" } : s
            )
          );
        }
      }, (i + 1) * 1200);
    });
  }, []);

  // Start fresh build
  const handleBuild = useCallback(() => {
    buildDone.current = false;
    setBuildStatus("building");
    setProgress(0);
    setElapsed(0);
    setLogs([{ id: uid(), time: nowTime(), step: "#0", level: "dim", text: "Starting new build…" }]);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "waiting" as const, duration: undefined })));

    // Re-run seed then push logs
    [...SEED_LOGS, ...PUSH_LOGS].forEach((l, i) => {
      setTimeout(() => {
        if (buildDone.current && i >= SEED_LOGS.length) return;
        setLogs((prev) => [...prev, { ...l, id: uid(), time: nowTime() }]);
        const total = SEED_LOGS.length + PUSH_LOGS.length;
        const pct = Math.round(((i + 1) / total) * 100);
        setProgress(pct);

        // Update steps visually
        if (i === 1)  setSteps((p) => p.map((s) => s.id === 1 ? { ...s, status: "running" } : s));
        if (i === 4)  setSteps((p) => p.map((s) => s.id === 1 ? { ...s, status: "done", duration: "0.8s" } : s.id === 2 ? { ...s, status: "running" } : s));
        if (i === 8)  setSteps((p) => p.map((s) => s.id === 2 ? { ...s, status: "done", duration: "5.4s" } : s.id === 3 ? { ...s, status: "running" } : s));
        if (i === 14) setSteps((p) => p.map((s) => s.id === 3 ? { ...s, status: "done", duration: "2.1s" } : s.id === 4 ? { ...s, status: "running" } : s));
        if (i === SEED_LOGS.length + PUSH_LOGS.length - 1) {
          buildDone.current = true;
          setBuildStatus("success");
          setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "done" as const, duration: s.duration ?? "—" })));
        }
      }, i * 300);
    });
  }, []);

  // Tag helpers
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = tagInput.trim().replace(",", "");
      if (v && !tags.includes(v)) setTags([...tags, v]);
      setTagInput("");
    }
  };

  // Build arg helpers
  const updateArg = (id: number, field: "key" | "value", val: string) =>
    setBuildArgs((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  const removeArg = (id: number) => setBuildArgs((prev) => prev.filter((a) => a.id !== id));
  const addArg    = () => setBuildArgs((prev) => [...prev, { id: uid(), key: "", value: "" }]);

  // Status badge
  const statusBadge = {
    idle:     { cls: "bg-slate-500/20 text-slate-400",                        label: "IDLE"     },
    building: { cls: "bg-amber-500/20 text-amber-400 animate-pulse",          label: "BUILDING" },
    success:  { cls: "bg-green-500/20 text-green-400",                        label: "SUCCESS"  },
    failed:   { cls: "bg-red-500/20   text-red-400",                          label: "FAILED"   },
  }[buildStatus];

  const NAV_TABS   = ["Builder", "Registry", "Pipelines", "Artifacts"];
  const BUILD_TABS = ["Configuration", "Dockerfile", "Environment", "History"];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen bg-[#0a0c10] text-slate-200 overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.05) 2px,rgba(0,0,0,.05) 4px)",
        }}
      />

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-7 h-[54px] bg-[#0f1117] border-b border-[#1e2230] sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
          <span
            className="w-7 h-7 bg-cyan-400 flex items-center justify-center text-[#0a0c10] text-[10px] font-black"
            style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }}
          >
            ⬡
          </span>
          BuildForge
        </div>

        <div className="flex gap-0.5">
          {NAV_TABS.map((t) => (
            <button
              key={t}
              className={`px-4 py-1.5 rounded text-[11px] transition-all ${
                t === "Builder"
                  ? "bg-cyan-400/20 text-cyan-400"
                  : "text-slate-500 hover:bg-[#1e2230] hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-green-400 shadow-[0_0_8px_#00ff87] animate-pulse" />
          <span className="text-[10px] text-slate-500">daemon:running</span>
          <div className="w-[30px] h-[30px] rounded-md bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white">
            KH
          </div>
        </div>
      </nav>

      {/* ── WORKSPACE ── */}
      <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "240px 1fr 320px" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="bg-[#0f1117] border-r border-[#1e2230] flex flex-col overflow-y-auto">
          {/* Recent images */}
          <div className="px-4 pt-5 pb-2">
            <p className="text-[10px] tracking-widest uppercase text-slate-600 mb-2.5">Recent Images</p>
            {RECENT_IMAGES.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-1 border transition-all text-left ${
                  activeImage === img.id
                    ? "bg-cyan-400/10 border-cyan-400/40"
                    : "bg-transparent border-transparent hover:bg-[#1e2230]"
                }`}
              >
                <span className="w-7 h-7 rounded flex items-center justify-center bg-[#1e2230] shrink-0 text-sm">
                  {img.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium truncate ${activeImage === img.id ? "text-cyan-400" : "text-slate-200"}`}>
                    {img.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{img.branch} · {img.base}</p>
                </div>
                <Badge type={img.badgeType} text={img.badgeText} />
              </button>
            ))}
          </div>

          <div className="mx-4 h-px bg-[#1e2230] my-1" />

          {/* Registries */}
          <div className="px-4 py-3">
            <p className="text-[10px] tracking-widest uppercase text-slate-600 mb-2.5">Registries</p>
            {["ghcr.io/myorg", "registry.hub.docker"].map((r, i) => (
              <div key={r} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#1e2230] cursor-pointer mb-1">
                <span className="w-7 h-7 rounded bg-[#1e2230] flex items-center justify-center text-sm">{i === 0 ? "🌐" : "☁️"}</span>
                <div>
                  <p className="text-[11px] text-slate-200">{r}</p>
                  <p className="text-[10px] text-slate-500">{i === 0 ? "GitHub Container" : "Docker Hub"}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-4 h-px bg-[#1e2230] my-1" />

          {/* Stats */}
          <div className="px-4 py-3">
            <p className="text-[10px] tracking-widest uppercase text-slate-600 mb-2.5">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Builds Today", value: "24",  color: "text-cyan-400"   },
                { label: "Success",      value: "91%", color: "text-green-400"  },
                { label: "Avg Time",     value: "2m4s",color: "text-amber-400"  },
                { label: "Cache Hit",    value: "78%", color: "text-purple-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#13161e] border border-[#252a3a] rounded-md p-2.5">
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex flex-col overflow-hidden bg-[#0a0c10]">
          {/* Header */}
          <div className="px-7 pt-5 border-b border-[#1e2230] shrink-0">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] text-slate-500 mb-1">
                  workspace / <span className="text-cyan-400">api-gateway</span> / new build
                </p>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Build Image
                </h1>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#252a3a] text-slate-500 hover:border-slate-500 hover:text-slate-200 text-[11px] transition-all">
                  ⤴ Import Config
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#252a3a] text-slate-500 hover:border-slate-500 hover:text-slate-200 text-[11px] transition-all">
                  💾 Save Draft
                </button>
                <button
                  onClick={handleBuild}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-cyan-400 text-[#0a0c10] text-[11px] font-bold hover:shadow-[0_0_24px_rgba(0,212,255,.45)] transition-all hover:-translate-y-px active:translate-y-0"
                >
                  ▶ Run Build
                </button>
              </div>
            </div>

            <div className="flex">
              {BUILD_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 text-[11px] border-b-2 transition-all bg-transparent border-t-0 border-l-0 border-r-0 ${
                    activeTab === t
                      ? "text-cyan-400 border-cyan-400"
                      : "text-slate-500 border-transparent hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Config Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

            {/* Source */}
            <SectionTitle>Source</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Image Name" required hint="Lowercase letters, numbers, hyphens only">
                <input className={inputCls} value={imageName} onChange={(e) => setImageName(e.target.value)} placeholder="my-image" />
              </Field>
              <Field label="Tag" required>
                <input className={inputCls} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="latest" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Dockerfile Path">
                <input className={inputCls} value={dockerfile} onChange={(e) => setDockerfile(e.target.value)} />
              </Field>
              <Field label="Build Context">
                <input className={inputCls} value={context} onChange={(e) => setContext(e.target.value)} />
              </Field>
            </div>

            {/* Base Image */}
            <SectionTitle>Base Image</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Base Image">
                <select className={inputCls} value={baseImage} onChange={(e) => setBaseImage(e.target.value)}>
                  {["node:20-alpine","node:20-slim","python:3.12-alpine","ubuntu:22.04","debian:bookworm-slim"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Platform">
                <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {["linux/amd64","linux/arm64","linux/amd64,linux/arm64"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Build Target">
                <input className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="production" />
              </Field>
            </div>

            {/* Tags */}
            <SectionTitle>Additional Tags</SectionTitle>
            <Field label="Push Tags">
              <div
                className="bg-[#13161e] border border-[#252a3a] rounded-md px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:border-cyan-400 focus-within:shadow-[0_0_0_3px_rgba(0,212,255,.15)] transition-all"
                onClick={() => document.getElementById("tagInput")?.focus()}
              >
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-cyan-400/15 text-cyan-400 rounded px-2 py-0.5 text-[11px]">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100 leading-none">×</button>
                  </span>
                ))}
                <input
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="add tag…"
                  className="bg-transparent outline-none text-[12px] text-slate-200 flex-1 min-w-[80px] px-1 py-0.5 placeholder:text-slate-600"
                />
              </div>
            </Field>

            {/* Build Args */}
            <SectionTitle>Build Arguments</SectionTitle>
            <div className="flex flex-col gap-2">
              {buildArgs.map((arg) => (
                <div key={arg.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 32px" }}>
                  <input className={inputCls} placeholder="KEY"   value={arg.key}   onChange={(e) => updateArg(arg.id, "key",   e.target.value)} />
                  <input className={inputCls} placeholder="VALUE" value={arg.value} onChange={(e) => updateArg(arg.id, "value", e.target.value)} />
                  <button
                    onClick={() => removeArg(arg.id)}
                    className="w-8 h-8 rounded flex items-center justify-center bg-[#1e2230] border border-[#252a3a] text-slate-500 hover:bg-red-400/20 hover:border-red-400 hover:text-red-400 transition-all"
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                onClick={addArg}
                className="w-full py-2 rounded border border-[#252a3a] text-slate-500 hover:border-slate-500 hover:text-slate-200 text-[11px] transition-all"
              >
                + Add Build Argument
              </button>
            </div>

            {/* Options */}
            <SectionTitle>Build Options</SectionTitle>
            <div className="flex flex-col gap-2">
              {[
                { title: "Use Layer Cache",           desc: "Reuse cached layers to speed up builds",          defaultOn: true  },
                { title: "Push to Registry",          desc: "Automatically push image after successful build", defaultOn: true  },
                { title: "Scan for Vulnerabilities",  desc: "Run Trivy scan on the built image",               defaultOn: false },
                { title: "BuildKit (experimental)",   desc: "Use Docker BuildKit for parallel builds",         defaultOn: true  },
              ].map((o) => (
                <div key={o.title} className="flex items-center justify-between px-3.5 py-3 bg-[#13161e] border border-[#252a3a] rounded-md">
                  <div>
                    <p className="text-[12px] text-slate-200">{o.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{o.desc}</p>
                  </div>
                  <Toggle defaultOn={o.defaultOn} />
                </div>
              ))}
            </div>

            {/* Registry */}
            <SectionTitle>Registry</SectionTitle>
            <div className="grid grid-cols-2 gap-4 pb-10">
              <Field label="Target Registry">
                <select className={inputCls} value={registry} onChange={(e) => setRegistry(e.target.value)}>
                  {["ghcr.io/myorg","docker.io/myuser","123456789.dkr.ecr.us-east-1.amazonaws.com"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Credential Secret">
                <select className={inputCls} value={credential} onChange={(e) => setCredential(e.target.value)}>
                  {["GHCR_TOKEN","DOCKERHUB_TOKEN","AWS_ECR_CREDS"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>

          </div>
        </main>

        {/* ── RIGHT LOG PANEL ── */}
        <aside className="bg-[#0f1117] border-l border-[#1e2230] flex flex-col overflow-hidden">
          {/* Log header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e2230] shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              Build Output
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusBadge.cls}`}>
                ● {statusBadge.label}
              </span>
            </div>
            <button className="text-[10px] px-2.5 py-1 rounded border border-[#252a3a] text-slate-500 hover:text-slate-200 transition-all">
              ⬇ Download
            </button>
          </div>

          {/* Log body */}
          <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3.5 text-[11px] leading-relaxed">
            {logs.map((line, i) => (
              <LogRow key={line.id} line={line} isLast={i === logs.length - 1} />
            ))}
          </div>

          {/* Pipeline steps */}
          <div className="border-t border-[#1e2230] px-4 py-3 shrink-0">
            <p className="text-[10px] tracking-widest uppercase text-slate-600 mb-2.5">Pipeline Steps</p>
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#1e2230] last:border-0">
                <StepIcon status={s.status} />
                <span className="flex-1 text-[11px] text-slate-200">{s.name}</span>
                <span className="text-[10px] text-slate-500">{s.duration ?? "—"}</span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="border-t border-[#1e2230] px-4 pt-3 pb-10 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500">Overall Progress</span>
              <span className="text-[11px] text-cyan-400 font-semibold">{progress}%</span>
            </div>
            <div className="h-1 bg-[#252a3a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,212,255,.6)]"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #00d4ff, #a855f7)",
                }}
              />
            </div>
          </div>
        </aside>

      </div>

      {/* ── STATUS BAR ── */}
      <footer className="fixed bottom-0 left-0 right-0 h-6 bg-cyan-400 flex items-center gap-5 px-4 text-[10px] font-semibold text-[#0a0c10] z-50">
        <span>▶ BuildForge v3.2.1</span>
        <span className="opacity-40">│</span>
        <span>🐳 Docker 26.1.4</span>
        <span className="opacity-40">│</span>
        <span>⚡ BuildKit enabled</span>
        <span className="opacity-40">│</span>
        <span>⏱ {fmtTimer(elapsed)}</span>
        <span className="opacity-40">│</span>
        <span>🏠 workspace: myorg</span>
      </footer>
    </div>
  );
}

// ─── Micro helpers ────────────────────────────────────────────────────────────

const inputCls =
  "bg-[#13161e] border border-[#252a3a] rounded-md text-slate-200 text-[12px] px-3 py-2 outline-none w-full transition-all focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(0,212,255,.15)] placeholder:text-slate-600 appearance-none";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase text-slate-600">
      {children}
      <span className="flex-1 h-px bg-[#1e2230]" />
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-widest uppercase text-slate-500">
        {label}
        {required && <span className="text-cyan-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}
