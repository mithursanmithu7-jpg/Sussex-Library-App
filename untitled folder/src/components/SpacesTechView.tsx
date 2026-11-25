import React, { useState } from 'react';
import {
  FloorData,
  LibraryPc,
  NetworkExceptionState,
  RoomClimate,
  SoftwareName,
  StudyRoomBooking,
} from '../types/library';
import {
  MOBILE_SOURCE_BRIDGES,
  OFFICIAL_LIBRARY_LINKS,
  SERENDIPITY_SPARKS,
  SOFTWARE_OPTIONS,
  STUDY_CONSTELLATIONS,
} from '../data/libraryInitialData';
import { playSprintChime, toggleBrownNoise } from '../utils/audio';
import {
  Laptop,
  PhoneCall,
  Thermometer,
  Wifi,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Timer,
  Smartphone,
  Sparkles,
  Users,
  Footprints,
  Copy,
} from 'lucide-react';

interface SpacesTechViewProps {
  floors: FloorData[];
  rooms: RoomClimate[];
  pcs: LibraryPc[];
  boothsFree: Record<number, number>;
  heldBoothFloor: number | null;
  boothSecondsLeft: number;
  studyBooking: StudyRoomBooking | null;
  networkState: NetworkExceptionState;
  points: number;
  stairsClimbed: number;
  quietCheckinDone: boolean;
  sprintState: 'idle' | 'running' | 'done';
  syncedBridgeIds: string[];
  claimedSparkIds: string[];
  joinedConstellationId: string | null;
  onHoldBooth: (floor: number) => void;
  onReleaseBooth: () => void;
  onReservePc: (pcId: string) => void;
  onReportPcFault: (pcId: string) => void;
  onAdjustTemp: (roomIdx: number, delta: number) => void;
  onReportWeakWifi: (floorName: string) => void;
  onStartDemoBooking: () => void;
  onAdvanceBookingTime: () => void;
  onCheckInBooking: () => void;
  onKineticStep: (stepIdx: number) => void;
  onQuietCheckin: () => void;
  onStartSprint: () => void;
  onSyncMobileBridge: (bridgeId: string) => void;
  onClaimSpark: (sparkId: string, bonus: number) => void;
  onJoinConstellation: (constellationId: string) => void;
  onNotify: (msg: string) => void;
}

const LIGHT_RISER_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SpacesTechView: React.FC<SpacesTechViewProps> = ({
  floors,
  rooms,
  pcs,
  boothsFree,
  heldBoothFloor,
  boothSecondsLeft,
  studyBooking,
  networkState,
  points,
  stairsClimbed,
  quietCheckinDone,
  sprintState,
  syncedBridgeIds,
  claimedSparkIds,
  joinedConstellationId,
  onHoldBooth,
  onReleaseBooth,
  onReservePc,
  onReportPcFault,
  onAdjustTemp,
  onReportWeakWifi,
  onStartDemoBooking,
  onAdvanceBookingTime,
  onCheckInBooking,
  onKineticStep,
  onQuietCheckin,
  onStartSprint,
  onSyncMobileBridge,
  onClaimSpark,
  onJoinConstellation,
  onNotify,
}) => {
  const [softwareFilter, setSoftwareFilter] = useState<'All' | SoftwareName>('All');
  const [noisePlaying, setNoisePlaying] = useState(false);
  const [litRiser, setLitRiser] = useState<number | null>(null);

  const offline = networkState === 'offline';
  const delayed = networkState !== 'ok';

  const filteredPcs = pcs.filter(
    (p) => softwareFilter === 'All' || p.software.includes(softwareFilter)
  );

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleNoise = () => {
    const active = toggleBrownNoise(!noisePlaying);
    setNoisePlaying(active);
  };

  const handleSilentStep = (idx: number) => {
    setLitRiser(idx);
    onKineticStep(idx);
    window.setTimeout(() => {
      setLitRiser((cur) => (cur === idx ? null : cur));
    }, 450);
  };

  const handleSprintClick = () => {
    playSprintChime();
    onStartSprint();
  };

  const handleCopyCitation = async (citation: string) => {
    try {
      await navigator.clipboard.writeText(citation);
      onNotify('Formatted citation copied to your phone clipboard.');
    } catch {
      onNotify(citation);
    }
  };

  const nextReward = [
    { pts: 25, reward: 'Free Library Café espresso' },
    { pts: 50, reward: '20 free colour print pages' },
    { pts: 100, reward: 'Dissertation pod priority pass' },
  ].find((r) => r.pts > points);

  const leaderboard = [
    { team: 'Group 6 (Postgrad)', pts: points },
    { team: 'Psychology MSc', pts: 88 },
    { team: 'Data Science MSc', pts: 64 },
  ].sort((a, b) => b.pts - a.pts);

  const bookingMinutesLeft = studyBooking ? 30 - studyBooking.minutesElapsed : 0;
  const bookingCancelled = studyBooking ? bookingMinutesLeft <= 0 : false;
  const libcalLink = OFFICIAL_LIBRARY_LINKS[1].url;

  return (
    <div className="space-y-8">
      {/* Section 1: Mobile-to-Library Source Bridge (Connecting Phones to Books, Stacks & PCs) */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Mobile-to-Library Source Bridge
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tap NFC shelf tags or desk pucks with your phone to sync citations, beam readings to PCs, and cache chapters before entering weak-signal book stacks.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {syncedBridgeIds.length} of {MOBILE_SOURCE_BRIDGES.length} synced to mobile
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {MOBILE_SOURCE_BRIDGES.map((item) => {
            const isSynced = syncedBridgeIds.includes(item.id);
            const blocked = offline && !item.offlineReady;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                      {item.tagLabel}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{item.location}</span>
                  </div>
                  <h3 className="mt-2 font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.citation}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => onSyncMobileBridge(item.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      isSynced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#003B49] dark:bg-cyan-500 text-white dark:text-slate-950 disabled:opacity-40'
                    }`}
                  >
                    {isSynced ? 'Synced to Phone' : item.actionLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCitation(item.citation)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Copy className="h-3 w-3" />
                    Cite
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Software-Specific Workstation Finder */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <Laptop className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Software Workstation Finder
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Check exact machines licensed with your postgraduate software and reserve for 15 minutes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EFECE5] dark:bg-[#00222B] p-1">
            {(['All', ...SOFTWARE_OPTIONS] as const).map((sw) => (
              <button
                key={sw}
                type="button"
                onClick={() => setSoftwareFilter(sw)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  softwareFilter === sw
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                }`}
              >
                {sw}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredPcs.map((pc) => {
            const statusText = delayed
              ? 'Unconfirmed'
              : pc.reservedByMe
                ? 'Reserved for you'
                : pc.available
                  ? 'Free'
                  : 'In use';
            const statusStyle = delayed
              ? 'text-amber-600 dark:text-amber-400'
              : pc.reservedByMe
                ? 'text-cyan-600 dark:text-cyan-400'
                : pc.available
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400';

            return (
              <div
                key={pc.id}
                className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-semibold text-slate-900 dark:text-white font-mono">
                      {pc.id} · {pc.floor}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {pc.software.join(' · ')}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${statusStyle}`}>
                    {statusText}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={offline || !pc.available || pc.reservedByMe}
                    onClick={() => onReservePc(pc.id)}
                    className="rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {pc.reservedByMe ? 'Held 15 min' : 'Reserve 15 min'}
                  </button>
                  <button
                    type="button"
                    disabled={offline}
                    onClick={() => onReportPcFault(pc.id)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Software not working
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Call Booths & Group Study Room QR Tracker */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Call Booths */}
        <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <PhoneCall className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Acoustic Call Booths
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Hold a soundproof two-person booth for online seminars or viva calls before climbing stairs.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[2, 3].map((floorNum) => {
              const freeCount = boothsFree[floorNum] ?? 0;
              const isHeldHere = heldBoothFloor === floorNum;
              return (
                <div
                  key={floorNum}
                  className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Floor {floorNum} Two-Person Booths
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {delayed ? 'Unconfirmed count' : `${freeCount} free now`}
                        {isHeldHere ? ` · Held (${formatCountdown(boothSecondsLeft)})` : ''}
                      </div>
                    </div>

                    {isHeldHere ? (
                      <button
                        type="button"
                        onClick={onReleaseBooth}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 whitespace-nowrap"
                      >
                        Release hold
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={offline || freeCount < 1 || heldBoothFloor !== null}
                        onClick={() => onHoldBooth(floorNum)}
                        className="rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Hold 15 min
                      </button>
                    )}
                  </div>

                  {freeCount < 1 && (
                    <p className="mt-2.5 text-xs text-amber-700 dark:text-amber-300">
                      All Floor {floorNum} booths are occupied. Try Floor {floorNum === 2 ? 3 : 2} or the Ground Floor call-friendly hub.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Study Room Check-In Tracker */}
        <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <Timer className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Group Study Room Check-in
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sussex LibCal rooms allow 3 hours/day and auto-cancel if door QR check-in is missed after 30 minutes.
              </p>
            </div>
          </div>

          {!studyBooking ? (
            <div className="mt-4 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No active LibCal room booking tracked right now.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <a
                  href={libcalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2B979] px-3.5 py-2 text-xs font-semibold text-slate-950 hover:opacity-90 whitespace-nowrap"
                >
                  Book on Sussex LibCal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onStartDemoBooking}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Track demo booking
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {studyBooking.roomName} · Booking Active
                  </div>
                  <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {bookingCancelled
                      ? 'Cancelled: 30-minute QR check-in window expired'
                      : `${bookingMinutesLeft} min remaining to scan door QR code`}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    bookingCancelled
                      ? 'text-rose-600 dark:text-rose-400'
                      : bookingMinutesLeft <= 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {bookingCancelled ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {bookingCancelled ? 'Cancelled' : bookingMinutesLeft <= 10 ? 'Check in soon' : 'Booked'}
                </span>
              </div>

              {bookingCancelled && (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                  Room released automatically. Plan B ready: a free acoustic booth is available on Floor{' '}
                  {boothsFree[2] > 0 ? 2 : 3}, or rebook a slot on LibCal.
                </p>
              )}

              {!bookingCancelled && bookingMinutesLeft <= 10 && (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  Urgent phone nudge sent: scan the QR badge outside {studyBooking.roomName} within {bookingMinutesLeft} minutes.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onCheckInBooking}
                  className="rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 whitespace-nowrap"
                >
                  I’ve checked in
                </button>
                <button
                  type="button"
                  disabled={bookingCancelled}
                  onClick={onAdvanceBookingTime}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 whitespace-nowrap"
                >
                  Simulate +10 min
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Phone Wi-Fi Telemetry & Shared Room Climate */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Phone Wi-Fi */}
        <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <Wifi className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Mobile Wi-Fi & Power Coverage
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Verify eduroam phone signal and spare desk sockets before unpacking your laptop.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {floors.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] px-4 py-3"
              >
                <div>
                  <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {f.name}
                  </div>
                  <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    Signal {f.wifi}/5 · {f.freeSockets} power sockets free · {f.use}% occupied
                  </div>
                </div>
                <button
                  type="button"
                  disabled={offline}
                  onClick={() => onReportWeakWifi(f.name)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
                >
                  Weak signal here
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Room Climate */}
        <div className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <Thermometer className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Shared Thermal Comfort (19–23 °C)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Targets average student requests across shared zones and escalate limit requests to Estates.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {rooms.map((r, idx) => (
              <div
                key={r.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] px-4 py-3"
              >
                <div>
                  <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    {r.name}
                  </div>
                  <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {r.temp === r.goal
                      ? 'Steady'
                      : `Adjusting to ${r.goal.toFixed(1)} °C (~10 min)`}
                    {r.requests > 0 ? ` · ${r.requests} request${r.requests > 1 ? 's' : ''} today` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Cooler ${r.name}`}
                    disabled={offline}
                    onClick={() => onAdjustTemp(idx, -0.5)}
                    className="h-8 w-8 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-14 text-center font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                    {r.temp.toFixed(1)}°
                  </span>
                  <button
                    type="button"
                    aria-label={`Warmer ${r.name}`}
                    disabled={offline}
                    onClick={() => onAdjustTemp(idx, 0.5)}
                    className="h-8 w-8 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Creative Silent Library Pull (Serendipity Radar, Silent Light-Stairs & Co-Presence Constellations) */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[#E2B979] shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Silent Library Pull & Serendipity Discovery
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Designed for total library silence: tactile archive discoveries, anonymous "Study With Me" focus constellations, and silent kinetic light-stairs that earn café & print rewards.
              </p>
            </div>
          </div>
          <div className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
            {points} pts · {nextReward ? `Next: ${nextReward.reward} (${nextReward.pts})` : 'All campus perks unlocked'}
          </div>
        </div>

        {/* Sub-grid A: Serendipity Shelf Sparks */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            Serendipity Shelf Radar — Physical gems near your floor you won’t spot by browsing alone
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {SERENDIPITY_SPARKS.map((spark) => {
              const claimed = claimedSparkIds.includes(spark.id);
              return (
                <div
                  key={spark.id}
                  className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#B88635] dark:text-[#E2B979]">
                      {spark.floor} · {spark.bay}
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {spark.title}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {spark.whyItMatters}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={claimed}
                    onClick={() => onClaimSpark(spark.id, spark.pointsBonus)}
                    className={`mt-4 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap self-start ${
                      claimed
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    {claimed ? 'Spark Saved to Phone' : `Save Spark (+${spark.pointsBonus} pts)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-grid B: Silent Kinetic Light-Stairs + Co-Presence Constellations + Leaderboard */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Silent Kinetic Light-Stairs (Zero sound!) */}
          <div className="lg:col-span-5 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Footprints className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Silent Kinetic Light-Stairs (Zero Audio)
                </span>
                <span className="font-mono tabular-nums">
                  {stairsClimbed} steps · {Math.floor(stairsClimbed / 8)} floors
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pressure-sensitive LED risers ripple silently as you climb, converting steps into Library Café & print credits without disturbing readers.
              </p>
            </div>

            <div className="mt-4 flex items-end gap-1.5 h-28">
              {LIGHT_RISER_STEPS.map((stepNum, idx) => {
                const isLit = litRiser === idx;
                return (
                  <button
                    key={stepNum}
                    type="button"
                    onClick={() => handleSilentStep(idx)}
                    style={{ height: `${38 + idx * 9}px` }}
                    className={`flex-1 rounded-t-md border text-[11px] font-mono font-semibold transition-all active:translate-y-0.5 ${
                      isLit
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950 shadow-sm'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
                    }`}
                  >
                    {stepNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Silent Study Constellations */}
          <div className="lg:col-span-4 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              Silent Study Constellations
            </div>
            {STUDY_CONSTELLATIONS.map((c) => {
              const joined = joinedConstellationId === c.id;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {c.floor} · {c.activeCount + (joined ? 1 : 0)} silent
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onJoinConstellation(c.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                      joined
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {joined ? 'Joined' : 'Join'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Headphone Focus Audio & Leaderboard */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3">
            <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4 space-y-2">
              <button
                type="button"
                disabled={quietCheckinDone}
                onClick={onQuietCheckin}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3 py-2 text-xs font-semibold text-white dark:text-slate-950 disabled:opacity-40 whitespace-nowrap"
              >
                <Zap className="h-3.5 w-3.5" />
                {quietCheckinDone ? 'Floor 3 Checked In' : 'Check in Floor 3 (+20)'}
              </button>

              <button
                type="button"
                disabled={sprintState !== 'idle'}
                onClick={handleSprintClick}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-40 whitespace-nowrap"
              >
                {sprintState === 'running'
                  ? 'Sprint running (10s)…'
                  : sprintState === 'done'
                    ? 'Sprint completed'
                    : '10s Focus Sprint (+15)'}
              </button>

              <button
                type="button"
                onClick={handleToggleNoise}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                  noisePlaying
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {noisePlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {noisePlaying ? 'Stop Headphones Audio' : 'Headphone Brown Noise'}
              </button>
            </div>

            <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Cohort Focus Streak (Demo)
              </div>
              <div className="space-y-1">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.team} className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 dark:text-slate-200">
                      {idx + 1}. {entry.team}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {entry.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
