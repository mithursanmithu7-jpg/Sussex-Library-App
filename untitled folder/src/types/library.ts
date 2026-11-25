export type PrimaryTab = 'twin' | 'spaces' | 'books' | 'studio' | 'autopilot' | 'operations';

export type NetworkExceptionState = 'ok' | 'late' | 'offline';

export type HeatmapLayer = 'use' | 'wifi' | 'temp' | 'noise';

export type CameraPreset = 'orbit' | 'aisle' | 'booths' | 'desk';

export type SoftwareName = 'SPSS' | 'NVivo' | 'Python' | 'MATLAB' | 'Stata';

export interface FloorData {
  id: number;
  name: string;
  shortName: string;
  use: number;
  note: string;
  wifi: number;
  freeSockets: number;
}

export interface ZoneTelemetry {
  index: number;
  name: string;
  use: number;
  bars: number;
  temp: number;
  noise: number;
}

export interface RoomClimate {
  name: string;
  floorIndex: number;
  temp: number;
  goal: number;
  requests: number;
}

export interface LibraryPc {
  id: string;
  floor: string;
  floorIndex: number;
  software: SoftwareName[];
  available: boolean;
  reservedByMe?: boolean;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  callNumber: string;
  shelf: string;
  floorIndex: number;
  freeCopies: number;
  totalCopies: number;
  lastConfirmed: string;
  reportedMissing: boolean;
}

export interface LendingStep {
  stepNumber: number;
  title: string;
  summary: string;
  badge: string;
}

export interface AutopilotPlan {
  software: SoftwareName;
  needsCallBooth: boolean;
  pcId: string | null;
  boothFloor: number | null;
}

export interface AutopilotLogEntry {
  id: string;
  time: string;
  eventTitle: string;
  actionSummary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  source?: 'gemini' | 'local';
}

export interface StaffIssue {
  id: string;
  category: string;
  detail: string;
  timestamp: string;
  resolved: boolean;
}

export interface StudyRoomBooking {
  roomName: string;
  minutesElapsed: number;
  checkedIn: boolean;
}

export interface MobileSourceBridgeItem {
  id: string;
  tagLabel: string;
  location: string;
  title: string;
  citation: string;
  actionLabel: string;
  offlineReady: boolean;
}

export interface SerendipitySpark {
  id: string;
  floor: string;
  bay: string;
  discipline: string;
  title: string;
  whyItMatters: string;
  pointsBonus: number;
}

export interface StudyConstellation {
  id: string;
  name: string;
  floor: string;
  activeCount: number;
  cadence: string;
}

export type StoryVisualMotif = 'network' | 'experiment' | 'spatial' | 'timeline' | 'contrast';

export type StoryVisualStyle =
  | 'Architectural Documentary'
  | 'Visual Concept Animation'
  | 'Lab Case Narrative';

export interface BookStoryScene {
  sceneNumber: number;
  chapterBeat: string;
  visualHeadline: string;
  narration: string;
  visualMotif: StoryVisualMotif;
  diagramLabels: string[];
  citationAnchor: string;
  durationSeconds: number;
}

export interface BookVideoStory {
  bookId: string;
  bookTitle: string;
  author: string;
  callNumber: string;
  visualStyle: StoryVisualStyle;
  storyTitle: string;
  hookSummary: string;
  totalDurationSeconds: number;
  keyTakeaways: string[];
  scenes: BookStoryScene[];
  source: 'gemini' | 'curated';
}

