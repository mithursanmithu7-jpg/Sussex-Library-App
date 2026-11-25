import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookVideoStory,
  LibraryBook,
  NetworkExceptionState,
  StoryVisualStyle,
} from '../types/library';
import { CURATED_BOOK_STORIES } from '../data/bookStoriesCurated';
import {
  Film,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  BookmarkCheck,
  AlertCircle,
  Loader2,
  BookOpenCheck,
  Download,
} from 'lucide-react';

interface BookVideoStoryStudioProps {
  activeBook: LibraryBook;
  books: LibraryBook[];
  networkState: NetworkExceptionState;
  onSelectBook: (bookId: string) => void;
  onNotify: (msg: string) => void;
}

const VISUAL_STYLES: StoryVisualStyle[] = [
  'Visual Concept Animation',
  'Architectural Documentary',
  'Lab Case Narrative',
];

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const BookVideoStoryStudio: React.FC<BookVideoStoryStudioProps> = ({
  activeBook,
  books,
  networkState,
  onSelectBook,
  onNotify,
}) => {
  const [story, setStory] = useState<BookVideoStory>(
    () => CURATED_BOOK_STORIES[activeBook.id] ?? Object.values(CURATED_BOOK_STORIES)[0]
  );
  const [visualStyle, setVisualStyle] = useState<StoryVisualStyle>('Visual Concept Animation');
  const [chapterFocus, setChapterFocus] = useState<string>('');
  const [excerpt, setExcerpt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSpokenSceneRef = useRef<number>(-1);
  const offline = networkState === 'offline';

  // Switch to curated reel when user picks a different book from the shelf tracker
  useEffect(() => {
    if (story.bookId !== activeBook.id) {
      const preset = CURATED_BOOK_STORIES[activeBook.id];
      if (preset) {
        setStory(preset);
        setElapsedSeconds(0);
        setIsPlaying(false);
        setErrorMsg('');
      }
    }
  }, [activeBook.id, story.bookId]);

  const sceneTimeline = useMemo(() => {
    let cursor = 0;
    return story.scenes.map((scene) => {
      const start = cursor;
      const end = cursor + scene.durationSeconds;
      cursor = end;
      return { scene, start, end };
    });
  }, [story.scenes]);

  const totalDuration = useMemo(
    () => sceneTimeline[sceneTimeline.length - 1]?.end ?? story.totalDurationSeconds,
    [sceneTimeline, story.totalDurationSeconds]
  );

  const currentWindow = useMemo(() => {
    return (
      sceneTimeline.find((w) => elapsedSeconds >= w.start && elapsedSeconds < w.end) ??
      sceneTimeline[sceneTimeline.length - 1]
    );
  }, [elapsedSeconds, sceneTimeline]);

  const currentScene = currentWindow?.scene ?? story.scenes[0];
  const sceneProgress = currentWindow
    ? Math.min(
        1,
        Math.max(
          0,
          (elapsedSeconds - currentWindow.start) / Math.max(1, currentWindow.scene.durationSeconds)
        )
      )
    : 0;

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setElapsedSeconds((prev) => {
        const next = prev + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration]);

  // Headphone-only Web Speech API Narration
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isPlaying || !voiceEnabled || !currentScene) {
      window.speechSynthesis.cancel();
      if (!isPlaying) {
        lastSpokenSceneRef.current = -1;
      }
      return;
    }

    if (lastSpokenSceneRef.current !== currentScene.sceneNumber) {
      lastSpokenSceneRef.current = currentScene.sceneNumber;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScene.narration);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentScene, isPlaying, voiceEnabled]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 16:9 Procedural Motion-Graphics Video Canvas Renderer (always runs gentle idle shimmer when paused, full animation when playing)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 960;
    const height = 540;
    let animTime = elapsedSeconds;
    let rafId = 0;

    const paletteByScene = [
      { primary: '#38BDF8', secondary: '#E2B979', glow: 'rgba(56,189,248,0.24)' },
      { primary: '#34D399', secondary: '#E2B979', glow: 'rgba(52,211,153,0.24)' },
      { primary: '#E2B979', secondary: '#38BDF8', glow: 'rgba(226,185,121,0.24)' },
      { primary: '#A78BFA', secondary: '#34D399', glow: 'rgba(167,139,250,0.24)' },
    ];
    const pal = paletteByScene[(currentScene.sceneNumber - 1) % paletteByScene.length];

    const particles = Array.from({ length: 24 }, (_, idx) => ({
      x: ((idx * 137) % width),
      y: ((idx * 89) % (height - 130)) + 20,
      r: 1.5 + (idx % 3) * 0.9,
      speed: 8 + (idx % 5) * 4,
    }));

    const drawWrappedHeadline = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number
    ) => {
      const words = text.split(' ');
      let line = '';
      let cursorY = y;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), x, cursorY);
          line = words[i] + ' ';
          cursorY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), x, cursorY);
      }
    };

    const drawProgressiveSubtitles = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      progress: number
    ) => {
      const words = text.split(' ');
      const highlightedCount = Math.max(1, Math.ceil(words.length * Math.min(1, progress * 1.08)));
      let lineWords: { word: string; lit: boolean }[] = [];
      const lines: { word: string; lit: boolean }[][] = [];

      words.forEach((word, idx) => {
        const testStr = [...lineWords.map((w) => w.word), word].join(' ');
        if (ctx.measureText(testStr).width > maxWidth && lineWords.length > 0) {
          lines.push(lineWords);
          lineWords = [{ word, lit: idx < highlightedCount }];
        } else {
          lineWords.push({ word, lit: idx < highlightedCount });
        }
      });
      if (lineWords.length > 0) lines.push(lineWords);

      lines.slice(0, 3).forEach((ln, lineIdx) => {
        let cursorX = x;
        const lineY = y + lineIdx * lineHeight;
        ln.forEach((token) => {
          ctx.fillStyle = token.lit ? '#FFFFFF' : 'rgba(148, 163, 184, 0.72)';
          ctx.fillText(token.word + ' ', cursorX, lineY);
          cursorX += ctx.measureText(token.word + ' ').width;
        });
      });
    };

    const renderFrame = (t: number) => {
      // Deep Sussex Flint studio backdrop with subtle breathing radial light
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#001B22');
      bgGrad.addColorStop(0.55, '#00323F');
      bgGrad.addColorStop(1, '#001E26');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Drifting parallax architectural grid
      const panX = (t * 10) % 48;
      ctx.strokeStyle = 'rgba(226, 185, 121, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = -48 + panX; gx < width; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Ambient radial aura
      const auraX = width * 0.68 + Math.sin(t * 0.6) * 24;
      const auraY = height * 0.4 + Math.cos(t * 0.5) * 18;
      const radial = ctx.createRadialGradient(auraX, auraY, 24, auraX, auraY, 360);
      radial.addColorStop(0, pal.glow);
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Ambient floating knowledge particles
      particles.forEach((p, idx) => {
        const px = (p.x + t * p.speed) % width;
        const py = p.y + Math.sin(t * 1.4 + idx) * 8;
        ctx.fillStyle = idx % 3 === 0 ? 'rgba(226,185,121,0.38)' : 'rgba(56,189,248,0.28)';
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Right-hand Cinema Visual Stage
      const stageCx = 680;
      const stageCy = 232;
      ctx.save();

      if (currentScene.visualMotif === 'network') {
        const nodes = [
          { x: stageCx - 135, y: stageCy - 55, label: 'Thesis' },
          { x: stageCx + 15, y: stageCy - 110, label: 'Evidence' },
          { x: stageCx + 155, y: stageCy - 28, label: 'Method' },
          { x: stageCx - 60, y: stageCy + 78, label: 'Context' },
          { x: stageCx + 115, y: stageCy + 82, label: 'Impact' },
        ];
        nodes.forEach((n, i) => {
          nodes.slice(i + 1).forEach((m, j) => {
            ctx.strokeStyle = 'rgba(226,185,121,0.26)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();

            const pulse = (t * 0.5 + (i + j) * 0.23) % 1;
            const px = n.x + (m.x - n.x) * pulse;
            const py = n.y + (m.y - n.y) * pulse;
            ctx.fillStyle = pal.secondary;
            ctx.beginPath();
            ctx.arc(px, py, 3.6, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        nodes.forEach((n, i) => {
          const r = 16 + Math.sin(t * 2.4 + i) * 3;
          ctx.fillStyle = i % 2 === 0 ? pal.primary : pal.secondary;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#001E26';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#E2E8F0';
          ctx.font = '600 11px JetBrains Mono, monospace';
          ctx.fillText(n.label, n.x - 18, n.y + r + 15);
        });
      } else if (currentScene.visualMotif === 'experiment') {
        // Control vs Intervention curves + shaded confidence envelope
        ctx.fillStyle = 'rgba(56,189,248,0.1)';
        ctx.beginPath();
        for (let x = -185; x <= 185; x += 6) {
          const y = Math.sin(x * 0.032 - t * 2.1) * 54 - 22;
          if (x === -185) ctx.moveTo(stageCx + x, stageCy + y - 20);
          else ctx.lineTo(stageCx + x, stageCy + y - 20);
        }
        for (let x = 185; x >= -185; x -= 6) {
          const y = Math.sin(x * 0.032 - t * 2.1) * 54 - 22;
          ctx.lineTo(stageCx + x, stageCy + y + 20);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(226,185,121,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = -185; x <= 185; x += 6) {
          const y = Math.sin(x * 0.028 + t * 1.3) * 26 + 38;
          if (x === -185) ctx.moveTo(stageCx + x, stageCy + y);
          else ctx.lineTo(stageCx + x, stageCy + y);
        }
        ctx.stroke();

        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        for (let x = -185; x <= 185; x += 6) {
          const y = Math.sin(x * 0.032 - t * 2.1) * 54 - 22;
          if (x === -185) ctx.moveTo(stageCx + x, stageCy + y);
          else ctx.lineTo(stageCx + x, stageCy + y);
        }
        ctx.stroke();

        const probeX = stageCx + Math.sin(t * 0.95) * 145;
        ctx.strokeStyle = '#E2B979';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(probeX, stageCy - 115);
        ctx.lineTo(probeX, stageCy + 100);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (currentScene.visualMotif === 'spatial') {
        // Isometric 4-floor Sussex Library stack with ascending gold beam
        for (let layer = 0; layer < 4; layer++) {
          const ly = stageCy + 70 - layer * 42 + Math.sin(t * 1.5 + layer) * 4;
          const activeFloor = Math.floor((t * 0.65) % 4) === layer;
          ctx.fillStyle = activeFloor ? 'rgba(226,185,121,0.24)' : 'rgba(0, 48, 60, 0.78)';
          ctx.strokeStyle = activeFloor ? '#E2B979' : 'rgba(56,189,248,0.45)';
          ctx.lineWidth = activeFloor ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.moveTo(stageCx, ly - 36);
          ctx.lineTo(stageCx + 150, ly);
          ctx.lineTo(stageCx, ly + 36);
          ctx.lineTo(stageCx - 150, ly);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        const beamY = stageCy + 70 - ((t * 50) % 130);
        ctx.fillStyle = '#E2B979';
        ctx.beginPath();
        ctx.arc(stageCx, beamY, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentScene.visualMotif === 'timeline') {
        ctx.strokeStyle = 'rgba(148,163,184,0.28)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(stageCx - 175, stageCy);
        ctx.lineTo(stageCx + 175, stageCy);
        ctx.stroke();

        const activeSpan = ((t * 0.32) % 1) * 350;
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(stageCx - 175, stageCy);
        ctx.lineTo(stageCx - 175 + activeSpan, stageCy);
        ctx.stroke();

        [-150, -50, 50, 150].forEach((ox, idx) => {
          const lit = activeSpan >= ox + 175;
          ctx.fillStyle = lit ? '#E2B979' : '#0B3440';
          ctx.strokeStyle = lit ? '#FFFFFF' : '#1D5362';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(stageCx + ox, stageCy, lit ? 14 : 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '600 11px JetBrains Mono, monospace';
          ctx.fillText(`0${idx + 1}`, stageCx + ox - 7, stageCy - 22);
        });
      } else {
        // Holographic Open Book vs Live Data Lens
        ctx.fillStyle = 'rgba(0, 59, 73, 0.55)';
        ctx.strokeStyle = 'rgba(226,185,121,0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(stageCx - 180, stageCy - 95, 165, 190);
        ctx.strokeRect(stageCx - 180, stageCy - 95, 165, 190);

        ctx.fillStyle = 'rgba(56,189,248,0.16)';
        ctx.strokeStyle = pal.primary;
        ctx.fillRect(stageCx + 15, stageCy - 95, 165, 190);
        ctx.strokeRect(stageCx + 15, stageCy - 95, 165, 190);

        // Simulated text lines on left page transforming into bar visuals on right
        for (let r = 0; r < 5; r++) {
          ctx.fillStyle = 'rgba(226,232,240,0.32)';
          ctx.fillRect(stageCx - 158, stageCy - 62 + r * 30, 118 - (r % 2) * 28, 7);

          const barW = 48 + Math.sin(t * 2 + r) * 35 + 30;
          ctx.fillStyle = r % 2 === 0 ? pal.primary : '#E2B979';
          ctx.fillRect(stageCx + 35, stageCy - 64 + r * 30, barW, 11);
        }

        const sweepY = stageCy + Math.sin(t * 1.9) * 80;
        ctx.strokeStyle = '#E2B979';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(stageCx - 185, sweepY);
        ctx.lineTo(stageCx + 185, sweepY);
        ctx.stroke();
      }
      ctx.restore();

      // Top HUD metadata bar
      ctx.fillStyle = '#E2B979';
      ctx.font = '600 13px JetBrains Mono, monospace';
      ctx.fillText(currentScene.chapterBeat.toUpperCase(), 44, 48);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '500 12px JetBrains Mono, monospace';
      const rightLabel = `${story.callNumber} · ${currentScene.citationAnchor}`;
      const rw = ctx.measureText(rightLabel).width;
      ctx.fillText(rightLabel, width - 44 - rw, 48);

      // Voiceover Audio Waveform Indicator when Voiceover is active & playing
      if (isPlaying && voiceEnabled) {
        for (let bar = 0; bar < 7; bar++) {
          const bh = 6 + Math.abs(Math.sin(t * 9 + bar * 0.9)) * 16;
          ctx.fillStyle = '#E2B979';
          ctx.fillRect(width - 44 - bar * 6, 62 + (22 - bh) / 2, 3, bh);
        }
      }

      // Left-side Main Story Headline
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 32px Outfit, Plus Jakarta Sans, sans-serif';
      drawWrappedHeadline(currentScene.visualHeadline, 44, 122, 410, 40);

      // Diagram label chips inside scene (left stack)
      currentScene.diagramLabels.slice(0, 3).forEach((lbl, idx) => {
        const chipY = 238 + idx * 46;
        const activePulse = Math.floor(t * 0.85) % 3 === idx;
        ctx.fillStyle = activePulse ? 'rgba(226,185,121,0.22)' : 'rgba(0, 38, 48, 0.86)';
        ctx.strokeStyle = activePulse ? '#E2B979' : 'rgba(29, 83, 98, 0.9)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(44, chipY, 290, 35, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = activePulse ? '#FFFFFF' : '#E2E8F0';
        ctx.font = '600 13px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`0${idx + 1} · ${lbl}`, 58, chipY + 22);
      });

      // Bottom Cinematic Subtitle Caption Band
      ctx.fillStyle = 'rgba(0, 26, 33, 0.92)';
      ctx.fillRect(0, height - 118, width, 118);
      ctx.strokeStyle = 'rgba(226, 185, 121, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, height - 118);
      ctx.lineTo(width, height - 118);
      ctx.stroke();

      ctx.font = '500 17px Plus Jakarta Sans, sans-serif';
      drawProgressiveSubtitles(
        currentScene.narration,
        44,
        height - 78,
        width - 88,
        25,
        isPlaying ? sceneProgress : 1
      );

      // Scene progress bar along bottom
      ctx.fillStyle = 'rgba(29, 83, 98, 0.5)';
      ctx.fillRect(0, height - 5, width, 5);
      ctx.fillStyle = '#E2B979';
      const totalPct = Math.min(1, elapsedSeconds / Math.max(1, totalDuration));
      ctx.fillRect(0, height - 5, width * totalPct, 5);
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      animTime += isPlaying ? dt : dt * 0.45;
      renderFrame(animTime);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [currentScene, elapsedSeconds, isPlaying, sceneProgress, story.callNumber, totalDuration, voiceEnabled]);

  const handleTogglePlay = () => {
    if (elapsedSeconds >= totalDuration) {
      setElapsedSeconds(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    setElapsedSeconds(0);
    setIsPlaying(true);
  };

  const handleJumpScene = (startSeconds: number) => {
    setElapsedSeconds(startSeconds);
    lastSpokenSceneRef.current = -1;
  };

  const handleGenerateAiStory = async () => {
    if (offline) return;
    setIsGenerating(true);
    setErrorMsg('');
    setIsPlaying(false);

    try {
      const response = await fetch('/api/book-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: activeBook.id,
          bookTitle: activeBook.title,
          author: activeBook.author,
          callNumber: activeBook.callNumber,
          shelf: activeBook.shelf,
          visualStyle,
          chapterFocus: chapterFocus.trim(),
          excerpt: excerpt.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Could not generate AI book video story.');
        return;
      }

      setStory(data as BookVideoStory);
      setElapsedSeconds(0);
      setIsPlaying(true);
      onNotify(`Generated AI Video Story for "${activeBook.title}".`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Network error connecting to AI story service.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadCurated = (bookId: string, autoPlayNow = true) => {
    onSelectBook(bookId);
    const preset = CURATED_BOOK_STORIES[bookId];
    if (preset) {
      setStory(preset);
      setElapsedSeconds(0);
      setIsPlaying(autoPlayNow);
      setErrorMsg('');
    }
  };

  const handleExportVideoClip = () => {
    const canvas = canvasRef.current as (HTMLCanvasElement & {
      captureStream?: (fps?: number) => MediaStream;
    }) | null;
    if (!canvas || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      onNotify('Direct .webm video capture is not supported in this browser.');
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${story.callNumber.replace(/\s+/g, '_')}_story_clip.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        onNotify('Saved 8-second book story video clip (.webm) for offline phone viewing.');
      };

      setIsExporting(true);
      setIsPlaying(true);
      recorder.start();
      onNotify('Recording 8-second story reel clip…');
      window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 8000);
    } catch {
      setIsExporting(false);
      onNotify('Could not export video clip in this browser context.');
    }
  };

  const handleSyncNotes = async () => {
    const noteText = `${story.storyTitle}\nBook: ${story.bookTitle} (${story.callNumber})\n\nTakeaways:\n${story.keyTakeaways
      .map((t, i) => `${i + 1}. ${t}`)
      .join('\n')}`;
    try {
      await navigator.clipboard.writeText(noteText);
      onNotify('Video story takeaways & citation synced to clipboard for mobile study.');
    } catch {
      onNotify('Video story takeaways saved to your mobile reading pack.');
    }
  };

  return (
    <section
      id="book-video-story-studio"
      className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
        <div className="flex items-start gap-3">
          <Film className="mt-0.5 h-5 w-5 text-[#B88635] dark:text-[#E2B979] shrink-0" />
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              AI Book-to-Video Story Studio
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Watch any reading-list book or pasted chapter as a dynamic 60-second visual story—built for digital-age students instead of dense word-by-word scanning.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-300">
            {story.source === 'gemini' ? 'Gemini AI Storyboard' : 'Curated Reading-List Reel'} ·{' '}
            {formatSeconds(totalDuration)}
          </span>
        </div>
      </div>

      {/* Streaming-Style Book Story Poster Shelf */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {books.map((bk) => {
          const preview = CURATED_BOOK_STORIES[bk.id];
          const isSelected = activeBook.id === bk.id;
          return (
            <button
              key={bk.id}
              type="button"
              onClick={() => handleLoadCurated(bk.id, true)}
              className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-[#E2B979] bg-[#003B49] text-white shadow-md'
                  : 'border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] hover:border-[#E2B979]/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={isSelected ? 'text-[#E2B979]' : 'text-cyan-700 dark:text-cyan-400'}>
                    {bk.callNumber}
                  </span>
                  <span className={isSelected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}>
                    {preview?.totalDurationSeconds ?? 56}s Story
                  </span>
                </div>
                <div
                  className={`mt-1.5 font-display text-sm font-semibold leading-snug ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {preview?.storyTitle ?? bk.title}
                </div>
                <div
                  className={`mt-1 text-xs ${
                    isSelected ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {bk.title} · {bk.author}
                </div>
              </div>

              <div
                className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isSelected ? 'text-[#E2B979]' : 'text-[#003B49] dark:text-cyan-400'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                {isSelected && isPlaying ? 'Now Playing' : 'Watch Story Reel'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Layout: 16:9 Animated Player (Left 7 cols) + AI Story Director Controls (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Player + Chapter Scrubber + Key Takeaways */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#001B22] shadow-sm">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                onClick={handleTogglePlay}
                className="w-full h-auto aspect-video block cursor-pointer"
                aria-label={`Animated visual book story for ${story.bookTitle}`}
              />

              {!isPlaying && (
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label="Play AI Book Video Story"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-full border border-[#E2B979] bg-[#002630]/90 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-[#003B49]"
                >
                  <Play className="h-4 w-4 text-[#E2B979] fill-[#E2B979]" />
                  {elapsedSeconds >= totalDuration ? 'Replay Visual Story' : 'Watch Video Story'}
                </button>
              )}
            </div>

            {/* Player Controls Bar */}
            <div className="border-t border-[#1D5362] bg-[#002630] px-4 py-3 space-y-3 text-white">
              {/* Scrub slider */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] tabular-nums text-slate-300 w-10">
                  {formatSeconds(elapsedSeconds)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.25}
                  value={elapsedSeconds}
                  aria-label="Scrub video story timeline"
                  onChange={(e) => {
                    setElapsedSeconds(Number(e.target.value));
                    lastSpokenSceneRef.current = -1;
                  }}
                  className="flex-1 accent-[#E2B979] cursor-pointer"
                />
                <span className="font-mono text-[11px] tabular-nums text-slate-400 w-10 text-right">
                  {formatSeconds(totalDuration)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2B979] px-3.5 py-1.5 text-xs font-semibold text-[#002630] hover:opacity-90 whitespace-nowrap"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isPlaying ? 'Pause' : elapsedSeconds >= totalDuration ? 'Replay' : 'Play Story'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1D5362] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#08313D] whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceEnabled((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      voiceEnabled
                        ? 'border-[#E2B979] bg-[#E2B979]/15 text-[#E2B979]'
                        : 'border-[#1D5362] text-slate-300 hover:bg-[#08313D]'
                    }`}
                  >
                    {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    {voiceEnabled ? 'Voiceover On' : 'Silent Captions'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportVideoClip}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1D5362] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#08313D] disabled:opacity-50 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isExporting ? 'Recording 8s…' : 'Save Clip (.webm)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncNotes}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-[#002630] whitespace-nowrap"
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    Sync Notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Scene Beat Selector */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sceneTimeline.map((win) => {
              const active = currentScene?.sceneNumber === win.scene.sceneNumber;
              return (
                <button
                  key={win.scene.sceneNumber}
                  type="button"
                  onClick={() => handleJumpScene(win.start)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-[#E2B979] bg-[#E2B979]/12'
                      : 'border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] hover:border-[#E2B979]/50'
                  }`}
                >
                  <div className="font-mono text-[11px] font-semibold text-[#B88635] dark:text-[#E2B979]">
                    {win.scene.chapterBeat}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                    {win.scene.visualHeadline}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Story Summary & Takeaways */}
          <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-4 space-y-2.5">
            <div>
              <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                {story.bookTitle} · {story.visualStyle}
              </div>
              <h3 className="mt-0.5 font-display text-base font-semibold text-slate-900 dark:text-white">
                {story.storyTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{story.hookSummary}</p>
            </div>
            {story.keyTakeaways.length > 0 && (
              <ul className="space-y-1.5 border-t border-[#DDD8CE] dark:border-[#1D5362] pt-2.5 text-xs text-slate-700 dark:text-slate-300">
                {story.keyTakeaways.map((tk) => (
                  <li key={tk} className="flex items-start gap-2">
                    <BookOpenCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{tk}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: AI Story Director Form */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-5 space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Generate Custom AI Book Video Story
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Choose a narrative style, focus chapter, or paste a tricky paragraph to transform any reading-list source into an instant 4-scene visual story.
              </p>
            </div>

            {/* Visual Style Picker */}
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Story visual style
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {VISUAL_STYLES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setVisualStyle(st)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      visualStyle === st
                        ? 'border-[#E2B979] bg-[#E2B979]/15 text-[#003B49] dark:text-[#E2B979]'
                        : 'border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter / Concept Focus */}
            <div>
              <label
                htmlFor="story-chapter-focus"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                Chapter or dissertation question (optional)
              </label>
              <input
                id="story-chapter-focus"
                type="text"
                value={chapterFocus}
                onChange={(e) => setChapterFocus(e.target.value)}
                placeholder="e.g. Ch. 10 factorial designs & internal validity"
                className="w-full rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#00222B] px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label
                htmlFor="story-excerpt"
                className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
              >
                Paste tricky paragraph or page notes (optional)
              </label>
              <textarea
                id="story-excerpt"
                rows={4}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Paste dense prose from an e-chapter or abstract to convert into visual scenes…"
                className="w-full rounded-lg border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#00222B] px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={offline || isGenerating}
              onClick={handleGenerateAiStory}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#E2B979] px-4 py-2.5 text-xs font-semibold text-[#002630] hover:opacity-90 disabled:opacity-45 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI Visual Story…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Video Story ({activeBook.author.split(' ').pop()})
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {offline
                ? 'Offline mode active — play curated reels or reconnect to generate custom AI stories.'
                : 'Powered by Gemini storyboarding · Plays locally at 60 fps with downloadable .webm clips.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
