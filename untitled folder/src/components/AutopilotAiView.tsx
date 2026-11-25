import React, { useEffect, useRef, useState } from 'react';
import {
  AutopilotLogEntry,
  AutopilotPlan,
  ChatMessage,
  FloorData,
  LibraryBook,
  LibraryPc,
  NetworkExceptionState,
  RoomClimate,
  SoftwareName,
} from '../types/library';
import { HOURLY_FORECAST, SOFTWARE_OPTIONS } from '../data/libraryInitialData';
import {
  Bot,
  Cpu,
  Mic,
  Play,
  Send,
  Square,
  Zap,
  BarChart3,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface AutopilotAiViewProps {
  floors: FloorData[];
  rooms: RoomClimate[];
  pcs: LibraryPc[];
  books: LibraryBook[];
  boothsFree: Record<number, number>;
  networkState: NetworkExceptionState;
  autopilotPlan: AutopilotPlan | null;
  autopilotLog: AutopilotLogEntry[];
  onStartAutopilot: (sw: SoftwareName, needsCall: boolean) => void;
  onTriggerAutopilotEvent: () => void;
  onStopAutopilot: () => void;
  onHandoffToStaff: () => void;
  onReservePc: (pcId: string) => void;
  onHoldBooth: (floor: number) => void;
}

export const AutopilotAiView: React.FC<AutopilotAiViewProps> = ({
  floors,
  rooms,
  pcs,
  books,
  boothsFree,
  networkState,
  autopilotPlan,
  autopilotLog,
  onStartAutopilot,
  onTriggerAutopilotEvent,
  onStopAutopilot,
  onHandoffToStaff,
  onReservePc,
  onHoldBooth,
}) => {
  const [selectedSw, setSelectedSw] = useState<SoftwareName>('SPSS');
  const [needsCall, setNeedsCall] = useState<boolean>(true);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      source: 'local',
      text: 'Ask about live call booths, PCs with SPSS/NVivo/Python/MATLAB/Stata, floor occupancy, study room QR rules, or request a human staff handoff.',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const offline = networkState === 'offline';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runLocalDeterministicReply = (rawQuery: string): string => {
    const q = rawQuery.toLowerCase();
    if (offline) {
      return 'Network is currently simulated as Offline. Live booth and PC lookups are paused. Call 01273 678163 or visit the Service Desk during staffed hours.';
    }
    const matchedSw = SOFTWARE_OPTIONS.find((s) => q.includes(s.toLowerCase()));
    if (matchedSw) {
      const pc = pcs.find((p) => p.available && p.software.includes(matchedSw));
      return pc
        ? `${pc.id} on ${pc.floor} has ${matchedSw} installed and is free right now. You can reserve it in Spaces & Tech.`
        : `All workstations with ${matchedSw} are currently occupied. Start Autopilot to auto-claim the next available machine.`;
    }
    if (/person|human|staff|desk|handoff/.test(q)) {
      onHandoffToStaff();
      return 'Human handoff logged in Staff Operations. Sussex Library online chat runs 9am-5pm Mon-Fri (library@sussex.ac.uk / 01273 678163).';
    }
    if (/booth|call|zoom|teams|viva/.test(q)) {
      const bf = [2, 3].find((f) => (boothsFree[f] ?? 0) > 0);
      return bf
        ? `A two-person acoustic call booth is free on Floor ${bf}. Hold it for 15 minutes in Spaces & Tech.`
        : 'All call booths are currently occupied. Plan B: Floor 2 open pods have 5/5 phone signal.';
    }
    if (/busy|crowd|quiet|seat/.test(q)) {
      const quietest = floors.reduce((a, b) => (b.use < a.use ? b : a));
      return `Quietest floor right now: ${quietest.name} at ${quietest.use}% occupancy (${quietest.note}).`;
    }
    if (/study room|group room|book/.test(q)) {
      return 'Group study rooms are booked via Sussex LibCal (3 hours/day max). Remember to scan the door QR code within 30 minutes of your slot start.';
    }
    return 'Specify your software (e.g. SPSS, NVivo), call booth, or floor preference, and I will build a live spatial plan.';
  };

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');

    if (offline) {
      setMessages((prev) => [
        ...prev,
        {
          id: `l-${Date.now()}`,
          role: 'assistant',
          source: 'local',
          text: runLocalDeterministicReply(text),
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          libraryState: {
            networkState,
            floors,
            rooms,
            pcs,
            boothsFree,
            books,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'error',
            text: data.error || 'Assistant service returned an error.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            source: 'gemini',
            text: data.reply,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'error',
          text: 'Could not reach /api/assistant. Check server connectivity or use the deterministic planner below.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const Win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        start: () => void;
      };
    };
    const Recognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!Recognition) {
      setMessages((prev) => [
        ...prev,
        {
          id: `v-${Date.now()}`,
          role: 'error',
          text: 'Voice recognition is not supported in this browser.',
        },
      ]);
      return;
    }
    const rec = new Recognition();
    rec.lang = 'en-GB';
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) handleSendMessage(transcript);
    };
    rec.onerror = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ve-${Date.now()}`,
          role: 'error',
          text: 'Could not capture audio. Check microphone permissions.',
        },
      ]);
    };
    rec.start();
  };

  const minOcc = Math.min(...HOURLY_FORECAST.map((h) => h.occupancy));
  const quietHour = HOURLY_FORECAST.find((h) => h.occupancy === minOcc)?.hour ?? '20:00';

  const quickMatchPc = pcs.find((p) => p.available && p.software.includes(selectedSw));
  const quickMatchBoothFloor = [2, 3].find((f) => (boothsFree[f] ?? 0) > 0);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Autonomous Session Autopilot */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <Cpu className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Autonomous Session Autopilot
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Set your assignment goals once. Autopilot monitors live sensor disruptions and re-plans automatically.
                </p>
              </div>
            </div>

            {!autopilotPlan ? (
              <div className="mt-4 space-y-4 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
                <div>
                  <label htmlFor="ap-sw" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Required Software
                  </label>
                  <select
                    id="ap-sw"
                    value={selectedSw}
                    onChange={(e) => setSelectedSw(e.target.value as SoftwareName)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {SOFTWARE_OPTIONS.map((sw) => (
                      <option key={sw} value={sw}>
                        {sw}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsCall}
                    onChange={(e) => setNeedsCall(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Also reserve an acoustic call booth
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={offline}
                    onClick={() => onStartAutopilot(selectedSw, needsCall)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start Autopilot
                  </button>
                  {quickMatchPc && (
                    <button
                      type="button"
                      disabled={offline}
                      onClick={() => onReservePc(quickMatchPc.id)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 whitespace-nowrap"
                    >
                      Quick Hold {quickMatchPc.id}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-500/8 p-4">
                <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                  Active Autonomous Plan
                </div>
                <div className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  {autopilotPlan.pcId ? `${autopilotPlan.pcId} (${autopilotPlan.software})` : `Queued for ${autopilotPlan.software}`}
                  {autopilotPlan.needsCallBooth ? ` · Booth Floor ${autopilotPlan.boothFloor}` : ''}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onTriggerAutopilotEvent}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2B979] px-3 py-1.5 text-xs font-semibold text-slate-950 whitespace-nowrap"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Simulate Disruption
                  </button>
                  <button
                    type="button"
                    onClick={onStopAutopilot}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </button>
                </div>
              </div>
            )}

            {/* Decision Log */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Autonomous Agent Log
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {autopilotLog.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500 dark:text-slate-400">
                    Start Autopilot to observe live event detections and automatic re-routing.
                  </p>
                ) : (
                  autopilotLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3 text-xs"
                    >
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {entry.time} · {entry.eventTitle}
                      </div>
                      <div className="mt-1 text-slate-800 dark:text-slate-200">{entry.actionSummary}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {quickMatchBoothFloor && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Instant call backup: Floor {quickMatchBoothFloor}
              </span>
              <button
                type="button"
                disabled={offline}
                onClick={() => onHoldBooth(quickMatchBoothFloor)}
                className="font-semibold text-cyan-700 dark:text-cyan-400 hover:underline disabled:opacity-40"
              >
                Hold booth 15m
              </button>
            </div>
          )}
        </div>

        {/* Right: Gemini-Grounded Library Assistant */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <div className="flex items-start gap-3">
                <Bot className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                    Sussex Library Assistant
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Grounded in live floor telemetry with instant human Service Desk handoff.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendMessage('I need to talk to a person at the help desk')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Talk to a person
              </button>
            </div>

            <div className="mt-4 h-72 overflow-y-auto space-y-3 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#003B49] text-white dark:bg-cyan-500 dark:text-slate-950'
                        : m.role === 'error'
                          ? 'border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                          : 'border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.role === 'error' && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Server Assistant Notice
                      </div>
                    )}
                    <p>{m.text}</p>
                    {m.role === 'error' && (
                      <button
                        type="button"
                        onClick={() => {
                          const lastUser = [...messages].reverse().find((x) => x.role === 'user');
                          if (lastUser) {
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `loc-${Date.now()}`,
                                role: 'assistant',
                                source: 'local',
                                text: runLocalDeterministicReply(lastUser.text),
                              },
                            ]);
                          }
                        }}
                        className="mt-2 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950"
                      >
                        Run local spatial planner
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Querying live library telemetry…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {[
                'Is there a free call booth?',
                'Which PC has SPSS?',
                'How busy is Floor 3?',
                'How do I book a study room?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask about SPSS PCs, call booths, books, Wi-Fi, or room comfort..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="button"
                aria-label="Voice input"
                onClick={handleVoiceInput}
                className="rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => handleSendMessage()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E2B979] px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-40 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Best Time to Come 12-Hour Forecast */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Best Time to Visit Forecast
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Historical postgraduate occupancy curve · Quietest window today starts at{' '}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{quietHour}</span>
              </p>
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            09:00 – 20:00 Window
          </span>
        </div>

        <div className="mt-6 flex items-end gap-2 h-36">
          {HOURLY_FORECAST.map((slot) => {
            const isQuietest = slot.occupancy === minOcc;
            return (
              <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                  {slot.occupancy}%
                </span>
                <div
                  style={{ height: `${slot.occupancy}%` }}
                  className={`w-full rounded-t-md transition-all ${
                    isQuietest
                      ? 'bg-[#E2B979]'
                      : 'bg-[#005266] dark:bg-cyan-500/75'
                  }`}
                />
                <span className="font-mono text-[10px] tabular-nums text-slate-600 dark:text-slate-400">
                  {slot.hour.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
