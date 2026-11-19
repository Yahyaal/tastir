import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { picture, type Mesh } from '@tastir/relief';
import { BED } from './settings';

/** The plaster colour of the carving, light and dark theme alike. */
const PLASTER = '#efe6d6';

interface Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly sun: THREE.DirectionalLight;
  readonly bed: THREE.LineSegments;
  object?: THREE.Mesh;
  /** The size the camera was last framed for, to keep the view on a redraw. */
  framed?: number;
}

/** The sun's place: `angle` round the panel (degrees, 0 from the left),
 * low over it like late light on a wall. */
function placeSun(stage: Stage, angle: number, size: number) {
  const a = (angle * Math.PI) / 180;
  const low = (28 * Math.PI) / 180;
  const far = size * 2;
  stage.sun.position.set(
    -Math.cos(a) * Math.cos(low) * far,
    Math.sin(a) * Math.cos(low) * far,
    Math.sin(low) * far,
  );
  const cam = stage.sun.shadow.camera;
  cam.left = -size;
  cam.right = size;
  cam.top = size;
  cam.bottom = -size;
  cam.near = 1;
  cam.far = far * 3;
  cam.updateProjectionMatrix();
}

/**
 * The carved object in 3D, lit from low on one side so the carving reads,
 * on the outline of the A1's bed. Drag to turn it, scroll or pinch to
 * come closer.
 */
export function ReliefView({
  mesh,
  light,
  fits,
  label,
}: {
  mesh: Mesh | undefined;
  /** Where the light comes from, in degrees round the panel. */
  light: number;
  /** Whether the object fits the bed; the bed's outline turns red if not. */
  fits: boolean;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const draw = useRef<() => void>(() => undefined);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    camera.up.set(0, 0, 1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    scene.add(new THREE.HemisphereLight('#fffaf0', '#6f6253', 0.75));
    const sun = new THREE.DirectionalLight('#fff1d8', 3.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.08;
    sun.shadow.radius = 2;
    scene.add(sun);
    const h = BED / 2;
    const bedGeometry = new THREE.BufferGeometry().setFromPoints(
      [
        [-h, -h],
        [h, -h],
        [h, -h],
        [h, h],
        [h, h],
        [-h, h],
        [-h, h],
        [-h, -h],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    );
    const bed = new THREE.LineSegments(
      bedGeometry,
      new THREE.LineBasicMaterial({ color: '#8a7a66', transparent: true, opacity: 0.6 }),
    );
    scene.add(bed);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(BED, BED),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    );
    ground.receiveShadow = true;
    scene.add(ground);
    const s: Stage = { renderer, scene, camera, controls, sun, bed };
    stage.current = s;
    let frame = 0;
    const render = () => {
      frame = 0;
      controls.update();
      renderer.render(scene, camera);
    };
    draw.current = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    controls.addEventListener('change', draw.current);
    const resize = () => {
      const { clientWidth: w, clientHeight: hh } = el;
      if (!w || !hh) return;
      renderer.setSize(w, hh);
      camera.aspect = w / hh;
      camera.updateProjectionMatrix();
      draw.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      controls.dispose();
      s.object?.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stage.current = undefined;
    };
  }, []);

  // The object itself.
  useEffect(() => {
    const s = stage.current;
    if (!s || !mesh) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(Float32Array.from(mesh.positions), 3),
    );
    geometry.setIndex(new THREE.BufferAttribute(mesh.triangles, 1));
    // Each face its own normals, so facets stay crisp.
    const flat = geometry.toNonIndexed();
    geometry.dispose();
    flat.computeVertexNormals();
    flat.computeBoundingBox();
    const object = new THREE.Mesh(
      flat,
      new THREE.MeshStandardMaterial({ color: PLASTER, roughness: 0.92, metalness: 0 }),
    );
    object.castShadow = true;
    object.receiveShadow = true;
    if (s.object) {
      s.scene.remove(s.object);
      s.object.geometry.dispose();
    }
    s.scene.add(object);
    s.object = object;
    const box = flat.boundingBox!;
    const size = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, 40);
    placeSun(s, light, Math.max(size, BED) * 0.75);
    // Frame the camera the first time, and when the size changes a lot.
    if (!s.framed || Math.abs(s.framed - size) / s.framed > 0.25) {
      s.framed = size;
      const distance = size * 2.4;
      const tilt = (50 * Math.PI) / 180;
      s.camera.position.set(0, -Math.cos(tilt) * distance, Math.sin(tilt) * distance);
      s.controls.target.set(0, 0, 0);
      s.controls.update();
    }
    draw.current();
    // light changes are handled below; only a new mesh reframes.
  }, [mesh]);

  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    const box = s.object?.geometry.boundingBox;
    const size = box ? Math.max(box.max.x - box.min.x, box.max.y - box.min.y, 40) : BED;
    placeSun(s, light, Math.max(size, BED) * 0.75);
    draw.current();
  }, [light]);

  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    (s.bed.material as THREE.LineBasicMaterial).color.set(fits ? '#8a7a66' : '#c0392b');
    draw.current();
  }, [fits]);

  return (
    <div className="relief-view" ref={host} role="img" aria-label={label}>
      {failed ? <StillView mesh={mesh} light={light} /> : null}
      <p className="relief-hint" aria-hidden="true">
        {failed ? 'Drag sideways to turn it.' : 'Drag to turn it; scroll or pinch to come closer.'}
      </p>
    </div>
  );
}

/**
 * Where the browser has no WebGL: the same object drawn as a still
 * picture, in the same light. Dragging sideways turns it.
 */
function StillView({ mesh, light }: { mesh: Mesh | undefined; light: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [spin, setSpin] = useState(0);
  const [dragging, setDragging] = useState<{ x: number; spin: number }>();
  useEffect(() => {
    const el = canvas.current;
    const box = el?.parentElement;
    if (!el || !box || !mesh) return;
    let frame = requestAnimationFrame(() => {
      frame = 0;
      // Smaller while turning, so it follows the hand.
      const k = dragging ? 0.4 : Math.min(1.5, window.devicePixelRatio || 1);
      const width = Math.max(64, Math.round(box.clientWidth * k));
      const height = Math.max(64, Math.round(box.clientHeight * k));
      const rgba = picture(mesh, {
        width,
        height,
        tilt: 50,
        spin,
        light,
        material: [0.94, 0.9, 0.84],
      });
      el.width = width;
      el.height = height;
      el.getContext('2d')?.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [mesh, light, spin, dragging]);
  return (
    <canvas
      ref={canvas}
      className="relief-still"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging({ x: e.clientX, spin });
      }}
      onPointerMove={(e) => {
        if (dragging) setSpin(dragging.spin + (e.clientX - dragging.x) * 0.4);
      }}
      onPointerUp={() => setDragging(undefined)}
      onPointerCancel={() => setDragging(undefined)}
    />
  );
}
