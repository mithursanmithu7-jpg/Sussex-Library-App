import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/assistant', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets, or switch to the deterministic spatial planner.',
      });
      return;
    }

    const { message, history, libraryState } = req.body ?? {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A message string is required.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = [
        'You are the Sussex Library Live spatial assistant for University of Sussex postgraduate students.',
        'Your job is to bridge digital library telemetry with physical building spaces (floors, software-equipped PCs, call booths, study rooms, physical books, phone Wi-Fi, and room temperature).',
        'Answer concisely, practically, and accurately using ONLY the live library state provided in context.',
        'If data is marked as delayed or offline, warn the student explicitly so they do not waste a walk.',
        'For group study rooms: note they are booked on the Sussex Library site (3 hours/day max, 30-minute QR code door check-in).',
        'If the student asks to speak to a human or needs staff intervention, provide Sussex Library chat hours (9am-5pm Mon-Fri), library@sussex.ac.uk, and 01273 678163.',
        `Current live library telemetry: ${JSON.stringify(libraryState ?? {})}`,
      ].join('\n');

      const transcript = Array.isArray(history)
        ? history
            .slice(-6)
            .map((item: { role: string; text: string }) => `${item.role === 'user' ? 'Student' : 'Assistant'}: ${item.text}`)
            .join('\n')
        : '';

      const prompt = transcript ? `${transcript}\nStudent: ${message}` : message;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({
        reply: response.text ?? 'I could not generate a response right now. Please try the Library Help Desk.',
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to query Gemini assistant.';
      res.status(502).json({ error: msg });
    }
  });

  app.post('/api/book-story', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to generate custom AI book stories.',
      });
      return;
    }

    const { bookId, bookTitle, author, callNumber, shelf, chapterFocus, visualStyle, excerpt } =
      req.body ?? {};
    if (!bookTitle || typeof bookTitle !== 'string') {
      res.status(400).json({ error: 'bookTitle is required.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = [
        'You are the Sussex Library Book-to-Video Story Director.',
        'Transform academic library books or excerpts into concise, high-impact 4-scene visual storyboards designed for postgraduate students who learn faster through narrative visual stories than reading word-by-word.',
        'Make every scene concrete, intellectually accurate, and easy to follow as a 60-second animated explainer.',
        'For each scene, choose visualMotif strictly from: "network", "experiment", "spatial", "timeline", or "contrast".',
        'Keep narration per scene to 22-32 crisp spoken words, visualHeadline to 3-6 words, and diagramLabels to 3 short conceptual labels (2-4 words each).',
      ].join('\n');

      const userPrompt = [
        `Book: ${bookTitle}${author ? ` by ${author}` : ''}`,
        callNumber ? `Classmark: ${callNumber}` : '',
        shelf ? `Library location: ${shelf}` : '',
        `Visual style: ${visualStyle || 'Visual Concept Animation'}`,
        chapterFocus ? `Student focus / question: ${chapterFocus}` : 'Focus: Core thesis, methodology, and postgraduate dissertation use.',
        excerpt ? `Passage / notes provided by student:\n${String(excerpt).slice(0, 1800)}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              storyTitle: { type: Type.STRING },
              hookSummary: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    chapterBeat: { type: Type.STRING },
                    visualHeadline: { type: Type.STRING },
                    narration: { type: Type.STRING },
                    visualMotif: { type: Type.STRING },
                    diagramLabels: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    citationAnchor: { type: Type.STRING },
                    durationSeconds: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      const validMotifs = new Set(['network', 'experiment', 'spatial', 'timeline', 'contrast']);
      const scenes = Array.isArray(parsed.scenes)
        ? parsed.scenes.slice(0, 4).map((sc: Record<string, unknown>, idx: number) => ({
            sceneNumber: idx + 1,
            chapterBeat: String(sc.chapterBeat || `0${idx + 1} · Story Beat`),
            visualHeadline: String(sc.visualHeadline || bookTitle),
            narration: String(sc.narration || ''),
            visualMotif: validMotifs.has(String(sc.visualMotif))
              ? String(sc.visualMotif)
              : (['spatial', 'experiment', 'network', 'timeline'][idx % 4]),
            diagramLabels: Array.isArray(sc.diagramLabels)
              ? sc.diagramLabels.slice(0, 4).map(String)
              : ['Core Concept', 'Method', 'Evidence'],
            citationAnchor: String(sc.citationAnchor || callNumber || 'Reading List'),
            durationSeconds: Math.min(20, Math.max(10, Number(sc.durationSeconds) || 14)),
          }))
        : [];

      if (scenes.length === 0) {
        res.status(502).json({ error: 'Gemini returned an empty storyboard. Please try again.' });
        return;
      }

      const totalDurationSeconds = scenes.reduce((acc: number, s: { durationSeconds: number }) => acc + s.durationSeconds, 0);

      res.json({
        bookId: bookId || 'custom',
        bookTitle,
        author: author || 'Sussex Reading List',
        callNumber: callNumber || 'Library Collection',
        visualStyle: visualStyle || 'Visual Concept Animation',
        storyTitle: String(parsed.storyTitle || `${bookTitle} — Visual Story`),
        hookSummary: String(parsed.hookSummary || 'Key arguments and methods distilled into a visual story.'),
        totalDurationSeconds,
        keyTakeaways: Array.isArray(parsed.keyTakeaways)
          ? parsed.keyTakeaways.slice(0, 4).map(String)
          : [],
        scenes,
        source: 'gemini',
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to generate book video story.';
      res.status(502).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: hmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Sussex Library Live server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
