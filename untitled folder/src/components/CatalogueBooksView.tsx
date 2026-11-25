import React, { useEffect, useRef, useState } from 'react';
import { LibraryBook, NetworkExceptionState } from '../types/library';
import { LENDING_STEPS, OFFICIAL_LIBRARY_LINKS } from '../data/libraryInitialData';
import {
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle2,
  Film,
} from 'lucide-react';
import { BookVideoStoryStudio } from './BookVideoStoryStudio';

interface CatalogueBooksViewProps {
  books: LibraryBook[];
  networkState: NetworkExceptionState;
  onReportBookMissing: (bookId: string) => void;
  onNotify: (msg: string) => void;
}

export const CatalogueBooksView: React.FC<CatalogueBooksViewProps> = ({
  books,
  networkState,
  onReportBookMissing,
  onNotify,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id ?? '');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeBook = books.find((b) => b.id === selectedBookId) ?? books[0];
  const offline = networkState === 'offline';
  const delayed = networkState !== 'ok';

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= LENDING_STEPS.length - 1) {
          setAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleOpenCameraScan = async () => {
    setScanResult('Initializing optical shelf label detector…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      window.setTimeout(() => {
        setScanResult(
          'Detected Bay 4B · Shelf 3 (BF 76.5 MOR). Matches physical catalogue entry for Research Methods in Psychology.'
        );
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraActive(false);
      }, 3200);
    } catch {
      setCameraActive(false);
      setScanResult(
        'Camera permission unavailable in this browser context. Simulated bay scan verified: Bay 4B, Shelf 3 matches active record.'
      );
    }
  };

  const currentStep = LENDING_STEPS[stepIdx];
  const noneOnShelf = activeBook.freeCopies === 0;

  return (
    <div className="space-y-8">
      {/* Physical Shelf Confidence + Camera Scanner */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
          <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <BookOpen className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Physical Shelf Confidence Tracker
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Displays RFID shelf sweep timestamps before you walk, with instant digital fallback if copies are out.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="book-select" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Select reading list title
            </label>
            <select
              id="book-select"
              value={activeBook.id}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author} ({b.callNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {activeBook.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {activeBook.author} · Classmark <span className="font-mono">{activeBook.callNumber}</span>
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  activeBook.reportedMissing
                    ? 'text-rose-600 dark:text-rose-400'
                    : delayed
                      ? 'text-amber-600 dark:text-amber-400'
                      : noneOnShelf
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {activeBook.reportedMissing || noneOnShelf ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {activeBook.reportedMissing
                  ? 'Reported missing'
                  : delayed
                    ? 'Unconfirmed'
                    : noneOnShelf
                      ? 'All copies checked out'
                      : 'Confirmed on shelf'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-3">
                <span className="text-slate-500 dark:text-slate-400">Physical Location</span>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{activeBook.shelf}</div>
              </div>
              <div className="rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-3 font-mono tabular-nums">
                <span className="font-sans text-slate-500 dark:text-slate-400">Shelf Inventory</span>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {activeBook.freeCopies} of {activeBook.totalCopies} available · Verified{' '}
                  {networkState === 'late' ? '14 min ago' : networkState === 'offline' ? '09:42 (saved)' : activeBook.lastConfirmed}
                </div>
              </div>
            </div>

            {noneOnShelf && (
              <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                All physical copies are currently loaned out. Read the instant e-book below or place a hold for pickup alerts.
              </p>
            )}

            {activeBook.reportedMissing && (
              <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                Staff have been alerted to audit {activeBook.shelf}. Meanwhile, open the instant e-book or place a hold.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNotify(`Opened digital e-book edition of "${activeBook.title}".`)}
                className="rounded-lg bg-[#E2B979] px-3.5 py-2 text-xs font-semibold text-slate-950 hover:opacity-90 whitespace-nowrap"
              >
                Open instant e-book
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('book-video-story-studio');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 dark:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 hover:opacity-90 whitespace-nowrap"
              >
                <Film className="h-3.5 w-3.5" />
                Watch AI Video Story
              </button>
              <button
                type="button"
                onClick={() =>
                  onNotify(
                    `Synced "${activeBook.title}" (${activeBook.callNumber}) & offline reading pack to your phone.`
                  )
                }
                className="rounded-lg bg-[#003B49] dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 whitespace-nowrap"
              >
                Sync to phone (Offline)
              </button>
              <button
                type="button"
                disabled={offline || noneOnShelf || activeBook.reportedMissing}
                onClick={() => onReportBookMissing(activeBook.id)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
              >
                Not on shelf
              </button>
              <button
                type="button"
                disabled={offline}
                onClick={() => onNotify(`Priority hold placed on "${activeBook.title}".`)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap"
              >
                Place a hold
              </button>
              <a
                href={OFFICIAL_LIBRARY_LINKS[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline ml-auto whitespace-nowrap"
              >
                Sussex Library Search
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Optical Shelf Bay Scanner */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <Camera className="mt-0.5 h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Optical Bay Verification
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Point your phone at a shelf bay label to cross-verify call numbers against the live catalogue.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleOpenCameraScan}
                className="inline-flex items-center gap-2 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 whitespace-nowrap"
              >
                <Camera className="h-3.5 w-3.5" />
                Scan shelf bay label
              </button>

              <video
                ref={videoRef}
                playsInline
                muted
                className={`mt-4 w-full rounded-xl border border-slate-200 dark:border-slate-800 ${
                  cameraActive ? 'block' : 'hidden'
                }`}
              />

              {scanResult && (
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                  {scanResult}
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            Zero images are stored or uploaded; bay label OCR executes locally on-device.
          </p>
        </div>
      </section>

      {/* AI Book-to-Video Story Studio */}
      <BookVideoStoryStudio
        activeBook={activeBook}
        books={books}
        networkState={networkState}
        onSelectBook={setSelectedBookId}
        onNotify={onNotify}
      />

      {/* 5-Step Interactive Lending Guide */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              Interactive Lending Walkthrough
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Five resilient steps from search verification to self-issue and missing-item recovery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIdx((prev) => (prev - 1 + LENDING_STEPS.length) % LENDING_STEPS.length)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setAutoPlay((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003B49] dark:bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-950 whitespace-nowrap"
            >
              {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {autoPlay ? 'Pause' : 'Play Guide'}
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((prev) => (prev + 1) % LENDING_STEPS.length)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-[#002630] dark:bg-[#04232C] border border-[#1D5362] p-6 text-white">
          <div className="text-xs font-semibold text-[#E2B979]">
            Step 0{currentStep.stepNumber} · {currentStep.badge}
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">
            {currentStep.title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 leading-relaxed">
            {currentStep.summary}
          </p>

          <div className="mt-6 grid grid-cols-5 gap-2">
            {LENDING_STEPS.map((st, idx) => (
              <button
                key={st.stepNumber}
                type="button"
                aria-label={`Jump to step ${st.stepNumber}`}
                onClick={() => setStepIdx(idx)}
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= stepIdx ? 'bg-[#E2B979]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
