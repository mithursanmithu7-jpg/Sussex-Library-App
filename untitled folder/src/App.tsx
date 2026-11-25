import React, { useCallback, useEffect, useState } from 'react';
import {
  AutopilotLogEntry,
  AutopilotPlan,
  FloorData,
  LibraryBook,
  LibraryPc,
  NetworkExceptionState,
  PrimaryTab,
  RoomClimate,
  SoftwareName,
  StaffIssue,
  StudyRoomBooking,
} from './types/library';
import {
  INITIAL_BOOKS,
  INITIAL_FLOORS,
  INITIAL_PCS,
  INITIAL_ROOMS,
} from './data/libraryInitialData';
import { SpatialTwinView } from './components/SpatialTwinView';
import { SpacesTechView } from './components/SpacesTechView';
import { CatalogueBooksView } from './components/CatalogueBooksView';
import { SourceStudioView } from './components/SourceStudioView';
import { AutopilotAiView } from './components/AutopilotAiView';
import { OperationsView } from './components/OperationsView';
import { AlertTriangle, CheckCircle2, Moon, Sun, WifiOff } from 'lucide-react';

const NAV_ITEMS: { id: PrimaryTab; label: string }[] = [
  { id: 'twin', label: 'Spatial Twin' },
  { id: 'studio', label: 'Source Studio' },
  { id: 'spaces', label: 'Spaces & Tech' },
  { id: 'books', label: 'Books & Shelf' },
  { id: 'operations', label: 'Operations' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('twin');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [networkState, setNetworkState] = useState<NetworkExceptionState>('ok');

  const [floors] = useState<FloorData[]>(INITIAL_FLOORS);
  const [rooms, setRooms] = useState<RoomClimate[]>(INITIAL_ROOMS);
  const [pcs, setPcs] = useState<LibraryPc[]>(INITIAL_PCS);
  const [books, setBooks] = useState<LibraryBook[]>(INITIAL_BOOKS);
  const [boothsFree, setBoothsFree] = useState<Record<number, number>>({ 2: 5, 3: 2 });
  const [heldBoothFloor, setHeldBoothFloor] = useState<number | null>(null);
  const [boothSecondsLeft, setBoothSecondsLeft] = useState<number>(0);

  const [studyBooking, setStudyBooking] = useState<StudyRoomBooking | null>(null);

  const [points, setPoints] = useState<number>(0);
  const [stairsClimbed, setStairsClimbed] = useState<number>(0);
  const [quietCheckinDone, setQuietCheckinDone] = useState<boolean>(false);
  const [sprintState, setSprintState] = useState<'idle' | 'running' | 'done'>('idle');
  const [syncedBridgeIds, setSyncedBridgeIds] = useState<string[]>([]);
  const [claimedSparkIds, setClaimedSparkIds] = useState<string[]>([]);
  const [joinedConstellationId, setJoinedConstellationId] = useState<string | null>(null);

  const [autopilotPlan, setAutopilotPlan] = useState<AutopilotPlan | null>(null);
  const [autopilotLog, setAutopilotLog] = useState<AutopilotLogEntry[]>([]);
  const [issues, setIssues] = useState<StaffIssue[]>([]);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const notify = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(''), 3800);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const logIssue = useCallback((category: string, detail: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIssues((prev) => [
      {
        id: `iss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category,
        detail,
        timestamp: now,
        resolved: false,
      },
      ...prev,
    ]);
  }, []);

  // 15-minute booth hold countdown timer
  useEffect(() => {
    if (heldBoothFloor === null) return;
    const timer = window.setInterval(() => {
      setBoothSecondsLeft((prev) => {
        if (prev <= 1) {
          setBoothsFree((b) => ({ ...b, [heldBoothFloor]: (b[heldBoothFloor] ?? 0) + 1 }));
          setHeldBoothFloor(null);
          notify('Your 15-minute booth hold expired and was released.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [heldBoothFloor, notify]);

  const handleHoldBooth = (floorNum: number) => {
    if (networkState === 'offline') return;
    if ((boothsFree[floorNum] ?? 0) < 1 || heldBoothFloor !== null) return;
    setBoothsFree((prev) => ({ ...prev, [floorNum]: prev[floorNum] - 1 }));
    setHeldBoothFloor(floorNum);
    setBoothSecondsLeft(15 * 60);
    notify(`Floor ${floorNum} call booth held for 15 minutes.`);
  };

  const handleReleaseBooth = () => {
    if (heldBoothFloor === null) return;
    const f = heldBoothFloor;
    setBoothsFree((prev) => ({ ...prev, [f]: prev[f] + 1 }));
    setHeldBoothFloor(null);
    setBoothSecondsLeft(0);
    notify(`Released Floor ${f} call booth.`);
  };

  const handleReservePc = (pcId: string) => {
    if (networkState === 'offline') return;
    const target = pcs.find((p) => p.id === pcId);
    if (!target || !target.available) return;
    const alt = pcs.find(
      (p) => p.id !== pcId && p.available && p.software.some((s) => target.software.includes(s))
    );
    setPcs((prev) =>
      prev.map((p) => (p.id === pcId ? { ...p, available: false, reservedByMe: true } : p))
    );
    notify(
      `${pcId} (${target.floor}) reserved for 15 min.${alt ? ` Backup ready: ${alt.id}.` : ''}`
    );
  };

  const handleReportPcFault = (pcId: string) => {
    if (networkState === 'offline') return;
    const target = pcs.find((p) => p.id === pcId);
    if (!target) return;
    setPcs((prev) =>
      prev.map((p) => (p.id === pcId ? { ...p, available: false, reservedByMe: false } : p))
    );
    logIssue('IT', `PC software fault: ${pcId}`);
    const alt = pcs.find(
      (p) => p.id !== pcId && p.available && p.software.some((s) => target.software.includes(s))
    );
    notify(
      alt
        ? `${pcId} flagged for IT. Redirected to ${alt.id} on ${alt.floor}.`
        : `${pcId} flagged for IT. Ask the Tech Desk for an immediate spare.`
    );
  };

  const handleAdjustTemp = (roomIdx: number, delta: number) => {
    if (networkState === 'offline') return;
    const room = rooms[roomIdx];
    if (!room) return;
    const clamped = Math.min(23.0, Math.max(19.0, room.goal + delta));
    if (clamped === room.goal) {
      logIssue('Estates', `Room at thermal limit: ${room.name}`);
      notify(
        `${room.name} cannot exceed ${clamped.toFixed(1)} °C. Escalated to Estates.`
      );
      return;
    }
    setRooms((prev) =>
      prev.map((r, i) => (i === roomIdx ? { ...r, goal: clamped, requests: r.requests + 1 } : r))
    );
    notify(`Target for ${room.name} updated to ${clamped.toFixed(1)} °C.`);
    window.setTimeout(() => {
      setRooms((prev) =>
        prev.map((r, i) => (i === roomIdx ? { ...r, temp: clamped } : r))
      );
    }, 3500);
  };

  const handleReportWeakWifi = (floorName: string) => {
    if (networkState === 'offline') return;
    logIssue('Wi-Fi', `Weak phone signal: ${floorName}`);
    notify(`Weak signal logged for ${floorName}. IT Services notified.`);
  };

  const handleReportBookMissing = (bookId: string) => {
    if (networkState === 'offline') return;
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, reportedMissing: true } : b))
    );
    logIssue('Collections', `Book not on shelf: ${book.title}`);
    notify(`Staff alerted to sweep ${book.shelf}.`);
  };

  const appendAutopilotLog = useCallback((eventTitle: string, actionSummary: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setAutopilotLog((prev) =>
      [{ id: `ap-${Date.now()}-${Math.random()}`, time, eventTitle, actionSummary }, ...prev].slice(0, 8)
    );
  }, []);

  const handleStartAutopilot = (sw: SoftwareName, needsCall: boolean) => {
    if (networkState === 'offline') return;
    const pc = pcs.find((p) => p.available && p.software.includes(sw));
    const bf = needsCall ? [2, 3].find((f) => (boothsFree[f] ?? 0) > 0) ?? 2 : null;
    const plan: AutopilotPlan = {
      software: sw,
      needsCallBooth: needsCall,
      pcId: pc ? pc.id : null,
      boothFloor: bf,
    };
    setAutopilotPlan(plan);
    setAutopilotLog([]);
    appendAutopilotLog(
      'Autopilot started',
      `${pc ? `Held ${pc.id} (${pc.floor}) with ${sw}` : `Queued for ${sw}`}${
        needsCall ? ` · Call booth Floor ${bf}` : ''
      }.`
    );
  };

  const handleTriggerAutopilotEvent = useCallback(() => {
    if (!autopilotPlan) return;
    if (networkState === 'offline') {
      appendAutopilotLog('Offline mode', 'Autopilot paused until connectivity is restored.');
      return;
    }

    const scenarios = [
      () => {
        const alt = pcs.find(
          (p) =>
            p.available &&
            p.id !== autopilotPlan.pcId &&
            p.software.includes(autopilotPlan.software)
        );
        if (alt) {
          setAutopilotPlan((prev) => (prev ? { ...prev, pcId: alt.id } : prev));
          appendAutopilotLog(
            'Another student logged into target PC',
            `Auto-reassigned you to ${alt.id} on ${alt.floor} with ${autopilotPlan.software}.`
          );
        } else {
          appendAutopilotLog(
            'Workstation occupancy spike',
            `All ${autopilotPlan.software} stations busy. Holding top queue spot.`
          );
        }
      },
      () => {
        if (!autopilotPlan.needsCallBooth) {
          appendAutopilotLog('Call booth telemetry checked', 'No booth in plan — no action required.');
          return;
        }
        const nextFloor = autopilotPlan.boothFloor === 2 ? 3 : 2;
        setAutopilotPlan((prev) => (prev ? { ...prev, boothFloor: nextFloor } : prev));
        appendAutopilotLog(
          'Phone Wi-Fi dip near booth',
          `Switched call booth reservation to Floor ${nextFloor} for stronger signal.`
        );
      },
      () => {
        const idx = 2;
        setRooms((prev) =>
          prev.map((r, i) =>
            i === idx ? { ...r, goal: Math.max(19, r.goal - 0.5), temp: Math.max(19, r.goal - 0.5), requests: r.requests + 1 } : r
          )
        );
        appendAutopilotLog(
          'Zone warmed above 22.0 °C',
          'Requested Estates HVAC cool-down on Floor 2 Postgraduate Pods.'
        );
      },
      () => {
        logIssue('Collections', 'Misplaced reading list book (auto-detected)');
        appendAutopilotLog(
          'Reading list book unconfirmed',
          'Pre-loaded digital e-book edition and flagged shelf sweep for staff.'
        );
      },
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    pick();
  }, [appendAutopilotLog, autopilotPlan, logIssue, networkState, pcs]);

  useEffect(() => {
    if (!autopilotPlan) return;
    const id = window.setInterval(handleTriggerAutopilotEvent, 6500);
    return () => window.clearInterval(id);
  }, [autopilotPlan, handleTriggerAutopilotEvent]);

  const handleKineticStep = () => {
    setStairsClimbed((prev) => {
      const next = prev + 1;
      setPoints((p) => p + (next % 8 === 0 ? 11 : 1));
      if (next % 8 === 0) {
        notify('Full flight climbed silently via Kinetic Light-Stairs! +10 café/print credits.');
      }
      return next;
    });
  };

  const handleSyncMobileBridge = (bridgeId: string) => {
    setSyncedBridgeIds((prev) => (prev.includes(bridgeId) ? prev : [...prev, bridgeId]));
    notify('Library source synced directly to your phone.');
  };

  const handleClaimSpark = (sparkId: string, bonus: number) => {
    if (claimedSparkIds.includes(sparkId)) return;
    setClaimedSparkIds((prev) => [...prev, sparkId]);
    setPoints((p) => p + bonus);
    notify(`Serendipity Spark saved to mobile reading list (+${bonus} pts).`);
  };

  const handleJoinConstellation = (constellationId: string) => {
    setJoinedConstellationId((prev) => {
      const next = prev === constellationId ? null : constellationId;
      notify(
        next
          ? 'Joined Silent Study Constellation. Desk puck light pulse synced.'
          : 'Left Silent Study Constellation.'
      );
      return next;
    });
  };

  const handleQuietCheckin = () => {
    if (quietCheckinDone) return;
    setQuietCheckinDone(true);
    setPoints((p) => p + 20);
    notify('Checked into Floor 3 quiet pods (+20 points).');
  };

  const handleStartSprint = () => {
    if (sprintState !== 'idle') return;
    setSprintState('running');
    window.setTimeout(() => {
      setSprintState('done');
      setPoints((p) => p + 15);
      notify('Focus sprint complete (+15 points).');
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#0F1F24] dark:bg-[#002630] dark:text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract — University of Sussex Flint Teal (#003B49) */}
      <header className="border-b-2 border-[#E2B979] bg-[#003B49] text-white">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('twin')}
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Sussex Library Live
          </button>

          {/* Zone 2: 5 clean single-line navigation links */}
          <nav aria-label="Primary workspaces" className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#E2B979]'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute right-0 -bottom-[17px] left-0 h-0.5 bg-[#E2B979]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <button
            type="button"
            onClick={() => setActiveTab('autopilot')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 ${
              activeTab === 'autopilot'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-[#E2B979] text-[#002630]'
            }`}
          >
            Autopilot & AI
          </button>
        </div>

        {/* Mobile navigation strip */}
        <div className="flex md:hidden overflow-x-auto border-t border-[#1D5362] bg-[#002D38] px-4 py-2 gap-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-semibold whitespace-nowrap shrink-0 py-1 ${
                activeTab === item.id
                  ? 'text-[#E2B979]'
                  : 'text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1380px] flex-1 px-6 py-6 space-y-6">
        {/* Compact Workspace Telemetry & Exception Simulator Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            {networkState === 'ok' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Live telemetry active · Updated just now · All 4 floors synced
                </span>
              </>
            )}
            {networkState === 'late' && (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300">
                  Telemetry delayed by 14 minutes · Treat free seats and booths as unconfirmed
                </span>
              </>
            )}
            {networkState === 'offline' && (
              <>
                <WifiOff className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="text-rose-700 dark:text-rose-300">
                  Offline snapshot (09:42) · Live holds and fault reporting paused until reconnected
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-[#EFECE5] dark:bg-[#002630] p-1">
              {(
                [
                  ['ok', 'Normal'],
                  ['late', 'Data Delayed'],
                  ['offline', 'Offline'],
                ] as [NetworkExceptionState, string][]
              ).map(([stateKey, label]) => (
                <button
                  key={stateKey}
                  type="button"
                  onClick={() => setNetworkState(stateKey)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    networkState === stateKey
                      ? 'bg-[#003B49] text-white dark:bg-[#E2B979] dark:text-[#002630] shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label="Toggle color theme"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#EFECE5] dark:hover:bg-[#0B3D4C] whitespace-nowrap"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-[#E2B979]" /> : <Moon className="h-3.5 w-3.5 text-[#003B49]" />}
              {isDark ? 'Light Chalk' : 'Sussex Dark'}
            </button>
          </div>
        </div>

        {/* Active Workspace View */}
        {activeTab === 'twin' && (
          <SpatialTwinView
            floors={floors}
            rooms={rooms}
            boothsFree={boothsFree}
            networkState={networkState}
            isDark={isDark}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onNotify={notify}
          />
        )}

        {activeTab === 'spaces' && (
          <SpacesTechView
            floors={floors}
            rooms={rooms}
            pcs={pcs}
            boothsFree={boothsFree}
            heldBoothFloor={heldBoothFloor}
            boothSecondsLeft={boothSecondsLeft}
            studyBooking={studyBooking}
            networkState={networkState}
            points={points}
            stairsClimbed={stairsClimbed}
            quietCheckinDone={quietCheckinDone}
            sprintState={sprintState}
            syncedBridgeIds={syncedBridgeIds}
            claimedSparkIds={claimedSparkIds}
            joinedConstellationId={joinedConstellationId}
            onHoldBooth={handleHoldBooth}
            onReleaseBooth={handleReleaseBooth}
            onReservePc={handleReservePc}
            onReportPcFault={handleReportPcFault}
            onAdjustTemp={handleAdjustTemp}
            onReportWeakWifi={handleReportWeakWifi}
            onStartDemoBooking={() =>
              setStudyBooking({ roomName: 'Pod 2.04', minutesElapsed: 0, checkedIn: false })
            }
            onAdvanceBookingTime={() =>
              setStudyBooking((prev) =>
                prev ? { ...prev, minutesElapsed: Math.min(30, prev.minutesElapsed + 10) } : null
              )
            }
            onCheckInBooking={() => {
              setStudyBooking(null);
              notify('Checked in at door QR code. Group study room confirmed.');
            }}
            onKineticStep={handleKineticStep}
            onQuietCheckin={handleQuietCheckin}
            onStartSprint={handleStartSprint}
            onSyncMobileBridge={handleSyncMobileBridge}
            onClaimSpark={handleClaimSpark}
            onJoinConstellation={handleJoinConstellation}
            onNotify={notify}
          />
        )}

        {activeTab === 'books' && (
          <CatalogueBooksView
            books={books}
            networkState={networkState}
            onReportBookMissing={handleReportBookMissing}
            onNotify={notify}
          />
        )}

        {activeTab === 'studio' && (
          <SourceStudioView
            networkState={networkState}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onAwardPoints={(pts, reason) => {
              setPoints((p) => p + pts);
              notify(`${reason} (+${pts} pts)`);
            }}
            onNotify={notify}
          />
        )}

        {activeTab === 'autopilot' && (
          <AutopilotAiView
            floors={floors}
            rooms={rooms}
            pcs={pcs}
            books={books}
            boothsFree={boothsFree}
            networkState={networkState}
            autopilotPlan={autopilotPlan}
            autopilotLog={autopilotLog}
            onStartAutopilot={handleStartAutopilot}
            onTriggerAutopilotEvent={handleTriggerAutopilotEvent}
            onStopAutopilot={() => setAutopilotPlan(null)}
            onHandoffToStaff={() => logIssue('Service Desk', 'Chatbot handoff requested')}
            onReservePc={handleReservePc}
            onHoldBooth={handleHoldBooth}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsView
            floors={floors}
            issues={issues}
            networkState={networkState}
            onResolveIssue={(id) => {
              setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, resolved: true } : i)));
              notify('Report marked resolved.');
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onNotify={notify}
          />
        )}
      </main>

      <footer className="border-t border-[#DDD8CE] dark:border-[#1D5362] bg-white/60 dark:bg-[#002D38] py-5 px-6 text-center text-xs text-slate-600 dark:text-slate-300">
        Sussex Library Live · University of Sussex Design Thinking & Innovation Practices (Group 6) · Postgraduate Study OS
      </footer>

      {toastMsg && (
        <div
          role="status"
          className="fixed right-6 bottom-6 z-50 max-w-sm rounded-xl border border-[#E2B979] bg-[#002630] px-4 py-3 text-xs font-medium text-white shadow-xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
