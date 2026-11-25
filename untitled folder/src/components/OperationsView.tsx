import React, { useEffect, useRef, useState } from 'react';
import { FloorData, NetworkExceptionState, PrimaryTab, StaffIssue } from '../types/library';
import {
  ETHICAL_SAFEGUARDS,
  FUTURE_ROADMAP,
  OFFICIAL_LIBRARY_LINKS,
  USABILITY_TASKS,
  WEBSITE_COMPARISON,
} from '../data/libraryInitialData';
import {
  ClipboardCheck,
  Copy,
  ExternalLink,
  EyeOff,
  Layers,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  ArrowUpRight,
  Compass,
} from 'lucide-react';

interface OperationsViewProps {
  floors: FloorData[];
  issues: StaffIssue[];
  networkState: NetworkExceptionState;
  onResolveIssue: (issueId: string) => void;
  onNavigateTab: (tab: PrimaryTab) => void;
  onNotify: (msg: string) => void;
}

const HMW_TRACEABILITY: {
  painPoint: string;
  solution: string;
  tab: PrimaryTab;
  actionLabel: string;
}[] = [
  {
    painPoint: 'Walking floors to find occupancy & free call booths',
    solution: '3D Spatial Digital Twin with 4-source sensor trust & 15m booth holds',
    tab: 'twin',
    actionLabel: 'Test 3D Twin',
  },
  {
    painPoint: 'Unknown which PC has SPSS, NVivo, Python, MATLAB, or Stata',
    solution: 'Live software-filtered workstation finder with auto-rerouting on faults',
    tab: 'spaces',
    actionLabel: 'Test PCs & Booths',
  },
  {
    painPoint: 'Under-utilised physical books, archives & weak mobile connection',
    solution: 'Source Studio Remix Table, Mystery Capsules & NFC Shelf-to-Phone Sync',
    tab: 'studio',
    actionLabel: 'Test Source Studio',
  },
  {
    painPoint: 'Catalogue sends students to shelves where the book is missing',
    solution: 'RFID shelf timestamps, instant e-book, and AI Book-to-Video visual story reels',
    tab: 'books',
    actionLabel: 'Test Books & Video Story',
  },
  {
    painPoint: 'Static schedules break when rooms warm up or PCs are taken',
    solution: 'Autonomous Session Autopilot & Gemini Assistant with staff handoff',
    tab: 'autopilot',
    actionLabel: 'Test Autopilot',
  },
];

export const OperationsView: React.FC<OperationsViewProps> = ({
  floors,
  issues,
  networkState,
  onResolveIssue,
  onNavigateTab,
  onNotify,
}) => {
  const [camFloorIdx, setCamFloorIdx] = useState<number>(2);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeFloor = floors[camFloorIdx] ?? floors[0];

  // Grouped issue counts for root-cause triage
  const groupedCounts = issues
    .filter((i) => !i.resolved)
    .reduce<Record<string, { count: number; ids: string[]; latest: string }>>((acc, item) => {
      if (!acc[item.detail]) {
        acc[item.detail] = { count: 0, ids: [], latest: item.timestamp };
      }
      acc[item.detail].count += 1;
      acc[item.detail].ids.push(item.id);
      acc[item.detail].latest = item.timestamp;
      return acc;
    }, {});

  const groupedList = Object.entries(groupedCounts);

  // Privacy-preserving anonymised occupancy canvas feed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dots = Array.from({ length: 8 }, (_, i) => ({
      x: (i * 83) % 640,
      y: 168 + i * 3,
      v: 0.45 + (i % 4) * 0.2,
    }));

    const seats: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 10; k++) {
        seats.push([56 + k * 54, 34 + r * 58 + (r > 1 ? 34 : 0)]);
      }
    }
    const taken = Math.round((seats.length * activeFloor.use) / 100);

    let rafId = 0;
    const renderFrame = () => {
      ctx.fillStyle = '#002630';
      ctx.fillRect(0, 0, 640, 340);

      seats.forEach(([sx, sy], i) => {
        ctx.fillStyle = i < taken ? '#E2B979' : '#163A47';
        ctx.fillRect(sx, sy, 34, 24);
      });

      ctx.fillStyle = '#38BDF8';
      dots.forEach((d) => {
        if (networkState === 'ok') {
          d.x = (d.x + d.v) % 640;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText(`${activeFloor.name} · Anonymised Vector Feed (${activeFloor.use}% occupied)`, 16, 322);

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [activeFloor, networkState]);

  const passedCount = USABILITY_TASKS.filter((_, i) => checkedTasks[i]).length;

  const handleCopyResults = async () => {
    const summary = `Sussex Library Live · Group 6 Usability Test: ${passedCount} of ${USABILITY_TASKS.length} tasks passed.`;
    try {
      await navigator.clipboard.writeText(summary);
      onNotify('Usability results copied to clipboard.');
    } catch {
      onNotify(summary);
    }
  };

  return (
    <div className="space-y-8">
      {/* Design Thinking HMW Brief & Traceability */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-2 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Design Thinking Brief · Group 6 Final Prototype
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                How might we reimagine the university library so digital tools match physical spaces for postgraduate students?
              </p>
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            5 Core Journeys Testable
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {HMW_TRACEABILITY.map((item) => (
            <div
              key={item.painPoint}
              className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3.5"
            >
              <div>
                <div className="text-[11px] font-semibold text-amber-700 dark:text-[#E2B979]">
                  Pain Point
                </div>
                <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                  {item.painPoint}
                </div>
                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.solution}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline self-start"
              >
                {item.actionLabel}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Row 1: Staff Triage Console & Anonymised Floor Feed */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Staff Triage Console */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <Wrench className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Staff Operations Triage
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Student reports and sensor flags grouped by root cause so Library, IT, and Estates fix causes once.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {groupedList.length === 0 ? (
              <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-5 text-sm text-slate-600 dark:text-slate-400">
                No active reports. Trigger "Not on shelf", "Software not working", or "Weak signal here" from student tabs to test triage.
              </div>
            ) : (
              groupedList.map(([detail, meta]) => (
                <div
                  key={detail}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
                >
                  <div>
                    <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {detail}
                    </div>
                    <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {meta.count > 1 ? 'Priority Escalated' : 'New Report'} · {meta.count} signal{meta.count > 1 ? 's' : ''} · {meta.latest}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => meta.ids.forEach(onResolveIssue)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anonymised Optical Floor View */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <div className="flex items-start gap-3">
              <EyeOff className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Privacy-Safe Occupancy Feed
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Simulated vector occupancy only — zero faces, zero video storage.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-[#EFECE5] dark:bg-[#00222B] p-1">
              {floors.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCamFloorIdx(idx)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                    camFloorIdx === idx
                      ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <canvas
              ref={canvasRef}
              width={640}
              height={340}
              className="w-full h-auto block"
              aria-label={`Anonymised spatial feed for ${activeFloor.name}`}
            />
          </div>
        </div>
      </section>

      {/* Row 2: Website vs Live Layer Comparison */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Sussex Library Website vs. Live Spatial Layer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bridging existing university catalogue and booking pages with live physical building telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {OFFICIAL_LIBRARY_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Postgraduate Task</th>
                <th className="py-2.5 px-4 font-semibold">Current Website</th>
                <th className="py-2.5 pl-4 font-semibold">Live Spatial Addition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {WEBSITE_COMPARISON.map((row) => (
                <tr key={row.task} className="align-top">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {row.task}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.website}</td>
                  <td className="py-3 pl-4 text-slate-800 dark:text-slate-200">{row.liveLayer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Row 3: Future Roadmap, Ethical Risks & Usability Test Checklist */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              3–5 Year Implementation Roadmap
            </h2>
            <div className="mt-4 space-y-3">
              {FUTURE_ROADMAP.map((stage) => (
                <div
                  key={stage.horizon}
                  className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                      {stage.horizon}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{stage.badge}</span>
                  </div>
                  <div className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {stage.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Privacy & Governance Safeguards
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ETHICAL_SAFEGUARDS.map((item) => (
                <div
                  key={item.principle}
                  className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3.5"
                >
                  <div className="font-display text-xs font-semibold text-slate-900 dark:text-white">
                    {item.principle}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usability Testing Checklist */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                    Group 6 Usability Test Checklist
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Validate each postgraduate task independently without verbal prompting.
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                {passedCount}/{USABILITY_TASKS.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {USABILITY_TASKS.map((task, idx) => (
                <label
                  key={task}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-3.5 py-2.5 text-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedTasks[idx])}
                    onChange={(e) =>
                      setCheckedTasks((prev) => ({ ...prev, [idx]: e.target.checked }))
                    }
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{task}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
              {passedCount} of {USABILITY_TASKS.length} tasks verified
            </span>
            <button
              type="button"
              onClick={handleCopyResults}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2B979] px-3.5 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Results
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
