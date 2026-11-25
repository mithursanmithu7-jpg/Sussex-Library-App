import {
  FloorData,
  LendingStep,
  LibraryBook,
  LibraryPc,
  MobileSourceBridgeItem,
  RoomClimate,
  SerendipitySpark,
  SoftwareName,
  StudyConstellation,
  ZoneTelemetry,
} from '../types/library';

export const SOFTWARE_OPTIONS: SoftwareName[] = ['SPSS', 'NVivo', 'Python', 'MATLAB', 'Stata'];

export const INITIAL_FLOORS: FloorData[] = [
  { id: 0, name: 'Ground Floor', shortName: 'Ground', use: 62, note: 'Social hub, Tech Desk, café nearby', wifi: 5, freeSockets: 26 },
  { id: 1, name: 'Floor 1', shortName: 'Floor 1', use: 71, note: 'Silent reading zone, no voice calls', wifi: 4, freeSockets: 18 },
  { id: 2, name: 'Floor 2', shortName: 'Floor 2', use: 58, note: 'Call booths, postgraduate PC cluster', wifi: 5, freeSockets: 30 },
  { id: 3, name: 'Floor 3', shortName: 'Floor 3', use: 44, note: 'Deep focus dissertation & viva pods', wifi: 4, freeSockets: 24 },
];

export const INITIAL_ROOMS: RoomClimate[] = [
  { name: 'Ground Floor Tech Hub', floorIndex: 0, temp: 21.5, goal: 21.5, requests: 0 },
  { name: 'Floor 1 Silent Reading', floorIndex: 1, temp: 20.5, goal: 20.5, requests: 0 },
  { name: 'Floor 2 Postgraduate Pods', floorIndex: 2, temp: 21.0, goal: 21.0, requests: 0 },
  { name: 'Floor 3 Dissertation Suite', floorIndex: 3, temp: 21.5, goal: 21.5, requests: 0 },
];

export const INITIAL_PCS: LibraryPc[] = [
  { id: 'PC-204', floor: 'Floor 2', floorIndex: 2, software: ['SPSS', 'NVivo', 'Python'], available: true },
  { id: 'PC-208', floor: 'Floor 2', floorIndex: 2, software: ['SPSS', 'Stata', 'Python'], available: true },
  { id: 'PC-301', floor: 'Floor 3', floorIndex: 3, software: ['NVivo', 'Python'], available: true },
  { id: 'PC-112', floor: 'Floor 1', floorIndex: 1, software: ['MATLAB', 'Python'], available: true },
  { id: 'PC-215', floor: 'Floor 2', floorIndex: 2, software: ['SPSS', 'MATLAB', 'Stata'], available: false },
];

export const INITIAL_BOOKS: LibraryBook[] = [
  {
    id: 'bk-morling',
    title: 'Research Methods in Psychology',
    author: 'Beth Morling',
    callNumber: 'BF 76.5 MOR',
    shelf: 'Floor 1, Bay 4B, Shelf 3',
    floorIndex: 1,
    freeCopies: 2,
    totalCopies: 4,
    lastConfirmed: '2 min ago',
    reportedMissing: false,
  },
  {
    id: 'bk-field',
    title: 'Discovering Statistics Using IBM SPSS Statistics',
    author: 'Andy Field',
    callNumber: 'HA 32 FIE',
    shelf: 'Floor 2, Bay 6A, Shelf 2',
    floorIndex: 2,
    freeCopies: 0,
    totalCopies: 5,
    lastConfirmed: '6 min ago',
    reportedMissing: false,
  },
  {
    id: 'bk-brown',
    title: 'Change by Design',
    author: 'Tim Brown',
    callNumber: 'TS 171.4 BRO',
    shelf: 'Floor 2, Bay 1A, Shelf 4',
    floorIndex: 2,
    freeCopies: 3,
    totalCopies: 3,
    lastConfirmed: '4 min ago',
    reportedMissing: false,
  },
];

export const LENDING_STEPS: LendingStep[] = [
  {
    stepNumber: 1,
    badge: 'Catalogue & Confidence',
    title: 'Verify shelf confidence before walking',
    summary:
      'Find the title in Library Search, then inspect its physical shelf confirmation timestamp here. If all copies are checked out or unconfirmed, launch the e-book immediately.',
  },
  {
    stepNumber: 2,
    badge: 'Spatial Wayfinding',
    title: 'Navigate directly to the floor and bay',
    summary:
      'Follow the 3D Digital Twin route to the exact bay and shelf level. If the physical book is absent, tap "Not on shelf" so staff receive an immediate sweep alert.',
  },
  {
    stepNumber: 3,
    badge: 'Self-Issue Kiosk',
    title: 'Tap Sussex ID at any RFID pad',
    summary:
      'Place your books flat on the self-issue pad and tap your Sussex student card or mobile pass. Your loan receipt and due date update instantaneously.',
  },
  {
    stepNumber: 4,
    badge: 'Smart Renewals',
    title: 'Automatic loan extension & return points',
    summary:
      'Loans renew automatically unless requested by another postgraduate. Drop returns at any floor return chute or the Ground Floor automated sorter.',
  },
  {
    stepNumber: 5,
    badge: 'Resilient Fallbacks',
    title: 'Instant recovery when friction happens',
    summary:
      'Missing item, unreadable card, or offline kiosk? Switch to the instant digital copy, place a priority hold, or escalate directly to the Service Desk.',
  },
];

export const HOURLY_FORECAST = [
  { hour: '09:00', occupancy: 35 },
  { hour: '10:00', occupancy: 48 },
  { hour: '11:00', occupancy: 62 },
  { hour: '12:00', occupancy: 70 },
  { hour: '13:00', occupancy: 66 },
  { hour: '14:00', occupancy: 58 },
  { hour: '15:00', occupancy: 60 },
  { hour: '16:00', occupancy: 64 },
  { hour: '17:00', occupancy: 52 },
  { hour: '18:00', occupancy: 44 },
  { hour: '19:00', occupancy: 38 },
  { hour: '20:00', occupancy: 30 },
];

export const WEBSITE_COMPARISON = [
  {
    task: 'Find a book',
    website: 'Library Search displays static catalogue status and call numbers.',
    liveLayer: 'Adds RFID shelf confidence age, one-tap "Not on shelf" staff alert, and instant e-book fallback.',
  },
  {
    task: 'Group study room',
    website: 'LibCal portal allows 3 hours/day booking with a 30-minute door QR check-in rule.',
    liveLayer: 'Tracks active check-in countdown, sends phone nudges, and generates an instant Plan B booth if released.',
  },
  {
    task: 'Call booth right now',
    website: 'No live real-time booth availability shown on reviewed Library pages.',
    liveLayer: 'Displays free two-person call booths per floor and holds one for 15 minutes.',
  },
  {
    task: 'Software-specific PC',
    website: 'No per-machine software filter or live seat occupancy.',
    liveLayer: 'Filters live workstations by SPSS, NVivo, Python, MATLAB, or Stata and auto-reroutes on faults.',
  },
  {
    task: 'Building occupancy',
    website: 'No real-time floor crowd metrics or zone heatmaps.',
    liveLayer: 'Interactive 3D Digital Twin with multi-sensor trust scores and 12-hour quiet-slot forecast.',
  },
  {
    task: 'Phone Wi-Fi & climate',
    website: 'No floor-level signal ratings or thermal comfort request loop.',
    liveLayer: 'Zone-level Wi-Fi telemetry, one-tap weak signal reporting, and shared 19-23 °C thermostat feedback.',
  },
  {
    task: 'Disruption recovery',
    website: 'Live chat 9am-5pm Mon-Fri and physical Service Desk during staffed hours.',
    liveLayer: '24/7 Autopilot re-planning plus grouped root-cause issue triage for Library & Estates staff.',
  },
];

export const OFFICIAL_LIBRARY_LINKS = [
  {
    label: 'Library Search',
    url: 'https://sussex.primo.exlibrisgroup.com/discovery/search?vid=44SUS_INST:44SUS_VU1',
  },
  {
    label: 'Book a study room',
    url: 'https://sussex.libcal.com/space/17805',
  },
  {
    label: 'Library live chat',
    url: 'https://sussex-ac-uk.libanswers.com/chat/widget/149b172f7b741bce9b79194bbe0b49e3c94edad4cfdb50652ab570001b3ccda0',
  },
  {
    label: 'Opening hours',
    url: 'https://www.sussex.ac.uk/library/using-the-library/hours',
  },
];

export const FUTURE_ROADMAP = [
  {
    horizon: 'Now · Prototype',
    badge: 'Simulated Telemetry',
    title: 'Spatial Digital Twin & Autopilot',
    description:
      'Interactive 3D floor stack with 4-source sensor trust scoring, real-time exception handling (delayed/offline), autonomous session re-routing, and WebXR walkthrough.',
  },
  {
    horizon: 'Next 12 Months · Single-Floor Pilot',
    badge: 'Live Sensors',
    title: 'Floor 2 Postgraduate Instrumentation',
    description:
      'Privacy-preserving anonymous occupancy counters, RFID shelf sweep pings, LibCal QR check-in nudges, and staff triage handoff. Measure walking minutes saved per visit.',
  },
  {
    horizon: '2 to 3 Years · Connected Campus',
    badge: 'Building Systems',
    title: 'BMS, Wi-Fi & Canvas Integration',
    description:
      'Bidirectional HVAC & Aruba Wi-Fi telemetry, module-aware study agents inside Canvas and Library Search, and AR mobile shelf wayfinding.',
  },
  {
    horizon: '3 to 5 Years · Immersive Ecosystem',
    badge: 'Emerging',
    title: 'Ambient Spatial Assistance',
    description:
      'VR/AR viva rehearsal rooms, adaptive ambient lighting and acoustics per zone, and predictive staffing aligned with postgraduate submission peaks.',
  },
];

export const ETHICAL_SAFEGUARDS = [
  {
    principle: 'Privacy by Architecture',
    detail: 'Count anonymous occupancy vectors only; never store faces or individual MAC histories. Complete a DPIA before deploying optical counters.',
  },
  {
    principle: 'Transparent Uncertainty',
    detail: 'Always display sensor trust scores, data freshness timestamps, and explicit Offline/Delayed states so students never trust stale occupancy.',
  },
  {
    principle: 'Accessible to Every Student',
    detail: 'Keyboard-navigable controls, WCAG AA contrast in both themes, reduced-motion respect, and human Service Desk escalation at every step.',
  },
  {
    principle: 'Staff in the Loop',
    detail: 'Group duplicate student fault reports by root cause so Library, IT, and Estates teams fix systemic issues once rather than chasing symptoms.',
  },
];

export const MOBILE_SOURCE_BRIDGES: MobileSourceBridgeItem[] = [
  {
    id: 'nfc-morling',
    tagLabel: 'NFC Shelf Tag · BF 76.5',
    location: 'Floor 1 · Bay 4B',
    title: 'Research Methods in Psychology',
    citation: 'Morling, B. (2021). Research Methods in Psychology (4th ed.). W. W. Norton.',
    actionLabel: 'Sync citation & e-chapter to phone',
    offlineReady: true,
  },
  {
    id: 'nfc-pc204',
    tagLabel: 'NFC Desk Puck · PC-204',
    location: 'Floor 2 · Postgraduate Cluster',
    title: 'Beam mobile reading list to SPSS workstation',
    citation: 'Canvas MSc Dissertation Workspace · Dataset + APA 7th Zotero Bundle',
    actionLabel: 'Cast mobile session to PC-204',
    offlineReady: false,
  },
  {
    id: 'nfc-stacks-pack',
    tagLabel: 'Offline Stack Cache · Floor 2',
    location: 'Floor 2 · Deep Stacks',
    title: 'Pre-cache reading pack before entering low-signal aisles',
    citation: 'Field (2024) SPSS Companion + Brown (2019) Change by Design (PDF/EPUB)',
    actionLabel: 'Download offline pack (14 MB)',
    offlineReady: true,
  },
];

export const SERENDIPITY_SPARKS: SerendipitySpark[] = [
  {
    id: 'spark-mass-obs',
    floor: 'Floor 3',
    bay: 'Special Collections Alcove',
    discipline: 'Social Research · Archive',
    title: 'Mass Observation Archive: Everyday Digital Diaries',
    whyItMatters:
      'Original Sussex qualitative field notebooks physically displayed 18m from Dissertation Pods — ideal inspiration for mixed-methods framing.',
    pointsBonus: 15,
  },
  {
    id: 'spark-tufte',
    floor: 'Floor 2',
    bay: 'Bay 2C · Shelf 4',
    discipline: 'Data Visualisation',
    title: 'The Visual Display of Quantitative Information (Tufte)',
    whyItMatters:
      'Physical folio edition with fold-out plates that read far better on paper than on a 13-inch laptop screen.',
    pointsBonus: 15,
  },
  {
    id: 'spark-zotero',
    floor: 'Ground Floor',
    bay: 'Tech Hub Wall Display',
    discipline: 'Research Workflow',
    title: 'Rapid Synthesis Pod: 10-Min Thesis Structuring Cards',
    whyItMatters:
      'Tactile magnetic argument boards next to the café for mapping chapters before typing.',
    pointsBonus: 10,
  },
];

export const STUDY_CONSTELLATIONS: StudyConstellation[] = [
  {
    id: 'const-dissertation',
    name: 'Dissertation Deep-Work Cohort',
    floor: 'Floor 3 · Silent Pods',
    activeCount: 18,
    cadence: '50m silent focus / 10m café break',
  },
  {
    id: 'const-quant',
    name: 'SPSS & Python Analysis Group',
    floor: 'Floor 2 · PC Cluster',
    activeCount: 11,
    cadence: '25m sprint / 5m stretch',
  },
  {
    id: 'const-lit',
    name: 'Quiet Literature Review Circle',
    floor: 'Floor 1 · Reading Room',
    activeCount: 14,
    cadence: '45m reading / 10m notes sync',
  },
];

export const USABILITY_TASKS = [
  'Locate a free call booth without walking the floors',
  'Filter for a PC with SPSS and reserve it for 15 minutes',
  'Verify a book shelf timestamp and report it as Not on shelf',
  'Inspect phone Wi-Fi strength per floor and flag a weak zone',
  'Adjust room target temperature and observe the 19-23 °C Estates limit',
  'Switch to Offline mode and confirm stale booking actions pause safely',
  'Build a combined study plan using the Assistant',
  'Inspect a zone 4-source trust score in the 3D Spatial Twin',
  'Start Autopilot and watch it re-plan around a live disruption',
  'Simulate missing the 30-minute study room QR check-in and verify Plan B',
  'Ask the Assistant for a human staff handoff',
  'Explore the 3D Spatial Twin in Walkthrough / Cardboard Stereo view',
  'Sync a physical book to your phone via NFC Bridge and join a Silent Study Constellation',
  'Play or generate an AI Book-to-Video Story in Books & Shelf instead of reading word-by-word',
];


export function computeFloorZones(floor: FloorData, room: RoomClimate): ZoneTelemetry[] {
  return [
    {
      index: 0,
      name: 'Open Desks',
      use: Math.min(98, Math.max(12, floor.use - 10)),
      bars: Math.max(2, floor.wifi),
      temp: room.temp,
      noise: 52 + (floor.id === 0 ? 8 : 0) + (floor.id === 1 ? -14 : 0),
    },
    {
      index: 1,
      name: 'PC Cluster',
      use: Math.min(98, Math.max(15, floor.use + 6)),
      bars: Math.max(2, floor.wifi),
      temp: room.temp + 0.4,
      noise: 44 + (floor.id === 0 ? 6 : 0) + (floor.id === 1 ? -10 : 0),
    },
    {
      index: 2,
      name: 'Call Booths',
      use: Math.min(98, Math.max(10, floor.use - 4)),
      bars: Math.max(2, floor.wifi),
      temp: room.temp - 0.3,
      noise: 38 + (floor.id === 0 ? 4 : 0) + (floor.id === 1 ? -6 : 0),
    },
    {
      index: 3,
      name: 'Book Stacks',
      use: Math.min(98, Math.max(18, floor.use + 12)),
      bars: Math.max(1, floor.wifi - 2),
      temp: room.temp + 0.2,
      noise: 34 + (floor.id === 0 ? 5 : 0) + (floor.id === 1 ? -5 : 0),
    },
  ];
}
