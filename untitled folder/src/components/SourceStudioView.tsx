import React, { useState } from 'react';
import { NetworkExceptionState, PrimaryTab } from '../types/library';
import {
  BookMarked,
  Compass,
  Copy,
  FileScan,
  Gift,
  Layers,
  Send,
  Sparkles,
  Users,
  ArrowUpRight,
  Film,
} from 'lucide-react';

interface SourceStudioViewProps {
  networkState: NetworkExceptionState;
  onNavigateTab: (tab: PrimaryTab) => void;
  onAwardPoints: (pts: number, reason: string) => void;
  onNotify: (msg: string) => void;
}

interface RemixRecipe {
  id: string;
  theme: string;
  physicalBook: string;
  bookShelf: string;
  archiveSource: string;
  archiveLocation: string;
  softwareTool: string;
  outcome: string;
}

interface MysteryCapsule {
  id: string;
  capsuleCode: string;
  clueQuestion: string;
  revealedTitle: string;
  shelfLocation: string;
  insight: string;
}

interface PeerTrail {
  id: string;
  cohort: string;
  pairing: string;
  zone: string;
  timeAgo: string;
}

const REMIX_RECIPES: RemixRecipe[] = [
  {
    id: 'mixed-methods',
    theme: 'Mixed-Methods UX',
    physicalBook: 'Change by Design — Tim Brown (TS 171.4 BRO)',
    bookShelf: 'Floor 2, Bay 1A, Shelf 4',
    archiveSource: 'Mass Observation Everyday Tech Diaries (MOA Box 14)',
    archiveLocation: 'Floor 3, Special Collections Alcove',
    softwareTool: 'NVivo Qualitative Coding on PC-204 / PC-301',
    outcome: 'Triangulate design-thinking frameworks with authentic qualitative diaries and NVivo coding.',
  },
  {
    id: 'quant-stats',
    theme: 'Applied Quantitative',
    physicalBook: 'Discovering Statistics Using SPSS — Andy Field (HA 32 FIE)',
    bookShelf: 'Floor 2, Bay 6A, Shelf 2',
    archiveSource: 'Sussex Open Research Benchmark Datasets (Digital Repository)',
    archiveLocation: 'Instant E-Repository + Floor 2 Tech Hub',
    softwareTool: 'SPSS & Stata on PC-208',
    outcome: 'Pair physical worked regression tables on desk beside live SPSS syntax testing.',
  },
  {
    id: 'research-design',
    theme: 'Experimental Design',
    physicalBook: 'Research Methods in Psychology — Beth Morling (BF 76.5 MOR)',
    bookShelf: 'Floor 1, Bay 4B, Shelf 3',
    archiveSource: 'Historical Lab Apparatus & Ethics Protocols Folio',
    archiveLocation: 'Floor 1, Reference Folio Case B',
    softwareTool: 'Python & Jupyter on PC-112 / PC-204',
    outcome: 'Connect validity checklists directly to reproducible Python power-analysis scripts.',
  },
  {
    id: 'data-story',
    theme: 'Data Storytelling',
    physicalBook: 'The Visual Display of Quantitative Information — Edward Tufte',
    bookShelf: 'Floor 2, Bay 2C, Shelf 4',
    archiveSource: 'Sussex Cartography & Print Folio Collection',
    archiveLocation: 'Floor 2, Folio Table 3',
    softwareTool: 'Python Matplotlib / MATLAB on PC-112',
    outcome: 'Inspect full-size print typography plates before exporting dissertation figures.',
  },
];

const MYSTERY_CAPSULES: MysteryCapsule[] = [
  {
    id: 'cap-1',
    capsuleCode: 'Locker A-04',
    clueQuestion: 'Why do 68% of study participants contradict their own clickstream logs?',
    revealedTitle: 'Mass Observation Archive: Everyday Digital Diaries (1998–2022)',
    shelfLocation: 'Floor 3 · Special Collections Alcove',
    insight: 'First-person handwritten self-reports reveal emotional friction invisible in analytics.',
  },
  {
    id: 'cap-2',
    capsuleCode: 'Locker B-11',
    clueQuestion: 'What makes a complex regression table readable in 4 seconds on paper?',
    revealedTitle: 'Tufte — Envisioning Information (Print Plate Edition)',
    shelfLocation: 'Floor 2 · Bay 2C · Shelf 4',
    insight: 'Large-format print spreads demonstrate small-multiples clarity impossible on a 13-inch screen.',
  },
  {
    id: 'cap-3',
    capsuleCode: 'Locker C-07',
    clueQuestion: 'How can a 10-minute physical card sort unlock a stalled dissertation chapter?',
    revealedTitle: 'Sussex Rapid Synthesis Argument Deck + Brown (Ch. 3)',
    shelfLocation: 'Ground Floor · Source Studio Wall',
    insight: 'Tactile spatial arranging breaks writer’s block faster than linear outlining.',
  },
];

const INITIAL_TRAILS: PeerTrail[] = [
  {
    id: 'tr-1',
    cohort: 'MSc Psychology',
    pairing: 'Paired Morling Ch.4 + SPSS PC-204 + Ethics Folio',
    zone: 'Floor 2',
    timeAgo: '6 min ago',
  },
  {
    id: 'tr-2',
    cohort: 'MA Digital Media',
    pairing: 'Paired Mass Observation Diaries + NVivo PC-301',
    zone: 'Floor 3',
    timeAgo: '14 min ago',
  },
  {
    id: 'tr-3',
    cohort: 'MSc Data Science',
    pairing: 'Paired Tufte Folio Plates + Python Workspace PC-112',
    zone: 'Floor 1',
    timeAgo: '22 min ago',
  },
];

export const SourceStudioView: React.FC<SourceStudioViewProps> = ({
  networkState,
  onNavigateTab,
  onAwardPoints,
  onNotify,
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(REMIX_RECIPES[0].id);
  const [pulledRecipes, setPulledRecipes] = useState<string[]>([]);
  const [unwrappedCapsules, setUnwrappedCapsules] = useState<string[]>([]);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'ready'>('idle');
  const [scanSourceTitle, setScanSourceTitle] = useState<string>(
    'Research Methods in Psychology (BF 76.5 MOR)'
  );
  const [trails, setTrails] = useState<PeerTrail[]>(INITIAL_TRAILS);
  const [newTrailNote, setNewTrailNote] = useState<string>('');

  const offline = networkState === 'offline';
  const activeRecipe = REMIX_RECIPES.find((r) => r.id === selectedRecipeId) ?? REMIX_RECIPES[0];

  const handlePullRecipe = (recipe: RemixRecipe) => {
    if (offline) return;
    if (!pulledRecipes.includes(recipe.id)) {
      setPulledRecipes((prev) => [...prev, recipe.id]);
      onAwardPoints(15, `Starter Pack synced: ${recipe.theme}`);
    } else {
      onNotify(`"${recipe.theme}" pack is already synced to your phone.`);
    }
  };

  const handleUnwrapCapsule = (capsule: MysteryCapsule) => {
    if (unwrappedCapsules.includes(capsule.id)) return;
    setUnwrappedCapsules((prev) => [...prev, capsule.id]);
    onAwardPoints(15, `Unwrapped ${capsule.capsuleCode}: ${capsule.revealedTitle}`);
  };

  const handleRunSpeedScan = () => {
    setScanStep('scanning');
    window.setTimeout(() => {
      setScanStep('ready');
      onAwardPoints(10, '3-Min Book-to-Draft synthesis card sent to phone');
    }, 1200);
  };

  const handleCopySynthesis = async () => {
    const text = `Source: ${scanSourceTitle}\nClaim: Physical sampling audits reduce catalogue mismatch walking time.\nEvidence: Morling Ch. 5 & Sussex RFID audit.\nLimitation: Requires 15-min freshness window.`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify('Synthesis card & citation copied to clipboard.');
    } catch {
      onNotify('Synthesis card saved to mobile notes.');
    }
  };

  const handlePostTrail = () => {
    const trimmed = newTrailNote.trim();
    if (!trimmed) return;
    setTrails((prev) => [
      {
        id: `tr-${Date.now()}`,
        cohort: 'Postgrad Cohort (You)',
        pairing: trimmed,
        zone: 'Source Studio',
        timeAgo: 'just now',
      },
      ...prev,
    ]);
    setNewTrailNote('');
    onAwardPoints(10, 'Shared anonymous source trail on the Living Wall');
  };

  return (
    <div className="space-y-8">
      {/* Studio Overview Banner */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-[#B88635] dark:text-[#E2B979] shrink-0" />
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                Sussex Source Studio · Creative Knowledge Commons
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A dedicated quiet-friendly studio bridging physical books, Special Collections archives, and licensed software—giving digital-age postgraduates concrete reasons to explore physical library sources.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('twin')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Compass className="h-3.5 w-3.5" />
              Locate Studio in 3D
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigateTab('books');
                window.setTimeout(() => {
                  document.getElementById('book-video-story-studio')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 80);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2B979] px-3.5 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap"
            >
              <Film className="h-3.5 w-3.5" />
              AI Book Video Stories
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('books')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 whitespace-nowrap"
            >
              Check Shelf Inventory
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Station 1: Interactive Research Remix Table */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                01. Research Remix Table
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select a dissertation theme to pair 1 physical book, 1 archive item, and 1 licensed workstation tool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-[#EFECE5] dark:bg-[#00222B] p-1">
            {REMIX_RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => setSelectedRecipeId(recipe.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedRecipeId === recipe.id
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                }`}
              >
                {recipe.theme}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
              Physical Library Book
            </div>
            <div className="mt-1.5 font-display text-sm font-semibold text-slate-900 dark:text-white">
              {activeRecipe.physicalBook}
            </div>
            <div className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              {activeRecipe.bookShelf}
            </div>
          </div>

          <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
            <div className="text-xs font-semibold text-amber-700 dark:text-[#E2B979]">
              Archive & Special Source
            </div>
            <div className="mt-1.5 font-display text-sm font-semibold text-slate-900 dark:text-white">
              {activeRecipe.archiveSource}
            </div>
            <div className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              {activeRecipe.archiveLocation}
            </div>
          </div>

          <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Paired Library Software
            </div>
            <div className="mt-1.5 font-display text-sm font-semibold text-slate-900 dark:text-white">
              {activeRecipe.softwareTool}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Ready via NFC Desk Puck sync
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-700 dark:text-slate-300">{activeRecipe.outcome}</p>
          <button
            type="button"
            disabled={offline}
            onClick={() => handlePullRecipe(activeRecipe)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 ${
              pulledRecipes.includes(activeRecipe.id)
                ? 'bg-emerald-600 text-white'
                : 'bg-[#E2B979] text-slate-950 disabled:opacity-40'
            }`}
          >
            {pulledRecipes.includes(activeRecipe.id)
              ? 'Starter Pack Synced to Phone'
              : 'Sync Pack & Request Shelf Hold (+15 pts)'}
          </button>
        </div>
      </section>

      {/* Station 2: Blind Date with a Breakthrough (Tactile Mystery Source Wall) */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <Gift className="mt-0.5 h-5 w-5 text-[#B88635] dark:text-[#E2B979] shrink-0" />
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              02. Mystery Source Capsules ("Blind Date with a Breakthrough")
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Physical alcove lockers labeled with intriguing research questions instead of dry call numbers.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {MYSTERY_CAPSULES.map((capsule) => {
            const unwrapped = unwrappedCapsules.includes(capsule.id);
            return (
              <div
                key={capsule.id}
                className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                      {capsule.capsuleCode}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {unwrapped ? 'Revealed' : 'Sealed Clue'}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    “{capsule.clueQuestion}”
                  </p>

                  {unwrapped && (
                    <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/8 p-3 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {capsule.revealedTitle}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                        {capsule.shelfLocation}
                      </div>
                      <p className="mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {capsule.insight}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={unwrapped}
                  onClick={() => handleUnwrapCapsule(capsule)}
                  className={`mt-4 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap self-start ${
                    unwrapped
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#003B49] dark:bg-cyan-500 text-white dark:text-slate-950'
                  }`}
                >
                  {unwrapped ? 'Saved to Reading List' : 'Reveal Physical Source (+15 pts)'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Station 3 & 4: 3-Minute Book-to-Draft Booth + Living Dissertation Wall */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 3-Minute Book-to-Draft Synthesis Booth */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <FileScan className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  03. Three-Minute Book-to-Draft Booth
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Bring any stack volume to the standing overhead scanner—export a structured Claim, Evidence & Citation card directly to your phone without hauling heavy books home.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label htmlFor="scan-book" className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Book placed under booth scanner
              </label>
              <select
                id="scan-book"
                value={scanSourceTitle}
                onChange={(e) => {
                  setScanSourceTitle(e.target.value);
                  setScanStep('idle');
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Research Methods in Psychology (BF 76.5 MOR)">
                  Research Methods in Psychology (BF 76.5 MOR)
                </option>
                <option value="Change by Design — Tim Brown (TS 171.4 BRO)">
                  Change by Design — Tim Brown (TS 171.4 BRO)
                </option>
                <option value="Mass Observation Diary Folio #14 (Special Collections)">
                  Mass Observation Diary Folio #14 (Special Collections)
                </option>
              </select>

              <button
                type="button"
                disabled={scanStep === 'scanning'}
                onClick={handleRunSpeedScan}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 disabled:opacity-50 whitespace-nowrap"
              >
                <BookMarked className="h-3.5 w-3.5" />
                {scanStep === 'scanning' ? 'Extracting pages & APA citation…' : 'Run 3-Min Page Synthesis'}
              </button>

              {scanStep === 'ready' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs space-y-1.5">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Synced to Mobile Zotero / Notes
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    <strong>Source:</strong> {scanSourceTitle}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>Claim:</strong> Real-time physical-digital parity eliminates unproductive stack searches.
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>Limitation:</strong> Requires 15-minute RFID sweep intervals to remain reliable.
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySynthesis}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Citation & Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Living Dissertation Wall */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <Users className="mt-0.5 h-5 w-5 text-[#B88635] dark:text-[#E2B979] shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  04. Living Dissertation Source Wall
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Anonymous live stream of physical sources and software pairs peers are discovering on campus today.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {trails.map((trail) => (
                <div
                  key={trail.id}
                  className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] px-4 py-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-400">{trail.cohort}</span>
                    <span className="font-mono tabular-nums">
                      {trail.zone} · {trail.timeAgo}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                    {trail.pairing}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={newTrailNote}
              onChange={(e) => setNewTrailNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePostTrail();
              }}
              placeholder="Share a helpful book + tool pair anonymously…"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={!newTrailNote.trim()}
              onClick={handlePostTrail}
              className="inline-flex items-center gap-1 rounded-lg bg-[#E2B979] px-3.5 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40 whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" />
              Share (+10 pts)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
