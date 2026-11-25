import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraPreset,
  FloorData,
  HeatmapLayer,
  NetworkExceptionState,
  PrimaryTab,
  RoomClimate,
  ZoneTelemetry,
} from '../types/library';
import { computeFloorZones } from '../data/libraryInitialData';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Glasses,
  Layers,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';

interface SpatialTwinViewProps {
  floors: FloorData[];
  rooms: RoomClimate[];
  boothsFree: Record<number, number>;
  networkState: NetworkExceptionState;
  isDark: boolean;
  onNavigateTab: (tab: PrimaryTab) => void;
  onNotify: (msg: string) => void;
}

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _colorTmp = new THREE.Color();

function createArchitecturalGridTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isDark ? '#07313C' : '#EFECE5';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 59, 73, 0.11)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.strokeStyle = isDark ? 'rgba(226, 185, 121, 0.18)' : 'rgba(0, 59, 73, 0.12)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 508, 508);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function zoneMetricRatio(zone: ZoneTelemetry, layer: HeatmapLayer): number {
  switch (layer) {
    case 'use':
      return zone.use / 100;
    case 'wifi':
      return Math.min(1, Math.max(0, (5 - zone.bars) / 4));
    case 'temp':
      return Math.min(1, Math.abs(zone.temp - 21) / 2.2);
    case 'noise':
      return Math.min(1, Math.max(0, (zone.noise - 30) / 32));
  }
}

function zoneMetricLabel(zone: ZoneTelemetry, layer: HeatmapLayer): string {
  switch (layer) {
    case 'use':
      return `${zone.use}% full`;
    case 'wifi':
      return `${zone.bars}/5 signal`;
    case 'temp':
      return `${zone.temp.toFixed(1)} °C`;
    case 'noise':
      return `${zone.noise} dB`;
  }
}

function zoneCenterLocal(zoneIndex: number): [number, number] {
  const x = zoneIndex % 2 === 0 ? -5.8 : 5.8;
  const z = zoneIndex < 2 ? -4.0 : 4.0;
  return [x, z];
}

export const SpatialTwinView: React.FC<SpatialTwinViewProps> = ({
  floors,
  rooms,
  boothsFree,
  networkState,
  isDark,
  onNavigateTab,
  onNotify,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [exploded, setExploded] = useState<boolean>(true);
  const [layer, setLayer] = useState<HeatmapLayer>('use');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [routeActive, setRouteActive] = useState<boolean>(true);
  const [stereoVr, setStereoVr] = useState<boolean>(false);
  const [xrSupported, setXrSupported] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Mutable refs for Three.js animation loop without tearing down WebGL
  const stateRef = useRef({
    selectedFloor,
    selectedZone,
    exploded,
    layer,
    routeActive,
    stereoVr,
    isDark,
    floors,
    rooms,
    boothsFree,
  });

  stateRef.current = {
    selectedFloor,
    selectedZone,
    exploded,
    layer,
    routeActive,
    stereoVr,
    isDark,
    floors,
    rooms,
    boothsFree,
  };

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    floorGroups: THREE.Group[];
    zonePads: { floorIdx: number; zoneIdx: number; mesh: THREE.Mesh; ring: THREE.Mesh }[];
    boothLights: { floorIdx: number; meshes: THREE.Mesh[] }[];
    routeGroup: THREE.Group | null;
    routePulse: THREE.Mesh | null;
    routeCurve: THREE.CatmullRomCurve3 | null;
    targetCamPos: THREE.Vector3 | null;
    targetLookAt: THREE.Vector3 | null;
    slabMat: THREE.MeshStandardMaterial | null;
    gridTex: THREE.CanvasTexture | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    floorGroups: [],
    zonePads: [],
    boothLights: [],
    routeGroup: null,
    routePulse: null,
    routeCurve: null,
    targetCamPos: null,
    targetLookAt: null,
    slabMat: null,
    gridTex: null,
  });

  const allFloorZones = useMemo(
    () => floors.map((f, idx) => computeFloorZones(f, rooms[idx] ?? rooms[0])),
    [floors, rooms]
  );

  const activeZones = allFloorZones[selectedFloor] ?? allFloorZones[0];
  const activeZone = activeZones[selectedZone] ?? activeZones[0];

  const trustFactor = networkState === 'ok' ? 1 : networkState === 'late' ? 0.6 : 0.3;
  const sensorSources = useMemo(
    () =>
      [
        { name: 'Occupancy optical counter', base: 96 },
        { name: 'Wi-Fi AP device density', base: 91 },
        { name: 'RFID shelf sweep', base: 99 },
        { name: 'Workstation telemetry', base: 100 },
      ].map((s) => ({ name: s.name, score: Math.round(s.base * trustFactor) })),
    [trustFactor]
  );
  const overallTrust = Math.round(
    sensorSources.reduce((acc, s) => acc + s.score, 0) / sensorSources.length
  );

  // Keyboard shortcut 'H' for dock collapse
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Build Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 520;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const bgHex = stateRef.current.isDark ? 0x002630 : 0xede8df;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.014);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 160);
    camera.position.set(24, 21, 27);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 8;
    controls.maxDistance = 52;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 7.5, 0);
    controls.addEventListener('start', () => {
      sceneRefs.current.targetCamPos = null;
      sceneRefs.current.targetLookAt = null;
    });

    // 3-Point Warm/Cool Architectural Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbbe8ff, 0x0c1520, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.35);
    keyLight.position.set(18, 34, 16);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.camera.near = 4;
    keyLight.shadow.camera.far = 70;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.55);
    rimLight.position.set(-20, 18, -18);
    scene.add(rimLight);

    // Architectural Ground Plinth & Contact Grounding
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x001d25,
      roughness: 0.85,
      metalness: 0.15,
    });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 22), plinthMat);
    plinth.position.set(0, -0.25, 0);
    plinth.receiveShadow = true;
    scene.add(plinth);

    const gridTex = createArchitecturalGridTexture(stateRef.current.isDark);
    gridTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const slabMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.62,
      metalness: 0.08,
    });
    const brassTrimMat = new THREE.MeshStandardMaterial({
      color: 0xe2b979,
      roughness: 0.25,
      metalness: 0.88,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.78,
    });
    const oakMat = new THREE.MeshStandardMaterial({
      color: 0xc29b61,
      roughness: 0.55,
      metalness: 0.05,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });

    const floorGroups: THREE.Group[] = [];
    const zonePads: { floorIdx: number; zoneIdx: number; mesh: THREE.Mesh; ring: THREE.Mesh }[] = [];
    const boothLights: { floorIdx: number; meshes: THREE.Mesh[] }[] = [];
    const clickables: THREE.Object3D[] = [];

    for (let f = 0; f < 4; f++) {
      const fg = new THREE.Group();
      fg.position.set(0, f * 4.8, 0);

      // Primary floor slab + brass edge trim
      const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 0.24, 16), slabMat);
      slab.position.set(0, 0.12, 0);
      slab.receiveShadow = true;
      slab.castShadow = true;
      fg.add(slab);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(22.14, 0.08, 16.14), brassTrimMat);
      trim.position.set(0, 0.2, 0);
      fg.add(trim);

      // Perimeter low glass balustrade
      const railFront = new THREE.Mesh(new THREE.BoxGeometry(22, 0.7, 0.08), glassMat);
      railFront.position.set(0, 0.6, 7.96);
      fg.add(railFront);
      const railBack = new THREE.Mesh(new THREE.BoxGeometry(22, 0.7, 0.08), glassMat);
      railBack.position.set(0, 0.6, -7.96);
      fg.add(railBack);

      // Central sculptural stair/atrium spine (3-part column)
      const coreBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.3, 16), steelMat);
      coreBase.position.set(0, 0.38, 0);
      fg.add(coreBase);
      const coreShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 16), glassMat);
      coreShaft.position.set(0, 1.35, 0);
      fg.add(coreShaft);
      const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 10, 28), brassTrimMat);
      coreRing.rotation.x = Math.PI / 2;
      coreRing.position.set(0, 0.42, 0);
      fg.add(coreRing);

      // 4 Interactive Heatmap Zone Pads
      for (let z = 0; z < 4; z++) {
        const [zx, zz] = zoneCenterLocal(z);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.28,
          roughness: 0.5,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const pad = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.05, 6.4), padMat);
        pad.position.set(zx, 0.26, zz);
        pad.userData = { floorIdx: f, zoneIdx: z };
        fg.add(pad);
        clickables.push(pad);

        const ringGeo = new THREE.RingGeometry(4.2, 4.45, 4);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.z = Math.PI / 4;
        ring.position.set(zx, 0.295, zz);
        fg.add(ring);

        zonePads.push({ floorIdx: f, zoneIdx: z, mesh: pad, ring });
      }

      // Zone 0: Open Desks (4 composite oak + steel study tables)
      for (let d = 0; d < 4; d++) {
        const dx = -7.6 + (d % 2) * 3.6;
        const dz = -5.2 + Math.floor(d / 2) * 2.5;
        const deskGroup = new THREE.Group();
        deskGroup.position.set(dx, 0.24, dz);

        const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.15), oakMat);
        top.position.y = 0.76;
        top.castShadow = true;
        deskGroup.add(top);

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 1.0), steelMat);
        legL.position.set(-1.02, 0.37, 0);
        deskGroup.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 1.0), steelMat);
        legR.position.set(1.02, 0.37, 0);
        deskGroup.add(legR);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.08), brassTrimMat);
        lamp.position.set(0, 1.12, 0);
        deskGroup.add(lamp);

        fg.add(deskGroup);
      }

      // Zone 1: PC Cluster (4 dual-screen workstation pods)
      for (let p = 0; p < 4; p++) {
        const px = 4.0 + (p % 2) * 3.6;
        const pz = -5.2 + Math.floor(p / 2) * 2.5;
        const ws = new THREE.Group();
        ws.position.set(px, 0.24, pz);

        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.05), steelMat);
        deskTop.position.y = 0.75;
        deskTop.castShadow = true;
        ws.add(deskTop);

        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), brassTrimMat);
        stand.position.set(0, 0.92, -0.22);
        ws.add(stand);

        const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.56, 0.05), screenMat);
        monitor.position.set(0, 1.14, -0.2);
        ws.add(monitor);

        const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.48, 10), steelMat);
        chair.position.set(0, 0.25, 0.68);
        ws.add(chair);

        fg.add(ws);
      }

      // Zone 2: Call Booths (3 acoustic glass-and-oak pods with status beacon)
      const floorBeaconMeshes: THREE.Mesh[] = [];
      for (let b = 0; b < 3; b++) {
        const bx = -8.2 + b * 2.5;
        const bz = 4.0;
        const booth = new THREE.Group();
        booth.position.set(bx, 0.24, bz);

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 1.85), oakMat);
        base.position.y = 0.04;
        booth.add(base);

        const shell = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.8), glassMat);
        shell.position.y = 1.14;
        booth.add(shell);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.9), steelMat);
        roof.position.y = 2.28;
        roof.castShadow = true;
        booth.add(roof);

        const beaconMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        });
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.18), beaconMat);
        beacon.position.set(0, 2.4, 0.85);
        booth.add(beacon);
        floorBeaconMeshes.push(beacon);

        fg.add(booth);
      }
      boothLights.push({ floorIdx: f, meshes: floorBeaconMeshes });

      // Zone 3: Book Stacks (3 composite shelving rows)
      for (let s = 0; s < 3; s++) {
        const sx = 5.8;
        const sz = 2.1 + s * 1.9;
        const stack = new THREE.Group();
        stack.position.set(sx, 0.24, sz);

        const frame = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.05, 0.65), steelMat);
        frame.position.y = 1.02;
        frame.castShadow = true;
        stack.add(frame);

        const bookBand = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.55, 0.72), oakMat);
        bookBand.position.y = 1.0;
        stack.add(bookBand);

        const header = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.1, 0.74), brassTrimMat);
        header.position.y = 2.08;
        stack.add(header);

        fg.add(stack);
      }

      scene.add(fg);
      floorGroups.push(fg);
    }

    // 3D Holographic Wayfinding Route Group
    const routeGroup = new THREE.Group();
    const routePulseMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.6,
      roughness: 0.15,
    });
    const routePulse = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), routePulseMat);
    routeGroup.add(routePulse);
    scene.add(routeGroup);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      floorGroups,
      zonePads,
      boothLights,
      routeGroup,
      routePulse,
      routeCurve: null,
      targetCamPos: null,
      targetLookAt: null,
      slabMat,
      gridTex,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on click
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0) {
        const { floorIdx, zoneIdx } = hits[0].object.userData;
        if (typeof floorIdx === 'number' && typeof zoneIdx === 'number') {
          setSelectedFloor(floorIdx);
          setSelectedZone(zoneIdx);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Resize Observer
    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    ro.observe(container);

    // Check WebXR availability
    if ('xr' in navigator && navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-vr')
        .then((ok) => setXrSupported(ok))
        .catch(() => setXrSupported(false));
    }

    // Main render loop with Software-WebGL pacing
    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = (now = performance.now()) => {
      if (disposed) return;
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const s = stateRef.current;
      const spacing = s.exploded ? 4.8 : 2.95;

      // Smoothly damp floor vertical separation
      for (let i = 0; i < floorGroups.length; i++) {
        const targetY = i * spacing;
        floorGroups[i].position.y = THREE.MathUtils.damp(
          floorGroups[i].position.y,
          targetY,
          7,
          dt
        );
      }

      // Smoothly damp camera preset transitions if active
      const refs = sceneRefs.current;
      if (refs.targetCamPos && refs.targetLookAt) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, refs.targetCamPos.x, 5.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, refs.targetCamPos.y, 5.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, refs.targetCamPos.z, 5.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, refs.targetLookAt.x, 5.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, refs.targetLookAt.y, 5.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, refs.targetLookAt.z, 5.5, dt);
        if (camera.position.distanceTo(refs.targetCamPos) < 0.08) {
          refs.targetCamPos = null;
          refs.targetLookAt = null;
        }
      }

      // Animate wayfinding pulse sphere along route curve
      if (refs.routeCurve && refs.routePulse && s.routeActive) {
        const t = (now * 0.00028) % 1;
        refs.routeCurve.getPointAt(t, _vecA);
        refs.routePulse.position.copy(_vecA);
        refs.routeGroup!.visible = true;
      } else if (refs.routeGroup) {
        refs.routeGroup.visible = false;
      }

      controls.update();

      const w = container.clientWidth || 960;
      const h = container.clientHeight || 520;

      if (s.stereoVr) {
        renderer.setScissorTest(true);
        camera.aspect = w / 2 / h;
        camera.updateProjectionMatrix();
        const offsets: [number, number][] = [
          [-0.035, 0],
          [0.035, w / 2],
        ];
        offsets.forEach(([eyeOffset, xStart]) => {
          camera.translateX(eyeOffset);
          renderer.setViewport(xStart, 0, w / 2, h);
          renderer.setScissor(xStart, 0, w / 2, h);
          renderer.render(scene, camera);
          camera.translateX(-eyeOffset);
        });
      } else {
        renderer.setScissorTest(false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, h);
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      gridTex.dispose();
      slabMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Sync theme colors onto 3D scene without rebuilding WebGL
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs.scene || !refs.slabMat) return;
    const bgHex = isDark ? 0x002630 : 0xede8df;
    refs.scene.background = new THREE.Color(bgHex);
    refs.scene.fog = new THREE.FogExp2(bgHex, 0.014);
    const newTex = createArchitecturalGridTexture(isDark);
    if (refs.renderer) {
      newTex.anisotropy = refs.renderer.capabilities.getMaxAnisotropy();
    }
    if (refs.gridTex) refs.gridTex.dispose();
    refs.gridTex = newTex;
    refs.slabMat.map = newTex;
    refs.slabMat.needsUpdate = true;
  }, [isDark]);

  // Update zone heatmap colors, selection rings, booth beacons, and 3D wayfinding path
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs.scene) return;

    // 1. Update heatmap zone pads & selection highlight rings
    refs.zonePads.forEach(({ floorIdx, zoneIdx, mesh, ring }) => {
      const z = allFloorZones[floorIdx]?.[zoneIdx];
      if (!z) return;
      const ratio = zoneMetricRatio(z, layer);
      // Hue from Emerald (0.42) to Amber (0.12) to Crimson (0.0)
      _colorTmp.setHSL(0.42 - ratio * 0.42, 0.72, isDark ? 0.48 : 0.45);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.copy(_colorTmp);
      const isSelected = floorIdx === selectedFloor && zoneIdx === selectedZone;
      mat.opacity = isSelected ? 0.56 : 0.24;

      const rMat = ring.material as THREE.MeshBasicMaterial;
      rMat.opacity = isSelected ? 0.95 : 0;
    });

    // 2. Update Call Booth overhead beacons based on live free count
    refs.boothLights.forEach(({ floorIdx, meshes }) => {
      const freeCount = floorIdx === 2 ? boothsFree[2] ?? 0 : floorIdx === 3 ? boothsFree[3] ?? 0 : 2;
      meshes.forEach((m, idx) => {
        const isFree = idx < freeCount;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.color.setHex(isFree ? 0x10b981 : 0xf43f5e);
        mat.emissive.setHex(isFree ? 0x10b981 : 0xf43f5e);
      });
    });

    // 3. Rebuild 3D holographic wayfinding curve from Entrance -> Atrium -> Selected Zone
    if (refs.routeGroup) {
      const existingTube = refs.routeGroup.getObjectByName('wayfinding-tube');
      if (existingTube) {
        (existingTube as THREE.Mesh).geometry.dispose();
        refs.routeGroup.remove(existingTube);
      }

      const spacing = exploded ? 4.8 : 2.95;
      const targetY = selectedFloor * spacing + 0.55;
      const [zx, zz] = zoneCenterLocal(selectedZone);

      const pts = [
        new THREE.Vector3(0, 0.55, 8.8),
        new THREE.Vector3(0, 0.55, 1.5),
        new THREE.Vector3(0, Math.max(0.55, targetY * 0.5), 0),
        new THREE.Vector3(0, targetY, 0),
        new THREE.Vector3(zx * 0.5, targetY, zz * 0.5),
        new THREE.Vector3(zx, targetY, zz),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      refs.routeCurve = curve;

      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.11, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.15,
        roughness: 0.2,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.name = 'wayfinding-tube';
      refs.routeGroup.add(tubeMesh);
    }
  }, [allFloorZones, boothsFree, exploded, isDark, layer, selectedFloor, selectedZone]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const refs = sceneRefs.current;
    const spacing = exploded ? 4.8 : 2.95;
    const floorY = selectedFloor * spacing;

    if (preset === 'orbit') {
      refs.targetCamPos = new THREE.Vector3(24, 21, 27);
      refs.targetLookAt = new THREE.Vector3(0, exploded ? 7.2 : 4.5, 0);
    } else if (preset === 'aisle') {
      refs.targetCamPos = new THREE.Vector3(1.2, floorY + 2.1, 4.0);
      refs.targetLookAt = new THREE.Vector3(6.2, floorY + 1.1, 4.0);
    } else if (preset === 'booths') {
      refs.targetCamPos = new THREE.Vector3(-5.8, floorY + 2.4, 9.6);
      refs.targetLookAt = new THREE.Vector3(-5.8, floorY + 1.2, 3.8);
    } else if (preset === 'desk') {
      refs.targetCamPos = new THREE.Vector3(5.8, floorY + 2.5, 1.5);
      refs.targetLookAt = new THREE.Vector3(5.8, floorY + 1.1, -4.4);
    }
  };

  const handleEnterXr = async () => {
    const renderer = sceneRefs.current.renderer;
    const scene = sceneRefs.current.scene;
    const camera = sceneRefs.current.camera;
    if (!renderer || !scene || !camera || !navigator.xr) return;
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor'],
      });
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(session);
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
    } catch {
      onNotify('WebXR session could not be started in this browser.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Immersive 3D Spatial Digital Twin Viewport */}
      <section className="relative h-[540px] w-full overflow-hidden rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#EDE8DF] dark:bg-[#002630]">
        <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

        {contextLost && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#002630]/90 p-6 text-center text-white">
            <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
            <p className="font-display text-lg font-semibold">3D Context Interrupted</p>
            <p className="mt-1 text-sm text-slate-300">
              WebGL context was paused by the browser. Reload or switch tabs to restore.
            </p>
          </div>
        )}

        {/* Top-Left Compact Telemetry Header (No backdrop-filter over WebGL) */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
          <div className="pointer-events-auto rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white/95 dark:bg-[#062C37]/95 px-4 py-3">
            <h2 className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              {floors[selectedFloor]?.name} · {activeZone.name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              {zoneMetricLabel(activeZone, layer)} · Trust {overallTrust}% · Drag to orbit, click any zone
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRouteActive((prev) => !prev)}
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              routeActive
                ? 'border-[#E2B979] bg-[#E2B979] text-[#002630]'
                : 'border-[#DDD8CE] dark:border-[#1D5362] bg-white/95 dark:bg-[#062C37]/95 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            {routeActive ? '3D Path Active' : 'Route Me Here'}
          </button>
        </div>

        {/* Collapsible Bottom Control Dock (Zero Mid-Screen Occlusion) */}
        <div
          className={`absolute left-1/2 bottom-4 w-[min(920px,calc(100%-24px))] -translate-x-1/2 transition-transform duration-200 ease-out ${
            dockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
          }`}
        >
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#DDD8CE] dark:border-[#1D5362] bg-white/95 dark:bg-[#062C37]/95 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {dockCollapsed ? 'Show Spatial Controls (H)' : 'Hide Controls (H)'}
            </button>
          </div>

          <div className="rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white/95 dark:bg-[#062C37]/95 p-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Floor Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-[#EFECE5] dark:bg-[#00222B] p-1">
                {floors.map((f, idx) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFloor(idx)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedFloor === idx
                        ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {f.shortName}
                  </button>
                ))}
              </div>

              {/* Heatmap Layer Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1">
                {(
                  [
                    ['use', 'Seats'],
                    ['wifi', 'Wi-Fi'],
                    ['temp', 'Temp'],
                    ['noise', 'Noise'],
                  ] as [HeatmapLayer, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLayer(k)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      layer === k
                        ? 'bg-[#003B49] text-white dark:bg-[#E2B979] dark:text-slate-950'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Camera Presets & Exploded Stack */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExploded((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    exploded
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {exploded ? 'Exploded' : 'Stacked'}
                </button>

                {(
                  [
                    ['orbit', 'Orbit'],
                    ['aisle', 'Shelf Aisle'],
                    ['booths', 'Call Booths'],
                    ['desk', 'Tech Desk'],
                  ] as [CameraPreset, string][]
                ).map(([preset, label]) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyCameraPreset(preset)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === preset
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setStereoVr((prev) => !prev)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    stereoVr
                      ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Glasses className="h-3.5 w-3.5" />
                  Cardboard
                </button>

                {xrSupported && (
                  <button
                    type="button"
                    onClick={handleEnterXr}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Enter VR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Zone Telemetry & 4-Source Sensor Trust Panel */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active Floor Zones Matrix */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {floors[selectedFloor]?.name} Zone Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {floors[selectedFloor]?.note} · Click a zone to route in 3D
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('spaces')}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Book Booth / PC
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('books')}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                Check Shelves
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeZones.map((zone) => {
              const isSelected = zone.index === selectedZone;
              const ratio = zoneMetricRatio(zone, layer);
              const statusText =
                networkState !== 'ok'
                  ? 'Unconfirmed'
                  : ratio < 0.45
                    ? 'Nominal'
                    : ratio < 0.72
                      ? 'Moderate'
                      : 'High load';
              const statusColor =
                networkState !== 'ok'
                  ? 'text-amber-600 dark:text-amber-400'
                  : ratio < 0.45
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : ratio < 0.72
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400';

              return (
                <button
                  key={zone.index}
                  type="button"
                  onClick={() => setSelectedZone(zone.index)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/8 dark:bg-cyan-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {zone.name}
                    </span>
                    <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
                  </div>

                  <div className="mt-3 grid w-full grid-cols-2 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                    <span>Seats: {zone.use}%</span>
                    <span>Wi-Fi: {zone.bars}/5</span>
                    <span>Temp: {zone.temp.toFixed(1)}°C</span>
                    <span>Noise: {zone.noise} dB</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Multi-Sensor Trust Confidence Breakdown */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-[#DDD8CE] dark:border-[#1D5362] pb-4">
              <div className="flex items-center gap-2.5">
                {networkState === 'offline' ? (
                  <WifiOff className="h-5 w-5 text-rose-500" />
                ) : networkState === 'late' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Sensor Trust Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Four independent feeds cross-checked before you walk
                  </p>
                </div>
              </div>
              <span className="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {overallTrust}%
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {sensorSources.map((src) => (
                <div key={src.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-200">{src.name}</span>
                    <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                      {src.score}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE5] dark:bg-[#00222B]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        src.score >= 80
                          ? 'bg-emerald-500'
                          : src.score >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${src.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3.5 text-xs text-slate-700 dark:text-slate-200">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span>
              {overallTrust >= 80
                ? 'All four spatial sensors agree within threshold. Safe to act on free booths, workstations, and shelf counts.'
                : 'Live telemetry is delayed or offline. Treat seat counts and booth availability as unconfirmed before walking across campus.'}
            </span>
          </div>
        </div>
      </section>

      {/* Digital-Age Library Capability Showcase Strip */}
      <section className="rounded-2xl border border-[#DDD8CE] dark:border-[#1D5362] bg-white dark:bg-[#08313D] p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDD8CE] dark:border-[#1D5362] pb-3">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            How Sussex Library Live Reimagines the Digital-Age Postgraduate Library
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-300">
            Select any capability to test end-to-end
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              title: 'AI Book Video Stories',
              detail: 'Watch 60s animated AI visual stories of dense books instead of word-by-word scanning.',
              tab: 'books' as PrimaryTab,
              scrollTarget: 'book-video-story-studio',
              cta: 'Watch Book Stories',
            },
            {
              title: 'Sussex Source Studio',
              detail: 'Research Remix Table, Mystery Source Capsules & 3-Min Book-to-Draft synthesis.',
              tab: 'studio' as PrimaryTab,
              cta: 'Open Source Studio',
            },
            {
              title: 'PCs, Booths & NFC Phone',
              detail: 'SPSS/NVivo machine filter, 15m booth holds, LibCal QR tracker & NFC stack sync.',
              tab: 'spaces' as PrimaryTab,
              cta: 'Test Spaces & Tech',
            },
            {
              title: 'Autopilot & Gemini AI',
              detail: '24/7 disruption re-routing & live-state assistant with human Service Desk handoff.',
              tab: 'autopilot' as PrimaryTab,
              cta: 'Launch Autopilot',
            },
            {
              title: 'Design Brief & Ops',
              detail: 'HMW pain-point matrix, staff root-cause triage, privacy feed & 14 usability tasks.',
              tab: 'operations' as PrimaryTab,
              cta: 'Review Brief & Test',
            },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                onNavigateTab(card.tab);
                if (card.scrollTarget) {
                  window.setTimeout(() => {
                    document
                      .getElementById(card.scrollTarget!)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 90);
                }
              }}
              className="flex flex-col justify-between rounded-xl border border-[#DDD8CE] dark:border-[#1D5362] bg-[#FAF8F4] dark:bg-[#04232C] p-3.5 text-left hover:border-[#E2B979] transition-colors"
            >
              <div>
                <div className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  {card.title}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {card.detail}
                </p>
              </div>
              <span className="mt-3 text-xs font-semibold text-[#003B49] dark:text-[#E2B979]">
                {card.cta} →
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
